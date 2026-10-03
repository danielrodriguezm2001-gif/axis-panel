#!/usr/bin/env python3
"""
Departamento de marketing autónomo de Axis Health & Performance.

Orquesta los agentes de .claude/agents/ con Claude Code en modo no interactivo:

    analista-seo-performance → cmo (brief) → estratega-contenidos
    → copywriter → social-media → cmo (control de calidad)

Nada se publica sin aprobación: los agentes escriben en borradores/pendiente/,
Daniel aprueba (pasa a borradores/aprobado/) y `publicar` lo mueve a
borradores/publicado/ dejando el texto listo y un registro.

Uso:
    scripts/axis_marketing.py semana [--semana 2026-W41] [--desde copywriter]
    scripts/axis_marketing.py paso <agente> [--semana ...]
    scripts/axis_marketing.py estado
    scripts/axis_marketing.py aprobar <id|archivo|semana> [--forzar]
    scripts/axis_marketing.py cambios <id|archivo> "comentario"
    scripts/axis_marketing.py publicar [--hasta AAAA-MM-DD]
Opciones globales: --dry-run (muestra lo que haría sin llamar a Claude)
"""

import argparse
import csv
import datetime as dt
import re
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BORRADORES = RAIZ / "borradores"
PENDIENTE = BORRADORES / "pendiente"
APROBADO = BORRADORES / "aprobado"
PUBLICADO = BORRADORES / "publicado"
SEMANAS = RAIZ / "semanas"
REGISTRO = PUBLICADO / "registro.csv"

HERRAMIENTAS = "Read,Write,Edit,Glob,Grep,WebSearch,WebFetch"
HERRAMIENTAS_ANALISTA = HERRAMIENTAS + ",Bash(python3:*),Bash(awk:*),Bash(wc:*),Bash(head:*)"

DRY_RUN = False


# ---------------------------------------------------------------- utilidades

def semana_actual(hoy=None):
    hoy = hoy or dt.date.today()
    año, num, _ = hoy.isocalendar()
    return f"{año}-W{num:02d}"


def lunes_de(semana):
    año, num = semana.split("-W")
    return dt.date.fromisocalendar(int(año), int(num), 1)


def es_primera_semana_del_mes(semana):
    return lunes_de(semana).day <= 7


def es_ultima_semana_del_mes(semana):
    lunes = lunes_de(semana)
    return (lunes + dt.timedelta(days=7)).month != lunes.month


def leer_frontmatter(ruta):
    texto = ruta.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", texto, re.S)
    datos = {}
    if m:
        for linea in m.group(1).splitlines():
            if ":" in linea:
                k, v = linea.split(":", 1)
                datos[k.strip()] = v.strip().strip('"')
    return datos


def fijar_campo(ruta, campo, valor):
    texto = ruta.read_text(encoding="utf-8")
    patron = re.compile(rf"^({re.escape(campo)}:).*$", re.M)
    if patron.search(texto):
        texto = patron.sub(rf"\g<1> {valor}", texto, count=1)
    else:
        texto = texto.replace("---\n", f"---\n{campo}: {valor}\n", 1)
    ruta.write_text(texto, encoding="utf-8")


def piezas(carpeta):
    return sorted(p for p in carpeta.rglob("*.md") if p.name != "README.md")


def resolver(objetivo, carpeta=PENDIENTE):
    """Acepta una ruta, un id de pieza (2026-W41-03) o una semana (2026-W41)."""
    ruta = Path(objetivo)
    if ruta.exists():
        return [ruta.resolve()]
    if re.fullmatch(r"\d{4}-W\d{2}", objetivo):
        return piezas(carpeta / objetivo)
    return [p for p in piezas(carpeta) if p.name.startswith(objetivo + "_")]


def claude(agente, instrucciones, herramientas=HERRAMIENTAS):
    cmd = [
        "claude", "-p", instrucciones,
        "--agent", agente,
        "--permission-mode", "acceptEdits",
        "--allowedTools", herramientas,
    ]
    print(f"\n▶ {agente}")
    if DRY_RUN:
        print("  (dry-run) " + instrucciones.splitlines()[0][:110] + "…")
        return
    if shutil.which("claude") is None:
        sys.exit("No encuentro el comando `claude`. Instala Claude Code: https://code.claude.com")
    r = subprocess.run(cmd, cwd=RAIZ)
    if r.returncode != 0:
        sys.exit(f"✖ El agente {agente} ha fallado (código {r.returncode}). "
                 f"Reanuda con: scripts/axis_marketing.py semana --desde {agente}")


# ---------------------------------------------------------------- pasos

def pasos_de(semana):
    d = SEMANAS / semana
    p = PENDIENTE / semana
    lunes = lunes_de(semana)
    marco = (f"Semana de trabajo: {semana} (del lunes {lunes:%d/%m/%Y} al domingo "
             f"{lunes + dt.timedelta(days=6):%d/%m/%Y}). Hoy es {dt.date.today():%d/%m/%Y}. "
             f"Carpeta de la semana: semanas/{semana}/. Borradores: borradores/pendiente/{semana}/.")
    extra_mes = ""
    if es_primera_semana_del_mes(semana):
        extra_mes += " Es la PRIMERA semana del mes: hay que preparar el guion del día de contenido."
    if es_ultima_semana_del_mes(semana):
        extra_mes += " Es la ÚLTIMA semana del mes: toca informe mensual."

    return [
        ("analista-seo-performance",
         f"{marco}{extra_mes}\nEscribe el informe semanal en semanas/{semana}/01-informe-analista.md "
         f"siguiendo tus instrucciones.", HERRAMIENTAS_ANALISTA,
         d / "01-informe-analista.md"),
        ("cmo",
         f"{marco}{extra_mes}\nMODO 1 · BRIEF SEMANAL. Lee semanas/{semana}/01-informe-analista.md "
         f"y escribe semanas/{semana}/02-brief-cmo.md.", HERRAMIENTAS,
         d / "02-brief-cmo.md"),
        ("estratega-contenidos",
         f"{marco}{extra_mes}\nEscribe el calendario pieza a pieza en semanas/{semana}/03-calendario.md.",
         HERRAMIENTAS, d / "03-calendario.md"),
        ("copywriter",
         f"{marco}\nRedacta TODAS las piezas de semanas/{semana}/03-calendario.md, un archivo por pieza "
         f"en borradores/pendiente/{semana}/, con el formato de tus instrucciones.", HERRAMIENTAS, p),
        ("social-media",
         f"{marco}\nPrepara para su plataforma todas las piezas de borradores/pendiente/{semana}/, "
         f"y crea el pack de stories y el archivo de comunidad.", HERRAMIENTAS, None),
        ("cmo",
         f"{marco}\nMODO 2 · CONTROL DE CALIDAD FINAL. Revisa cada archivo de borradores/pendiente/{semana}/ "
         f"y escribe semanas/{semana}/00-resumen-para-daniel.md. En el resumen, indica que se aprueba con "
         f"`scripts/axis_marketing.py aprobar <id>` (o `aprobar {semana}` para toda la semana) y que "
         f"se piden cambios con `scripts/axis_marketing.py cambios <id> \"comentario\"`.",
         HERRAMIENTAS, d / "00-resumen-para-daniel.md"),
    ]


def cmd_semana(args):
    semana = args.semana or semana_actual()
    (SEMANAS / semana).mkdir(parents=True, exist_ok=True)
    (PENDIENTE / semana).mkdir(parents=True, exist_ok=True)
    pasos = pasos_de(semana)
    nombres = [p[0] for p in pasos]
    inicio = 0
    if args.desde:
        if args.desde not in nombres:
            sys.exit(f"Agente desconocido: {args.desde}. Opciones: {', '.join(dict.fromkeys(nombres))}")
        inicio = nombres.index(args.desde)

    print(f"═══ Axis · flujo de marketing · {semana} ═══")
    for agente, instr, herramientas, salida in pasos[inicio:]:
        claude(agente, instr, herramientas)
        if not DRY_RUN and salida is not None and not salida.exists():
            sys.exit(f"✖ {agente} no ha generado {salida.relative_to(RAIZ)}. "
                     f"Reanuda con: scripts/axis_marketing.py semana --semana {semana} --desde {agente}")

    resumen = SEMANAS / semana / "00-resumen-para-daniel.md"
    print(f"\n✔ Semana {semana} lista para revisar.")
    print(f"  Resumen: {resumen.relative_to(RAIZ)}")
    print(f"  Piezas:  borradores/pendiente/{semana}/")


def cmd_paso(args):
    semana = args.semana or semana_actual()
    (SEMANAS / semana).mkdir(parents=True, exist_ok=True)
    (PENDIENTE / semana).mkdir(parents=True, exist_ok=True)
    pasos = [p for p in pasos_de(semana) if p[0] == args.agente]
    if not pasos:
        sys.exit(f"Agente desconocido: {args.agente}")
    agente, instr, herramientas, _ = pasos[-1] if args.agente == "cmo" and args.qa else pasos[0]
    claude(agente, instr, herramientas)


def cmd_estado(_args):
    for nombre, carpeta in (("PENDIENTE", PENDIENTE), ("APROBADO", APROBADO), ("PUBLICADO", PUBLICADO)):
        lista = piezas(carpeta)
        print(f"\n{nombre} ({len(lista)})")
        for p in lista:
            fm = leer_frontmatter(p)
            qa = fm.get("revision_cmo", "—")
            print(f"  {fm.get('fecha_publicacion', '—'):10}  {fm.get('canal', '—'):20}  "
                  f"QA:{qa:9}  {p.relative_to(BORRADORES)}")


def cmd_aprobar(args):
    lista = resolver(args.objetivo)
    if not lista:
        sys.exit(f"No encuentro nada pendiente que coincida con «{args.objetivo}».")
    for p in lista:
        fm = leer_frontmatter(p)
        if fm.get("revision_cmo") != "ok" and not args.forzar:
            print(f"  ⚠ {p.name}: la revisión del CMO es «{fm.get('revision_cmo')}». "
                  f"Revísalo o usa --forzar.")
            continue
        destino = APROBADO / p.parent.name / p.name
        if DRY_RUN:
            print(f"  (dry-run) aprobaría {p.name}")
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        fijar_campo(p, "estado", "aprobado")
        fijar_campo(p, "aprobado_el", dt.date.today().isoformat())
        shutil.move(str(p), destino)
        print(f"  ✔ aprobado: {destino.relative_to(BORRADORES)}")


def cmd_cambios(args):
    lista = resolver(args.objetivo)
    if len(lista) != 1:
        sys.exit("Indica una sola pieza (su id o su ruta) en borradores/pendiente/.")
    ruta = lista[0].relative_to(RAIZ)
    claude("copywriter",
           f"Daniel pide cambios en {ruta}. Comentario de Daniel: «{args.comentario}». "
           f"Reescribe solo ese archivo siguiendo tus instrucciones.")
    claude("cmo",
           f"MODO 2 · CONTROL DE CALIDAD FINAL solo del archivo {ruta} (revisado tras un comentario de "
           f"Daniel). No toques otros archivos ni el resumen.")


def cmd_publicar(args):
    hasta = dt.date.fromisoformat(args.hasta) if args.hasta else dt.date.today()
    listas = [p for p in piezas(APROBADO)
              if leer_frontmatter(p).get("fecha_publicacion", "9999-12-31") <= hasta.isoformat()]
    if not listas:
        print(f"No hay piezas aprobadas con fecha hasta el {hasta}.")
        return
    nuevo = not REGISTRO.exists()
    if not DRY_RUN:
        PUBLICADO.mkdir(parents=True, exist_ok=True)
    for p in listas:
        fm = leer_frontmatter(p)
        texto = p.read_text(encoding="utf-8")
        m = re.search(r"## Texto para publicar\n(.*?)(?=\n## |\Z)", texto, re.S)
        print("\n" + "─" * 70)
        print(f"{fm.get('id')} · {fm.get('canal')} · {fm.get('fecha_publicacion')} {fm.get('hora', '')}")
        print("─" * 70)
        print((m.group(1).strip() if m else "(sin sección «Texto para publicar»: abre el archivo)"))
        if DRY_RUN:
            continue
        destino = PUBLICADO / p.parent.name / p.name
        destino.parent.mkdir(parents=True, exist_ok=True)
        fijar_campo(p, "estado", "publicado")
        fijar_campo(p, "publicado_el", dt.datetime.now().isoformat(timespec="minutes"))
        shutil.move(str(p), destino)
        with REGISTRO.open("a", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            if nuevo:
                w.writerow(["id", "canal", "fecha_publicacion", "perfil", "pilar", "archivo", "publicado_el"])
                nuevo = False
            w.writerow([fm.get("id"), fm.get("canal"), fm.get("fecha_publicacion"), fm.get("perfil"),
                        fm.get("pilar"), destino.relative_to(RAIZ), dt.datetime.now().isoformat(timespec="minutes")])
    print(f"\n✔ {len(listas)} pieza(s) pasadas a publicado. Copia cada texto en su plataforma "
          f"(o en la herramienta de programación) y añade las métricas a datos/ la semana siguiente.")


# ---------------------------------------------------------------- main

def main():
    global DRY_RUN
    ap = argparse.ArgumentParser(description="Departamento de marketing autónomo de Axis")
    ap.add_argument("--dry-run", action="store_true", help="muestra lo que haría sin ejecutar")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("semana", help="ejecuta el flujo completo de la semana")
    s.add_argument("--semana", help="semana ISO, por ejemplo 2026-W41 (por defecto, la actual)")
    s.add_argument("--desde", help="reanudar desde este agente")
    s.set_defaults(fn=cmd_semana)

    s = sub.add_parser("paso", help="ejecuta un solo agente")
    s.add_argument("agente")
    s.add_argument("--semana")
    s.add_argument("--qa", action="store_true", help="con cmo: modo de control de calidad")
    s.set_defaults(fn=cmd_paso)

    sub.add_parser("estado", help="lista las piezas por estado").set_defaults(fn=cmd_estado)

    s = sub.add_parser("aprobar", help="aprueba una pieza, por id o ruta, o una semana entera")
    s.add_argument("objetivo")
    s.add_argument("--forzar", action="store_true", help="aprueba aunque el CMO no haya dado el ok")
    s.set_defaults(fn=cmd_aprobar)

    s = sub.add_parser("cambios", help="pide cambios en una pieza al copywriter")
    s.add_argument("objetivo")
    s.add_argument("comentario")
    s.set_defaults(fn=cmd_cambios)

    s = sub.add_parser("publicar", help="pasa a publicado las piezas aprobadas cuya fecha ha llegado")
    s.add_argument("--hasta", help="AAAA-MM-DD (por defecto, hoy)")
    s.set_defaults(fn=cmd_publicar)

    args = ap.parse_args()
    DRY_RUN = args.dry_run
    args.fn(args)


if __name__ == "__main__":
    main()
