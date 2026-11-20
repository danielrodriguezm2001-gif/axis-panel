/* Conexión del panel con la Caja de Axis (aplicación independiente, otra URL).
 *
 * La Caja (Supabase) es donde se registran los pagos de productos con su importe
 * real; el panel solo los LEE y se los pone a los pagos de AimHarder (que van a
 * 0 €): cada pago de la Caja se empareja con el de AimHarder del mismo cliente y
 * producto con la fecha más cercana (±7 días). Aquí solo se revisa ese emparejado.
 * Lo que no tenga pareja en AimHarder cuenta como ingreso, pero no cubre sesiones.
 *
 * Se carga ANTES de panel.js (que lo usa al pintar). Usa funciones de panel.js
 * (normName, productOf, catFromConcept, creatorId, todayISO) solo al ejecutarse.
 */
(function () {
  const URL_CAJA = "https://danielrodriguezm2001-gif.github.io/axis-caja/";
  const SB_URL = "https://jakvmfippiakvfgvzeam.supabase.co";
  const SB_KEY = "sb_publishable_OYbWV66QORfVoj0Gj0NqIw_mkPSgiYQ"; // clave pública: los permisos los da RLS
  const TOLERANCIA_DIAS = 7;
  const CACHE_KEY = "axis-caja-cache";
  const FORMAS = [["tarjeta", "Tarjeta"], ["efectivo", "Efectivo"], ["transferencia", "Transferencia"], ["domiciliado", "Domiciliado"], ["bizum", "Bizum"], ["otro", "Otro"]];
  const VENDEDORES = ["Marc", "Erik", "Daniel", "Sergio", "Martí", "Marina", "Axis"];
  const INK = "#12211B", MUTED = "#5A6B63", LINE = "#DDE4E0", SOFT = "#EDF1EF", BAD = "#9B1C1C", WARN = "#B45309", GOOD = "#1F3A2A";
  const h = React.createElement;
  const { useState, useEffect, useMemo, useRef, useCallback } = React;

  let sb = null;
  try {
    sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  } catch (e) {
    console.warn("Caja: no se pudo cargar Supabase", e);
  }

  const eur2 = (n) => (Number(n) || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const diasEntre = (a, b) => Math.abs((Date.parse(a) - Date.parse(b)) / 864e5);
  // Mismo nombre aunque cambie el orden ("García Ana" = "Ana García").
  const claveNombre = (s) => normName(s || "").split(" ").filter(Boolean).sort().join(" ");
  const claveProducto = (concepto) => {
    const pr = productOf(concepto, "");
    return pr.familia === "Otros" ? "otros:" + normName(String(concepto || "").replace(/\s*\d{1,2}\/\d{4}\s*$/, "")) : pr.nombre;
  };

  /* ---------- emparejado Caja <-> AimHarder ---------- */
  // raw: pagos del panel (AimHarder + externos). caja: filas de caja_pagos.
  // Devuelve { payments, info }: payments = raw con el importe de la Caja donde hay pareja.
  function aplicar(raw, caja) {
    const lista = (caja || []).filter((c) => c && c.fecha);
    const ah = raw.filter((p) => !p.ext);
    const porId = new Map(ah.map((p) => [String(p.id), p]));
    const usados = new Set();
    const pareja = new Map(); // id caja -> pago AimHarder
    for (const c of lista) {
      if (c.aimharder_pago_id && porId.has(String(c.aimharder_pago_id)) && !usados.has(String(c.aimharder_pago_id))) {
        usados.add(String(c.aimharder_pago_id));
        pareja.set(c.id, porId.get(String(c.aimharder_pago_id)));
      }
    }
    const sueltos = lista.filter((c) => !pareja.has(c.id) && !c.sin_aimharder && !c.aimharder_pago_id).sort((a, b) => a.fecha.localeCompare(b.fecha));
    for (const c of sueltos) {
      const cli = claveNombre(c.cliente_nombre), prod = claveProducto(c.concepto);
      let mejor = null, mejorD = Infinity;
      for (const p of ah) {
        if (usados.has(String(p.id)) || claveNombre(p.cl) !== cli || claveProducto(p.co) !== prod) continue;
        const d = Math.min(diasEntre(p.d, c.fecha), p.em ? diasEntre(p.em, c.fecha) : Infinity);
        if (d <= TOLERANCIA_DIAS && d < mejorD) { mejor = p; mejorD = d; }
      }
      if (mejor) { usados.add(String(mejor.id)); pareja.set(c.id, mejor); }
    }
    const cajaDePago = new Map([...pareja].map(([cid, p]) => [String(p.id), lista.find((c) => c.id === cid)]));
    const payments = raw.map((p) => {
      const c = cajaDePago.get(String(p.id));
      if (!c) return p;
      const cobrado = c.estado === "cobrado";
      return { ...p, amt: c.importe_cents / 100, d: c.fecha, st: cobrado ? "fin" : "pen", met: cobrado ? c.forma_pago : "", ...(c.vendedor ? { cr: c.vendedor, c: creatorId(c.vendedor) } : {}), caja: c.id };
    });
    const sinPareja = [];
    for (const c of lista) {
      if (pareja.has(c.id)) continue;
      if (!c.sin_aimharder) sinPareja.push(c);
      const cobrado = c.estado === "cobrado", v = c.vendedor || "Axis";
      // ext: true => no cubre sesiones de AimHarder (el panel ya lo respeta).
      payments.push({ id: "caja-" + c.id, cl: c.cliente_nombre, cat: catFromConcept(c.concepto), amt: c.importe_cents / 100, c: creatorId(v), cr: v, co: c.concepto, d: c.fecha, st: cobrado ? "fin" : "pen", met: cobrado ? c.forma_pago : "", em: c.fecha, ext: true, caja: c.id, nt: c.notas || "" });
    }
    const ceroSinCaja = ah.filter((p) => !usados.has(String(p.id)) && !(p.amt > 0));
    return { payments, info: { pareja, sinPareja, ceroSinCaja, candidatos: (c) => ah.filter((p) => claveNombre(p.cl) === claveNombre(c.cliente_nombre) && (!usados.has(String(p.id)) || String(c.aimharder_pago_id) === String(p.id))) } };
  }

  // Clave del panel: el identificador del Gist de la URL de sincronización guardada en este dispositivo.
  function clavePanel() {
    try {
      const m = String(JSON.parse(localStorage.getItem("axis-autosync-url") || '""')).match(/gists\/([0-9a-f]{20,40})/i);
      return m ? m[1] : "";
    } catch (e) { return ""; }
  }

  /* ---------- conexión: sesión, datos y tiempo real ---------- */
  function useCaja() {
    const [estado, setEstado] = useState(sb ? "cargando" : "error"); // cargando | sin-sesion | sin-acceso | ok | error
    const [error, setError] = useState(sb ? "" : "No se pudo cargar la librería de Supabase.");
    const [sesion, setSesion] = useState(null);
    const [rol, setRol] = useState(null);
    const [pagos, setPagos] = useState(() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}").pagos || []; } catch (e) { return []; } });
    const [clientes, setClientes] = useState([]);
    const [enVivo, setEnVivo] = useState(false);
    const [desactualizado, setDesactualizado] = useState(true); // true hasta leer de Supabase
    const [publico, setPublico] = useState(false); // true si se leen los cobros sin sesión (con la clave del panel)
    const [errorPublico, setErrorPublico] = useState("");
    const clientesRef = useRef([]);
    clientesRef.current = clientes;

    const cargar = useCallback(async () => {
      if (!sb) return;
      try {
        const leer = async (tabla, orden) => {
          const filas = [];
          for (let desde = 0; ; desde += 1000) {
            const { data, error: e } = await sb.from(tabla).select("*").order(orden.col, { ascending: orden.asc }).range(desde, desde + 999);
            if (e) throw e;
            filas.push(...data);
            if (data.length < 1000) break;
          }
          return filas;
        };
        const [p, c] = await Promise.all([leer("caja_pagos", { col: "fecha", asc: false }), leer("caja_clientes", { col: "nombre", asc: true })]);
        setPagos(p);
        setClientes(c);
        setDesactualizado(false);
        setError("");
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ pagos: p })); } catch (e) { /* sin caché */ }
      } catch (e) {
        setDesactualizado(true);
        setError("No se han podido leer los pagos de la Caja (" + (e.message || e) + "). Se muestran los últimos guardados.");
      }
    }, []);

    // Sesión de Supabase Auth
    useEffect(() => {
      if (!sb) return;
      let vivo = true;
      sb.auth.getSession().then(({ data }) => { if (vivo) { setSesion(data.session); if (!data.session) setEstado("sin-sesion"); } });
      const { data: sub } = sb.auth.onAuthStateChange((_ev, s) => { setSesion(s); if (!s) { setRol(null); setEstado("sin-sesion"); } });
      return () => { vivo = false; sub.subscription.unsubscribe(); };
    }, []);

    // Con sesión: rol, datos y suscripción en tiempo real
    const uid = sesion && sesion.user && sesion.user.id;
    useEffect(() => {
      if (!sb || !uid) return;
      let vivo = true, canal = null, temporizador = null;
      (async () => {
        const { data, error: e } = await sb.rpc("caja_rol");
        if (!vivo) return;
        if (e) { setEstado("error"); setError("No se pudo comprobar el acceso (" + e.message + ")."); return; }
        if (!data) { setRol(null); setEstado("sin-acceso"); return; }
        setRol(data);
        setEstado("ok");
        await cargar();
        if (!vivo) return;
        const refrescar = () => { clearTimeout(temporizador); temporizador = setTimeout(cargar, 250); };
        canal = sb.channel("caja-axis")
          .on("postgres_changes", { event: "*", schema: "public", table: "caja_pagos" }, refrescar)
          .on("postgres_changes", { event: "*", schema: "public", table: "caja_clientes" }, refrescar)
          .subscribe((s) => { setEnVivo(s === "SUBSCRIBED"); if (s === "SUBSCRIBED") cargar(); });
      })();
      return () => { vivo = false; clearTimeout(temporizador); if (canal) sb.removeChannel(canal); setEnVivo(false); };
    }, [uid, cargar]);

    // Lectura SIN sesión: el panel presenta la clave de su sincronización (el identificador del Gist,
    // que ya tiene cada dispositivo) y Supabase le devuelve los cobros. Se refresca cada 30 s y al
    // volver a la pestaña. Con sesión de editor se usa en cambio la lectura completa en tiempo real.
    useEffect(() => {
      if (!sb || estado === "ok") return;
      let vivo = true;
      const leerPublico = async () => {
        const clave = clavePanel();
        if (!clave) { if (vivo) { setPublico(false); setErrorPublico("Falta la URL de sincronización del panel: sin ella no se pueden leer los cobros de la Caja sin iniciar sesión."); } return; }
        try {
          const { data, error: e } = await sb.rpc("caja_pagos_panel", { p_clave: clave });
          if (!vivo) return;
          if (e) throw e;
          if (!data || !data.ok) { setPublico(false); setErrorPublico("La Caja no reconoce la clave de este panel (la URL de sincronización). Entra con tu usuario o revisa la URL."); return; }
          setPagos(data.pagos);
          setPublico(true); setDesactualizado(false); setErrorPublico("");
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ pagos: data.pagos })); } catch (err) { /* sin caché */ }
        } catch (e) {
          if (vivo) { setDesactualizado(true); setErrorPublico("No se han podido leer los cobros de la Caja (" + (e.message || e) + "). Se muestran los últimos guardados."); }
        }
      };
      leerPublico();
      const t = setInterval(leerPublico, 30000);
      const alVolver = () => { if (document.visibilityState === "visible") leerPublico(); };
      document.addEventListener("visibilitychange", alVolver);
      return () => { vivo = false; clearInterval(t); document.removeEventListener("visibilitychange", alVolver); };
    }, [estado]);

    const puedeEditar = rol === "admin" || rol === "editor";
    const api = {
      async entrar(email, clave) {
        const { error: e } = await sb.auth.signInWithPassword({ email: email.trim(), password: clave });
        if (e) throw new Error(e.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : e.message);
      },
      async salir() { await sb.auth.signOut(); },
      // ahId: pago de AimHarder concreto; null con sinAH=false => automático; sinAH=true => no existe en AimHarder
      async vincular(id, ahId, sinAH) {
        const { error: e } = await sb.from("caja_pagos").update({ aimharder_pago_id: ahId || null, sin_aimharder: !!sinAH, updated_at: new Date().toISOString() }).eq("id", id);
        if (e) throw e;
        await cargar();
      },
      // Crea en la Caja los clientes de AimHarder que aún no existan (sin duplicar).
      async asegurarClientes(nombres) {
        if (!puedeEditar || estado !== "ok") return;
        // Mismo cliente aunque cambie el orden del nombre ("García Ana" = "Ana García").
        const orden = (n) => normName(n).split(" ").filter(Boolean).sort().join(" ");
        const existentes = new Set(clientesRef.current.map((c) => orden(c.nombre)));
        const nuevos = new Map();
        for (const n of nombres) {
          const nombre = String(n || "").trim(), k = normName(nombre);
          const o = orden(nombre);
          if (nombre && k && !existentes.has(o) && !nuevos.has(o)) nuevos.set(o, { nombre, nombre_norm: k, origen: "aimharder" });
        }
        if (!nuevos.size) return;
        const filas = [...nuevos.values()];
        for (let i = 0; i < filas.length; i += 200) {
          const { error: e } = await sb.from("caja_clientes").upsert(filas.slice(i, i + 200), { onConflict: "nombre_norm", ignoreDuplicates: true });
          if (e) { console.warn("Caja: no se pudieron importar clientes", e.message); return; }
        }
        await cargar();
      }
    };
    return { estado, error, sesion, rol, puedeEditar, pagos, clientes, enVivo, desactualizado, publico, errorPublico, api };
  }

  /* ---------- pantalla ---------- */
  const box = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 };
  const lbl = { fontSize: 12, color: MUTED, display: "grid", gap: 3 };

  function Login({ caja }) {
    const [email, setEmail] = useState("");
    const [clave, setClave] = useState("");
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);
    const enviar = async (ev) => {
      ev.preventDefault();
      setBusy(true); setMsg("");
      try { await caja.api.entrar(email, clave); } catch (e) { setMsg(e.message); } finally { setBusy(false); }
    };
    return h("form", { onSubmit: enviar, style: { display: "grid", gap: 10, maxWidth: 360 } },
      h("label", { style: lbl }, "Email", h("input", { className: "axis-input", type: "email", autoComplete: "username", value: email, onChange: (e) => setEmail(e.target.value), required: true })),
      h("label", { style: lbl }, "Contraseña", h("input", { className: "axis-input", type: "password", autoComplete: "current-password", value: clave, onChange: (e) => setClave(e.target.value), required: true })),
      h("div", null, h("button", { className: "axis-btn primary", type: "submit", disabled: busy }, busy ? "Entrando…" : "Entrar")),
      msg && h("p", { style: { margin: 0, fontSize: 13, color: BAD } }, msg));
  }

  const enlaceCaja = h("a", { href: URL_CAJA, target: "_blank", rel: "noopener", style: { color: "#2563EB", fontSize: 13 } }, "Abrir la Caja ↗");

  // Pestaña «Cobros»: revisión del emparejado entre la Caja y AimHarder.
  function CobrosTab({ caja, info, month, setMonth }) {
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);
    // Sin sesión el panel lee los cobros con su clave (modo lectura): solo si eso falla se pide entrar.
    if (caja.estado === "cargando" && !caja.publico) return h("div", { style: { padding: "18px 22px" } }, h("p", { style: { color: MUTED, fontSize: 13 } }, "Conectando con la Caja…"));
    if ((caja.estado === "sin-sesion" || caja.estado === "error" && !caja.sesion) && !caja.publico) {
      return h("div", { style: { padding: "0 22px 30px" } }, h("section", { style: box },
        h("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, "Cobros · Caja de Axis"),
        h("p", { style: { margin: "0 0 12px", fontSize: 13, color: MUTED } }, "El panel no ha podido leer los cobros de la Caja (en AimHarder van a 0 €), así que ahora mismo esos pagos cuentan 0 €. Los pagos se registran en la Caja: ", enlaceCaja),
        (caja.errorPublico || caja.error) && h("p", { style: { fontSize: 13, color: BAD } }, caja.errorPublico || caja.error),
        caja.estado === "sin-sesion" && h("details", null, h("summary", { style: { cursor: "pointer", fontSize: 13 } }, "Entrar con mi usuario de la Caja"), h("div", { style: { marginTop: 10 } }, h(Login, { caja })))));
    }
    if (caja.estado === "sin-acceso") {
      return h("div", { style: { padding: "0 22px 30px" } }, h("section", { style: box },
        h("p", { style: { margin: "0 0 10px", fontSize: 14 } }, `Has entrado como ${caja.sesion.user.email}, pero ese usuario no tiene acceso a la Caja. Pide que te añadan.`),
        h("button", { className: "axis-btn ghost", onClick: () => caja.api.salir() }, "Salir")));
    }
    const delMes = caja.pagos.filter((c) => (c.fecha || "").startsWith(month));
    const sinPareja = info.sinPareja.filter((c) => (c.fecha || "").startsWith(month));
    const ceroMes = info.ceroSinCaja.filter((p) => (p.d || "").startsWith(month)).sort((a, b) => (a.d || "").localeCompare(b.d || ""));
    const emparejados = delMes.filter((c) => info.pareja.has(c.id)).length;
    const vincular = async (c, v) => {
      setBusy(true); setMsg("Guardando…");
      try { await caja.api.vincular(c.id, v && v !== "__ninguno" ? v : null, v === "__ninguno"); setMsg("Vínculo actualizado."); } catch (e) { setMsg("No se ha guardado: " + (e.message || e)); } finally { setBusy(false); }
    };
    const fila = (c) => h("div", { key: c.id, style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${SOFT}` } },
      h("span", { style: { color: MUTED, minWidth: 78 } }, c.fecha),
      h("b", { style: { flex: "1 1 180px" } }, c.concepto, c.cliente_nombre ? ` · ${c.cliente_nombre}` : ""),
      h("b", null, eur2(c.importe_cents / 100)),
      caja.puedeEditar && h("select", { className: "axis-input", style: { width: 230 }, value: "", disabled: busy, "aria-label": "Vincular con un pago de AimHarder", onChange: (e) => vincular(c, e.target.value) },
        h("option", { value: "" }, "Vincular con un pago de AimHarder…"), h("option", { value: "__ninguno" }, "No existe en AimHarder"),
        info.candidatos(c).map((p) => h("option", { key: p.id, value: String(p.id) }, `${p.d} · ${p.co} · AH ${eur2(p.amt)}`))));
    return h("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 14 } },
        h("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, -1)), "aria-label": "Mes anterior" }, "←"),
        h("input", { type: "month", className: "axis-input", style: { width: 160 }, value: month, onChange: (e) => e.target.value && setMonth(e.target.value) }),
        h("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, 1)), "aria-label": "Mes siguiente" }, "→"),
        h("span", { style: { marginLeft: "auto", fontSize: 12, color: caja.desactualizado ? WARN : MUTED } },
          caja.desactualizado ? "⚠ Sin conexión con la Caja: datos guardados · " : caja.sesion ? (caja.enVivo ? "● En tiempo real · " : "Conectando… · ") : "● Se actualiza cada 30 s · ",
          caja.sesion ? [caja.sesion.user.email, ` (${caja.rol}) `, h("button", { key: "s", className: "axis-btn ghost", style: { padding: "2px 8px", marginLeft: 6 }, onClick: () => caja.api.salir() }, "Salir")] : "solo lectura")),
      (caja.error || caja.errorPublico) && h("p", { style: { margin: 0, fontSize: 13, color: BAD } }, caja.sesion ? caja.error : caja.errorPublico || caja.error),
      !caja.sesion && caja.estado === "sin-sesion" && h("details", { style: { fontSize: 13 } }, h("summary", { style: { cursor: "pointer", color: MUTED } }, "Entrar con mi usuario (para vincular a mano)"), h("div", { style: { marginTop: 10 } }, h(Login, { caja }))),
      h("section", { style: box },
        h("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, "Cobros · Caja ↔ AimHarder"),
        h("p", { style: { margin: "0 0 8px", fontSize: 13, color: MUTED } }, "Los pagos se registran en la Caja y el panel les pone su importe a los pagos de AimHarder (mismo cliente, producto y fecha ±7 días). Aquí solo se revisa. ", enlaceCaja),
        h("p", { style: { margin: 0, fontSize: 14 } }, h("b", null, delMes.length), " pago(s) de la Caja este mes · ", h("b", { style: { color: GOOD } }, emparejados), " emparejado(s) · ", h("b", { style: { color: sinPareja.length ? WARN : INK } }, sinPareja.length), " sin pareja · ", h("b", { style: { color: ceroMes.length ? WARN : INK } }, ceroMes.length), " de AimHarder a 0 € sin cobro"),
        msg && h("p", { style: { margin: "8px 0 0", fontSize: 13, color: GOOD } }, msg)),
      sinPareja.length > 0 && h("section", { style: { ...box, borderColor: WARN } },
        h("h3", { style: { margin: "0 0 4px", fontSize: 15, color: WARN } }, `Pagos de la Caja sin pareja en AimHarder (${sinPareja.length})`),
        h("p", { style: { margin: "0 0 8px", fontSize: 12, color: MUTED } }, "Cuentan como ingreso pero no cubren sesiones. Revisa el nombre del cliente, el producto o la fecha, o vincúlalos a mano."),
        h("div", null, sinPareja.map(fila))),
      ceroMes.length > 0 && h("section", { style: { ...box, borderColor: WARN } },
        h("h3", { style: { margin: "0 0 4px", fontSize: 15, color: WARN } }, `Pagos de AimHarder a 0 € sin cobro en la Caja (${ceroMes.length})`),
        h("p", { style: { margin: "0 0 8px", fontSize: 12, color: MUTED } }, "Tienen sesiones o bono en AimHarder pero no hay un pago en la Caja que los empareje: ahora mismo cuentan 0 €. Regístralos en la Caja con la fecha del pago, o revísalos si son gratuitos."),
        h("div", null, ceroMes.map((p) => h("div", { key: p.id, style: { fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${SOFT}` } }, `${p.d} · ${p.cl} · ${p.co}`)))));
  }

  window.CajaAxis = { useCaja, aplicar, CajaTab: CobrosTab };
})();
