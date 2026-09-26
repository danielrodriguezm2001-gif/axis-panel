# Axis · Instalador del vigilante de sync_axis.py
#
# Uso: abre PowerShell y pega esta línea (todo en una):
#   irm https://raw.githubusercontent.com/danielrodriguezm2001-gif/axis-panel/claude/sync-axis-active-monitoring-no4sda/monitor/instalar.ps1 | iex
#
# Hace todo solo:
#   1. Copia el vigilante a C:\Users\<tu usuario>\axis-vigilante
#   2. Busca la tarea programada que ejecuta sync_axis.py
#   3. Saca la URL del Gist del propio sync_axis.py (o te la pide)
#   4. Opcional: avisos al móvil con la app ntfy
#   5. Lo prueba y lo programa para que se ejecute cada hora
# Para desinstalarlo: Unregister-ScheduledTask -TaskName "Axis - Vigilante sync_axis"

$ErrorActionPreference = "Stop"
$Base = "https://raw.githubusercontent.com/danielrodriguezm2001-gif/axis-panel/claude/sync-axis-active-monitoring-no4sda/monitor"
$NombreTarea = "Axis - Vigilante sync_axis"
$Destino = Join-Path $env:USERPROFILE "axis-vigilante"

function Paso($t) { Write-Host ""; Write-Host "==> $t" -ForegroundColor Cyan }
function Ok($t) { Write-Host "    $t" -ForegroundColor Green }
function Aviso($t) { Write-Host "    $t" -ForegroundColor Yellow }

try {
  # ---------------------------------------------------------------- 1
  Paso "Descargando el vigilante en $Destino"
  New-Item -ItemType Directory -Force -Path $Destino | Out-Null
  $watchdog = Join-Path $Destino "axis_watchdog.py"
  Invoke-WebRequest -UseBasicParsing -Uri "$Base/axis_watchdog.py" -OutFile $watchdog
  Ok "Descargado."

  # ---------------------------------------------------------------- 2
  Paso "Buscando la tarea programada de sync_axis.py"
  $tareaSync = $null; $accionSync = $null
  foreach ($t in Get-ScheduledTask) {
    if ($t.TaskName -eq $NombreTarea) { continue }
    foreach ($a in $t.Actions) {
      if ("$($a.Execute) $($a.Arguments) $($a.WorkingDirectory)" -match "sync_axis") {
        $tareaSync = $t; $accionSync = $a; break
      }
    }
    if ($tareaSync) { break }
  }

  $scriptSync = $null
  if ($tareaSync) {
    Ok "Encontrada: '$($tareaSync.TaskName)' (estado: $($tareaSync.State))"
    $texto = "$($accionSync.Execute) $($accionSync.Arguments)"
    $m = [regex]::Match($texto, '[A-Za-z]:\\[^"]*?sync_axis[^"\s]*\.py')
    if ($m.Success) { $scriptSync = $m.Value }
    elseif ($accionSync.WorkingDirectory) {
      $c = Join-Path ($accionSync.WorkingDirectory.Trim('"')) "sync_axis.py"
      if (Test-Path $c) { $scriptSync = $c }
    }
  } else {
    Aviso "No encuentro ninguna tarea programada que ejecute sync_axis.py."
    Aviso "El vigilante comprobará igualmente que los datos se actualizan y te avisará,"
    Aviso "pero no podrá relanzarlo solo."
  }
  if (-not $scriptSync) {
    Write-Host ""
    $r = Read-Host "    Arrastra aquí el archivo sync_axis.py y pulsa Enter (o solo Enter para saltar)"
    $r = $r.Trim().Trim('"').Trim("'")
    if ($r -and (Test-Path $r)) { $scriptSync = $r }
  }
  if ($scriptSync) { Ok "sync_axis.py: $scriptSync" }

  # ---------------------------------------------------------------- 3
  Paso "Buscando la URL de sincronización (el Gist)"
  $url = $null
  if ($scriptSync) {
    try {
      $contenido = Get-Content -Raw -Path $scriptSync -ErrorAction Stop
      $m = [regex]::Match($contenido, 'gists/([0-9a-fA-F]{20,})')
      if (-not $m.Success) { $m = [regex]::Match($contenido, 'gist\.github(?:usercontent)?\.com/[^/\s"'']+/([0-9a-fA-F]{20,})') }
      if ($m.Success) { $url = "https://api.github.com/gists/$($m.Groups[1].Value)" }
    } catch {
      # Suele pasar si sync_axis.py se creó como administrador: no es grave,
      # solo necesitábamos leerlo para sacar la URL.
      Aviso "No tengo permiso para leer sync_axis.py; no pasa nada, te pido la URL."
    }
  }
  if ($url) {
    Ok "Encontrada en sync_axis.py: $url"
  } else {
    Aviso "No la he encontrado sola. Cópiala del panel: pestaña 'Sesiones e import',"
    Aviso "recuadro 'Sincronización automática' (es la URL que pegaste allí)."
    while (-not $url) { $url = (Read-Host "    Pega la URL aquí y pulsa Enter").Trim() }
  }

  # ---------------------------------------------------------------- python
  $python = $null
  if ($accionSync -and $accionSync.Execute -match 'python(w)?\.exe') {
    $exe = $accionSync.Execute.Trim('"')
    if (Test-Path $exe) { $python = $exe }
  }
  if (-not $python) {
    foreach ($n in "python.exe", "py.exe") {
      $c = Get-Command $n -ErrorAction SilentlyContinue
      if ($c -and $c.Source -notmatch "WindowsApps") { $python = $c.Source; break }
    }
  }
  if (-not $python) { throw "No encuentro Python en este ordenador. Es el mismo que usa sync_axis.py; si no lo tienes, instálalo desde python.org y vuelve a pegar la línea." }
  # pythonw.exe = sin ventana negra cada hora
  $pythonw = Join-Path (Split-Path $python) "pythonw.exe"
  if (-not (Test-Path $pythonw)) { $pythonw = $python }

  # ---------------------------------------------------------------- 4
  Paso "Avisos en el móvil (opcional)"
  $ntfy = ""
  $r = Read-Host "    ¿Quieres recibir los avisos también en el móvil? (s/n)"
  if ($r -match '^[sSyY]') {
    $ntfy = "axis-" + ([guid]::NewGuid().ToString("N").Substring(0, 16))
    Write-Host ""
    Write-Host "    1. Instala en el móvil la app 'ntfy' (App Store o Google Play)." -ForegroundColor White
    Write-Host "    2. Ábrela, pulsa '+' y escribe exactamente este nombre:" -ForegroundColor White
    Write-Host ""
    Write-Host "           $ntfy" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "    3. Pulsa 'Suscribirse' (Subscribe)." -ForegroundColor White
    Read-Host "    Cuando lo tengas, pulsa Enter y te mando un aviso de prueba"
    try {
      Invoke-RestMethod -Method Post -Uri "https://ntfy.sh/$ntfy" -Body "Aviso de prueba del vigilante de Axis. Si ves esto, funciona." -Headers @{ Title = "Axis - prueba" } | Out-Null
      Ok "Enviado. Debería llegarte al móvil en unos segundos."
    } catch { Aviso "No se pudo enviar la prueba ($($_.Exception.Message))." }
  }

  # ---------------------------------------------------------------- config
  $config = [ordered]@{
    url = $url
    max_horas = 3
    tarea = $(if ($tareaSync) { $tareaSync.TaskName } else { "" })
    script = $(if ($scriptSync) { $scriptSync } else { "" })
    python = $python
    relanzar = [bool]($tareaSync -or $scriptSync)
    ntfy_topic = $ntfy
    repetir_aviso = 6
  }
  $configPath = Join-Path $Destino "config.json"
  [IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))

  # ---------------------------------------------------------------- 5
  Paso "Probando el vigilante ahora mismo"
  & $python $watchdog --config $configPath --sin-notificacion
  if ($LASTEXITCODE -eq 0) { Ok "Todo correcto: sync_axis.py está funcionando." }
  elseif ($LASTEXITCODE -eq 1) { Aviso "Ha detectado un problema (arriba ves cuál). Lo dejo instalado igualmente para que te avise y lo relance." }
  else { throw "La configuración no es válida (mira el mensaje de arriba)." }

  Paso "Programando la comprobación cada hora"
  $accion = New-ScheduledTaskAction -Execute $pythonw -Argument "`"$watchdog`" --config `"$configPath`"" -WorkingDirectory $Destino
  $disparador = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Hours 1)
  $ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew
  Register-ScheduledTask -TaskName $NombreTarea -Action $accion -Trigger $disparador -Settings $ajustes `
    -Description "Comprueba cada hora que sync_axis.py sigue actualizando el panel de Axis; avisa y lo relanza si falla." `
    -Force | Out-Null
  Ok "Instalado como tarea '$NombreTarea'."

  Write-Host ""
  Write-Host "LISTO. No tienes que hacer nada más." -ForegroundColor Green
  Write-Host "Si sync_axis.py deja de funcionar, intentará relanzarlo y, si no puede, te avisará."
  Write-Host "Registro de lo que hace: $Destino\vigilante.log"
} catch {
  Write-Host ""
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Copia este mensaje y pásaselo a Claude."
}
Write-Host ""
Read-Host "Pulsa Enter para cerrar"
