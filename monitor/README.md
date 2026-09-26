# Vigilante de `sync_axis.py`

Evita que la sincronización deje de funcionar sin que nadie se entere.
Tiene tres capas:

1. **Aviso en el panel**: si los datos del Gist tienen más de 6 h, el panel
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

```powershell
cd ruta\a\axis-panel\monitor
copy config.example.json config.json
notepad config.json        # URL del Gist, ruta a sync_axis.py, nombre de su tarea
python axis_watchdog.py    # prueba manual: debe decir "OK"
.\instalar_vigilante.ps1   # registra la tarea "Axis - Vigilante sync_axis" cada hora
```

Si PowerShell bloquea el script:
`powershell -ExecutionPolicy Bypass -File .\instalar_vigilante.ps1`.

Opciones de `config.json`:

| clave | qué es |
|---|---|
| `url` | la misma URL que pegas en el panel (Sincronización automática) |
| `max_horas` | antigüedad máxima permitida de los datos (def. 3) |
| `tarea` | nombre exacto de la tarea programada que ejecuta `sync_axis.py` (en el Programador de tareas). Déjalo vacío para no comprobarla |
| `script` / `python` | ruta a `sync_axis.py` y al `python.exe` con el que se ejecuta, para relanzarlo |
| `relanzar` | `true` para relanzar automáticamente si falla |
| `ntfy_topic` | nombre largo y difícil de adivinar; instala la app ntfy en el móvil y suscríbete a ese tema |
| `repetir_aviso` | horas entre avisos repetidos mientras siga fallando (def. 6) |

Log: `monitor/vigilante.log`. Estado: `monitor/estado_vigilante.json`.

## Recomendado en `sync_axis.py`

GitHub no cambia la fecha del Gist si el contenido subido es idéntico, así
que en horas sin cambios en AimHarder podría parecer "parado". Para que la
frescura sea exacta, añade al JSON que sube el script una marca de tiempo:

```python
data["generated_at"] = datetime.now(timezone.utc).isoformat()
```

El vigilante y el panel la usan automáticamente si existe.
