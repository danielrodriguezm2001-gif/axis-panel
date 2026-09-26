# Axis · Vigilante de sync_axis.py
#
# Comprueba cada hora (lo programa instalar.ps1) que sync_axis.py sigue
# funcionando y, si no, lo relanza y avisa. No necesita Python.
#
# Qué comprueba:
#   1. Que la URL de sincronización (el Gist) responde, trae sesiones y pagos
#      (0 pagos = falló la descarga de AimHarder dentro del script) y se ha
#      actualizado en las últimas max_horas_datos.
#   2. Que la tarea programada de sync_axis.py no está deshabilitada, que su
#      último resultado es correcto y que se ha ejecutado en las últimas
#      max_horas.
# Si algo falla y relanzar=true, ejecuta esa misma tarea y vuelve a comprobar.
# Avisa con una notificación de Windows y, si hay ntfy_topic, al móvil. Solo
# avisa al empezar a fallar, cada repetir_aviso horas mientras siga, y al
# recuperarse.
#
# Uso: powershell -ExecutionPolicy Bypass -File axis_watchdog.ps1 [-Config ruta] [-SinNotificacion]
# Código de salida: 0 OK, 1 fallo, 2 error de configuración.

param(
  [string]$Config = "",
  [switch]$SinNotificacion
)

$ErrorActionPreference = "Stop"
$Aqui = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (-not $Config) { $Config = Join-Path $Aqui "config.json" }
$LogPath = Join-Path $Aqui "vigilante.log"
$EstadoPath = Join-Path $Aqui "estado_vigilante.json"
$EsWindows = [Environment]::OSVersion.Platform -eq "Win32NT"
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

function Log([string]$msg) {
  $linea = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Write-Host $linea
  try { Add-Content -Path $LogPath -Value $linea -Encoding UTF8 } catch {}
}

function Opcion($cfg, [string]$nombre, $defecto) {
  if ($cfg -and ($cfg.PSObject.Properties.Name -contains $nombre) -and $null -ne $cfg.$nombre -and "$($cfg.$nombre)" -ne "") { return $cfg.$nombre }
  return $defecto
}

function A-Utc($valor) {
  if ($null -eq $valor -or "$valor" -eq "") { return $null }
  if ($valor -is [datetime]) { return $valor.ToUniversalTime() }
  try {
    return [DateTimeOffset]::Parse([string]$valor, [Globalization.CultureInfo]::InvariantCulture).UtcDateTime
  } catch { return $null }
}

function Formato-Edad([TimeSpan]$t) {
  $min = [int][Math]::Floor($t.TotalMinutes)
  if ($min -lt 60) { return "$min min" }
  return "{0} h {1:00} min" -f [int][Math]::Floor($min / 60), ($min % 60)
}

# ------------------------------------------------------------------ datos

function Comprobar-Datos([string]$url, [double]$maxHoras) {
  $problemas = @()
  $sep = if ($url.Contains("?")) { "&" } else { "?" }
  try {
    $raw = Invoke-RestMethod -UseBasicParsing -Uri ("{0}{1}_={2}" -f $url, $sep, [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) `
      -Headers @{ "User-Agent" = "axis-watchdog"; "Accept" = "application/json" } -TimeoutSec 30
  } catch {
    return @("No se pudo leer la URL de sincronización ($($_.Exception.Message)).")
  }

  $data = $raw
  if ($raw -and $raw.files -and $raw.files.'axis-sessions.json' -and $raw.files.'axis-sessions.json'.content -is [string]) {
    try { $data = $raw.files.'axis-sessions.json'.content | ConvertFrom-Json }
    catch { return @("El archivo axis-sessions.json del Gist no es un JSON válido.") }
  }

  # Preferimos la marca que escribe el propio script (cambia en cada
  # ejecución); si no, la fecha del Gist.
  $marca = $null; $origen = $null
  foreach ($k in "generated_at", "updated_at", "synced_at") {
    if ($data.PSObject.Properties.Name -contains $k) {
      $marca = A-Utc $data.$k
      if ($marca) { $origen = "campo '$k' del JSON"; break }
    }
  }
  if (-not $marca -and $raw.PSObject.Properties.Name -contains "updated_at") {
    $marca = A-Utc $raw.updated_at; $origen = "fecha del Gist"
  }

  if (-not $marca) {
    $problemas += "No hay fecha en los datos: no se puede saber cuándo corrió sync_axis.py por última vez."
  } else {
    $edad = [DateTime]::UtcNow - $marca
    if ($edad.TotalHours -gt $maxHoras) {
      $problemas += "Los datos no se actualizan desde el {0} (hace {1}, según {2}). Límite: {3} h." -f `
        $marca.ToLocalTime().ToString("dd/MM HH:mm"), (Formato-Edad $edad), $origen, $maxHoras
    }
  }

  $dias = if ($data.PSObject.Properties.Name -contains "days") { $data.days } else { $null }
  if (-not $dias -or @($dias.PSObject.Properties).Count -eq 0) {
    $problemas += "El JSON no trae ningún día de sesiones."
  }
  if (($data.PSObject.Properties.Name -contains "payments") -and @($data.payments | Where-Object { $_ -ne $null }).Count -eq 0) {
    $problemas += "El JSON trae 0 pagos (probablemente falló la descarga de pagos en AimHarder)."
  }
  return $problemas
}

# ------------------------------------------------------ tarea programada

function Comprobar-Tarea([string]$nombre, [double]$maxHoras) {
  if (-not $EsWindows) { return @() }
  try {
    $t = Get-ScheduledTask -TaskName $nombre -ErrorAction Stop
    $i = $t | Get-ScheduledTaskInfo -ErrorAction Stop
  } catch {
    return @("No existe o no se puede leer la tarea programada '$nombre'.")
  }
  $problemas = @()
  if ("$($t.State)" -eq "Disabled") { $problemas += "La tarea '$nombre' está DESHABILITADA." }
  $res = [int64]$i.LastTaskResult
  # 267009 (0x41301) = se está ejecutando ahora; 267011 (0x41303) = aún no se ha ejecutado.
  if ($res -ne 0 -and $res -ne 267009 -and $res -ne 267011) {
    $problemas += "La última ejecución de '{0}' terminó con error (código {1} / 0x{2:X})." -f $nombre, $res, ($res -band 0xFFFFFFFF)
  }
  $ultima = $i.LastRunTime
  if (-not $ultima -or $ultima.Year -lt 2000) {
    $problemas += "La tarea '$nombre' no se ha ejecutado nunca."
  } elseif (((Get-Date) - $ultima).TotalHours -gt $maxHoras) {
    $problemas += "La tarea '{0}' no se ejecuta desde hace {1}." -f $nombre, (Formato-Edad ((Get-Date) - $ultima))
  }
  return $problemas
}

function Relanzar-Tarea([string]$nombre) {
  if (-not $EsWindows) { return $false }
  Log "Relanzando la tarea '$nombre'..."
  try {
    try { Enable-ScheduledTask -TaskName $nombre -ErrorAction Stop | Out-Null } catch {}
    Start-ScheduledTask -TaskName $nombre -ErrorAction Stop
  } catch {
    Log "No se pudo relanzar la tarea: $($_.Exception.Message)"
    return $false
  }
  $fin = (Get-Date).AddMinutes(15)
  Start-Sleep -Seconds 5
  while ((Get-ScheduledTask -TaskName $nombre).State -eq "Running" -and (Get-Date) -lt $fin) { Start-Sleep -Seconds 10 }
  $res = (Get-ScheduledTaskInfo -TaskName $nombre).LastTaskResult
  Log "La tarea terminó con resultado $res."
  return ($res -eq 0)
}

# ------------------------------------------------------------- avisos

function Aviso-Windows([string]$titulo, [string]$texto) {
  if (-not $EsWindows) { return }
  try {
    Add-Type -AssemblyName System.Windows.Forms, System.Drawing
    $n = New-Object System.Windows.Forms.NotifyIcon
    $n.Icon = [System.Drawing.SystemIcons]::Warning
    $n.Visible = $true
    if ($texto.Length -gt 250) { $texto = $texto.Substring(0, 250) }
    $n.ShowBalloonTip(30000, $titulo, $texto, [System.Windows.Forms.ToolTipIcon]::Warning)
    Start-Sleep -Seconds 20
    $n.Dispose()
  } catch {}
}

function Aviso-Movil([string]$topic, [string]$titulo, [string]$texto, [string]$prioridad) {
  if (-not $topic) { return }
  $url = if ($topic.StartsWith("http")) { $topic } else { "https://ntfy.sh/$topic" }
  try {
    Invoke-RestMethod -UseBasicParsing -Method Post -Uri $url -TimeoutSec 20 `
      -Body ([Text.Encoding]::UTF8.GetBytes($texto)) -ContentType "text/plain; charset=utf-8" `
      -Headers @{ Title = $titulo; Priority = $prioridad; Tags = "warning" } | Out-Null
  } catch { Log "No se pudo enviar el aviso al móvil ($($_.Exception.Message))." }
}

# --------------------------------------------------------------- main

$cfg = $null
if (Test-Path $Config) {
  try { $cfg = Get-Content -Raw -Path $Config -Encoding UTF8 | ConvertFrom-Json }
  catch { Log "config.json no es válido: $($_.Exception.Message)"; exit 2 }
}
$url = Opcion $cfg "url" $env:AXIS_SYNC_URL
$maxHoras = [double](Opcion $cfg "max_horas" 3)
$tarea = Opcion $cfg "tarea" ""
# El Gist no cambia de fecha si los datos no cambian: con la tarea vigilada
# damos más margen a los datos para no dar falsas alarmas.
$maxHorasDatos = [double](Opcion $cfg "max_horas_datos" $(if ($tarea) { 24 } else { $maxHoras }))
$relanzar = [bool](Opcion $cfg "relanzar" $false) -and [bool]$tarea
$ntfy = Opcion $cfg "ntfy_topic" ""
$repetirHoras = [double](Opcion $cfg "repetir_aviso" 6)

if (-not $url) { Log "Falta la URL de sincronización (config.json -> url)."; exit 2 }

function Comprobar-Todo {
  $p = @(Comprobar-Datos $url $maxHorasDatos)
  if ($tarea) { $p += @(Comprobar-Tarea $tarea $maxHoras) }
  return ,$p
}

$problemas = Comprobar-Todo
$relanzado = $false
$relanzoBien = $false
if ($problemas.Count -gt 0 -and $relanzar) {
  foreach ($p in $problemas) { Log "FALLO: $p" }
  $relanzoBien = Relanzar-Tarea $tarea
  $relanzado = $true
  $problemas = Comprobar-Todo
}

$estado = $null
if (Test-Path $EstadoPath) { try { $estado = Get-Content -Raw $EstadoPath | ConvertFrom-Json } catch {} }
$estabaOk = if ($estado -and $null -ne $estado.ok) { [bool]$estado.ok } else { $true }
$ahora = [DateTime]::UtcNow

function Guardar-Estado($obj) {
  try { $obj | ConvertTo-Json | Set-Content -Path $EstadoPath -Encoding UTF8 } catch {}
}

if ($problemas.Count -eq 0) {
  $msg = "sync_axis.py funciona correctamente."
  if ($relanzado) { $msg += " (Se ha relanzado y ya está al día.)" }
  Log "OK: $msg"
  if (-not $SinNotificacion -and ($relanzado -or -not $estabaOk)) {
    Aviso-Movil $ntfy "Axis - sync recuperado" $msg "default"
    Aviso-Windows "Axis · sync recuperado" $msg
  }
  Guardar-Estado ([ordered]@{ ok = $true; desde = $ahora.ToString("o") })
  exit 0
}

foreach ($p in $problemas) { Log "FALLO: $p" }
$texto = ($problemas | ForEach-Object { "- $_" }) -join "`n"
if ($relanzado) {
  if ($relanzoBien) { $texto += "`nSe relanzó sync_axis.py pero los datos siguen sin estar bien." }
  else { $texto += "`nNo se pudo relanzar la tarea '$tarea'. Ábrela en el Programador de tareas y pulsa 'Ejecutar'." }
}
$ultimoAviso = if ($estado) { A-Utc $estado.ultimo_aviso } else { $null }
$toca = $estabaOk -or -not $ultimoAviso -or ($ahora - $ultimoAviso).TotalHours -ge $repetirHoras
if (-not $SinNotificacion -and $toca) {
  Aviso-Movil $ntfy "Axis - sync_axis.py NO funciona" $texto "high"
  Aviso-Windows "Axis · sync_axis.py NO está funcionando" $texto
  $ultimoAviso = $ahora
}
Guardar-Estado ([ordered]@{
  ok = $false
  desde = $(if (-not $estabaOk -and $estado.desde) { $estado.desde } else { $ahora.ToString("o") })
  ultimo_aviso = $(if ($ultimoAviso) { $ultimoAviso.ToString("o") } else { $null })
  problemas = $problemas
})
exit 1
