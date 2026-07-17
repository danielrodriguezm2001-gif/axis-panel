/* Axis · Panel de salas — Integración con Google Calendar
   Widget independiente (no toca panel.js). Lee las sesiones y coaches
   que panel.js ya guarda en localStorage ("axis-sessions", "axis-coaches",
   "axis-rooms") y crea eventos reales en Google Calendar con el coach de
   cada sesión como invitado, para que reciba el email de invitación.

   Autoenvío: en cuanto panel.js guarda sesiones nuevas (import/sincronización
   de AimHarder), este script detecta el cambio y envía automáticamente las
   invitaciones de las sesiones de hoy en adelante que aún no se hayan
   enviado. La única acción manual necesaria es pulsar "Conectar" una vez
   por navegador/dispositivo (Google exige ese primer permiso explícito);
   a partir de ahí, mientras la pestaña siga abierta, todo se envía solo.
*/
(function () {
  var CLIENT_ID = "359527306675-a5vpmnrbq28mv34vjehfi02nmf7o9ve0.apps.googleusercontent.com";
  var SCOPES = "https://www.googleapis.com/auth/calendar.events";
  var tokenClient = null;
  var accessToken = null;
  var tokenExpiresAt = 0;
  var sending = false;
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
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try {
      writingGuard = true;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
    } finally {
      writingGuard = false;
    }
  }

  // Detecta cuando panel.js guarda sesiones nuevas en localStorage
  // (import de AimHarder, sincronización automática, edición manual, etc.)
  var nativeSetItem = window.localStorage.setItem.bind(window.localStorage);
  window.localStorage.setItem = function (key, value) {
    nativeSetItem(key, value);
    if (key === "axis-sessions" && !writingGuard) scheduleAutoSend();
  };

  var autoSendTimer = null;
  function scheduleAutoSend() {
    if (autoSendTimer) clearTimeout(autoSendTimer);
    autoSendTimer = setTimeout(autoSendPending, 800);
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

  var box, statusLine, connectBtn, logLine;

  function buildWidget() {
    box = el("div", {
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

    statusLine = el("div", { style: { fontSize: "12px", color: "#5A6B63" }, text: "Desconectado. Pulsa \"Conectar\" una vez para activar el autoenvío." });
    connectBtn = el("button", {
      text: "Conectar con Google Calendar",
      style: btnStyle(true),
      onclick: function () { connect(true); }
    });
    logLine = el("div", { style: { fontSize: "12px", color: "#5A6B63", whiteSpace: "pre-wrap" } });

    var toggle = el("button", {
      text: "▾",
      title: "Minimizar",
      style: { background: "transparent", border: "none", color: "#fff", cursor: "pointer", float: "right", fontSize: "14px" }
    });
    header.appendChild(toggle);

    body.appendChild(statusLine);
    body.appendChild(connectBtn);
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
          if (statusLine) statusLine.textContent = 'Desconectado. Pulsa "Conectar" una vez para activar el autoenvío.';
          if (connectBtn) connectBtn.style.display = "inline-block";
          return;
        }
        accessToken = resp.access_token;
        tokenExpiresAt = Date.now() + (resp.expires_in || 3500) * 1000;
        if (statusLine) statusLine.textContent = "Conectado · autoenvío activo mientras esta pestaña siga abierta.";
        if (connectBtn) connectBtn.style.display = "none";
        autoSendPending();
      }
    });
  }

  function connect(interactive) {
    ensureTokenClient();
    if (!tokenClient) { setTimeout(function () { connect(interactive); }, 500); return; }
    if (connecting) return;
    connecting = true;
    if (interactive && statusLine) statusLine.textContent = "Conectando…";
    tokenClient.requestAccessToken({ prompt: interactive ? "consent" : "" });
    // Si la reconexión silenciosa no responde (p.ej. el navegador bloquea el
    // popup por no venir de un clic), no dejamos el estado colgado.
    setTimeout(function () {
      if (connecting) {
        connecting = false;
        if (!accessToken && statusLine) {
          statusLine.textContent = 'Desconectado. Pulsa "Conectar" una vez para activar el autoenvío.';
          if (connectBtn) connectBtn.style.display = "inline-block";
        }
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

  function pendingSessions() {
    var sessions = readJSON("axis-sessions", []);
    var today = todayISO();
    // Solo hoy en adelante: no se invita a sesiones ya pasadas al importar históricos.
    return sessions.filter(function (s) { return s && s.date && !s.gcalSent && s.date >= today; });
  }

  async function autoSendPending() {
    if (sending) return;
    var toSend = pendingSessions();
    if (!toSend.length) return;

    if (!accessToken) {
      // No forzamos conexión sola (el navegador bloquearía el popup sin clic
      // del usuario). Avisamos para que pulse "Conectar" una vez.
      if (statusLine && connectBtn && connectBtn.style.display !== "none") {
        statusLine.textContent = toSend.length + " sesión(es) nueva(s) esperando. Pulsa \"Conectar\" para enviarlas.";
      }
      return;
    }
    if (Date.now() > tokenExpiresAt - 5000) { connect(false); return; }

    sending = true;
    var coaches = readJSON("axis-coaches", []);
    var rooms = readJSON("axis-rooms", []);
    var sessions = readJSON("axis-sessions", []);
    var ok = 0, fail = 0, noEmail = 0, authExpired = false;

    for (var i = 0; i < toSend.length; i++) {
      var s = toSend[i];
      var coach = coachOf(s.coachId, coaches);
      if (!coach || !coach.email) noEmail++;
      var body = buildEvent(s, coaches, rooms);
      try {
        var res = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
          {
            method: "POST",
            headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );
        if (res.ok) {
          ok++;
          s.gcalSent = true;
        } else if (res.status === 401) {
          fail++;
          authExpired = true;
        } else {
          fail++;
        }
      } catch (e) {
        fail++;
      }
    }

    writeJSON("axis-sessions", sessions.map(function (s) {
      var upd = toSend.find(function (t) { return t.id === s.id; });
      return upd ? Object.assign({}, s, { gcalSent: upd.gcalSent || s.gcalSent }) : s;
    }));

    var stamp = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    if (logLine) {
      logLine.textContent = "[" + stamp + "] Enviadas " + ok + " invitación(es) automáticamente" +
        (fail ? ", " + fail + " con error" : "") +
        (noEmail ? ". " + noEmail + " sesión(es) sin email de coach (pestaña Equipo)." : ".");
    }

    sending = false;
    if (authExpired) {
      accessToken = null;
      if (statusLine) statusLine.textContent = 'El acceso caducó. Pulsa "Conectar" para reactivar el autoenvío.';
      if (connectBtn) connectBtn.style.display = "inline-block";
    }
  }

  // Renueva el token en silencio antes de que caduque (solo si ya estábamos
  // conectados en esta pestaña); si falla, se pide reconectar con un clic.
  setInterval(function () {
    if (accessToken && Date.now() > tokenExpiresAt - 5 * 60 * 1000) connect(false);
  }, 60000);

  // Red de seguridad: revisa cada minuto por si algún import no disparó
  // el aviso al vuelo.
  setInterval(autoSendPending, 60000);

  function waitForGis(retries) {
    ensureTokenClient();
    if (tokenClient || retries <= 0) return;
    setTimeout(function () { waitForGis(retries - 1); }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
  waitForGis(20);
})();
