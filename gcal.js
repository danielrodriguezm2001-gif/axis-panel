/* Axis · Panel de salas — Integración con Google Calendar
   Widget independiente (no toca panel.js). Lee las sesiones y coaches
   que panel.js ya guarda en localStorage ("axis-sessions", "axis-coaches",
   "axis-rooms") y crea eventos reales en Google Calendar con los coaches
   como invitados, para que reciban el email de invitación automáticamente.
*/
(function () {
  var CLIENT_ID = "359527306675-a5vpmnrbq28mv34vjehfi02nmf7o9ve0.apps.googleusercontent.com";
  var SCOPES = "https://www.googleapis.com/auth/calendar.events";
  var tokenClient = null;
  var accessToken = null;
  var tokenExpiresAt = 0;

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
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
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

  var box, statusLine, connectBtn, dateInput, sendBtn, logLine;

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
      text: "Google Calendar · invitaciones"
    });
    var body = el("div", { style: { padding: "12px 14px", display: "grid", gap: "8px" } });

    statusLine = el("div", { style: { fontSize: "12px", color: "#5A6B63" }, text: "Desconectado de Google Calendar." });
    connectBtn = el("button", {
      text: "Conectar con Google Calendar",
      style: btnStyle(true),
      onclick: connect
    });
    dateInput = el("input", { type: "date", value: todayISO(), style: inputStyle() });
    sendBtn = el("button", {
      text: "Enviar invitaciones de este día",
      style: btnStyle(false),
      disabled: "true",
      onclick: sendForSelectedDate
    });
    sendBtn.disabled = true;
    logLine = el("div", { style: { fontSize: "12px", color: "#5A6B63", whiteSpace: "pre-wrap" } });

    var toggle = el("button", {
      text: "▾",
      title: "Minimizar",
      style: { background: "transparent", border: "none", color: "#fff", cursor: "pointer", float: "right", fontSize: "14px" }
    });
    header.appendChild(toggle);

    body.appendChild(statusLine);
    body.appendChild(connectBtn);
    body.appendChild(dateInput);
    body.appendChild(sendBtn);
    body.appendChild(logLine);

    toggle.addEventListener("click", function () {
      var collapsed = body.style.display === "none";
      body.style.display = collapsed ? "grid" : "none";
      toggle.textContent = collapsed ? "▾" : "▸";
    });

    box.appendChild(header);
    box.appendChild(body);
    document.body.appendChild(box);

    dateInput.addEventListener("change", updateSendButtonLabel);
    updateSendButtonLabel();
  }

  function btnStyle(primary) {
    return {
      border: "none", borderRadius: "8px", padding: "9px 12px", font: "600 13px Barlow, sans-serif",
      cursor: "pointer", background: primary ? "#12211B" : "#E5F4E9", color: primary ? "#fff" : "#12211B"
    };
  }
  function inputStyle() {
    return { border: "1px solid #C9D2CD", borderRadius: "6px", padding: "7px 9px", fontSize: "13px" };
  }

  function pendingForDate(dateISO) {
    var sessions = readJSON("axis-sessions", []);
    return sessions.filter(function (s) { return s.date === dateISO && !s.gcalSent; });
  }

  function updateSendButtonLabel() {
    var n = pendingForDate(dateInput.value).length;
    sendBtn.textContent = "Enviar invitaciones de este día (" + n + ")";
    sendBtn.disabled = !accessToken || n === 0;
  }

  function ensureTokenClient() {
    if (tokenClient || !window.google || !window.google.accounts || !window.google.accounts.oauth2) return;
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: function (resp) {
        if (resp.error) {
          statusLine.textContent = "Error al conectar: " + resp.error;
          return;
        }
        accessToken = resp.access_token;
        tokenExpiresAt = Date.now() + (resp.expires_in || 3500) * 1000;
        statusLine.textContent = "Conectado a Google Calendar.";
        connectBtn.textContent = "Reconectar";
        updateSendButtonLabel();
      }
    });
  }

  function connect() {
    ensureTokenClient();
    if (!tokenClient) {
      statusLine.textContent = "Google Identity Services no ha cargado todavía, espera un segundo y vuelve a pulsar.";
      return;
    }
    tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
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

  async function sendForSelectedDate() {
    if (!accessToken) { statusLine.textContent = "Conéctate primero."; return; }
    if (Date.now() > tokenExpiresAt - 5000) {
      statusLine.textContent = "El acceso caducó, reconectando…";
      connect();
      return;
    }
    var dateISO = dateInput.value;
    var coaches = readJSON("axis-coaches", []);
    var rooms = readJSON("axis-rooms", []);
    var sessions = readJSON("axis-sessions", []);
    var toSend = sessions.filter(function (s) { return s.date === dateISO && !s.gcalSent; });
    if (!toSend.length) { logLine.textContent = "No hay sesiones pendientes ese día."; return; }

    sendBtn.disabled = true;
    var ok = 0, fail = 0, noEmail = 0;
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
    logLine.textContent = "Enviadas " + ok + " invitación(es)" +
      (fail ? ", " + fail + " con error" : "") +
      (noEmail ? ". " + noEmail + " sesión(es) sin email de coach (rellénalo en la pestaña Equipo)." : ".") +
      " Recarga la página para ver las marcas actualizadas en el panel.";
    updateSendButtonLabel();
  }

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
