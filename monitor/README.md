# Vigilante de `sync_axis.py`

Evita que la sincronización deje de funcionar sin que nadie se entere.
Tiene tres capas:

1. **Aviso en el panel**: si los datos del Gist tienen más de 24 h (6 h si
   `sync_axis.py` escribe `generated_at`), el panel
   muestra una franja roja arriba ("Los datos llevan X h sin actualizarse…").
2. **Vigilante local (Windows)** — `axis_watchdog.py`, ejecutado cada hora
   por el Programador de tareas. Comprueba:
   - que la URL del Gist responde y se ha actualizado en las últimas `max_horas`;
   - que trae sesiones y pagos (0 pagos = fallo de descarga en el script);
   - el estado de la tarea programada de `sync_axis.py` (deshabilitada,
     último resultado con error, o sin ejecutarse hace horas).

   Si algo falla, **relanza `sync_axis.py`** (con `"relanzar": true`), vuelve
   a comprobar y, si sigue mal, muestra una notificación de Windows y
   (opcional) te manda un push al móvil con [ntfy](https://ntfy.sh).
   Solo avisa al empezar a fallar, cada `repetir_aviso` horas mientras siga
   fallando, y cuando se recupera.
3. **Routine en la nube de Claude Code** (opcional): una comprobación
   periódica que no depende de que el ordenador esté encendido y te avisa
   por push/email. Ver más abajo.

## Instalación (una vez)

1. Pulsa la tecla Windows, escribe `PowerShell` y ábrelo.
2. Pega esta línea y pulsa Enter:

   ```powershell
   irm https://raw.githubusercontent.com/danielrodriguezm2001-gif/axis-panel/claude/sync-axis-active-monitoring-no4sda/monitor/instalar.ps1 | iex
   ```
3. Responde a lo que te pregunte. El instalador (`instalar.ps1`) busca solo
   la tarea de `sync_axis.py` y la URL del Gist, lo prueba y lo programa cada
   hora. Queda en `C:\Users\<usuario>\axis-vigilante` (config, log y estado).

Desinstalar: `Unregister-ScheduledTask -TaskName "Axis - Vigilante sync_axis"`.

Opciones de `config.json` (las rellena el instalador):

| clave | qué es |
|---|---|
| `url` | la misma URL que pegas en el panel (Sincronización automática) |
| `max_horas` | horas máximas sin que se ejecute la tarea de `sync_axis.py` (def. 3) |
| `max_horas_datos` | antigüedad máxima de los datos del Gist (def. 24 si se vigila la tarea, si no = `max_horas`) |
| `tarea` | nombre de la tarea programada que ejecuta `sync_axis.py`; al relanzar se ejecuta esa misma tarea |
| `script` / `python` | ruta a `sync_axis.py` y a Python, para relanzarlo si no hay tarea |
| `relanzar` | `true` para relanzar automáticamente si falla |
| `ntfy_topic` | tema de la app ntfy para recibir el aviso en el móvil |
| `repetir_aviso` | horas entre avisos repetidos mientras siga fallando (def. 6) |

## Recomendado en `sync_axis.py`

GitHub no cambia la fecha del Gist si el contenido subido es idéntico, así
que en horas sin cambios en AimHarder podría parecer "parado". Para que la
frescura sea exacta, añade al JSON que sube el script una marca de tiempo:

```python
data["generated_at"] = datetime.now(timezone.utc).isoformat()
```

El vigilante y el panel la usan automáticamente si existe.
