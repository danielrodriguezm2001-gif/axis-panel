# Axis · Departamento de marketing autónomo

Cinco agentes de Claude Code que cada lunes preparan todo el marketing de la semana de **Axis Health & Performance**: informe de datos, brief, calendario, textos, adaptación a cada red y control de calidad. Tú solo revisas y apruebas.

```
 datos/ ──► Analista SEO/Performance ──► CMO (brief) ──► Estratega ──► Copywriter ──► Social Media ──► CMO (control de calidad)
                                                                                                          │
                                                       borradores/pendiente/ ◄─────────────────────────────┘
                                                                 │  tú: aprobar / cambios
                                                       borradores/aprobado/
                                                                 │  publicar
                                                       borradores/publicado/ + registro.csv ──► (vuelve a datos/ la semana siguiente)
```

## Requisitos
- [Claude Code](https://code.claude.com) instalado y con la sesión iniciada (`claude` en la terminal).
- Python 3.9 o superior (no necesita librerías externas).

## Rutina del lunes (unos 20 minutos de tu tiempo)
1. **Deja los datos** de la semana en `datos/` (exports de AimHarder, estadísticas de Instagram, Google Business Profile, anuncios). Consulta `datos/README.md`.
2. **Lanza el flujo** desde esta carpeta:
   ```bash
   cd marketing
   scripts/axis_marketing.py semana
   ```
   Tarda entre 10 y 20 minutos. Si un paso falla, el script te dice cómo reanudarlo (`--desde <agente>`).
3. **Lee** `semanas/<semana>/00-resumen-para-daniel.md`.
4. **Decide** pieza a pieza:
   ```bash
   scripts/axis_marketing.py aprobar 2026-W41-01
   scripts/axis_marketing.py cambios 2026-W41-02 "el gancho no me convence, empieza por la pregunta"
   scripts/axis_marketing.py aprobar 2026-W41            # todo lo que el CMO ha dado por bueno
   ```
5. **Publica** cada día lo que toca:
   ```bash
   scripts/axis_marketing.py publicar
   ```
   Muestra el texto listo para pegar en Instagram o Google, mueve la pieza a `publicado/` y la apunta en `registro.csv`.

Otras órdenes: `estado` (qué hay en cada estado), `paso <agente>` (relanzar un solo agente) y `--dry-run` (ver qué haría sin ejecutar nada).

## Programarlo cada lunes
En tu ordenador (macOS o Linux), con `crontab -e`, para que se ejecute los lunes a las 7:00:
```
0 7 * * 1 cd /ruta/a/axis-panel/marketing && ./scripts/axis_marketing.py semana >> semanas/cron.log 2>&1
```
También se puede dejar como tarea programada en Claude Code en la nube.

## Sobre la publicación
Hoy `publicar` deja cada pieza **lista para copiar y pegar** y lleva el registro, pero no publica directamente en Instagram ni en Google. Para publicar automáticamente después de tu aprobación hacen falta acceso a la API de Meta (Instagram Graph API, con una cuenta de empresa conectada a una página de Facebook) y a la API de Google Business Profile. Se puede añadir más adelante sin cambiar el flujo de aprobación.

## Estructura
| Ruta | Contenido |
|---|---|
| `context/` | Marca y voz, servicios y equipo, buyer personas, plan y canales, precios (uso interno) |
| `.claude/agents/` | Los 5 agentes. Desde esta carpeta también puedes llamarlos en una sesión normal de Claude Code: «usa el copywriter para…» |
| `scripts/axis_marketing.py` | Orquestador del flujo y de los estados |
| `datos/` | Exports con datos de clientes (**no se suben a git**) |
| `semanas/<S>/` | Informe, brief, calendario y resumen de cada semana |
| `borradores/` | Piezas: `pendiente/`, `aprobado/` y `publicado/` |

## Fuentes del contexto
Carpeta de Drive «Axis»: Plan de captación Q4 2026 v3, Auditoría SEO de theaxistraining.es, Auditoría SEO local de Google Business Profile, Precios de small group de la competencia y colores de marca, más la entrevista con Daniel (octubre de 2026).
