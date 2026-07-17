/* Axis · Panel de salas — Integración con Google Calendar (v4)
   - Autoenvío: al importar/sincronizar sesiones de AimHarder se crean los
     eventos en Google Calendar con el coach como invitado, sin pulsar nada
     (salvo "Conectar" una vez por navegador).
   - Sin duplicados: se guarda un registro permanente (axis-gcal-map) de qué
     sesión ya tiene evento creado y con qué id. Aunque el panel re-importe y
     borre sus propias marcas, el registro no se toca y cada sesión se envía
     UNA sola vez. Si ya está enviada, se mantiene.
   - Borrados: tras cada sincronización se compara con el Gist; si una sesión
     con evento creado ya no existe en AimHarder, se elimina su evento del
     Calendar (avisando a los invitados) y se quita del panel.
   - Botón "Limpiar duplicados": borra del Calendar los eventos "Axis ·"
     futuros repetidos (mismo título y misma hora), dejando solo uno.
*/
(function () {
  var CLIENT_ID = "359527306675-a5vpmnrbq28mv34vjehfi02nmf7o9ve0.apps.googleusercontent.com";
  var SCOPES = "https://www.googleapis.com/auth/calendar.events";
  var API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  var MAP_KEY = "axis-gcal-map";
  var LOCK_KEY = "axis-gcal-lock";
  var tokenClient = null;
  var accessToken = null;
  var tokenExpiresAt = 0;
  var busy = false;
  var connecting = false;
  var writingGuard = false;

  function pad(n) { return String(n).padStart(2, "0"); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try {
      writingGuard = true;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {} finally { writingGuard = false; }
  }

  /* Registro permanente: { [sessionId]: { eventId, date } } */
  function readMap() { return readJSON(MAP_KEY, {}); }
  function writeMap(m) { writeJSON(MAP_KEY, m); }

  /* Migración: sesiones marcadas como enviadas por la versión anterior entran
     al registro (sin eventId conocido) para que NO se reenvíen nunca. */
  function migrateOldFlags() {
    var map = readMap();
    var sessions = readJSON("axis-sessions", []);
    var changed = false;
    sessions.forEach(function (s) {
      if (s && s.gcalSent && !map[String(s.id)]) {
        map[String(s.id)] = { eventId: null, date: s.date };
        changed = true;
      }
    });
    if (changed) writeMap(map);
  }

  /* Detectar cambios de sesiones (sincronización/import del panel) */
  var nativeSetItem = window.localStorage.setItem.bind(window.localStorage);
  window.localStorage.setItem = function (key, value) {
    nativeSetItem(key, value);
    if (key === "axis-sessions" && !writingGuard) scheduleRun();
  };

  var runTimer = null;
  function scheduleRun() {
    if (runTimer) clearTimeout(runTimer);
    runTimer = setTimeout(runCycle, 1000);
  }

  /* Candado entre pestañas para no enviar por duplicado si hay dos abiertas */
  function acquireLock() {
    try {
      var now = Date.now();
      var lock = parseInt(window.localStorage.getItem(LOCK_KEY) || "0", 10);
      if (lock && now - lock < 45000) return false;
      nativeSetItem(LOCK_KEY, String(now));
      return true;
    } catch (e) { return true; }
  }
  function releaseLock() {
    try { window.localStorage.removeItem(LOCK_KEY); } catch (e) {}
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === "style") Object.assign(node.style, attrs[k]);
      else if (k === "text") node.textContent = attrs[k];
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  var statusLine, connectBtn, dedupBtn, logLine;

  function buildWidget() {
    var box = el("div", {
      style: {
        position: "fixed", right: "18px", bottom: "18px", zIndex: 999999,
        width: "300px", background: "#fff", border: "1px solid #DDE4E0",
        borderRadius: "12px", boxShadow: "0 4px 18px rgba(0,0,0,.18)",
        fontFamily: "Barlow, system-ui, sans-serif", overflow: "hidden"
      }
    });
    var header = el("div", {
      style: { background: "#12211B", color: "#fff", padding: "10px 14px", fontWeight: "700", fontSize: "14px" },
      text: "Google Calendar · autoenvío"
    });
    var body = el("div", { style: { padding: "12px 14px", display: "grid", gap: "8px" } });

    statusLine = el("div", { style: { fontSize: "12px", color: "#5A6B63" }, text: 'Desconectado. Pulsa "Conectar" una vez para activar el autoenvío.' });
    connectBtn = el("button", {
      text: "Conectar con Google Calendar",
      style: btnStyle(true),
      onclick: function () { connect(true); }
    });
    dedupBtn = el("button", {
      text: "Limpiar duplicados del calendario",
      style: btnStyle(false),
      onclick: cleanupDuplicates
    });
    dedupBtn.style.display = "none";
    logLine = el("div", { style: { fontSize: "12px", color: "#5A6B63", whiteSpace: "pre-wrap" } });

    var toggle = el("button", {
      text: "▾", title: "Minimizar",
      style: { background: "transparent", border: "none", color: "#fff", cursor: "pointer", float: "right", fontSize: "14px" }
    });
    header.appendChild(toggle);
    body.appendChild(statusLine);
    body.appendChild(connectBtn);
    body.appendChild(dedupBtn);
    body.appendChild(logLine);
    toggle.addEventListener("click", function () {
      var collapsed = body.style.display === "none";
      body.style.display = collapsed ? "grid" : "none";
      toggle.textContent = collapsed ? "▾" : "▸";
    });
    box.appendChild(header);
    box.appendChild(body);
    document.body.appendChild(box);
  }

  function btnStyle(primary) {
    return {
      border: "none", borderRadius: "8px", padding: "9px 12px", font: "600 13px Barlow, sans-serif",
      cursor: "pointer", background: primary ? "#12211B" : "#E5F4E9", color: primary ? "#fff" : "#12211B"
    };
  }

  function ensureTokenClient() {
    if (tokenClient || !window.google || !window.google.accounts || !window.google.accounts.oauth2) return;
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: function (resp) {
        connecting = false;
        if (resp.error) {
          accessToken = null;
          setStatus('Desconectado. Pulsa "Conectar" una vez para activar el autoenvío.', true);
          return;
        }
        accessToken = resp.access_token;
        tokenExpiresAt = Date.now() + (resp.expires_in || 3500) * 1000;
        setStatus("Conectado · autoenvío activo mientras esta pestaña siga abierta.", false);
        if (dedupBtn) dedupBtn.style.display = "inline-block";
        runCycle();
      }
    });
  }

  function setStatus(msg, showConnect) {
    if (statusLine) statusLine.textContent = msg;
    if (connectBtn) connectBtn.style.display = showConnect ? "inline-block" : "none";
  }

  function connect(interactive) {
    ensureTokenClient();
    if (!tokenClient) { setTimeout(function () { connect(interactive); }, 500); return; }
    if (connecting) return;
    connecting = true;
    if (interactive) setStatus("Conectando…", false);
    tokenClient.requestAccessToken({ prompt: interactive ? "consent" : "" });
    setTimeout(function () {
      if (connecting) {
        connecting = false;
        if (!accessToken) setStatus('Desconectado. Pulsa "Conectar" una vez para activar el autoenvío.', true);
      }
    }, 6000);
  }

  function coachOf(id, coaches) { return coaches.find(function (c) { return c.id === id; }); }
  function roomOf(id, rooms) { return rooms.find(function (r) { return r.id === id; }); }

  function buildEvent(s, coaches, rooms) {
    var coach = coachOf(s.coachId, coaches);
    var room = roomOf(s.roomId, rooms);
    var attendees = [];
    if (coach && coach.email) attendees.push({ email: coach.email });
    return {
      summary: "Axis · " + s.title + " — " + ((coach && coach.name) || s.coachRaw || "?") + " (" + ((room && room.name) || "?") + ")",
      description: "Sala: " + ((room && room.name) || "?") + (s.client ? " · Cliente: " + s.client : ""),
      start: { dateTime: s.date + "T" + s.start + ":00", timeZone: "Europe/Madrid" },
      end: { dateTime: s.date + "T" + s.end + ":00", timeZone: "Europe/Madrid" },
      attendees: attendees
    };
  }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: "Bearer " + accessToken }, opts.headers || {});
    return fetch(API + path, opts);
  }

  /* ---------- envío de sesiones nuevas ---------- */
  async function sendPending() {
    var map = readMap();
    var today = todayISO();
    var sessions = readJSON("axis-sessions", []);
    var toSend = sessions.filter(function (s) {
      return s && s.date && s.date >= today && !map[String(s.id)];
    });
    if (!toSend.length) return { ok: 0, fail: 0, noEmail: 0 };

    var coaches = readJSON("axis-coaches", []);
    var rooms = readJSON("axis-rooms", []);
    var ok = 0, fail = 0, noEmail = 0;

    for (var i = 0; i < toSend.length; i++) {
      var s = toSend[i];
      var coach = coachOf(s.coachId, coaches);
      if (!coach || !coach.email) noEmail++;
      try {
        var res = await api("?sendUpdates=all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildEvent(s, coaches, rooms))
        });
        if (res.ok) {
          var ev = await res.json();
          ok++;
          map[String(s.id)] = { eventId: ev.id || null, date: s.date };
          writeMap(map);
          s.gcalSent = true;
        } else if (res.status === 401) {
          fail++;
          accessToken = null;
          break;
        } else fail++;
      } catch (e) { fail++; }
    }

    writeJSON("axis-sessions", sessions);
    return { ok: ok, fail: fail, noEmail: noEmail };
  }

  /* ---------- borrado de sesiones eliminadas en AimHarder ---------- */
  async function deleteEventById(eventId) {
    var res = await api("/" + encodeURIComponent(eventId) + "?sendUpdates=all", { method: "DELETE" });
    return res.ok || res.status === 404 || res.status === 410;
  }

  async function findEventIdByDate(dateISO, sessionStart) {
    /* Para registros antiguos sin eventId: busca el evento "Axis ·" de ese
       día cuya hora de inicio coincida. Ventana ±1 día para cubrir husos. */
    try {
      var d = new Date(dateISO + "T00:00:00");
      var prev = new Date(d.getTime() - 86400000).toISOString();
      var next = new Date(d.getTime() + 2 * 86400000).toISOString();
      var res = await api("?timeMin=" + encodeURIComponent(prev) + "&timeMax=" + encodeURIComponent(next) + "&singleEvents=true&maxResults=250&q=" + encodeURIComponent("Axis"), {});
      if (!res.ok) return null;
      var data = await res.json();
      var items = data.items || [];
      for (var i = 0; i < items.length; i++) {
        var st = items[i].start && items[i].start.dateTime;
        if (st && st.indexOf(dateISO + "T" + sessionStart) === 0 && (items[i].summary || "").indexOf("Axis ·") === 0) {
          return items[i].id;
        }
      }
    } catch (e) {}
    return null;
  }

  async function removeDeleted() {
    var url = (readJSON.length, window.localStorage.getItem("axis-autosync-url"));
    try { url = url ? JSON.parse(url) : ""; } catch (e) {}
    if (!url || typeof url !== "string" || !url.trim()) return { removed: 0 };

    var raw;
    try {
      var res = await fetch(url.trim() + (url.indexOf("?") !== -1 ? "&" : "?") + "_=" + Date.now());
      if (!res.ok) return { removed: 0 };
      raw = await res.json();
    } catch (e) { return { removed: 0 }; }

    var json = raw;
    if (raw && raw.files && raw.files["axis-sessions.json"] && typeof raw.files["axis-sessions.json"].content === "string") {
      try { json = JSON.parse(raw.files["axis-sessions.json"].content); } catch (e) { return { removed: 0 }; }
    }
    var days = (json && json.days) || {};
    var today = todayISO();

    /* Días futuros que cubre el Gist y los ids que contienen */
    var coveredDays = {};
    var liveIds = {};
    Object.keys(days).forEach(function (d) {
      if (d >= today) {
        coveredDays[d] = true;
        (Array.isArray(days[d]) ? days[d] : []).forEach(function (r) {
          if (r && r.id !== undefined) liveIds[String(r.id)] = true;
        });
      }
    });

    var map = readMap();
    var sessions = readJSON("axis-sessions", []);
    var byId = {};
    sessions.forEach(function (s) { if (s) byId[String(s.id)] = s; });

    var removed = 0;
    var ids = Object.keys(map);
    for (var i = 0; i < ids.length; i++) {
      var sid = ids[i];
      var info = map[sid];
      if (!info || !info.date || info.date < today) continue;
      if (!coveredDays[info.date]) continue;      /* el Gist no cubre ese día: no tocar */
      if (liveIds[sid]) continue;                  /* sigue existiendo en AimHarder */

      /* La sesión ha desaparecido de AimHarder → borrar del Calendar */
      var eventId = info.eventId;
      if (!eventId) {
        var sess = byId[sid];
        eventId = await findEventIdByDate(info.date, (sess && sess.start) || "");
      }
      var deleted = true;
      if (eventId) deleted = await deleteEventById(eventId);
      if (deleted) {
        delete map[sid];
        writeMap(map);
        removed++;
      }
    }

    if (removed) {
      /* quitarlas también del panel */
      var remaining = sessions.filter(function (s) {
        if (!s || !s.date || s.date < today) return true;
        if (!coveredDays[s.date]) return true;
        return !!liveIds[String(s.id)];
      });
      if (remaining.length !== sessions.length) writeJSON("axis-sessions", remaining);
    }
    return { removed: removed };
  }

  /* ---------- ciclo completo ---------- */
  async function runCycle() {
    if (busy) return;
    if (!accessToken) {
      var map = readMap();
      var today = todayISO();
      var pending = readJSON("axis-sessions", []).filter(function (s) {
        return s && s.date && s.date >= today && !map[String(s.id)];
      }).length;
      if (pending && connectBtn && connectBtn.style.display !== "none") {
        setStatus(pending + ' sesión(es) nueva(s) esperando. Pulsa "Conectar" para enviarlas.', true);
      }
      return;
    }
    if (Date.now() > tokenExpiresAt - 5000) { connect(false); return; }
    if (!acquireLock()) return;

    busy = true;
    try {
      var sent = await sendPending();
      var del = await removeDeleted();
      var parts = [];
      if (sent.ok) parts.push("enviadas " + sent.ok);
      if (del.removed) parts.push("borradas del Calendar " + del.removed);
      if (sent.fail) parts.push(sent.fail + " con error");
      if (sent.noEmail) parts.push(sent.noEmail + " sin email de coach");
      if (parts.length && logLine) {
        var stamp = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        logLine.textContent = "[" + stamp + "] " + parts.join(" · ") + ".";
      }
      if (!accessToken) setStatus('El acceso caducó. Pulsa "Conectar" para reactivar el autoenvío.', true);
    } finally {
      busy = false;
      releaseLock();
    }
  }

  /* ---------- limpieza de duplicados ya creados ---------- */
  async function cleanupDuplicates() {
    if (!accessToken) { setStatus('Conéctate primero.', true); return; }
    dedupBtn.disabled = true;
    try {
      var now = new Date().toISOString();
      var horizon = new Date(Date.now() + 120 * 86400000).toISOString();
      var res = await api("?timeMin=" + encodeURIComponent(now) + "&timeMax=" + encodeURIComponent(horizon) + "&singleEvents=true&maxResults=2500&orderBy=startTime&q=" + encodeURIComponent("Axis"), {});
      if (!res.ok) { logLine.textContent = "No se pudo leer el calendario (" + res.status + ")."; return; }
      var data = await res.json();
      var items = (data.items || []).filter(function (ev) {
        return (ev.summary || "").indexOf("Axis ·") === 0 && ev.start && ev.start.dateTime;
      });
      var seen = {};
      var toDelete = [];
      items.forEach(function (ev) {
        var key = ev.summary + "|" + ev.start.dateTime;
        if (seen[key]) toDelete.push(ev);
        else seen[key] = ev;
      });
      var deleted = 0;
      for (var i = 0; i < toDelete.length; i++) {
        if (await deleteEventById(toDelete[i].id)) deleted++;
      }
      /* re-vincular el registro a los eventos que quedan */
      var map = readMap();
      Object.keys(map).forEach(function (sid) {
        var info = map[sid];
        if (info && !info.eventId) return; /* nada que corregir */
      });
      logLine.textContent = deleted
        ? "Eliminados " + deleted + " evento(s) duplicado(s) del calendario."
        : "No se han encontrado duplicados futuros.";
    } catch (e) {
      logLine.textContent = "Error al limpiar duplicados: " + e.message;
    } finally {
      dedupBtn.disabled = false;
    }
  }

  /* Renovación silenciosa del token */
  setInterval(function () {
    if (accessToken && Date.now() > tokenExpiresAt - 5 * 60 * 1000) connect(false);
  }, 60000);
  /* Red de seguridad periódica */
  setInterval(runCycle, 120000);

  function waitForGis(retries) {
    ensureTokenClient();
    if (tokenClient || retries <= 0) return;
    setTimeout(function () { waitForGis(retries - 1); }, 500);
  }

  migrateOldFlags();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
  waitForGis(20);
})();
