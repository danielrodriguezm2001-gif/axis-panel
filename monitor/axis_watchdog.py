#!/usr/bin/env python3
"""Axis · Vigilante de sync_axis.py

Comprueba periódicamente que sync_axis.py sigue funcionando y, si no, avisa
y (opcionalmente) lo relanza. Pensado para ejecutarse cada hora desde el
Programador de tareas de Windows (ver instalar_vigilante.ps1).

Qué comprueba:
  1. Frescura de los datos: descarga la misma URL que usa el panel (el Gist)
     y mira cuándo se actualizó por última vez. Si supera --max-horas, falla.
  2. Contenido: que haya días con sesiones y que haya pagos (si llegan 0,
     casi siempre es que la descarga de AimHarder falló dentro del script).
  3. (Solo Windows, si se indica --tarea) Estado de la tarea programada de
     sync_axis.py: que no esté deshabilitada, que su último resultado sea 0
     y que se haya ejecutado recientemente.

Si algo falla:
  - con --relanzar y --script, ejecuta sync_axis.py y vuelve a comprobar;
  - avisa con una notificación de Windows y, si se configura, al móvil vía
    ntfy.sh (--ntfy-topic). Solo avisa al pasar de OK a fallo, cada
    --repetir-aviso horas mientras siga fallando, y cuando se recupera.

Solo usa la librería estándar de Python. Código de salida: 0 OK, 1 fallo,
2 error de configuración.
"""
import argparse
import datetime as dt
import json
import os
import platform
import re
import subprocess
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG = os.path.join(HERE, "config.json")
DEFAULT_STATE = os.path.join(HERE, "estado_vigilante.json")
DEFAULT_LOG = os.path.join(HERE, "vigilante.log")
IS_WINDOWS = platform.system() == "Windows"


def now_utc():
    return dt.datetime.now(dt.timezone.utc)


def log(msg, path):
    line = "[%s] %s" % (dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg)
    print(line)
    if path:
        try:
            with open(path, "a", encoding="utf-8") as f:
                f.write(line + "\n")
        except OSError:
            pass


def parse_iso(value):
    if not isinstance(value, str) or not value.strip():
        return None
    v = value.strip().replace("Z", "+00:00")
    try:
        d = dt.datetime.fromisoformat(v)
    except ValueError:
        return None
    if d.tzinfo is None:
        d = d.astimezone()  # hora local del equipo
    return d.astimezone(dt.timezone.utc)


def fmt_age(delta):
    mins = int(delta.total_seconds() // 60)
    if mins < 60:
        return "%d min" % mins
    return "%d h %02d min" % (mins // 60, mins % 60)


# ---------------------------------------------------------------- datos

def fetch_sync_data(url, timeout=30):
    """Devuelve (json_interno, marca_de_tiempo_utc | None, origen_marca)."""
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(
        "%s%s_=%d" % (url, sep, int(now_utc().timestamp())),
        headers={"User-Agent": "axis-watchdog", "Accept": "application/json"},
    )
    token = os.environ.get("GITHUB_TOKEN")
    if token and "api.github.com" in url:
        req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        body = res.read().decode("utf-8")
        last_modified = res.headers.get("Last-Modified")
    raw = json.loads(body)

    data = raw
    files = raw.get("files") if isinstance(raw, dict) else None
    if isinstance(files, dict) and isinstance(files.get("axis-sessions.json"), dict):
        content = files["axis-sessions.json"].get("content")
        if isinstance(content, str):
            data = json.loads(content)

    # Preferimos una marca que escriba el propio script (cambia en cada
    # ejecución aunque los datos sean iguales); si no, la del Gist.
    for key in ("generated_at", "updated_at", "synced_at"):
        ts = parse_iso(data.get(key)) if isinstance(data, dict) else None
        if ts:
            return data, ts, "campo '%s' del JSON" % key
    ts = parse_iso(raw.get("updated_at")) if isinstance(raw, dict) else None
    if ts:
        return data, ts, "updated_at del Gist"
    if last_modified:
        try:
            from email.utils import parsedate_to_datetime
            return data, parsedate_to_datetime(last_modified).astimezone(dt.timezone.utc), "cabecera Last-Modified"
        except (TypeError, ValueError):
            pass
    return data, None, None


def check_data(url, max_hours):
    problems = []
    try:
        data, ts, source = fetch_sync_data(url)
    except (urllib.error.URLError, OSError, ValueError) as e:
        return ["No se pudo leer la URL de sincronización (%s)." % e], None

    if ts is None:
        problems.append("No hay marca de tiempo en los datos: no se puede saber cuándo corrió sync_axis.py por última vez.")
    else:
        age = now_utc() - ts
        if age > dt.timedelta(hours=max_hours):
            local = ts.astimezone().strftime("%d/%m %H:%M")
            problems.append(
                "Los datos no se actualizan desde el %s (hace %s, según %s). Límite: %s h."
                % (local, fmt_age(age), source, max_hours)
            )

    days = data.get("days") if isinstance(data, dict) else None
    if not isinstance(days, dict) or not days:
        problems.append("El JSON no trae ningún día de sesiones.")
    payments = data.get("payments") if isinstance(data, dict) else None
    if isinstance(data, dict) and "payments" in data and not payments:
        problems.append("El JSON trae 0 pagos (probablemente falló la descarga de pagos en AimHarder).")
    return problems, ts


# ------------------------------------------------- tarea programada (Windows)

def _ps_date(value):
    """PowerShell 5 serializa fechas como '/Date(1727344800000)/'."""
    if isinstance(value, str):
        m = re.match(r"/Date\((-?\d+)", value)
        if m:
            return dt.datetime.fromtimestamp(int(m.group(1)) / 1000, dt.timezone.utc)
        return parse_iso(value)
    return None


def check_task(task_name, max_hours):
    if not IS_WINDOWS:
        return []
    ps = (
        "$t = Get-ScheduledTask -TaskName '%s' -ErrorAction Stop; "
        "$i = $t | Get-ScheduledTaskInfo; "
        "[pscustomobject]@{State=[string]$t.State; LastRunTime=$i.LastRunTime; "
        "LastTaskResult=$i.LastTaskResult; NextRunTime=$i.NextRunTime} | ConvertTo-Json"
    ) % task_name.replace("'", "''")
    try:
        out = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
            capture_output=True, text=True, timeout=60,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.TimeoutExpired) as e:
        return ["No se pudo consultar la tarea '%s' (%s)." % (task_name, e)]
    if out.returncode != 0:
        return ["No existe o no se puede leer la tarea programada '%s'." % task_name]
    try:
        info = json.loads(out.stdout)
    except ValueError:
        return ["Respuesta inesperada al consultar la tarea '%s'." % task_name]

    problems = []
    if str(info.get("State")) == "Disabled":
        problems.append("La tarea '%s' está DESHABILITADA." % task_name)
    result = info.get("LastTaskResult")
    # 267009 (0x41301) = se está ejecutando ahora mismo; no es un error.
    if result not in (0, 267009, None):
        problems.append("La última ejecución de '%s' terminó con error (código %s / 0x%X)." % (task_name, result, result & 0xFFFFFFFF))
    last = _ps_date(info.get("LastRunTime"))
    if last is None or last.year < 2000:
        problems.append("La tarea '%s' no se ha ejecutado nunca." % task_name)
    elif now_utc() - last > dt.timedelta(hours=max_hours):
        problems.append("La tarea '%s' no se ejecuta desde hace %s." % (task_name, fmt_age(now_utc() - last)))
    return problems


# ---------------------------------------------------------------- acciones

def relaunch(script, python_exe, log_path, timeout_min):
    cmd = [python_exe or sys.executable, script]
    log("Relanzando: %s" % " ".join(cmd), log_path)
    try:
        out = subprocess.run(
            cmd, cwd=os.path.dirname(os.path.abspath(script)),
            capture_output=True, text=True, timeout=timeout_min * 60,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.TimeoutExpired) as e:
        log("El relanzamiento falló: %s" % e, log_path)
        return False
    tail = (out.stdout + out.stderr).strip().splitlines()[-15:]
    for line in tail:
        log("  sync_axis> " + line, log_path)
    log("sync_axis.py terminó con código %d." % out.returncode, log_path)
    return out.returncode == 0


def notify_windows(title, text):
    if not IS_WINDOWS:
        return
    esc = lambda s: s.replace("'", "''")
    ps = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "$n = New-Object System.Windows.Forms.NotifyIcon; "
        "$n.Icon = [System.Drawing.SystemIcons]::Warning; $n.Visible = $true; "
        "$n.ShowBalloonTip(30000, '%s', '%s', 'Warning'); Start-Sleep 30; $n.Dispose()"
    ) % (esc(title), esc(text[:250]))
    try:
        subprocess.Popen(
            ["powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", ps],
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except OSError:
        pass


def notify_ntfy(topic, title, text, priority, log_path):
    if not topic:
        return
    url = topic if topic.startswith("http") else "https://ntfy.sh/" + topic
    req = urllib.request.Request(
        url, data=text.encode("utf-8"), method="POST",
        # Las cabeceras HTTP deben ir en latin-1; ntfy acepta el título así.
        headers={"Title": title.encode("utf-8").decode("latin-1"), "Priority": priority, "Tags": "warning"},
    )
    try:
        urllib.request.urlopen(req, timeout=20).close()
    except (urllib.error.URLError, OSError) as e:
        log("No se pudo enviar el aviso a ntfy (%s)." % e, log_path)


def load_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save_json(path, value):
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(value, f, ensure_ascii=False, indent=2)
    except OSError:
        pass


# ---------------------------------------------------------------- main

def main(argv=None):
    p = argparse.ArgumentParser(description="Vigila que sync_axis.py siga actualizando los datos del panel.")
    p.add_argument("--config", default=DEFAULT_CONFIG, help="JSON con las mismas opciones (por defecto monitor/config.json)")
    p.add_argument("--url", help="URL de sincronización (la misma que pegas en el panel)")
    p.add_argument("--max-horas", type=float, help="antigüedad máxima de los datos antes de avisar (def. 3)")
    p.add_argument("--tarea", help="nombre de la tarea programada de Windows que ejecuta sync_axis.py")
    p.add_argument("--script", help="ruta a sync_axis.py (necesaria para --relanzar)")
    p.add_argument("--python", help="python.exe con el que relanzar sync_axis.py")
    p.add_argument("--relanzar", action="store_true", default=None, help="si falla, ejecuta sync_axis.py y vuelve a comprobar")
    p.add_argument("--ntfy-topic", help="tema de ntfy.sh para recibir el aviso en el móvil")
    p.add_argument("--repetir-aviso", type=float, help="horas entre avisos mientras siga fallando (def. 6)")
    p.add_argument("--sin-notificacion", action="store_true", help="no mostrar avisos (solo log y código de salida)")
    args = p.parse_args(argv)

    cfg = load_json(args.config, {})
    opt = lambda name, default=None: getattr(args, name) if getattr(args, name) is not None else cfg.get(name, default)
    url = opt("url") or os.environ.get("AXIS_SYNC_URL")
    max_hours = float(opt("max_horas", 3))
    task = opt("tarea")
    script = opt("script")
    do_relaunch = bool(opt("relanzar", False))
    ntfy = opt("ntfy_topic")
    repeat_h = float(opt("repetir_aviso", 6))
    log_path = cfg.get("log", DEFAULT_LOG)
    state_path = cfg.get("estado", DEFAULT_STATE)

    if not url:
        log("Falta la URL de sincronización (--url, config.json o AXIS_SYNC_URL).", log_path)
        return 2
    if do_relaunch and not (script and os.path.isfile(script)):
        log("--relanzar necesita --script con la ruta a sync_axis.py (no encontrado: %s)." % script, log_path)
        return 2

    def run_checks():
        probs, _ = check_data(url, max_hours)
        if task:
            probs += check_task(task, max_hours)
        return probs

    problems = run_checks()
    relaunched = False
    if problems and do_relaunch:
        for pr in problems:
            log("FALLO: " + pr, log_path)
        relaunch(script, opt("python"), log_path, timeout_min=15)
        relaunched = True
        problems = run_checks()

    state = load_json(state_path, {})
    was_ok = state.get("ok", True)
    now = now_utc()
    notify = not args.sin_notificacion

    if not problems:
        msg = "sync_axis.py funciona correctamente." + (" (Se ha relanzado y ya está al día.)" if relaunched else "")
        log("OK: " + msg, log_path)
        if notify and (relaunched or not was_ok):
            title = "Axis · sync recuperado"
            notify_windows(title, msg)
            notify_ntfy(ntfy, title, msg, "default", log_path)
        save_json(state_path, {"ok": True, "desde": now.isoformat()})
        return 0

    for pr in problems:
        log("FALLO: " + pr, log_path)
    text = "\n".join("• " + pr for pr in problems)
    if relaunched:
        text += "\nSe intentó relanzar sync_axis.py pero sigue fallando."
    last_alert = parse_iso(state.get("ultimo_aviso"))
    due = was_ok or last_alert is None or now - last_alert >= dt.timedelta(hours=repeat_h)
    if notify and due:
        title = "Axis · sync_axis.py NO está funcionando"
        notify_windows(title, text)
        notify_ntfy(ntfy, title, text, "high", log_path)
        last_alert = now
    save_json(state_path, {
        "ok": False,
        "desde": state.get("desde") if not was_ok else now.isoformat(),
        "ultimo_aviso": last_alert.isoformat() if last_alert else None,
        "problemas": problems,
    })
    return 1


if __name__ == "__main__":
    sys.exit(main())
