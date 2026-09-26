# Axis · Instala el vigilante de sync_axis.py en el Programador de tareas.
#
# Uso (PowerShell, desde la carpeta monitor):
#   .\instalar_vigilante.ps1                 # cada hora
#   .\instalar_vigilante.ps1 -CadaMinutos 30
#   .\instalar_vigilante.ps1 -Desinstalar
#
# Antes: copia config.example.json a config.json y rellénalo.

param(
  [int]$CadaMinutos = 60,
  [string]$Python = "",
  [string]$NombreTarea = "Axis - Vigilante sync_axis",
  [switch]$Desinstalar
)

$ErrorActionPreference = "Stop"
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $aqui "axis_watchdog.py"
$config = Join-Path $aqui "config.json"

if ($Desinstalar) {
  Unregister-ScheduledTask -TaskName $NombreTarea -Confirm:$false
  Write-Host "Tarea '$NombreTarea' eliminada."
  exit 0
}

if (-not (Test-Path $config)) {
  Write-Error "Falta $config. Copia config.example.json a config.json y rellénalo."
}

if (-not $Python) {
  # pythonw.exe evita que se abra una ventana negra cada hora.
  $cmd = Get-Command pythonw.exe -ErrorAction SilentlyContinue
  if (-not $cmd) { $cmd = Get-Command python.exe -ErrorAction SilentlyContinue }
  if (-not $cmd) { Write-Error "No encuentro Python. Pásalo con -Python 'C:\ruta\pythonw.exe'." }
  $Python = $cmd.Source
}

$accion = New-ScheduledTaskAction -Execute $Python -Argument "`"$script`" --config `"$config`"" -WorkingDirectory $aqui
$disparador = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $CadaMinutos)
# Si el PC estaba apagado a la hora prevista, ejecuta en cuanto se encienda.
$ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $NombreTarea -Action $accion -Trigger $disparador -Settings $ajustes `
  -Description "Comprueba que sync_axis.py sigue actualizando los datos del panel de Axis; avisa y lo relanza si falla." `
  -Force | Out-Null

Write-Host "Tarea '$NombreTarea' instalada: cada $CadaMinutos min con $Python."
Write-Host "Prueba ahora mismo:  & '$Python' '$script' --config '$config'"
