# Departamento de marketing de Axis Health & Performance

Sistema multiagente que prepara cada semana el marketing de Axis (centro de entrenamiento y salud en Gavà). **Nada se publica sin la aprobación de Daniel.**

## Reglas que cualquier sesión de Claude debe respetar aquí
- Lee `context/` antes de escribir nada para Axis. Mandan `context/marca.md` y sus reglas comerciales.
- **Sin precios públicos ni «desde», sin descuentos ni ofertas.** `context/precios.md` es de uso interno.
- De tú, solo en español. Usa «Axis» o «Axis Health & Performance», nunca «The Axis Training».
- La sede es Gavà. Viladecans no se menciona hasta nuevo aviso.
- Toda llamada a la acción lleva a reservar la valoración inicial.
- Nunca copies datos personales de `datos/` a ningún archivo versionado.

## Agentes (`.claude/agents/`)
| Agente | Rol | Entregable |
|---|---|---|
| `analista-seo-performance` | Datos, SEO local y anuncios | `semanas/<S>/01-informe-analista.md` |
| `cmo` | Director: brief y control de calidad final | `02-brief-cmo.md`, `00-resumen-para-daniel.md` |
| `estratega-contenidos` | Calendario pieza a pieza | `03-calendario.md` |
| `copywriter` | Textos finales | `borradores/pendiente/<S>/*.md` |
| `social-media` | Adaptación a cada plataforma, stories y comunidad | Secciones `## Publicación` y packs |

## Flujo de estados
`borradores/pendiente/` → (Daniel: `aprobar`) → `borradores/aprobado/` → (`publicar`) → `borradores/publicado/` + `registro.csv`

## Comandos
```bash
scripts/axis_marketing.py semana                 # flujo completo de la semana actual
scripts/axis_marketing.py estado                 # qué hay en cada estado
scripts/axis_marketing.py aprobar 2026-W41-03    # aprobar una pieza (o una semana: aprobar 2026-W41)
scripts/axis_marketing.py cambios 2026-W41-03 "más corto y que salga Erik"
scripts/axis_marketing.py publicar               # piezas aprobadas cuya fecha ha llegado
```
