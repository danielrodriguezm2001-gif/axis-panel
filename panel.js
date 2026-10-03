const { useState, useEffect, useMemo, useRef } = React;
const DAY_START = 7;
const DAY_END = 22;
const PX_PER_MIN = 1.35;
const DEFAULT_COACHES = [
  { id: "erik", name: "Erik Benavides", role: "Entrenador personal / Fisio", color: "#0D9488", email: "" },
  { id: "marc", name: "Marc Rosa", role: "Entrenador personal", color: "#2563EB", email: "" },
  { id: "daniel", name: "Daniel Rodriguez", role: "Entrenador personal", color: "#D97706", email: "" },
  { id: "sergio", name: "Sergio Mar\xEDn", role: "Entrenador personal", color: "#9333EA", email: "" },
  { id: "marti", name: "Mart\xED", role: "Entrenador personal", color: "#DB2777", email: "" },
  { id: "marina", name: "Marina", role: "Entrenador personal", color: "#0891B2", email: "" }
];
const DEFAULT_ROOMS = [
  { id: "sala1", name: "Sala 1" },
  { id: "sala2", name: "Sala 2" }
];
const UNKNOWN_COLOR = "#6B7280";
const PAYMENTS_SEED = [];
const pad = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toMin = (hhmm) => {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
};
const fmtDateHuman = (iso) => {
  try {
    const d = /* @__PURE__ */ new Date(iso + "T12:00:00");
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  } catch (e) {
    return iso;
  }
};
const shiftDay = (iso, delta) => {
  const d = /* @__PURE__ */ new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const uid = () => Math.random().toString(36).slice(2, 10);
const stripAccents = (s) => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const nameKey = (s) => stripAccents(s).replace(/[^a-zñ\s]/g, " ").replace(/qu/g, "k").replace(/ck/g, "k").replace(/c(?=[aouñ\s]|$)/g, "k").replace(/\s+/g, " ").trim();
const matchCoach = (apiName, coaches) => {
  const apiTokens = nameKey(apiName).split(" ").filter(Boolean);
  if (!apiTokens.length) return void 0;
  let best;
  let bestScore = 0;
  for (const c of coaches) {
    const cTokens = nameKey(c.name).split(" ").filter(Boolean);
    const score = cTokens.filter((t) => apiTokens.includes(t)).length;
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best;
};
const PRODUCT_ORDER = [
  "Sesi\xF3n individual",
  "Pack 4",
  "Pack 8",
  "Small group / Grupo reducido",
  "Online",
  "Valoraci\xF3n inicial",
  "Fisio"
];
function categorize(title) {
  const t = stripAccents(title);
  if (!t) return "Sin tipo";
  if (t.includes("valoracion")) return "Valoraci\xF3n inicial";
  if (/pack\s*4|bono\s*4|4\s*sesiones/.test(t)) return "Pack 4";
  if (/pack\s*8|bono\s*8|8\s*sesiones/.test(t)) return "Pack 8";
  if (t.includes("small group") || t.includes("grupo reducido") || t.includes("grupo")) return "Small group / Grupo reducido";
  if (t.includes("online")) return "Online";
  if (t.includes("fisio")) return "Fisio";
  if (t.includes("individual") || t.includes("sesion")) return "Sesi\xF3n individual";
  return title.trim().charAt(0).toUpperCase() + title.trim().slice(1);
}
const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
// REGLA: Axis es una entidad propia desde el inicio, igual que un coach.
// Los pagos creados por "Axis Health & Performance", por el administrador o
// por cualquier usuario que no sea un coach conocido van a "Axis", NUNCA a Marc.
// Es la misma regla que aplica el Excel del plan financiero (secciones "Axis (centro)" y "Axis Club").
// Las cuotas de The Axis Club van siempre a Axis (ver personKeyOfPayment).
const CREATOR_LABELS = { marc: "Marc", erik: "Erik", daniel: "Daniel", sergio: "Sergio", marti: "Mart\xED", marina: "Marina", axis: "Axis" };
const CREATOR_ORDER = ["marc", "erik", "sergio", "daniel", "marti", "marina", "axis"];
const AXIS_COLOR = "#2F6F6D";
function creatorId(name) {
  const c = stripAccents((name || "").replace(/&amp/g, "&"));
  if (c.includes("erik") || c.includes("eric")) return "erik";
  // Cuenta del centro y administrador -> Axis (antes se sumaban a Marc).
  if (!c.trim() || c.includes("axis") || c.includes("admin")) return "axis";
  if (c.includes("marc") && !c.includes("marcos")) return "marc";
  if (c.includes("daniel")) return "daniel";
  if (c.includes("sergio")) return "sergio";
  if (c.includes("marti")) return "marti";
  if (c.includes("marina")) return "marina";
  return "axis";
}
function catFromConcept(concept) {
  const t = stripAccents(concept);
  if (t.includes("bono 4")) return "Pack 4";
  if (t.includes("bono 8")) return "Pack 8";
  if (t.includes("grupo")) return "Small group / Grupo reducido";
  if (t.includes("valoraci")) return "Valoraci\xF3n inicial";
  if (t.includes("online")) return "Online";
  if (t.includes("individual")) return "Sesi\xF3n individual";
  return concept.replace(/\s*\d{1,2}\/\d{4}\s*$/, "").trim() || "Sin concepto";
}
const dmyToISO = (s) => {
  const m = (s || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
function parseAimHarderPayments(payments) {
  if (!payments) return [];
  const toAmt = (v) => (typeof v === "number" ? v : parseFloat(String(v ?? "0").replace("€", "").replace(",", ".")) || 0);
  const out = [];
  for (const p of payments.pending || []) {
    if (p.id == null) continue;
    const d = (p.date || "").slice(0, 10); // "2026-06-01 00:00:00" -> "2026-06-01"
    if (!d) continue;
    out.push({ id: String(p.id), cl: p.name || "", cat: catFromConcept(p.concept || ""), amt: toAmt(p.amount), c: creatorId(p.creator || ""), cr: p.creator || "", co: p.concept || "", d, st: "pen", met: "" });
  }
  for (const p of payments.paid || []) {
    if (p.id == null) continue;
    const d = dmyToISO(p.date || "");
    if (!d) continue;
    out.push({ id: String(p.id), cl: p.name || "", cat: catFromConcept(p.concept || ""), amt: toAmt(p.amount), c: creatorId(p.creator || ""), cr: p.creator || "", co: p.concept || "", d, st: "fin", met: "" });
  }
  return out;
}
const monthLabel = (ym) => {
  try {
    const d = /* @__PURE__ */ new Date(ym + "-15T12:00:00");
    const s = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch (e) {
    return ym;
  }
};
const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 15);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== void 0 && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return void 0;
}
function asName(v) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") return (v.name || v.fullName || v.title || v.label || "").trim();
  return String(v).trim();
}
function splitDateTime(v) {
  if (v == null) return { date: null, time: null };
  if (typeof v === "number") {
    const d2 = new Date(v);
    return {
      date: `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-${pad(d2.getDate())}`,
      time: `${pad(d2.getHours())}:${pad(d2.getMinutes())}`
    };
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  const t = s.match(/^(\d{1,2}):(\d{2})/);
  if (t) return { date: null, time: `${pad(+t[1])}:${t[2]}` };
  const d = s.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (d) return { date: d[1], time: null };
  return { date: null, time: null };
}
function extractRecords(json) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    for (const key of ["data", "appointments", "bookings", "classes", "sessions", "items", "results", "calendar"]) {
      if (Array.isArray(json[key])) return json[key];
      if (json[key] && typeof json[key] === "object") {
        const inner = extractRecords(json[key]);
        if (inner.length) return inner;
      }
    }
    const vals = Object.values(json).filter(Array.isArray);
    if (vals.length) return vals.flat();
  }
  return [];
}
function parseAimHarder(json, fallbackDate, coaches, rooms) {
  var _a, _b, _c, _d, _e, _f;
  const records = extractRecords(json);
  const out = [];
  for (const r of records) {
    if (!r || typeof r !== "object") continue;
    const startRaw = pick(r, ["start", "startDate", "start_date", "startTime", "start_time", "from", "begin", "datetime", "date"]);
    const endRaw = pick(r, ["end", "endDate", "end_date", "endTime", "end_time", "to", "finish"]);
    const s = splitDateTime(startRaw);
    const e = splitDateTime(endRaw);
    const date0 = s.date || pick(r, ["day"]) || fallbackDate;
    const date = /^\d{8}$/.test(String(date0)) ? `${String(date0).slice(0, 4)}-${String(date0).slice(4, 6)}-${String(date0).slice(6, 8)}` : date0;
    let start = s.time;
    let end = e.time;
    if (!start) {
      const tRaw = String((_a = pick(r, ["time", "timeSlot", "hora", "hour"])) != null ? _a : "");
      const mm = tRaw.match(/(\d{1,2}):(\d{2})\s*[^\d]*\s*(?:(\d{1,2}):(\d{2}))?/);
      if (mm) {
        start = `${pad(+mm[1])}:${mm[2]}`;
        if (mm[3]) end = `${pad(+mm[3])}:${mm[4]}`;
      } else {
        const tid = String((_b = pick(r, ["timeid", "timeId"])) != null ? _b : "");
        const tm = tid.match(/^(\d{2})(\d{2})_(\d+)/);
        if (tm) {
          start = `${tm[1]}:${tm[2]}`;
          const em = toMin(start) + Number(tm[3]);
          end = `${pad(Math.floor(em / 60))}:${pad(em % 60)}`;
        }
      }
    }
    const dur = pick(r, ["duration", "durationMinutes", "duration_minutes", "minutes"]);
    if (start && !end && dur) {
      const em = toMin(start) + Number(dur);
      end = `${pad(Math.floor(em / 60))}:${pad(em % 60)}`;
    }
    if (!start) continue;
    if (!end) end = `${pad(Math.floor((toMin(start) + 60) / 60))}:${pad((toMin(start) + 60) % 60)}`;
    const coachName = asName(pick(r, ["coachName", "coach", "staff", "trainer", "professional", "employee", "teacher", "instructor", "createdBy", "created_by"]));
    const roomName = asName(pick(r, ["salaname", "room", "trainingRoom", "training_room", "roomName", "space", "location"]));
    const title = asName(pick(r, ["className", "name", "class", "activity", "concept", "title", "type"])) || "Sesi\xF3n";
    const athletesArr = Array.isArray(r.athletes) ? r.athletes : [];
    const client = asName(((_c = athletesArr[0]) == null ? void 0 : _c.realName) || ((_d = athletesArr[0]) == null ? void 0 : _d.name)) || asName(pick(r, ["client", "customer", "member", "athlete"]));
    const capacityRaw = pick(r, ["limit", "classLimit", "totalSpaces", "spaces", "capacity", "numSpaces", "max", "maxAthletes", "aforo", "limitAthletes", "totalLimit", "boxLimit"]);
    const capacity = capacityRaw !== void 0 && capacityRaw !== null && !Number.isNaN(+capacityRaw) && +capacityRaw > 0 ? +capacityRaw : null;
    const booked = athletesArr.length;
    const cMatch = matchCoach(coachName, coaches);
    const rn = stripAccents(roomName);
    let roomId = rooms[0].id;
    let roomGuessed = true;
    for (const room of rooms) {
      const target = stripAccents(room.name);
      if (rn && (rn.includes(target) || target.includes(rn) || rn.replace(/\D/g, "") === target.replace(/\D/g, "") && rn.replace(/\D/g, ""))) {
        roomId = room.id;
        roomGuessed = false;
        break;
      }
    }
    if (rn && roomGuessed) {
      const num = rn.match(/\d+/);
      if (num && +num[0] === 2) {
        roomId = ((_e = rooms[1]) == null ? void 0 : _e.id) || roomId;
        roomGuessed = false;
      }
      if (num && +num[0] === 1) {
        roomId = rooms[0].id;
        roomGuessed = false;
      }
    }
    out.push({
      id: String((_f = pick(r, ["id", "uuid", "appointmentId"])) != null ? _f : uid()),
      date,
      start,
      end,
      roomId,
      roomRaw: roomName,
      roomGuessed: roomGuessed && !!rn === false ? !rn : roomGuessed,
      coachId: cMatch ? cMatch.id : null,
      coachRaw: coachName,
      title,
      client,
      capacity,
      booked,
      sent: false
    });
  }
  const grupos = /* @__PURE__ */ new Map();
  for (const s of out) {
    const key = `${s.date}|${s.start}|${s.end}|${stripAccents(s.coachRaw)}|${stripAccents(s.title)}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(s);
  }
  const fusionadas = [];
  for (const grupo of grupos.values()) {
    if (grupo.length === 1) {
      fusionadas.push(grupo[0]);
      continue;
    }
    grupo.sort((a, b) => String(a.id).localeCompare(String(b.id), void 0, { numeric: true }));
    const base = { ...grupo[0] };
    const conSala = grupo.find((s) => !s.roomGuessed);
    if (conSala) {
      base.roomId = conSala.roomId;
      base.roomRaw = conSala.roomRaw;
      base.roomGuessed = false;
    }
    const clientes = [...new Set(grupo.map((s) => (s.client || "").trim()).filter(Boolean))];
    base.client = clientes.join(", ");
    const conAforo = grupo.find((s) => typeof s.capacity === "number");
    base.capacity = conAforo ? conAforo.capacity : base.capacity;
    base.booked = Math.max(...grupo.map((s) => s.booked || 0), clientes.length);
    fusionadas.push(base);
  }
  return fusionadas;
}
async function loadKey(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("storage", e);
  }
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function icsDate(dateISO, hhmm) {
  const [y, m, d] = dateISO.split("-");
  const [hh, mm] = hhmm.split(":");
  return `${y}${m}${d}T${pad2(hh)}${pad2(mm)}00`;
}
function icsEscape(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function buildIcs(sessions, coaches, rooms) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Axis//Panel Horarios//ES", "CALSCALE:GREGORIAN"];
  for (const s of sessions) {
    const c = coaches.find((x) => x.id === s.coachId);
    const room = rooms.find((x) => x.id === s.roomId);
    const uidStr = `${s.id}@axis-panel`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uidStr}`,
      `DTSTAMP:${icsDate(todayISO(), "00:00")}Z`,
      `DTSTART;TZID=Europe/Madrid:${icsDate(s.date, s.start)}`,
      `DTEND;TZID=Europe/Madrid:${icsDate(s.date, s.end)}`,
      `SUMMARY:${icsEscape(`Axis \xB7 ${s.title} \u2014 ${(c == null ? void 0 : c.name) || s.coachRaw || "?"} (${(room == null ? void 0 : room.name) || "?"})`)}`,
      `DESCRIPTION:${icsEscape(`Sala: ${(room == null ? void 0 : room.name) || "?"}${s.client ? ` \xB7 Cliente: ${s.client}` : ""}`)}`
    );
    if (c == null ? void 0 : c.email) lines.push(`ATTENDEE;CN=${icsEscape(c.name)}:mailto:${c.email}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function downloadIcs(sessions, coaches, rooms, filename) {
  const content = buildIcs(sessions, coaches, rooms);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "axis-sesiones.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// ===== AXIS · Módulos "Objetivos" y "Por persona" (02/10/2026). Fuente: extras.jsx =====
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const C_INK = "#12211B", C_MUTED = "#5A6B63", C_LINE = "#DDE4E0", C_SOFT = "#EDF1EF";
const C_GOOD = "#2E7D4F", C_WARN = "#B45309", C_BAD = "#9B1C1C";
const eur0 = (n) => (n || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const pct0 = (x) => (isFinite(x) ? Math.round(x * 100) : 0) + " %";
function personKeyOfCoach(c) {
  const k = creatorId(c.name || "");
  return k === "axis" ? "c:" + c.id : k;
}
function personKeyOfPayment(p) {
  // Las cuotas de The Axis Club se quedan siempre en el centro, las cree quien las cree.
  if (stripAccents(p.co || "").includes("axis club")) return "axis";
  const k = p.cr != null ? creatorId(p.cr) : p.c;
  return k === "eric" ? "erik" : k;
}
function personKeyOfSession(s, coaches) {
  const c = coaches.find((x) => x.id === s.coachId);
  if (c) return personKeyOfCoach(c);
  if (s.coachRaw) {
    const k = creatorId(s.coachRaw);
    return k === "axis" ? "__none__" : k;
  }
  return "__none__";
}
function buildPeople(coaches) {
  const map = /* @__PURE__ */ new Map();
  for (const c of coaches) {
    const k = personKeyOfCoach(c);
    if (!map.has(k)) map.set(k, { key: k, name: c.name, short: (c.name || "").split(" ")[0], color: c.color || "#6B7280" });
  }
  const fixed = { marc: "Marc Rosa", erik: "Erik Benavides", sergio: "Sergio Marín", marti: "Martí Soler", marina: "Marina", daniel: "Daniel Rodriguez" };
  for (const k of Object.keys(fixed)) {
    if (!map.has(k)) map.set(k, { key: k, name: fixed[k], short: fixed[k].split(" ")[0], color: "#6B7280" });
  }
  map.set("axis", { key: "axis", name: "Axis (centro)", short: "Axis", color: AXIS_COLOR });
  map.set("__none__", { key: "__none__", name: "Sin asignar", short: "Sin asignar", color: "#9CA3AF" });
  return map;
}
const PERSON_ORDER = ["marc", "erik", "sergio", "daniel", "marti", "marina"];
function sortPeople(keys) {
  const rank = (k) => k === "axis" ? 900 : k === "__none__" ? 999 : PERSON_ORDER.indexOf(k) >= 0 ? PERSON_ORDER.indexOf(k) : 500;
  return [...keys].sort((a, b) => rank(a) - rank(b) || String(a).localeCompare(String(b)));
}
const FAMILIAS = ["Valoración", "Entrenamiento personal", "Fisioterapia", "Nutrición", "Psicología", "Grupos", "Online", "Otros"];
function areaOf(t) {
  if (t.includes("fisio")) return "Fisioterapia";
  if (t.includes("nutri")) return "Nutrición";
  if (t.includes("psic") || /\bps\b/.test(t)) return "Psicología";
  if (t.includes("entrenamiento")) return "Entrenamiento personal";
  return null;
}
function productOf(conceptRaw, fallbackCat) {
  const raw = String(conceptRaw || fallbackCat || "").replace(/\s*\d{1,2}\/\d{4}\s*$/, "").trim();
  const t = stripAccents(raw);
  const area = areaOf(t);
  const num = (re) => {
    const m = t.match(re);
    return m ? parseFloat(m[1].replace(",", ".")) : null;
  };
  if (!t) return { familia: "Otros", nombre: "Sin concepto", sesiones: null };
  if (t.includes("gambaru")) {
    const n = num(/(\d+)\s*mensual/);
    return { familia: "Grupos", nombre: "Gambaru" + (n ? ` · ${n} mensuales` : ""), sesiones: n };
  }
  if (t.includes("axis club")) {
    const n = num(/(\d+)\s*mensual/);
    if (n) return { familia: "Grupos", nombre: `The Axis Club · ${n} mensuales`, sesiones: n };
    if (t.includes("mes 1")) return { familia: "Grupos", nombre: "The Axis Club · Mes 1", sesiones: null };
    return { familia: "Grupos", nombre: "The Axis Club", sesiones: null };
  }
  if (t.includes("performance")) return { familia: "Grupos", nombre: "Performance Group", sesiones: 8 };
  if (t.includes("valoraci")) return area === "Psicología" ? { familia: "Psicología", nombre: "Valoración inicial · Psicología", sesiones: 1 } : { familia: "Valoración", nombre: "Valoración inicial", sesiones: 1 };
  if (t.includes("trimestral") && area === "Nutrición") return { familia: "Nutrición", nombre: "Pack trimestral · Nutrición", sesiones: null };
  if (t.includes("grupo")) {
    const n = num(/\((\d+)\s*sesion/);
    return { familia: "Grupos", nombre: "Grupo reducido" + (n ? ` (${n} sesiones)` : ""), sesiones: n };
  }
  if (t.includes("bono") || t.includes("pack")) {
    const n = num(/(?:bono|pack)\s*(\d+(?:[.,]\d+)?)/);
    const fam = area || "Entrenamiento personal";
    const etiqueta = area ? ` · ${area}` : " · sin especificar";
    return { familia: fam, nombre: `Bono ${n || "?"} sesiones${etiqueta}`, sesiones: n };
  }
  if (t.includes("online")) return { familia: "Online", nombre: "Sesión online", sesiones: 1 };
  if (t.includes("individual") || t.includes("sesion")) {
    const fam = area || "Entrenamiento personal";
    const seg = t.includes("seguimiento") ? "Seguimiento" : "Sesión individual";
    return { familia: fam, nombre: `${seg} · ${area || "sin especificar"}`, sesiones: 1 };
  }
  return { familia: "Otros", nombre: raw.charAt(0).toUpperCase() + raw.slice(1), sesiones: null };
}
const TIPOS_GRUPALES = ["The Axis Club", "Performance Group", "Gambaru", "Grupo reducido"];
function sessionTypeOf(title) {
  const t = stripAccents(title || "");
  if (t.includes("axis club") || t.includes("small group")) return "The Axis Club";
  if (t.includes("performance")) return "Performance Group";
  if (t.includes("gambaru")) return "Gambaru";
  if (t.includes("grupo")) return "Grupo reducido";
  if (t.includes("valoraci")) return "Valoración inicial";
  if (t.includes("fisio")) return "Fisioterapia";
  if (t.includes("nutri")) return "Nutrición";
  if (t.includes("psic")) return "Psicología";
  if (t.includes("online")) return "Online";
  if (t.includes("entrenamiento") || t.includes("personal") || t.includes("individual") || /\bep\b/.test(t)) return "Entrenamiento personal";
  const s = (title || "Sin tipo").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatOf(s, tipo) {
  const n = Math.max(0, s.booked || (s.client ? String(s.client).split(",").filter((x) => x.trim()).length : 0));
  if (TIPOS_GRUPALES.includes(tipo)) return typeof s.capacity === "number" ? `Grupo de hasta ${s.capacity}` : "Grupo";
  if (n === 0) return "Sin cliente";
  return n <= 4 ? `${n} a 1` : `${n} personas`;
}
function minutesOf(s) {
  const m = toMin(s.end) - toMin(s.start);
  return m > 0 ? m : 0;
}
function isDone(s, today, nowMin) {
  if (!s.date) return false;
  if (s.date < today) return true;
  if (s.date > today) return false;
  return toMin(s.end) <= nowMin;
}
const card = { background: "#fff", border: `1px solid ${C_LINE}`, borderRadius: 12, padding: 16 };
const h2s = { margin: "0 0 4px", fontSize: 20, textTransform: "uppercase" };
const th = { padding: "8px 10px", borderBottom: `2px solid ${C_INK}`, fontSize: 12, color: C_MUTED, textAlign: "right", whiteSpace: "nowrap" };
const td = { padding: "7px 10px", borderBottom: `1px solid ${C_SOFT}`, fontSize: 13, textAlign: "right", whiteSpace: "nowrap" };
function Swatch({ color }) {
  return /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block", flex: "none" } });
}
function Seg({ value, onChange, options }) {
  return /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", gap: 4, flexWrap: "wrap" } }, options.map(([v, l]) => /* @__PURE__ */ React.createElement("button", { key: v, className: `axis-btn ${value === v ? "primary" : "ghost"}`, style: { padding: "6px 12px" }, "aria-pressed": value === v, onClick: () => onChange(v) }, l)));
}
function statusOf(ratio, future) {
  if (future) return { label: "Pendiente", icon: "○", color: C_MUTED };
  if (ratio >= 1) return { label: "Cumplido", icon: "✓", color: C_GOOD };
  if (ratio >= 0.7) return { label: "Cerca", icon: "▲", color: C_WARN };
  return { label: "Por debajo", icon: "✕", color: C_BAD };
}
function StatusBadge({ st }) {
  return /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: st.color } }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, st.icon), st.label);
}
function Progress({ ratio, color, pace, height = 14 }) {
  const w = Math.max(0, Math.min(1, ratio || 0)) * 100;
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", background: C_SOFT, borderRadius: 7, height, overflow: "visible" } }, /* @__PURE__ */ React.createElement("div", { style: { width: w + "%", height: "100%", background: color, borderRadius: 7, minWidth: ratio > 0 ? 4 : 0 } }), pace != null && pace > 0 && pace < 1 && /* @__PURE__ */ React.createElement("div", { title: "Ritmo esperado a día de hoy", style: { position: "absolute", left: `calc(${pace * 100}% - 1px)`, top: -4, bottom: -4, width: 2, background: C_INK } }));
}
function MoneyInput({ value, onChange, label, width = 130 }) {
  const fmt = (v) => v == null ? "" : Number(v).toLocaleString("es-ES", { maximumFractionDigits: 0 });
  const [txt, setTxt] = useState(fmt(value));
  useEffect(() => {
    setTxt(fmt(value));
  }, [value]);
  const commit = () => {
    const clean = txt.replace(/[€\s.]/g, "").replace(",", ".");
    if (clean === "") return onChange(null);
    const n = parseFloat(clean);
    if (!isNaN(n) && n >= 0) onChange(Math.round(n));
    else setTxt(fmt(value));
  };
  return /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      inputMode: "decimal",
      "aria-label": label,
      placeholder: "Sin objetivo",
      value: txt,
      style: { width, textAlign: "right" },
      onChange: (e) => setTxt(e.target.value),
      onBlur: commit,
      onFocus: (e) => {
        setTxt(value == null ? "" : String(value));
        setTimeout(() => e.target.select(), 0);
      },
      onKeyDown: (e) => {
        if (e.key === "Enter") e.target.blur();
      }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: C_MUTED } }, "€"));
}
function ObjetivosTab({ payments, coaches }) {
  const hoy = todayISO();
  const [year, setYear] = useState(Number(hoy.slice(0, 4)));
  const [objetivos, setObjetivos] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("axis-objetivos") || "{}") || {};
    } catch (e) {
      return {};
    }
  });
  const [base, setBase] = useState(() => {
    try {
      return window.localStorage.getItem("axis-objetivos-base") || "fin";
    } catch (e) {
      return "fin";
    }
  });
  const [mesSel, setMesSel] = useState(Number(hoy.slice(5, 7)));
  const [hover, setHover] = useState(null);
  useEffect(() => {
    try {
      window.localStorage.setItem("axis-objetivos", JSON.stringify(objetivos));
    } catch (e) {
    }
  }, [objetivos]);
  useEffect(() => {
    try {
      window.localStorage.setItem("axis-objetivos-base", base);
    } catch (e) {
    }
  }, [base]);
  const obj = objetivos[year] || { anual: null, meses: {} };
  const setObj = (patch) => setObjetivos((prev) => {
    const cur = prev[year] || { anual: null, meses: {} };
    return { ...prev, [year]: { ...cur, ...patch, meses: { ...cur.meses, ...patch.meses || {} } } };
  });
  const setMes = (m, v) => setObjetivos((prev) => {
    const cur = prev[year] || { anual: null, meses: {} };
    return { ...prev, [year]: { ...cur, meses: { ...cur.meses, [m]: v } } };
  });
  const people = useMemo(() => buildPeople(coaches), [coaches]);
  const data = useMemo(() => {
    const meses = Array.from({ length: 12 }, () => ({ fin: 0, pen: 0, porPersona: {} }));
    for (const p of payments) {
      if (!p.d || Number(p.d.slice(0, 4)) !== year) continue;
      const m = Number(p.d.slice(5, 7)) - 1;
      if (m < 0 || m > 11) continue;
      if (p.st === "fin") meses[m].fin += p.amt || 0;
      else meses[m].pen += p.amt || 0;
      if (base === "todos" || p.st === "fin") {
        const k = personKeyOfPayment(p);
        meses[m].porPersona[k] = (meses[m].porPersona[k] || 0) + (p.amt || 0);
      }
    }
    const real = meses.map((x) => base === "todos" ? x.fin + x.pen : x.fin);
    return { meses, real, totalReal: real.reduce((a, b) => a + b, 0) };
  }, [payments, year, base]);
  const yHoy = Number(hoy.slice(0, 4)), mHoy = Number(hoy.slice(5, 7));
  const esFuturo = (m) => year > yHoy || year === yHoy && m > mHoy;
  const esEnCurso = (m) => year === yHoy && m === mHoy;
  const metaMes = (m) => obj.meses && obj.meses[m] != null ? obj.meses[m] : null;
  const sumaMeses = Array.from({ length: 12 }, (_, i) => metaMes(i + 1) || 0).reduce((a, b) => a + b, 0);
  const hayMeses = Array.from({ length: 12 }, (_, i) => metaMes(i + 1)).some((v) => v != null);
  const anual = obj.anual != null ? obj.anual : hayMeses ? sumaMeses : null;
  const anualDerivado = obj.anual == null && hayMeses;
  let pace = null;
  if (anual) {
    if (year < yHoy) pace = 1;
    else if (year > yHoy) pace = 0;
    else {
      const d = /* @__PURE__ */ new Date(hoy + "T12:00:00");
      const diasMes = new Date(yHoy, mHoy, 0).getDate();
      const frMes = d.getDate() / diasMes;
      if (hayMeses) {
        let acum = 0;
        for (let m = 1; m < mHoy; m++) acum += metaMes(m) || 0;
        acum += (metaMes(mHoy) || 0) * frMes;
        pace = acum / anual;
      } else {
        const inicio = new Date(yHoy, 0, 1), fin = new Date(yHoy + 1, 0, 1);
        pace = (d - inicio) / (fin - inicio);
      }
    }
  }
  const ratioAnual = anual ? data.totalReal / anual : 0;
  const esperadoHoy = pace != null && anual ? anual * pace : null;
  const difRitmo = esperadoHoy != null ? data.totalReal - esperadoHoy : null;
  const mesesRestantes = year === yHoy ? 12 - mHoy + 1 : year > yHoy ? 12 : 0;
  const falta = anual ? Math.max(0, anual - data.totalReal) : 0;
  const repartir = () => {
    if (!anual) return;
    const each = Math.round(anual / 12);
    const meses = {};
    for (let m = 1; m <= 12; m++) meses[m] = m === 12 ? anual - each * 11 : each;
    setObj({ anual, meses });
  };
  const copiarAnterior = () => {
    const prev = objetivos[year - 1];
    if (!prev) return;
    setObjetivos((p) => ({ ...p, [year]: { anual: prev.anual, meses: { ...prev.meses } } }));
  };
  const W = 760, H = 240, PADL = 56, PADR = 12, PADT = 26, PADB = 30;
  const maxV = Math.max(1, ...data.real, ...Array.from({ length: 12 }, (_, i) => metaMes(i + 1) || 0)) * 1.12;
  const niceStep = (() => {
    const raw = maxV / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
  })();
  const ticks = [];
  for (let v = 0; v <= maxV; v += niceStep) ticks.push(v);
  const yMax = ticks[ticks.length - 1] < maxV ? ticks[ticks.length - 1] + niceStep : ticks[ticks.length - 1];
  if (ticks[ticks.length - 1] < yMax) ticks.push(yMax);
  const plotW = W - PADL - PADR, plotH = H - PADT - PADB;
  const colW = plotW / 12, barW = Math.min(30, colW * 0.5);
  const y = (v) => PADT + plotH - v / yMax * plotH;
  const mSel = data.meses[mesSel - 1];
  const realSel = data.real[mesSel - 1];
  const metaSel = metaMes(mesSel);
  const personasSel = sortPeople(Object.keys(mSel.porPersona)).filter((k) => mSel.porPersona[k] > 0);
  const maxPers = Math.max(1, ...personasSel.map((k) => mSel.porPersona[k]));
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setYear(year - 1), "aria-label": "Año anterior" }, "←"), /* @__PURE__ */ React.createElement("span", { className: "axis-display", style: { fontSize: 26, fontWeight: 700 } }, year), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setYear(year + 1), "aria-label": "Año siguiente" }, "→"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 12, fontSize: 13, color: C_MUTED } }, "Cuenta como facturado:"), /* @__PURE__ */ React.createElement(Seg, { value: base, onChange: setBase, options: [["fin", "Solo cobrado"], ["todos", "Cobrado + pendiente"]] }), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 12, color: C_MUTED } }, "Importes con IVA, igual que AimHarder")), /* @__PURE__ */ React.createElement("section", { style: card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Objetivo anual ", year), /* @__PURE__ */ React.createElement(MoneyInput, { label: `Objetivo anual ${year}`, width: 150, value: obj.anual, onChange: (v) => setObj({ anual: v }) }), anualDerivado && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C_MUTED } }, "Sin cifra anual: se usa la suma de los meses (", eur0(sumaMeses), ")"), obj.anual != null && hayMeses && Math.abs(sumaMeses - obj.anual) > 1 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C_WARN, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, "⚠ Los objetivos mensuales suman ", eur0(sumaMeses), ", no ", eur0(obj.anual), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { padding: "3px 9px", fontSize: 12 }, onClick: () => setObj({ anual: sumaMeses }) }, "Usar ", eur0(sumaMeses), " como anual"))), !anual ? /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: 14, color: C_MUTED } }, "Escribe un objetivo anual o los objetivos de cada mes en la tabla de abajo. Llevas facturado ", /* @__PURE__ */ React.createElement("b", { style: { color: C_INK } }, eur0(data.totalReal)), " en ", year, ".") : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "Completado"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 46, fontWeight: 700, lineHeight: 1 } }, pct0(ratioAnual))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "Facturado"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 26, fontWeight: 700 } }, eur0(data.totalReal)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "de ", eur0(anual))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "Falta"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 26, fontWeight: 700 } }, eur0(falta)), falta > 0 && mesesRestantes > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "≈ ", eur0(falta / mesesRestantes), " al mes (", mesesRestantes, " ", mesesRestantes === 1 ? "mes" : "meses", ")")), difRitmo != null && year === yHoy && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "Frente al ritmo de hoy"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 26, fontWeight: 700, color: difRitmo >= 0 ? C_GOOD : C_BAD } }, difRitmo >= 0 ? "▲ +" : "▼ ", eur0(difRitmo)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "esperado a hoy: ", eur0(esperadoHoy)))), /* @__PURE__ */ React.createElement(Progress, { ratio: ratioAnual, color: ratioAnual >= 1 ? C_GOOD : AXIS_COLOR, pace: year === yHoy ? pace : null, height: 18 }), year === yHoy && pace != null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 2, height: 12, background: C_INK, display: "inline-block" } }), " línea negra = dónde deberías estar hoy para cumplir el objetivo", hayMeses ? " (según los objetivos mensuales)" : ""))), /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Facturación mensual frente al objetivo"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C_MUTED, display: "inline-flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(Swatch, { color: AXIS_COLOR }), " facturado", /* @__PURE__ */ React.createElement("span", { style: { width: 16, height: 2, background: C_INK, display: "inline-block", marginLeft: 10 } }), " objetivo del mes · pulsa un mes para ver el detalle")), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", minWidth: 560 } }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": `Facturación mensual de ${year} frente al objetivo`, style: { display: "block" } }, ticks.map((v) => /* @__PURE__ */ React.createElement("g", { key: v }, /* @__PURE__ */ React.createElement("line", { x1: PADL, x2: W - PADR, y1: y(v), y2: y(v), stroke: v === 0 ? "#B7C3BD" : "#EEF2F0", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("text", { x: PADL - 8, y: y(v) + 4, textAnchor: "end", fontSize: "11", fill: C_MUTED }, v >= 1e3 ? (v / 1e3).toLocaleString("es-ES") + "k" : v))), data.real.map((v, i) => {
    const m = i + 1, cx = PADL + colW * i + colW / 2;
    const meta = metaMes(m);
    const ratio = meta ? v / meta : null;
    const sel = m === mesSel;
    const fill = ratio != null && ratio >= 1 ? C_GOOD : AXIS_COLOR;
    const barH = Math.max(v > 0 ? 2 : 0, v / yMax * plotH);
    return /* @__PURE__ */ React.createElement(
      "g",
      {
        key: m,
        style: { cursor: "pointer" },
        onClick: () => setMesSel(m),
        onMouseEnter: () => setHover({ m, x: cx, v, meta }),
        onMouseLeave: () => setHover(null)
      },
      /* @__PURE__ */ React.createElement("rect", { x: PADL + colW * i, y: PADT, width: colW, height: plotH, fill: sel ? "#F2F7F5" : "transparent" }),
      barH > 0 && /* @__PURE__ */ React.createElement("path", { d: `M${cx - barW / 2},${y(0)} V${y(0) - barH + 4} Q${cx - barW / 2},${y(0) - barH} ${cx - barW / 2 + 4},${y(0) - barH} H${cx + barW / 2 - 4} Q${cx + barW / 2},${y(0) - barH} ${cx + barW / 2},${y(0) - barH + 4} V${y(0)} Z`, fill, opacity: esFuturo(m) ? 0.35 : 1 }),
      meta != null && meta > 0 && /* @__PURE__ */ React.createElement("line", { x1: cx - barW / 2 - 7, x2: cx + barW / 2 + 7, y1: y(meta), y2: y(meta), stroke: C_INK, strokeWidth: "2", strokeLinecap: "round" }),
      ratio != null && !esFuturo(m) && /* @__PURE__ */ React.createElement("text", { x: cx, y: Math.min(y(v), meta ? y(meta) : y(v)) - 7, textAnchor: "middle", fontSize: "11", fontWeight: "700", fill: C_INK }, pct0(ratio)),
      /* @__PURE__ */ React.createElement("text", { x: cx, y: H - 10, textAnchor: "middle", fontSize: "12", fontWeight: sel ? 700 : 500, fill: sel ? C_INK : C_MUTED }, MESES_CORTOS[i])
    );
  })), hover && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: `${hover.x / W * 100}%`, top: 0, transform: "translateX(-50%)", background: C_INK, color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12, pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,.2)" } }, /* @__PURE__ */ React.createElement("b", null, MESES_LARGOS[hover.m - 1]), " · ", eur0(hover.v), hover.meta ? ` de ${eur0(hover.meta)} (${pct0(hover.v / hover.meta)})` : " · sin objetivo"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", alignItems: "start" } }, /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { ...h2s, marginRight: "auto" } }, "Objetivos por mes"), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { padding: "5px 10px", fontSize: 12 }, disabled: !obj.anual, onClick: repartir, title: "Divide el objetivo anual en 12 meses iguales" }, "Repartir anual en 12"), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { padding: "5px 10px", fontSize: 12 }, disabled: !objetivos[year - 1], onClick: copiarAnterior }, "Copiar de ", year - 1)), /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Mes"), /* @__PURE__ */ React.createElement("th", { style: th }, "Objetivo"), /* @__PURE__ */ React.createElement("th", { style: th }, "Facturado"), /* @__PURE__ */ React.createElement("th", { style: th }, "%"), /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Estado"))), /* @__PURE__ */ React.createElement("tbody", null, MESES_LARGOS.map((nombre, i) => {
    const m = i + 1, meta = metaMes(m), v = data.real[i];
    const ratio = meta ? v / meta : null;
    const st = meta ? statusOf(ratio, esFuturo(m)) : null;
    return /* @__PURE__ */ React.createElement("tr", { key: m, style: { background: m === mesSel ? "#F2F7F5" : void 0 } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 600, cursor: "pointer" }, onClick: () => setMesSel(m) }, nombre, esEnCurso(m) && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C_MUTED, fontWeight: 500 } }, " · en curso")), /* @__PURE__ */ React.createElement("td", { style: { ...td, padding: "4px 10px" } }, /* @__PURE__ */ React.createElement(MoneyInput, { label: `Objetivo ${nombre} ${year}`, width: 96, value: meta, onChange: (val) => setMes(m, val) })), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: v ? C_INK : "#B7C3BD" } }, esFuturo(m) && !v ? "—" : eur0(v)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700 } }, ratio != null && !esFuturo(m) ? pct0(ratio) : "—"), /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left" } }, st ? /* @__PURE__ */ React.createElement(StatusBadge, { st: esEnCurso(m) && ratio < 1 ? { label: "En curso", icon: "◔", color: C_WARN } : st }) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#9CA3AF" } }, "Sin objetivo")));
  }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, "Total"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, hayMeses ? eur0(sumaMeses) : "—"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, eur0(data.totalReal)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, hayMeses && sumaMeses ? pct0(data.totalReal / sumaMeses) : "—"), /* @__PURE__ */ React.createElement("td", { style: { ...td, borderTop: `2px solid ${C_INK}` } }))))), /* @__PURE__ */ React.createElement("section", { style: card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { padding: "4px 10px" }, onClick: () => setMesSel(mesSel === 1 ? 12 : mesSel - 1), "aria-label": "Mes anterior" }, "←"), /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { ...h2s, margin: 0 } }, MESES_LARGOS[mesSel - 1], " ", year), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { padding: "4px 10px" }, onClick: () => setMesSel(mesSel === 12 ? 1 : mesSel + 1), "aria-label": "Mes siguiente" }, "→")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "Facturado"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 28, fontWeight: 700 } }, eur0(realSel))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "Objetivo"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 28, fontWeight: 700 } }, metaSel ? eur0(metaSel) : "—")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, "Completado"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 28, fontWeight: 700 } }, metaSel ? pct0(realSel / metaSel) : "—"))), metaSel ? /* @__PURE__ */ React.createElement(Progress, { ratio: realSel / metaSel, color: realSel >= metaSel ? C_GOOD : AXIS_COLOR }) : null, metaSel && realSel < metaSel && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C_MUTED, margin: "8px 0 0" } }, "Faltan ", /* @__PURE__ */ React.createElement("b", { style: { color: C_INK } }, eur0(metaSel - realSel)), " para el objetivo del mes."), metaSel && realSel >= metaSel && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C_GOOD, margin: "8px 0 0", fontWeight: 600 } }, "✓ Objetivo superado en ", eur0(realSel - metaSel), "."), base === "fin" && mSel.pen > 0 && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C_MUTED, margin: "6px 0 0" } }, "Además hay ", eur0(mSel.pen), " pendientes de cobro este mes."), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 13, margin: "16px 0 8px", color: C_MUTED, textTransform: "uppercase", letterSpacing: ".04em" } }, "Quién lo ha facturado"), personasSel.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C_MUTED, margin: 0 } }, "Sin pagos este mes.") : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 7 } }, personasSel.map((k) => {
    const p = people.get(k) || { short: CREATOR_LABELS[k] || k, color: "#6B7280" };
    const v = mSel.porPersona[k];
    return /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "grid", gridTemplateColumns: "92px 1fr 120px", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 } }, /* @__PURE__ */ React.createElement(Swatch, { color: p.color }), p.short), /* @__PURE__ */ React.createElement("div", { style: { background: C_SOFT, borderRadius: 4, height: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: v / maxPers * 100 + "%", height: "100%", background: p.color, borderRadius: 4, minWidth: 3 } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, textAlign: "right" } }, /* @__PURE__ */ React.createElement("b", null, eur0(v)), " ", /* @__PURE__ */ React.createElement("span", { style: { color: C_MUTED, fontSize: 11 } }, realSel ? pct0(v / realSel) : "")));
  })))), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: 12, color: C_MUTED } }, "Los objetivos se guardan en este navegador. Si otra persona del equipo quiere verlos, tiene que escribirlos también en el suyo."));
}
// ---------- Valor de las sesiones impartidas ----------
// Cada sesión 1 a 1 (entrenamiento personal o fisioterapia) gasta una sesión del
// bono del cliente, por orden de compra. Su valor es lo que pagó el cliente por
// ese bono dividido entre sus sesiones (PVP con IVA) y se atribuye a quien IMPARTE
// la sesión, no a quien vendió el bono. Así cada coach suma lo que trabaja.
const SES_VALORADAS = ["Entrenamiento personal", "Fisioterapia"];
const normName = (s) => stripAccents(s).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
function creditFamily(pr) {
  if (pr.familia === "Fisioterapia") return "Fisioterapia";
  if (pr.familia === "Entrenamiento personal") return "Entrenamiento personal";
  return null;
}
function origenLabel(pr, fam) {
  const n = pr.sesiones;
  const base = n === 1 ? "Sesión suelta" : `Bono ${String(n).replace(".", ",")} sesiones`;
  return `${base} · ${fam === "Fisioterapia" ? "Fisio" : "EP"}`;
}
function buildSessionLedger(payments, sessions, coaches, hoy, nowMin) {
  const credits = /* @__PURE__ */ new Map();
  for (const p of payments) {
    const pr = productOf(p.co, p.cat);
    const fam = creditFamily(pr);
    if (!fam || !pr.sesiones || !(p.amt > 0)) continue;
    const key = normName(p.cl);
    if (!key) continue;
    const list = credits.get(key) || [];
    list.push({
      id: p.id,
      d: p.d || "",
      fam,
      generic: !areaOf(stripAccents(p.co || "")),
      left: pr.sesiones,
      unit: p.amt / pr.sesiones,
      origen: origenLabel(pr, fam),
      // Axis (cuenta del centro) solo vende The Axis Club: un bono de EP o fisio
      // registrado con la cuenta del centro no es "de otro", no tiene vendedor.
      seller: personKeyOfPayment(p) === "axis" ? null : personKeyOfPayment(p),
      st: p.st
    });
    credits.set(key, list);
  }
  for (const l of credits.values()) l.sort((a, b) => a.d.localeCompare(b.d) || String(a.id).localeCompare(String(b.id), void 0, { numeric: true }));
  const names = [...credits.keys()];
  const resolve = (raw) => {
    const k = normName(raw);
    if (credits.has(k)) return k;
    const c = names.filter((n) => n.startsWith(k + " ") || k.startsWith(n + " "));
    return c.length === 1 ? c[0] : k;
  };
  const hechas = sessions.filter((s) => isDone(s, hoy, nowMin) && SES_VALORADAS.includes(sessionTypeOf(s.title))).sort((a, b) => ((a.date || "") + (a.start || "")).localeCompare((b.date || "") + (b.start || "")));
  const rows = [];
  for (const s of hechas) {
    const tipo = sessionTypeOf(s.title);
    const coach = personKeyOfSession(s, coaches);
    const clientes = String(s.client || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (!clientes.length) {
      rows.push({ date: s.date, start: s.start, sid: s.id, coach, tipo, client: "(sin cliente)", value: 0, origen: "Sin bono", seller: null, sinBono: true });
      continue;
    }
    for (const cl of clientes) {
      const list = credits.get(resolve(cl)) || [];
      const prefs = tipo === "Fisioterapia" ? [(c) => c.fam === "Fisioterapia", (c) => c.generic] : [(c) => c.fam === "Entrenamiento personal"];
      let cr = null;
      for (const f of prefs) {
        cr = list.find((c) => c.left > 0 && f(c));
        if (cr) break;
      }
      if (cr) {
        cr.left -= 1;
        rows.push({ date: s.date, start: s.start, sid: s.id, coach, tipo, client: cl, value: cr.unit, origen: cr.origen, seller: cr.seller, pendiente: cr.st === "pen", sinBono: false });
      } else {
        rows.push({ date: s.date, start: s.start, sid: s.id, coach, tipo, client: cl, value: 0, origen: "Sin bono", seller: null, sinBono: true });
      }
    }
  }
  return rows;
}
function valorPorPersona(rows, prefix) {
  const per = {};
  const get = (k) => per[k] = per[k] || { n: 0, value: 0, origenes: {}, deOtros: { n: 0, value: 0, por: {} }, cedidas: { n: 0, value: 0, por: {} }, sinBono: { n: 0, clientes: {} }, pendientes: 0 };
  for (const r of rows) {
    if (!(r.date || "").startsWith(prefix)) continue;
    const st = get(r.coach);
    st.n += 1;
    st.value += r.value;
    if (r.pendiente) st.pendientes += 1;
    if (r.sinBono) {
      st.sinBono.n += 1;
      st.sinBono.clientes[r.client] = (st.sinBono.clientes[r.client] || 0) + 1;
      continue;
    }
    const o = st.origenes[r.origen] = st.origenes[r.origen] || { origen: r.origen, n: 0, value: 0 };
    o.n += 1;
    o.value += r.value;
    if (r.seller && r.seller !== r.coach) {
      st.deOtros.n += 1;
      st.deOtros.value += r.value;
      const x = st.deOtros.por[r.seller] = st.deOtros.por[r.seller] || { n: 0, value: 0 };
      x.n += 1;
      x.value += r.value;
      const v = get(r.seller);
      v.cedidas.n += 1;
      v.cedidas.value += r.value;
      const y = v.cedidas.por[r.coach] = v.cedidas.por[r.coach] || { n: 0, value: 0 };
      y.n += 1;
      y.value += r.value;
    }
  }
  return per;
}
function ValorEquipo({ valor, P, etiquetaPeriodo }) {
  const ks = sortPeople(Object.keys(valor).filter((k) => valor[k].n || valor[k].cedidas.n));
  if (!ks.length) return null;
  const tot = (f) => ks.reduce((a, k) => a + f(valor[k]), 0);
  const cell = (n, v, color) => n ? /* @__PURE__ */ React.createElement("span", { style: { color } }, n, " · ", eur0(v)) : "–";
  const tdT = { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` };
  return /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Valor de las sesiones impartidas"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 12, color: C_MUTED } }, "Solo sesiones de entrenamiento personal y fisioterapia de ", etiquetaPeriodo, ". Cada sesión vale lo que pagó el cliente por su bono entre sus sesiones (PVP con IVA) y cuenta para quien la imparte, aunque el bono lo vendiera otro entrenador. Los bonos registrados con la cuenta del centro no cuentan como «de otro»."), /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 640 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Persona"), /* @__PURE__ */ React.createElement("th", { style: th }, "Sesiones"), /* @__PURE__ */ React.createElement("th", { style: th }, "Valor impartido"), /* @__PURE__ */ React.createElement("th", { style: th, title: "Sesiones que imparte de bonos que vendió otra persona" }, "De bonos de otros"), /* @__PURE__ */ React.createElement("th", { style: th, title: "Sesiones de bonos que vendió esta persona y que impartió otra" }, "Sus bonos, dados por otros"), /* @__PURE__ */ React.createElement("th", { style: th, title: "Sesiones sin un bono o sesión pagada que las cubra" }, "Sin bono"))), /* @__PURE__ */ React.createElement("tbody", null, ks.map((k) => {
    const v = valor[k], p = P(k);
    return /* @__PURE__ */ React.createElement("tr", { key: k }, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(Swatch, { color: p.color }), p.name)), /* @__PURE__ */ React.createElement("td", { style: td }, v.n || "–"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700 } }, v.n ? eur0(v.value) : "–"), /* @__PURE__ */ React.createElement("td", { style: td }, cell(v.deOtros.n, v.deOtros.value)), /* @__PURE__ */ React.createElement("td", { style: td }, cell(v.cedidas.n, v.cedidas.value, C_MUTED)), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: v.sinBono.n ? C_WARN : void 0, fontWeight: v.sinBono.n ? 700 : 400 } }, v.sinBono.n || "–"));
  }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...tdT, textAlign: "left" } }, "Total"), /* @__PURE__ */ React.createElement("td", { style: tdT }, tot((v) => v.n)), /* @__PURE__ */ React.createElement("td", { style: tdT }, eur0(tot((v) => v.value))), /* @__PURE__ */ React.createElement("td", { style: tdT }, tot((v) => v.deOtros.n) || "–"), /* @__PURE__ */ React.createElement("td", { style: tdT }), /* @__PURE__ */ React.createElement("td", { style: { ...tdT, color: tot((v) => v.sinBono.n) ? C_WARN : void 0 } }, tot((v) => v.sinBono.n) || "–")))));
}
function DetalleSesiones({ rows, k, P }) {
  const mine = rows.filter((r) => r.coach === k || r.seller === k).sort((a, b) => (a.date + (a.start || "")).localeCompare(b.date + (b.start || "")));
  if (!mine.length) return null;
  const fmtD = (d) => d.slice(8, 10) + "/" + d.slice(5, 7);
  const tdD = { ...td, textAlign: "left" };
  return /* @__PURE__ */ React.createElement("details", { style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("summary", { style: { cursor: "pointer", fontSize: 13, fontWeight: 700 } }, "Ver sesiones una a una (", mine.length, ")"), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto", marginTop: 8 } }, /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 640 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, ["Fecha", "Hora", "Cliente", "Tipo", "Bono de origen", "Vendió", "Impartió"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: { ...th, textAlign: "left" } }, h)), /* @__PURE__ */ React.createElement("th", { style: th }, "Valor"))), /* @__PURE__ */ React.createElement("tbody", null, mine.map((r, i) => {
    const otro = !r.sinBono && r.seller && r.seller !== r.coach;
    const rareFisio = r.tipo === "Fisioterapia" && !["erik", "marti"].includes(r.coach);
    const bg = r.sinBono ? "#FEF3E7" : otro || rareFisio ? "#EEF4FB" : void 0;
    return /* @__PURE__ */ React.createElement("tr", { key: r.sid + "|" + r.client + "|" + i, style: { background: bg } }, /* @__PURE__ */ React.createElement("td", { style: tdD }, fmtD(r.date)), /* @__PURE__ */ React.createElement("td", { style: tdD }, r.start || "–"), /* @__PURE__ */ React.createElement("td", { style: tdD }, r.client), /* @__PURE__ */ React.createElement("td", { style: { ...tdD, fontWeight: rareFisio ? 700 : 400 } }, r.tipo === "Fisioterapia" ? "Fisioterapia" : "EP"), /* @__PURE__ */ React.createElement("td", { style: { ...tdD, color: r.sinBono ? C_WARN : void 0 } }, r.origen), /* @__PURE__ */ React.createElement("td", { style: tdD }, r.seller ? P(r.seller).short : "–"), /* @__PURE__ */ React.createElement("td", { style: tdD }, P(r.coach).short), /* @__PURE__ */ React.createElement("td", { style: td }, r.value ? eur0(r.value) : "–"));
  }))), /* @__PURE__ */ React.createElement("p", { style: { margin: "6px 0 0", fontSize: 11, color: C_MUTED } }, "Azul: sesión de un bono vendido por otra persona, o fisioterapia dada por alguien que no es fisio. Naranja: sin bono que la cubra.")));
}
function ValorPersona({ v, p, P, etiquetaPeriodo, rows, k }) {
  if (!v || !(v.n || v.cedidas.n)) return null;
  const origenes = Object.values(v.origenes).sort((a, b) => b.n - a.n);
  const lista = (por, verbo) => Object.entries(por).sort((a, b) => b[1].n - a[1].n).map(([k, x]) => /* @__PURE__ */ React.createElement("li", { key: k, style: { margin: "2px 0" } }, /* @__PURE__ */ React.createElement("b", null, x.n), " ", x.n === 1 ? "sesión" : "sesiones", " ", verbo, " ", /* @__PURE__ */ React.createElement("b", null, P(k).short), " · ", eur0(x.value)));
  const sinBono = Object.entries(v.sinBono.clientes).sort((a, b) => b[1] - a[1]);
  const tdT = { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` };
  return /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto", borderLeft: `6px solid ${p.color}` } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Valor de las sesiones impartidas"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 12, color: C_MUTED } }, "Solo sesiones de entrenamiento personal y fisioterapia de ", etiquetaPeriodo, ", según el bono del que sale cada sesión (PVP con IVA). Cuenta para quien la imparte."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 28, flexWrap: "wrap", margin: "6px 0 14px" } }, [["Valor impartido", eur0(v.value), v.n ? `${v.n} sesiones · ${eur0(v.n - v.sinBono.n ? v.value / (v.n - v.sinBono.n) : 0)} de media` : null], ["De bonos de otros", v.deOtros.n ? eur0(v.deOtros.value) : "–", v.deOtros.n ? `${v.deOtros.n} sesiones` : null], ["Sus bonos, dados por otros", v.cedidas.n ? eur0(v.cedidas.value) : "–", v.cedidas.n ? `${v.cedidas.n} sesiones` : null], ["Sin bono", v.sinBono.n || "–", v.sinBono.n ? "revisar cobro" : null]].map(([l, val, sub]) => /* @__PURE__ */ React.createElement("div", { key: l }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, l), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 26, fontWeight: 700, color: l === "Sin bono" && v.sinBono.n ? C_WARN : C_INK } }, val), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C_MUTED } }, sub)))), origenes.length > 0 && /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", maxWidth: 640 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Bono de origen"), /* @__PURE__ */ React.createElement("th", { style: th }, "Sesiones"), /* @__PURE__ */ React.createElement("th", { style: th }, "€ / sesión"), /* @__PURE__ */ React.createElement("th", { style: th }, "Importe"))), /* @__PURE__ */ React.createElement("tbody", null, origenes.map((o) => /* @__PURE__ */ React.createElement("tr", { key: o.origen }, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left" } }, o.origen), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700 } }, o.n), /* @__PURE__ */ React.createElement("td", { style: td }, (o.value / o.n).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 })), /* @__PURE__ */ React.createElement("td", { style: td }, eur0(o.value)))), v.sinBono.n > 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", color: C_WARN } }, "Sin bono que la cubra"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, color: C_WARN } }, v.sinBono.n), /* @__PURE__ */ React.createElement("td", { style: td }, "–"), /* @__PURE__ */ React.createElement("td", { style: td }, "–")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...tdT, textAlign: "left" } }, "Total"), /* @__PURE__ */ React.createElement("td", { style: tdT }, v.n), /* @__PURE__ */ React.createElement("td", { style: tdT }), /* @__PURE__ */ React.createElement("td", { style: tdT }, eur0(v.value))))), (v.deOtros.n > 0 || v.cedidas.n > 0 || sinBono.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 14, fontSize: 13 } }, v.deOtros.n > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C_MUTED, textTransform: "uppercase", letterSpacing: ".05em" } }, "Clientes de otros que ha entrenado"), /* @__PURE__ */ React.createElement("ul", { style: { margin: "4px 0 0", paddingLeft: 18 } }, lista(v.deOtros.por, "de bonos vendidos por"))), v.cedidas.n > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C_MUTED, textTransform: "uppercase", letterSpacing: ".05em" } }, "Sus bonos que ha dado otro"), /* @__PURE__ */ React.createElement("ul", { style: { margin: "4px 0 0", paddingLeft: 18 } }, lista(v.cedidas.por, "impartidas por"))), sinBono.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C_WARN, textTransform: "uppercase", letterSpacing: ".05em" } }, "Sesiones sin bono (revisar)"), /* @__PURE__ */ React.createElement("ul", { style: { margin: "4px 0 0", paddingLeft: 18 } }, sinBono.map(([c, n]) => /* @__PURE__ */ React.createElement("li", { key: c, style: { margin: "2px 0" } }, c, " · ", n, " ", n === 1 ? "sesión" : "sesiones"))))), rows && /* @__PURE__ */ React.createElement(DetalleSesiones, { rows, k, P }), v.pendientes > 0 && /* @__PURE__ */ React.createElement("p", { style: { margin: "10px 0 0", fontSize: 12, color: C_MUTED } }, v.pendientes, " de estas sesiones salen de bonos que todavía constan como pendientes de cobro."));
}
function PersonasTab({ payments, sessions, coaches, nowMin }) {
  const hoy = todayISO();
  const [periodo, setPeriodo] = useState("mes");
  const [month, setMonth] = useState(hoy.slice(0, 7));
  const [year, setYear] = useState(Number(hoy.slice(0, 4)));
  const [estado, setEstado] = useState("fin");
  const [sel, setSel] = useState("__equipo__");
  const people = useMemo(() => buildPeople(coaches), [coaches]);
  const prefix = periodo === "mes" ? month : String(year);
  const etiquetaPeriodo = periodo === "mes" ? monthLabel(month) : `Año ${year}`;
  const stats = useMemo(() => {
    const per = {};
    const get = (k) => per[k] = per[k] || { ventas: {}, nVentas: 0, importe: 0, sesVendidas: 0, tipos: {}, nSes: 0, nProg: 0, min: 0, asist: 0, clientes: /* @__PURE__ */ new Set() };
    for (const p of payments) {
      if (!(p.d || "").startsWith(prefix)) continue;
      if (estado !== "todos" && p.st !== estado) continue;
      const k = personKeyOfPayment(p);
      const pr = productOf(p.co, p.cat);
      const st = get(k);
      const key = pr.familia + "|" + pr.nombre;
      const v = st.ventas[key] = st.ventas[key] || { familia: pr.familia, nombre: pr.nombre, n: 0, importe: 0, sesiones: 0, sesionesConocidas: true };
      v.n += 1;
      v.importe += p.amt || 0;
      if (pr.sesiones != null) v.sesiones += pr.sesiones;
      else v.sesionesConocidas = false;
      st.nVentas += 1;
      st.importe += p.amt || 0;
      if (pr.sesiones != null) st.sesVendidas += pr.sesiones;
    }
    for (const s of sessions) {
      if (!(s.date || "").startsWith(prefix)) continue;
      const k = personKeyOfSession(s, coaches);
      const st = get(k);
      const tipo = sessionTypeOf(s.title);
      const fmt = formatOf(s, tipo);
      const dur = minutesOf(s);
      const done = isDone(s, hoy, nowMin);
      const t = st.tipos[tipo] = st.tipos[tipo] || { tipo, n: 0, prog: 0, min: 0, asist: 0, filas: {} };
      const fk = fmt + "|" + dur;
      const f = t.filas[fk] = t.filas[fk] || { formato: fmt, dur, n: 0, prog: 0, asist: 0, plazas: 0 };
      const asist = Math.max(0, s.booked || 0);
      if (done) {
        f.n += 1;
        f.asist += asist;
        if (typeof s.capacity === "number" && TIPOS_GRUPALES.includes(tipo)) f.plazas += s.capacity;
        t.n += 1;
        t.min += dur;
        t.asist += asist;
        st.nSes += 1;
        st.min += dur;
        st.asist += asist;
        String(s.client || "").split(",").map((x) => x.trim()).filter(Boolean).forEach((c) => st.clientes.add(c));
      } else {
        f.prog += 1;
        t.prog += 1;
        st.nProg += 1;
      }
    }
    return per;
  }, [payments, sessions, coaches, prefix, estado, nowMin]);
  const ledger = useMemo(() => buildSessionLedger(payments, sessions, coaches, hoy, nowMin), [payments, sessions, coaches, nowMin]);
  const valor = useMemo(() => valorPorPersona(ledger, prefix), [ledger, prefix]);
  const keys = sortPeople(Object.keys(stats).filter((k) => stats[k].nVentas || stats[k].nSes || stats[k].nProg));
  const P = (k) => people.get(k) || { key: k, name: CREATOR_LABELS[k] || k, short: CREATOR_LABELS[k] || k, color: "#6B7280" };
  const horas = (min) => (min / 60).toLocaleString("es-ES", { maximumFractionDigits: 1 }) + " h";
  const totalImporte = keys.reduce((a, k) => a + stats[k].importe, 0);
  const maxImp = Math.max(1, ...keys.map((k) => stats[k].importe));
  const maxSes = Math.max(1, ...keys.map((k) => stats[k].nSes));
  const prodRows = {}, tipoRows = {};
  for (const k of keys) {
    for (const v of Object.values(stats[k].ventas)) {
      const r = prodRows[v.familia + "|" + v.nombre] = prodRows[v.familia + "|" + v.nombre] || { familia: v.familia, nombre: v.nombre, por: {}, n: 0 };
      r.por[k] = (r.por[k] || 0) + v.n;
      r.n += v.n;
    }
    for (const t of Object.values(stats[k].tipos)) {
      const r = tipoRows[t.tipo] = tipoRows[t.tipo] || { tipo: t.tipo, por: {}, n: 0 };
      r.por[k] = (r.por[k] || 0) + t.n;
      r.n += t.n;
    }
  }
  const famRank = (f) => FAMILIAS.indexOf(f) < 0 ? 99 : FAMILIAS.indexOf(f);
  const prodList = Object.values(prodRows).sort((a, b) => famRank(a.familia) - famRank(b.familia) || b.n - a.n);
  const tipoList = Object.values(tipoRows).filter((r) => r.n > 0).sort((a, b) => b.n - a.n);
  const ventasKeys = keys.filter((k) => stats[k].nVentas);
  const sesKeys = keys.filter((k) => stats[k].nSes);
  const PersonHead = ({ k }) => /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: C_INK } }, /* @__PURE__ */ React.createElement(Swatch, { color: P(k).color }), P(k).short));
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 14 } }, /* @__PURE__ */ React.createElement(Seg, { value: periodo, onChange: setPeriodo, options: [["mes", "Mes"], ["anio", "Año"]] }), periodo === "mes" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, -1)), "aria-label": "Mes anterior" }, "←"), /* @__PURE__ */ React.createElement("input", { type: "month", className: "axis-input", style: { width: 160 }, value: month, onChange: (e) => e.target.value && setMonth(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, 1)), "aria-label": "Mes siguiente" }, "→")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setYear(year - 1), "aria-label": "Año anterior" }, "←"), /* @__PURE__ */ React.createElement("span", { className: "axis-display", style: { fontSize: 22, fontWeight: 700 } }, year), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setYear(year + 1), "aria-label": "Año siguiente" }, "→")), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 12, fontSize: 13, color: C_MUTED } }, "Ventas:"), /* @__PURE__ */ React.createElement(Seg, { value: estado, onChange: setEstado, options: [["fin", "Cobradas"], ["pen", "Pendientes"], ["todos", "Todas"]] })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, role: "tablist", "aria-label": "Persona" }, ["__equipo__", ...keys].map((k) => {
    const on = sel === k;
    const p = k === "__equipo__" ? { short: "Todo el equipo", color: C_INK } : P(k);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: k,
        role: "tab",
        "aria-selected": on,
        className: "axis-btn ghost",
        onClick: () => setSel(k),
        style: { padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6, borderColor: on ? C_INK : "#C9D2CD", background: on ? C_INK : "#fff", color: on ? "#fff" : C_INK }
      },
      k !== "__equipo__" && /* @__PURE__ */ React.createElement(Swatch, { color: p.color }),
      p.short
    );
  })), keys.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { ...card, border: "1px dashed #C9D2CD", textAlign: "center", color: C_MUTED, padding: 40 } }, "No hay ventas ni sesiones en ", etiquetaPeriodo, ". Pulsa «Sincronizar ahora» en la pestaña Sesiones si acabas de abrir el panel."), keys.length > 0 && sel === "__equipo__" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Resumen del equipo · ", etiquetaPeriodo), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 12, color: C_MUTED } }, "Pulsa una persona para ver su detalle completo."), /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 760 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Persona"), /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left", width: "22%" } }, "Facturado"), /* @__PURE__ */ React.createElement("th", { style: th }, "Ventas"), /* @__PURE__ */ React.createElement("th", { style: th }, "Sesiones vendidas"), /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left", width: "18%" } }, "Sesiones impartidas"), /* @__PURE__ */ React.createElement("th", { style: th }, "Horas"), /* @__PURE__ */ React.createElement("th", { style: th }, "Asistencias"), /* @__PURE__ */ React.createElement("th", { style: th }, "Programadas"))), /* @__PURE__ */ React.createElement("tbody", null, keys.map((k) => {
    const s = stats[k], p = P(k);
    return /* @__PURE__ */ React.createElement("tr", { key: k, style: { cursor: "pointer" }, onClick: () => setSel(k) }, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(Swatch, { color: p.color }), p.name)), /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 82px", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { background: C_SOFT, borderRadius: 4, height: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: s.importe / maxImp * 100 + "%", height: "100%", background: p.color, borderRadius: 4, minWidth: s.importe ? 3 : 0 } })), /* @__PURE__ */ React.createElement("b", { style: { textAlign: "right" } }, eur0(s.importe)))), /* @__PURE__ */ React.createElement("td", { style: td }, s.nVentas || "–"), /* @__PURE__ */ React.createElement("td", { style: td }, s.sesVendidas || "–"), /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 34px", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { background: C_SOFT, borderRadius: 4, height: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: s.nSes / maxSes * 100 + "%", height: "100%", background: p.color, borderRadius: 4, minWidth: s.nSes ? 3 : 0 } })), /* @__PURE__ */ React.createElement("b", { style: { textAlign: "right" } }, s.nSes || "–"))), /* @__PURE__ */ React.createElement("td", { style: td }, s.min ? horas(s.min) : "–"), /* @__PURE__ */ React.createElement("td", { style: td }, s.asist || "–"), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: C_MUTED } }, s.nProg || "–"));
  }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, "Total"), /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 800, borderTop: `2px solid ${C_INK}` } }, eur0(totalImporte)), ["nVentas", "sesVendidas", "nSes"].map((f) => /* @__PURE__ */ React.createElement("td", { key: f, style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}`, textAlign: f === "nSes" ? "left" : "right" } }, keys.reduce((a, k) => a + stats[k][f], 0))), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, horas(keys.reduce((a, k) => a + stats[k].min, 0))), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, keys.reduce((a, k) => a + stats[k].asist, 0)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}`, color: C_MUTED } }, keys.reduce((a, k) => a + stats[k].nProg, 0)))))), prodList.length > 0 && /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Productos vendidos por persona"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 12, color: C_MUTED } }, "Número de ventas de cada producto (", estado === "fin" ? "cobradas" : estado === "pen" ? "pendientes" : "cobradas y pendientes", ")."), /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 520 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Producto"), ventasKeys.map((k) => /* @__PURE__ */ React.createElement(PersonHead, { key: k, k })), /* @__PURE__ */ React.createElement("th", { style: th }, "Total"))), /* @__PURE__ */ React.createElement("tbody", null, prodList.map((r, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: r.familia + r.nombre }, (i === 0 || prodList[i - 1].familia !== r.familia) && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: ventasKeys.length + 2, style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textTransform: "uppercase", letterSpacing: ".05em" } }, r.familia)), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 600 } }, r.nombre), ventasKeys.map((k) => /* @__PURE__ */ React.createElement("td", { key: k, style: { ...td, textAlign: "center", color: r.por[k] ? C_INK : "#C4CDC8" } }, r.por[k] || "–")), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700 } }, r.n))))))), tipoList.length > 0 && /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Sesiones impartidas por persona"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 12, color: C_MUTED } }, "Sesiones del calendario ya realizadas, por tipo. El detalle de formato (1 a 1, 2 a 1, grupo) y duración está en la ficha de cada persona."), /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 520 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Tipo de sesión"), sesKeys.map((k) => /* @__PURE__ */ React.createElement(PersonHead, { key: k, k })), /* @__PURE__ */ React.createElement("th", { style: th }, "Total"))), /* @__PURE__ */ React.createElement("tbody", null, tipoList.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.tipo }, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 600 } }, r.tipo), sesKeys.map((k) => /* @__PURE__ */ React.createElement("td", { key: k, style: { ...td, textAlign: "center", color: r.por[k] ? C_INK : "#C4CDC8" } }, r.por[k] || "–")), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700 } }, r.n))))))), sel === "__equipo__" && /* @__PURE__ */ React.createElement(ValorEquipo, { valor, P, etiquetaPeriodo }), sel !== "__equipo__" && stats[sel] && (() => {
    const s = stats[sel], p = P(sel);
    const ventas = Object.values(s.ventas).sort((a, b) => famRank(a.familia) - famRank(b.familia) || b.importe - a.importe);
    const tipos = Object.values(s.tipos).sort((a, b) => b.n - a.n || b.prog - a.prog);
    const familias = [...new Set(ventas.map((v) => v.familia))];
    const kpi = (label, value, sub) => /* @__PURE__ */ React.createElement("div", { style: { minWidth: 110 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, label), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 28, fontWeight: 700, lineHeight: 1.1 } }, value), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C_MUTED } }, sub));
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { style: { ...card, borderLeft: `6px solid ${p.color}` } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, p.name, " · ", etiquetaPeriodo), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 28, flexWrap: "wrap", marginTop: 10 } }, kpi("Facturado", eur0(s.importe), totalImporte ? `${pct0(s.importe / totalImporte)} del equipo` : null), kpi("Ventas", s.nVentas, s.nVentas ? `ticket medio ${eur0(s.importe / s.nVentas)}` : null), kpi("Sesiones vendidas", s.sesVendidas || "–", "incluidas en lo vendido"), kpi("Sesiones impartidas", s.nSes, s.nProg ? `+ ${s.nProg} programadas` : null), kpi("Horas", s.min ? horas(s.min) : "–"), kpi("Clientes distintos", s.clientes.size || "–", s.asist ? `${s.asist} asistencias` : null))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", alignItems: "start" } }, /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Productos vendidos"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 12, color: C_MUTED } }, "Según «Creado por» en AimHarder · ", estado === "fin" ? "cobradas" : estado === "pen" ? "pendientes" : "cobradas y pendientes"), ventas.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C_MUTED, margin: 0 } }, "Sin ventas en ", etiquetaPeriodo, ".") : /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Producto"), /* @__PURE__ */ React.createElement("th", { style: th }, "Ventas"), /* @__PURE__ */ React.createElement("th", { style: th }, "Sesiones"), /* @__PURE__ */ React.createElement("th", { style: th }, "Importe"))), /* @__PURE__ */ React.createElement("tbody", null, familias.map((fam) => {
      const vs = ventas.filter((v) => v.familia === fam);
      const sub = vs.reduce((a, v) => ({ n: a.n + v.n, imp: a.imp + v.importe, ses: a.ses + v.sesiones }), { n: 0, imp: 0, ses: 0 });
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: fam }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textTransform: "uppercase", letterSpacing: ".05em" } }, fam), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textAlign: "right" } }, sub.n), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textAlign: "right" } }, sub.ses || ""), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textAlign: "right" } }, eur0(sub.imp))), vs.map((v) => /* @__PURE__ */ React.createElement("tr", { key: v.nombre }, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", paddingLeft: 18 } }, v.nombre), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700 } }, v.n), /* @__PURE__ */ React.createElement("td", { style: td }, v.sesionesConocidas && v.sesiones ? v.sesiones : "–"), /* @__PURE__ */ React.createElement("td", { style: td }, eur0(v.importe)))));
    }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, "Total"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, s.nVentas), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, s.sesVendidas || "–"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 800, borderTop: `2px solid ${C_INK}` } }, eur0(s.importe)))))), /* @__PURE__ */ React.createElement("section", { style: { ...card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: h2s }, "Sesiones impartidas"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 12, color: C_MUTED } }, "Del calendario de AimHarder · por tipo, formato y duración"), tipos.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C_MUTED, margin: 0 } }, "Sin sesiones en ", etiquetaPeriodo, ".") : /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...th, textAlign: "left" } }, "Tipo · formato"), /* @__PURE__ */ React.createElement("th", { style: th }, "Duración"), /* @__PURE__ */ React.createElement("th", { style: th }, "Hechas"), /* @__PURE__ */ React.createElement("th", { style: th }, "Asist."), /* @__PURE__ */ React.createElement("th", { style: th }, "Ocupación"), /* @__PURE__ */ React.createElement("th", { style: th }, "Programadas"))), /* @__PURE__ */ React.createElement("tbody", null, tipos.map((t) => {
      const filas = Object.values(t.filas).sort((a, b) => b.n - a.n || b.prog - a.prog);
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: t.tipo }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textTransform: "uppercase", letterSpacing: ".05em" } }, t.tipo), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textAlign: "right" } }, t.min ? horas(t.min) : ""), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textAlign: "right" } }, t.n), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textAlign: "right" } }, t.asist || ""), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 10px 4px", fontSize: 11, fontWeight: 700, color: C_MUTED, textAlign: "right" } }, t.prog || "")), filas.map((f) => /* @__PURE__ */ React.createElement("tr", { key: f.formato + f.dur }, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", paddingLeft: 18 } }, f.formato), /* @__PURE__ */ React.createElement("td", { style: td }, f.dur, " min"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700 } }, f.n || "–"), /* @__PURE__ */ React.createElement("td", { style: td }, f.asist || "–"), /* @__PURE__ */ React.createElement("td", { style: td, title: f.plazas ? `${f.asist} de ${f.plazas} plazas ocupadas` : void 0 }, f.plazas ? pct0(f.asist / f.plazas) : "–"), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: C_MUTED } }, f.prog || "–"))));
    }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, textAlign: "left", fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, "Total"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, s.min ? horas(s.min) : "–"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, s.nSes), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}` } }, s.asist || "–"), /* @__PURE__ */ React.createElement("td", { style: { ...td, borderTop: `2px solid ${C_INK}` } }), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${C_INK}`, color: C_MUTED } }, s.nProg || "–")))))));
  })(), sel !== "__equipo__" && /* @__PURE__ */ React.createElement(ValorPersona, { v: valor[sel], p: P(sel), P, etiquetaPeriodo, rows: ledger.filter((r) => (r.date || "").startsWith(prefix)), k: sel }), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: 12, color: C_MUTED } }, "Ventas: se atribuyen a quien registró el cobro en AimHarder («Creado por»); lo creado por la cuenta del centro o el administrador va a Axis. Sesiones: se atribuyen al coach de la sesión en el calendario. «2 a 1» = 2 clientes con un mismo profesional."));
}

function AxisPanel() {
  const [coaches, setCoaches] = useState(DEFAULT_COACHES);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [sessions, setSessions] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState("horario");
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState({});
  const [sendState, setSendState] = useState({ status: "idle", msg: "" });
  const [importError, setImportError] = useState("");
  const [nowMin, setNowMin] = useState(() => {
    const d = /* @__PURE__ */ new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [payments, setPayments] = useState([]);
  const [payFilter, setPayFilter] = useState("fin");
  const [autoSyncUrl, setAutoSyncUrl] = useState("");
  const [autoSyncState, setAutoSyncState] = useState({ status: "idle", msg: "" });
  useEffect(() => {
    (async () => {
      const savedCoaches = await loadKey("axis-coaches", DEFAULT_COACHES);
      const faltan = DEFAULT_COACHES.filter((d) => !savedCoaches.some((c) => c.id === d.id));
      setCoaches(faltan.length ? [...savedCoaches, ...faltan] : savedCoaches);
      setRooms(await loadKey("axis-rooms", DEFAULT_ROOMS));
      setSessions(await loadKey("axis-sessions", []));
      const storedPay = await loadKey("axis-payments", null);
      setPayments(storedPay && storedPay.length ? storedPay : PAYMENTS_SEED);
      setAutoSyncUrl(await loadKey("axis-autosync-url", ""));
      setLoaded(true);
    })();
    const t = setInterval(() => {
      const d = /* @__PURE__ */ new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }, 6e4);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (loaded) saveKey("axis-coaches", coaches);
  }, [coaches, loaded]);
  useEffect(() => {
    if (loaded) saveKey("axis-rooms", rooms);
  }, [rooms, loaded]);
  useEffect(() => {
    if (loaded) saveKey("axis-sessions", sessions);
  }, [sessions, loaded]);
  useEffect(() => {
    if (loaded) saveKey("axis-payments", payments);
  }, [payments, loaded]);
  useEffect(() => {
    if (loaded && autoSyncUrl) saveKey("axis-autosync-url", autoSyncUrl);
  }, [autoSyncUrl, loaded]);
  async function handleAutoSync(silent) {
    if (!autoSyncUrl.trim()) return;
    if (!silent) setAutoSyncState({ status: "sync", msg: "Descargando datos actualizados\u2026" });
    try {
      const res = await fetch(`${autoSyncUrl.trim()}${autoSyncUrl.includes("?") ? "&" : "?"}_=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      let json = raw;
      if (raw && raw.files && raw.files["axis-sessions.json"] && typeof raw.files["axis-sessions.json"].content === "string") {
        json = JSON.parse(raw.files["axis-sessions.json"].content);
      }
      const daysObj = json.days || {};
      let allRecords = [];
      for (const [d, records] of Object.entries(daysObj)) {
        allRecords = allRecords.concat(parseAimHarder(records, d, coaches, rooms));
      }
      setSessions((prev) => {
        const oldById = new Map(prev.map((s) => [s.id, s]));
        const nuevos = allRecords.map((s) => {
          const old = oldById.get(s.id);
          if (!old) return s;
          const kept = {};
          for (const k of old.manualKeys || []) if (k in old) kept[k] = old[k];
          return { ...s, sent: old.sent, manualKeys: old.manualKeys, ...kept };
        });
        const nuevosIds = new Set(nuevos.map((s) => s.id));
        const fechasSincronizadas = new Set(Object.keys(daysObj));
        const restantes = prev.filter(
          (s) => !nuevosIds.has(s.id) && (!fechasSincronizadas.has(s.date) || s.manualCreated)
        );
        return [...restantes, ...nuevos];
      });

      // Pagos: reemplazo COMPLETO en cada sincronización (a diferencia de
      // las sesiones, aquí no hay ediciones manuales que proteger). Así,
      // si borras un pago en AimHarder, en la siguiente sincronización
      // deja de aparecer también en el panel.
      let nPagos = 0;
      if (json.payments) {
        const parsedPayments = parseAimHarderPayments(json.payments);
        nPagos = parsedPayments.length;
        // Solo reemplazamos si vienen pagos de verdad. Si llegan 0, casi
        // siempre significa que la descarga falló en el script — en ese caso
        // conservamos los que ya teníamos en vez de dejar el panel a cero.
        if (nPagos > 0) {
          setPayments(parsedPayments);
        } else {
          console.warn("Sincronización sin pagos: se conservan los anteriores.");
        }
      }

      setAutoSyncState({
        status: "done",
        msg: `\xDAltima sincronizaci\xF3n: ${(/* @__PURE__ */ new Date()).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} \xB7 ${allRecords.length} sesi\xF3n(es)${nPagos ? ` \xB7 ${nPagos} pago(s)` : ""} cargados.`
      });
    } catch (e) {
      setAutoSyncState({ status: "error", msg: `No se pudo leer la URL de sincronizaci\xF3n (${e.message}). Comprueba que la has pegado bien.` });
    }
  }
  useEffect(() => {
    if (loaded && autoSyncUrl.trim()) handleAutoSync(true);
  }, [loaded]);
  const payStats = useMemo(() => {
    // El titular se recalcula desde el "Creado por" original (cr), así la regla
    // Axis/Marc se aplica también a pagos guardados en el navegador antes del cambio.
    const inMonth = payments.filter((p) => (p.d || "").startsWith(month)).map((p) => ({ ...p, c: personKeyOfPayment(p) }));
    const filtered = payFilter === "todos" ? inMonth : inMonth.filter((p) => p.st === payFilter);
    const cols = [...new Set(filtered.map((p) => p.c))].sort(
      (a, b) => (CREATOR_ORDER.indexOf(a) + 1 || 99) - (CREATOR_ORDER.indexOf(b) + 1 || 99)
    );
    const cats = /* @__PURE__ */ new Set();
    const matrix = {};
    const totals = {};
    for (const p of filtered) {
      cats.add(p.cat);
      matrix[p.cat] = matrix[p.cat] || {};
      const cell = matrix[p.cat][p.c] = matrix[p.cat][p.c] || { amt: 0, n: 0 };
      cell.amt += p.amt;
      cell.n += 1;
      const t = totals[p.c] = totals[p.c] || { amt: 0, n: 0 };
      t.amt += p.amt;
      t.n += 1;
    }
    const orderedCats = [
      ...PRODUCT_ORDER.filter((c) => cats.has(c)),
      ...[...cats].filter((c) => !PRODUCT_ORDER.includes(c)).sort()
    ];
    const sumFin = inMonth.filter((p) => p.st === "fin").reduce((a, p) => a + p.amt, 0);
    const sumPen = inMonth.filter((p) => p.st === "pen").reduce((a, p) => a + p.amt, 0);
    const grand = filtered.reduce((a, p) => a + p.amt, 0);
    return { cols, matrix, totals, orderedCats, sumFin, sumPen, grand, nFin: inMonth.filter((p) => p.st === "fin").length, nPen: inMonth.filter((p) => p.st === "pen").length, n: filtered.length };
  }, [payments, month, payFilter]);
  const daySessions = useMemo(
    () => sessions.filter((s) => s.date === date).sort((a, b) => toMin(a.start) - toMin(b.start)),
    [sessions, date]
  );
  const coachOf = (s) => coaches.find((c) => c.id === s.coachId);
  const colorOf = (s) => {
    var _a;
    return ((_a = coachOf(s)) == null ? void 0 : _a.color) || UNKNOWN_COLOR;
  };
  const capacityBadge = (s) => {
    if (typeof s.capacity !== "number" || s.capacity <= 0) return null;
    const total = s.capacity;
    const booked = Math.min(s.booked || 0, total);
    const free = total - booked;
    const isFull = free <= 0;
    const isLast = !isFull && free === 1;
    const MAX_DOTS = 8;
    const dots = total <= MAX_DOTS ? Array.from({ length: total }, (_, i) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: i,
        style: {
          width: 8,
          height: 8,
          borderRadius: "50%",
          display: "inline-block",
          background: i < booked ? "#fff" : "transparent",
          border: "1.5px solid rgba(255,255,255,0.9)"
        }
      }
    )) : null;
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" } }, dots ? /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", gap: 3 } }, dots) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700 } }, `${booked}/${total}`), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontSize: 10,
          fontWeight: 800,
          padding: "1px 6px",
          borderRadius: 8,
          textTransform: "uppercase",
          letterSpacing: 0.3,
          color: "#fff",
          background: isFull ? "#7F1D1D" : isLast ? "#92400E" : "rgba(255,255,255,0.28)"
        }
      },
      isFull ? "Completa" : `${free} libre${free === 1 ? "" : "s"}`
    ));
  };
  const monthStats = useMemo(() => {
    const monthSessions = sessions.filter((s) => (s.date || "").startsWith(month));
    const colIds = [...coaches.map((c) => c.id)];
    const hasUnassigned = monthSessions.some((s) => !s.coachId || !coaches.find((c) => c.id === s.coachId));
    if (hasUnassigned) colIds.push("__none__");
    const cats = /* @__PURE__ */ new Set();
    const matrix = {};
    const totalsByCoach = {};
    for (const s of monthSessions) {
      const cat = categorize(s.title);
      cats.add(cat);
      const col = coaches.find((c) => c.id === s.coachId) ? s.coachId : "__none__";
      matrix[cat] = matrix[cat] || {};
      matrix[cat][col] = (matrix[cat][col] || 0) + 1;
      totalsByCoach[col] = (totalsByCoach[col] || 0) + 1;
    }
    const orderedCats = [
      ...PRODUCT_ORDER.filter((c) => cats.has(c)),
      ...[...cats].filter((c) => !PRODUCT_ORDER.includes(c)).sort()
    ];
    return { total: monthSessions.length, colIds, matrix, totalsByCoach, orderedCats, hasUnassigned };
  }, [sessions, month, coaches]);
  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const selectedSessions = daySessions.filter((s) => selectedIds.includes(s.id));
  function handleSend(toSend) {
    if (!toSend.length) return;
    try {
      const porCoach = /* @__PURE__ */ new Map();
      const sinCoach = [];
      for (const s of toSend) {
        const c = coachOf(s);
        if (c) {
          if (!porCoach.has(c.id)) porCoach.set(c.id, []);
          porCoach.get(c.id).push(s);
        } else {
          sinCoach.push(s);
        }
      }
      let descargados = 0;
      const sinEmail = [];
      let i = 0;
      for (const [coachId, ses] of porCoach) {
        const c = coaches.find((x) => x.id === coachId);
        if (!(c == null ? void 0 : c.email)) {
          sinEmail.push((c == null ? void 0 : c.name) || coachId);
          continue;
        }
        const slug = stripAccents(c.name).replace(/\s+/g, "-");
        setTimeout(() => downloadIcs(ses, coaches, rooms, `axis-${slug}-${date}.ics`), i * 400);
        descargados += ses.length;
        i++;
      }
      const ids = new Set(toSend.filter((s) => {
        const c = coachOf(s);
        return c && c.email;
      }).map((s) => s.id));
      setSessions((prev) => prev.map((s) => ids.has(s.id) ? { ...s, sent: true } : s));
      setSelected({});
      const partes = [];
      if (descargados) partes.push(`Descargado un archivo por coach: al abrir cada uno, su calendario invita SOLO a ese coach a sus sesiones (${descargados} en total).`);
      if (sinEmail.length) partes.push(`Sin email configurado (no se gener\xF3 archivo): ${sinEmail.join(", ")} \u2014 a\xF1\xE1delo en la pesta\xF1a Equipo.`);
      if (sinCoach.length) partes.push(`${sinCoach.length} sesi\xF3n(es) sin coach asignado se han omitido.`);
      setSendState({ status: descargados ? "done" : "error", msg: partes.join(" ") || "Nada que enviar." });
    } catch (e) {
      setSendState({ status: "error", msg: "Error al generar los archivos de calendario: " + e.message });
    }
  }
  function addManual() {
    const s = {
      id: uid(),
      date,
      start: "09:00",
      end: "10:00",
      roomId: rooms[0].id,
      coachId: coaches[0].id,
      title: "Sesi\xF3n individual",
      client: "",
      sent: false,
      coachRaw: "",
      roomRaw: "",
      manualCreated: true
    };
    setSessions((p) => [...p, s]);
    setTab("sesiones");
  }
  const updateSession = (id, patch) => setSessions((p) => p.map((s) => {
    if (s.id !== id) return s;
    const manualKeys = [.../* @__PURE__ */ new Set([...s.manualKeys || [], ...Object.keys(patch)])];
    return { ...s, ...patch, manualKeys };
  }));
  const deleteSession = (id) => setSessions((p) => p.filter((s) => s.id !== id));
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap');
    .axis-root { font-family:'Barlow',system-ui,sans-serif; background:#F2F4F3; min-height:100vh; color:#12211B; }
    .axis-display { font-family:'Barlow Condensed','Barlow',sans-serif; letter-spacing:.02em; }
    .axis-tab { white-space:nowrap; flex:none; border:none; background:transparent; padding:10px 14px; font:600 14px 'Barlow'; color:#5A6B63; cursor:pointer; border-bottom:3px solid transparent; }
    .axis-tab.on { color:#12211B; border-bottom-color:#12211B; }
    .axis-btn { border:none; border-radius:8px; padding:9px 14px; font:600 13px 'Barlow'; cursor:pointer; }
    .axis-btn:focus-visible, .axis-tab:focus-visible { outline:2px solid #2563EB; outline-offset:2px; }
    .axis-btn.primary { background:#12211B; color:#fff; }
    .axis-btn.ghost { background:#fff; color:#12211B; border:1px solid #C9D2CD; }
    .axis-btn:disabled { opacity:.45; cursor:not-allowed; }
    input, select, textarea { font-family:'Barlow',sans-serif; }
    .axis-input { border:1px solid #C9D2CD; border-radius:6px; padding:7px 9px; font-size:13px; background:#fff; width:100%; box-sizing:border-box; }
    .sess-block { position:absolute; left:4px; right:4px; border-radius:8px; padding:6px 8px; color:#fff; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.18); cursor:pointer; transition:transform .08s; }
    .sess-block:hover { transform:scale(1.012); }
    @media (prefers-reduced-motion: reduce) { .sess-block { transition:none; } .sess-block:hover { transform:none; } }
  `;
  const totalH = (DAY_END - DAY_START) * 60 * PX_PER_MIN;
  const hours = [];
  for (let h = DAY_START; h <= DAY_END; h++) hours.push(h);
  const coachName = (s) => {
    var _a;
    return ((_a = coachOf(s)) == null ? void 0 : _a.name) || s.coachRaw || "\xBFCoach?";
  };
  return /* @__PURE__ */ React.createElement("div", { className: "axis-root" }, /* @__PURE__ */ React.createElement("style", null, css), /* @__PURE__ */ React.createElement("header", { style: { background: "#12211B", color: "#fff", padding: "18px 22px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("h1", { className: "axis-display", style: { margin: 0, fontSize: 30, fontWeight: 700, textTransform: "uppercase" } }, "Axis \xB7 Panel de salas"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#9DB4A9" } }, "Horarios por sala \xB7 exporta a Google Calendar / Outlook")), /* @__PURE__ */ React.createElement("nav", { style: { marginTop: 10, display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch" } }, [["horario", "Horario"], ["sesiones", "Sincronizaci\xF3n"], ["stats", "Resumen mensual"], ["objetivos", "Objetivos"], ["personas", "Por persona"], ["equipo", "Equipo y salas"]].map(([id, label]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: id,
      className: `axis-tab ${tab === id ? "on" : ""}`,
      style: { color: tab === id ? "#fff" : "#9DB4A9", borderBottomColor: tab === id ? "#7CC98F" : "transparent" },
      onClick: () => setTab(id)
    },
    label
  )))), (tab === "horario" || tab === "sesiones") && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setDate(shiftDay(date, -1)), "aria-label": "D\xEDa anterior" }, "\u2190"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "axis-input", style: { width: 150 }, value: date, onChange: (e) => setDate(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setDate(shiftDay(date, 1)), "aria-label": "D\xEDa siguiente" }, "\u2192"), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setDate(todayISO()) }, "Hoy"), /* @__PURE__ */ React.createElement("span", { className: "axis-display", style: { fontSize: 18, fontWeight: 600, textTransform: "capitalize" } }, fmtDateHuman(date)), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 13, color: "#5A6B63" } }, daySessions.length, " sesi\xF3n(es)")), sendState.status !== "idle" && /* @__PURE__ */ React.createElement("div", { style: {
    margin: "0 22px 12px",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    background: sendState.status === "error" ? "#FDE8E8" : sendState.status === "done" ? "#E5F4E9" : "#EEF2FF",
    color: sendState.status === "error" ? "#9B1C1C" : "#1F3A2A"
  } }, sendState.status === "sending" ? "\u23F3 " : sendState.status === "done" ? "\u2705 " : "\u26A0\uFE0F ", sendState.msg, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { marginLeft: 10, padding: "2px 8px" }, onClick: () => setSendState({ status: "idle", msg: "" }) }, "Cerrar")), tab === "horario" && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" } }, coaches.map((c) => /* @__PURE__ */ React.createElement("span", { key: c.id, style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 12, height: 12, borderRadius: 3, background: c.color, display: "inline-block" } }), c.name)), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: addManual }, "+ A\xF1adir sesi\xF3n"), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "axis-btn primary",
      disabled: !daySessions.length || sendState.status === "sending",
      onClick: () => handleSend(daySessions.filter((s) => !s.sent))
    },
    "Descargar .ics del d\xEDa (",
    daySessions.filter((s) => !s.sent).length,
    ")"
  ))), !daySessions.length ? /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px dashed #C9D2CD", borderRadius: 12, padding: 40, textAlign: "center", color: "#5A6B63" } }, "No hay sesiones para este d\xEDa. Pulsa \xABSincronizar ahora\xBB en la pesta\xF1a ", /* @__PURE__ */ React.createElement("b", null, "Sincronizaci\xF3n"), " o a\xF1ade una sesi\xF3n manual.") : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: `56px repeat(${rooms.length}, 1fr)`, background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "2px solid #12211B" } }), rooms.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, className: "axis-display", style: { padding: "10px 12px", fontSize: 18, fontWeight: 700, textTransform: "uppercase", borderBottom: "2px solid #12211B", borderLeft: "1px solid #EDF1EF" } }, r.name, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "Barlow", fontSize: 12, fontWeight: 500, color: "#5A6B63", marginLeft: 8 } }, daySessions.filter((s) => s.roomId === r.id).length, " sesiones"))), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: totalH } }, hours.map((h) => /* @__PURE__ */ React.createElement("div", { key: h, style: { position: "absolute", top: (h - DAY_START) * 60 * PX_PER_MIN - 7, right: 8, fontSize: 11, color: "#8A978F" } }, pad(h), ":00"))), rooms.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: { position: "relative", height: totalH, borderLeft: "1px solid #EDF1EF" } }, hours.map((h) => /* @__PURE__ */ React.createElement("div", { key: h, style: { position: "absolute", top: (h - DAY_START) * 60 * PX_PER_MIN, left: 0, right: 0, borderTop: "1px solid #EDF1EF" } })), date === todayISO() && nowMin >= DAY_START * 60 && nowMin <= DAY_END * 60 && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: (nowMin - DAY_START * 60) * PX_PER_MIN, left: 0, right: 0, borderTop: "2px solid #E11D48", zIndex: 3 } }), daySessions.filter((s) => s.roomId === r.id).map((s) => {
    const top = Math.max(0, (toMin(s.start) - DAY_START * 60) * PX_PER_MIN);
    const h = Math.max(26, (toMin(s.end) - toMin(s.start)) * PX_PER_MIN - 2);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: s.id,
        className: "sess-block",
        role: "button",
        tabIndex: 0,
        style: { top, height: h, background: colorOf(s), opacity: s.sent ? 0.85 : 1 },
        title: `${s.title} \xB7 ${coachName(s)} \xB7 ${s.start}\u2013${s.end}${s.client ? " \xB7 " + s.client : ""}`,
        onClick: () => {
          setSelected((p) => ({ ...p, [s.id]: !p[s.id] }));
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, display: "flex", justifyContent: "space-between", gap: 6 } }, /* @__PURE__ */ React.createElement("span", null, coachName(s)), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500 } }, s.start, "\u2013", s.end, " ", s.sent ? "\u{1F4C5}" : "", selected[s.id] ? " \u2611" : "")),
      h > 40 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.9, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" } }, s.title, s.client ? ` \xB7 ${s.client}` : ""),
      h > 40 && capacityBadge(s)
    );
  })))), selectedSessions.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13 } }, selectedSessions.length, " sesi\xF3n(es) seleccionada(s) (toca los bloques para seleccionar)"), /* @__PURE__ */ React.createElement("button", { className: "axis-btn primary", disabled: sendState.status === "sending", onClick: () => handleSend(selectedSessions) }, "Descargar .ics de la selecci\xF3n"), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setSelected({}) }, "Quitar selecci\xF3n"))), tab === "sesiones" && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18 } }, /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "2px solid #12211B", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, "Sincronizaci\xF3n autom\xE1tica"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 13, color: "#5A6B63" } }, "Pega aqu\xED la URL que te da el script ", /* @__PURE__ */ React.createElement("code", null, "sync_axis.py"), " una sola vez. A partir de ah\xED, cada vez que abras este panel se actualizar\xE1n solas las sesiones Y los pagos (pesta\xF1a Resumen mensual), sin copiar ni pegar nada m\xE1s. Si borras algo en AimHarder, tambi\xE9n desaparece de aqu\xED en la siguiente sincronizaci\xF3n."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      style: { flex: 1, minWidth: 260 },
      placeholder: "https://api.github.com/gists/xxxxxxxxxxxx",
      value: autoSyncUrl,
      onChange: (e) => setAutoSyncUrl(e.target.value)
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "axis-btn primary", onClick: () => handleAutoSync(false), disabled: !autoSyncUrl.trim() || autoSyncState.status === "sync" }, autoSyncState.status === "sync" ? "Sincronizando\u2026" : "Sincronizar ahora")), autoSyncState.status !== "idle" && /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10, fontSize: 13, color: autoSyncState.status === "error" ? "#9B1C1C" : "#1F3A2A" } }, autoSyncState.status === "sync" ? "\u23F3 " : autoSyncState.status === "done" ? "\u2705 " : "\u26A0\uFE0F ", autoSyncState.msg)), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: 0, fontSize: 20, textTransform: "uppercase" } }, "Sesiones del ", fmtDateHuman(date)), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: addManual }, "+ A\xF1adir")), !daySessions.length && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#5A6B63" } }, "Sin sesiones este d\xEDa."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 8, marginTop: 10 } }, daySessions.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.id, style: { display: "grid", gridTemplateColumns: "70px 70px 1fr 1fr 1fr 1fr 60px", gap: 6, alignItems: "center", fontSize: 13 } }, /* @__PURE__ */ React.createElement("input", { className: "axis-input", type: "time", value: s.start, onChange: (e) => updateSession(s.id, { start: e.target.value }) }), /* @__PURE__ */ React.createElement("input", { className: "axis-input", type: "time", value: s.end, onChange: (e) => updateSession(s.id, { end: e.target.value }) }), /* @__PURE__ */ React.createElement("select", { className: "axis-input", value: s.coachId || "", onChange: (e) => updateSession(s.id, { coachId: e.target.value || null }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "(", s.coachRaw || "sin coach", ")"), coaches.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))), /* @__PURE__ */ React.createElement("select", { className: "axis-input", value: s.roomId, onChange: (e) => updateSession(s.id, { roomId: e.target.value }) }, rooms.map((r) => /* @__PURE__ */ React.createElement("option", { key: r.id, value: r.id }, r.name))), /* @__PURE__ */ React.createElement("input", { className: "axis-input", value: s.title, onChange: (e) => updateSession(s.id, { title: e.target.value }), placeholder: "Actividad" }), /* @__PURE__ */ React.createElement("input", { className: "axis-input", value: s.client || "", onChange: (e) => updateSession(s.id, { client: e.target.value }), placeholder: "Cliente" }), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => deleteSession(s.id), "aria-label": "Eliminar sesi\xF3n" }, "\u{1F5D1}")))))), tab === "stats" && (() => {
    const colName = (id) => {
      var _a;
      return id === "__none__" ? "Sin asignar" : ((_a = coaches.find((c) => c.id === id)) == null ? void 0 : _a.name) || id;
    };
    const colColor = (id) => {
      var _a;
      return id === "__none__" ? UNKNOWN_COLOR : ((_a = coaches.find((c) => c.id === id)) == null ? void 0 : _a.color) || UNKNOWN_COLOR;
    };
    const maxCoach = Math.max(1, ...Object.values(monthStats.totalsByCoach));
    const cell = { padding: "8px 10px", borderBottom: "1px solid #EDF1EF", fontSize: 13, textAlign: "center" };
    return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, -1)), "aria-label": "Mes anterior" }, "\u2190"), /* @__PURE__ */ React.createElement("input", { type: "month", className: "axis-input", style: { width: 160 }, value: month, onChange: (e) => setMonth(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, 1)), "aria-label": "Mes siguiente" }, "\u2192"), /* @__PURE__ */ React.createElement("span", { className: "axis-display", style: { fontSize: 20, fontWeight: 700, textTransform: "uppercase" } }, monthLabel(month)), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 13, color: "#5A6B63" } }, monthStats.total, " sesi\xF3n(es) en el panel este mes")), monthStats.total === 0 ? /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px dashed #C9D2CD", borderRadius: 12, padding: 40, textAlign: "center", color: "#5A6B63" } }, "No hay sesiones cargadas para ", monthLabel(month), ". El resumen cuenta las sesiones importadas o creadas en el panel.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 12px", fontSize: 20, textTransform: "uppercase" } }, "Sesiones por coach"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 8 } }, monthStats.colIds.map((id) => {
      const n = monthStats.totalsByCoach[id] || 0;
      if (!n) return null;
      return /* @__PURE__ */ React.createElement("div", { key: id, style: { display: "grid", gridTemplateColumns: "110px 1fr 46px", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, colName(id)), /* @__PURE__ */ React.createElement("div", { style: { background: "#EDF1EF", borderRadius: 6, height: 18, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${n / maxCoach * 100}%`, height: "100%", background: colColor(id), borderRadius: 6, minWidth: 6 } })), /* @__PURE__ */ React.createElement("span", { className: "axis-display", style: { fontSize: 18, fontWeight: 700, textAlign: "right" } }, n));
    }))), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 12px", fontSize: 20, textTransform: "uppercase" } }, "Desglose por tipo de producto"), /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 520 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...cell, textAlign: "left", borderBottom: "2px solid #12211B", fontSize: 12, color: "#5A6B63" } }, "Producto"), monthStats.colIds.map((id) => /* @__PURE__ */ React.createElement("th", { key: id, style: { ...cell, borderBottom: "2px solid #12211B" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: colColor(id), display: "inline-block" } }), colName(id)))), /* @__PURE__ */ React.createElement("th", { style: { ...cell, borderBottom: "2px solid #12211B", fontSize: 12 } }, "Total"))), /* @__PURE__ */ React.createElement("tbody", null, monthStats.orderedCats.map((cat) => {
      const row = monthStats.matrix[cat] || {};
      const rowTotal = Object.values(row).reduce((a, b) => a + b, 0);
      return /* @__PURE__ */ React.createElement("tr", { key: cat }, /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "left", fontWeight: 600 } }, cat), monthStats.colIds.map((id) => /* @__PURE__ */ React.createElement("td", { key: id, style: { ...cell, color: row[id] ? "#12211B" : "#C4CDC8" } }, row[id] || "\u2013")), /* @__PURE__ */ React.createElement("td", { style: { ...cell, fontWeight: 700 } }, rowTotal));
    }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "left", fontWeight: 700, borderTop: "2px solid #12211B" } }, "Total"), monthStats.colIds.map((id) => /* @__PURE__ */ React.createElement("td", { key: id, style: { ...cell, fontWeight: 700, borderTop: "2px solid #12211B" } }, monthStats.totalsByCoach[id] || 0)), /* @__PURE__ */ React.createElement("td", { style: { ...cell, fontWeight: 800, borderTop: "2px solid #12211B" } }, monthStats.total)))), monthStats.hasUnassigned && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#9B1C1C", marginBottom: 0 } }, 'Hay sesiones sin coach asignado: as\xEDgnalas en "Sincronizaci\xF3n" (Sesiones del d\xEDa) para que cuenten a su profesional.'), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#5A6B63", marginBottom: 0 } }, "El tipo de producto se detecta del nombre de la actividad (individual, pack 4/8, small group o grupo, online, valoraci\xF3n, fisio). Lo no reconocido aparece con su propio nombre."))), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: 0, fontSize: 20, textTransform: "uppercase" } }, "Facturaci\xF3n \xB7 pagos AimHarder"), /* @__PURE__ */ React.createElement("span", { style: { display: "flex", gap: 6, marginLeft: "auto" } }, [["fin", "Cobrados"], ["pen", "Pendientes"], ["todos", "Todos"]].map(([id, label]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: id,
        className: "axis-btn",
        onClick: () => setPayFilter(id),
        style: { padding: "5px 12px", background: payFilter === id ? "#12211B" : "#fff", color: payFilter === id ? "#fff" : "#12211B", border: "1px solid #C9D2CD" }
      },
      label
    )))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A6B63" } }, "Cobrado en ", monthLabel(month)), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 30, fontWeight: 700 } }, eur(payStats.sumFin)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A6B63" } }, payStats.nFin, " pago(s)")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A6B63" } }, "Pendiente de cobro"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 30, fontWeight: 700, color: payStats.sumPen > 0 ? "#B45309" : "#12211B" } }, eur(payStats.sumPen)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A6B63" } }, payStats.nPen, " pago(s)"))), payStats.n === 0 ? /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#5A6B63" } }, "No hay pagos ", payFilter === "fin" ? "cobrados" : payFilter === "pen" ? "pendientes" : "", " en ", monthLabel(month), ".") : /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 560 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { padding: "8px 10px", borderBottom: "2px solid #12211B", fontSize: 12, color: "#5A6B63", textAlign: "left" } }, "Producto"), payStats.cols.map((c) => {
      var _a;
      return /* @__PURE__ */ React.createElement("th", { key: c, style: { padding: "8px 10px", borderBottom: "2px solid #12211B", fontSize: 12, fontWeight: 700, textAlign: "right" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: c === "axis" ? AXIS_COLOR : ((_a = coaches.find((x) => x.id === c)) == null ? void 0 : _a.color) || "#3A4A42", display: "inline-block" } }), CREATOR_LABELS[c] || c));
    }), /* @__PURE__ */ React.createElement("th", { style: { padding: "8px 10px", borderBottom: "2px solid #12211B", fontSize: 12, textAlign: "right" } }, "Total"))), /* @__PURE__ */ React.createElement("tbody", null, payStats.orderedCats.map((cat) => {
      const row = payStats.matrix[cat] || {};
      const rowAmt = Object.values(row).reduce((a, x) => a + x.amt, 0);
      const rowN = Object.values(row).reduce((a, x) => a + x.n, 0);
      return /* @__PURE__ */ React.createElement("tr", { key: cat }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", borderBottom: "1px solid #EDF1EF", fontSize: 13, fontWeight: 600 } }, cat), payStats.cols.map((c) => /* @__PURE__ */ React.createElement("td", { key: c, style: { padding: "8px 10px", borderBottom: "1px solid #EDF1EF", fontSize: 13, textAlign: "right", color: row[c] ? "#12211B" : "#C4CDC8" } }, row[c] ? /* @__PURE__ */ React.createElement(React.Fragment, null, eur(row[c].amt), " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#5A6B63" } }, "(", row[c].n, ")")) : "\u2013")), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", borderBottom: "1px solid #EDF1EF", fontSize: 13, textAlign: "right", fontWeight: 700 } }, eur(rowAmt), " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#5A6B63" } }, "(", rowN, ")")));
    }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", borderTop: "2px solid #12211B", fontSize: 13, fontWeight: 700 } }, "Total"), payStats.cols.map((c) => {
      var _a, _b;
      return /* @__PURE__ */ React.createElement("td", { key: c, style: { padding: "8px 10px", borderTop: "2px solid #12211B", fontSize: 13, textAlign: "right", fontWeight: 700 } }, eur(((_a = payStats.totals[c]) == null ? void 0 : _a.amt) || 0), " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#5A6B63" } }, "(", ((_b = payStats.totals[c]) == null ? void 0 : _b.n) || 0, ")"));
    }), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", borderTop: "2px solid #12211B", fontSize: 13, textAlign: "right", fontWeight: 800 } }, eur(payStats.grand), " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#5A6B63" } }, "(", payStats.n, ")"))))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#5A6B63", marginBottom: 0 } }, '"Creado por" indica qui\xE9n registr\xF3 el cobro, no necesariamente qui\xE9n dio la sesi\xF3n. La columna "Axis" re\xFAne los pagos creados con la cuenta del centro (Axis Health & Performance) o por el administrador: son ingresos del centro y no se suman a Marc, igual que en el Excel del plan financiero.')));
  })(), tab === "objetivos" && /* @__PURE__ */ React.createElement(ObjetivosTab, { payments, coaches }), tab === "personas" && /* @__PURE__ */ React.createElement(PersonasTab, { payments, sessions, coaches, nowMin }), tab === "equipo" && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18, maxWidth: 760 } }, /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 4px", fontSize: 20, textTransform: "uppercase" } }, "Equipo"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 12px", fontSize: 13, color: "#5A6B63" } }, "El email es el que se a\xF1adir\xE1 como invitado dentro del archivo .ics. Sin email, el evento se genera igualmente pero sin invitado."), coaches.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: c.id, style: { display: "grid", gridTemplateColumns: "36px 110px 150px 1fr auto", gap: 8, alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "color",
      value: c.color,
      style: { width: 34, height: 34, border: "none", background: "none", cursor: "pointer" },
      onChange: (e) => setCoaches((p) => p.map((x, j) => j === i ? { ...x, color: e.target.value } : x)),
      "aria-label": `Color de ${c.name}`
    }
  ), /* @__PURE__ */ React.createElement("input", { className: "axis-input", value: c.name, onChange: (e) => setCoaches((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x)) }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#5A6B63" } }, c.role), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      type: "email",
      placeholder: "email@dominio.com",
      value: c.email,
      onChange: (e) => setCoaches((p) => p.map((x, j) => j === i ? { ...x, email: e.target.value } : x))
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { padding: "4px 8px", fontSize: 12 }, title: `Quitar a ${c.name}`, onClick: () => setCoaches((p) => p.filter((x, j) => j !== i)) }, "Quitar"))), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { marginTop: 4 }, onClick: () => setCoaches((p) => [...p, { id: uid(), name: "Nuevo coach", role: "Entrenador personal", color: "#6B7280", email: "" }]) }, "+ A\xF1adir coach")), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 12px", fontSize: 20, textTransform: "uppercase" } }, "Salas"), rooms.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: { marginBottom: 8, maxWidth: 260 } }, /* @__PURE__ */ React.createElement("input", { className: "axis-input", value: r.name, onChange: (e) => setRooms((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x)) }))))));
}
const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(/* @__PURE__ */ React.createElement(AxisPanel, null));
