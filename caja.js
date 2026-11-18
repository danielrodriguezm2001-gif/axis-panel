/* Caja de Axis: pagos de productos registrados en Supabase (tiempo real, varios
 * usuarios, varios dispositivos) y emparejados con los pagos de AimHarder.
 *
 * Reparto de datos:
 *   - AimHarder: sesiones, reservas, bonos y su estructura (cliente, producto, fecha).
 *   - Caja (Supabase): lo que de verdad se cobra (importe, forma de pago, quién vende).
 * Cada pago de la Caja se empareja con el pago de AimHarder del mismo cliente y
 * producto con la fecha más cercana (±7 días) y le pone su importe. Se puede
 * corregir a mano. Lo que no tenga pareja en AimHarder cuenta como ingreso, pero
 * no cubre sesiones.
 *
 * Se carga ANTES de panel.js (que lo usa al pintar). Usa funciones de panel.js
 * (normName, productOf, catFromConcept, creatorId, todayISO) solo al ejecutarse.
 */
(function () {
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

    const puedeEditar = rol === "admin" || rol === "editor";
    const api = {
      async entrar(email, clave) {
        const { error: e } = await sb.auth.signInWithPassword({ email: email.trim(), password: clave });
        if (e) throw new Error(e.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : e.message);
      },
      async salir() { await sb.auth.signOut(); },
      async guardarPago(d, id) {
        if (!puedeEditar) throw new Error("Tu usuario solo puede ver la Caja.");
        const nombre = d.cliente_nombre.trim();
        let cliente = nombre ? clientesRef.current.find((c) => c.nombre_norm === normName(nombre)) : null;
        if (nombre && !cliente) {
          const { data, error: e } = await sb.from("caja_clientes").upsert({ nombre, nombre_norm: normName(nombre), origen: "manual" }, { onConflict: "nombre_norm" }).select().single();
          if (e) throw e;
          cliente = data;
        }
        const fila = { cliente_id: cliente ? cliente.id : null, cliente_nombre: cliente ? cliente.nombre : "", concepto: d.concepto.trim(), importe_cents: Math.round(d.importe * 100), fecha: d.fecha, forma_pago: d.forma_pago, estado: d.estado, vendedor: d.vendedor, sin_aimharder: !!d.sin_aimharder, notas: d.notas.trim(), updated_at: new Date().toISOString() };
        const r = id ? await sb.from("caja_pagos").update(fila).eq("id", id) : await sb.from("caja_pagos").insert({ ...fila, creado_por: sesion.user.email });
        if (r.error) throw r.error;
        await cargar();
      },
      async borrarPago(id) {
        const { error: e } = await sb.from("caja_pagos").delete().eq("id", id);
        if (e) throw e;
        await cargar();
      },
      // ahId: pago de AimHarder concreto; null con sinAH=false => automático; sinAH=true => no existe en AimHarder
      async vincular(id, ahId, sinAH) {
        const { error: e } = await sb.from("caja_pagos").update({ aimharder_pago_id: ahId || null, sin_aimharder: !!sinAH, updated_at: new Date().toISOString() }).eq("id", id);
        if (e) throw e;
        await cargar();
      },
      // Crea en la Caja los clientes de AimHarder que aún no existan (sin duplicar).
      async asegurarClientes(nombres) {
        if (!puedeEditar || estado !== "ok") return;
        const existentes = new Set(clientesRef.current.map((c) => c.nombre_norm));
        const nuevos = new Map();
        for (const n of nombres) {
          const nombre = String(n || "").trim(), k = normName(nombre);
          if (nombre && k && !existentes.has(k) && !nuevos.has(k)) nuevos.set(k, { nombre, nombre_norm: k, origen: "aimharder" });
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
    return { estado, error, sesion, rol, puedeEditar, pagos, clientes, enVivo, desactualizado, api };
  }

  /* ---------- pantalla ---------- */
  const box = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 };
  const lbl = { fontSize: 12, color: MUTED, display: "grid", gap: 3 };
  const vacio = () => ({ fecha: todayISO(), cliente_nombre: "", concepto: "", importe: "", forma_pago: "tarjeta", estado: "cobrado", vendedor: "", sin_aimharder: false, notas: "" });

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

  function CajaTab({ caja, info, month, setMonth }) {
    const [f, setF] = useState(vacio());
    const [editId, setEditId] = useState(null);
    const [msg, setMsg] = useState({ ok: true, t: "" });
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
    const importe = parseFloat(String(f.importe).replace(",", "."));
    const valido = f.fecha && f.concepto.trim() && Number.isFinite(importe) && importe >= 0;
    const ejecutar = async (fn, okTxt) => {
      setBusy(true); setMsg({ ok: true, t: "Guardando…" });
      try { await fn(); setMsg({ ok: true, t: okTxt }); return true; }
      catch (e) { setMsg({ ok: false, t: "No se ha guardado: " + (e.message || e) }); return false; }
      finally { setBusy(false); }
    };
    const guardar = async () => {
      if (!valido) return;
      const ok = await ejecutar(() => caja.api.guardarPago({ ...f, importe }, editId), editId ? "Cambios guardados." : "Pago registrado.");
      if (ok) { setEditId(null); setF({ ...vacio(), fecha: f.fecha, vendedor: f.vendedor }); }
    };
    const editar = (c) => {
      setEditId(c.id);
      setF({ fecha: c.fecha, cliente_nombre: c.cliente_nombre, concepto: c.concepto, importe: String(c.importe_cents / 100).replace(".", ","), forma_pago: c.forma_pago, estado: c.estado, vendedor: c.vendedor, sin_aimharder: c.sin_aimharder, notas: c.notas });
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (caja.estado === "cargando") return h("div", { style: { padding: "18px 22px" } }, h("p", { style: { color: MUTED, fontSize: 13 } }, "Conectando con la Caja…"));
    if (caja.estado === "sin-sesion" || caja.estado === "error" && !caja.sesion) {
      return h("div", { style: { padding: "0 22px 30px" } }, h("section", { style: box },
        h("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, "Caja de Axis"),
        h("p", { style: { margin: "0 0 12px", fontSize: 13, color: MUTED } }, "Entra con tu usuario para ver y registrar los pagos de productos. Los cambios se ven al instante en todos los dispositivos."),
        caja.error && h("p", { style: { fontSize: 13, color: BAD } }, caja.error),
        caja.estado === "sin-sesion" && h(Login, { caja })));
    }
    if (caja.estado === "sin-acceso") {
      return h("div", { style: { padding: "0 22px 30px" } }, h("section", { style: box },
        h("p", { style: { margin: "0 0 10px", fontSize: 14 } }, `Has entrado como ${caja.sesion.user.email}, pero ese usuario no tiene acceso a la Caja. Pide que te añadan.`),
        h("button", { className: "axis-btn ghost", onClick: () => caja.api.salir() }, "Salir")));
    }

    const delMes = caja.pagos.filter((c) => (c.fecha || "").startsWith(month));
    const cobrado = delMes.filter((c) => c.estado === "cobrado").reduce((a, c) => a + c.importe_cents, 0) / 100;
    const pendiente = delMes.filter((c) => c.estado === "pendiente").reduce((a, c) => a + c.importe_cents, 0) / 100;
    const ceroMes = info.ceroSinCaja.filter((p) => (p.d || "").startsWith(month));
    const conceptos = [...new Set(caja.pagos.map((c) => c.concepto))].sort();

    const fila = (c) => {
      const par = info.pareja.get(c.id);
      const cand = info.candidatos(c);
      const valor = c.sin_aimharder ? "__ninguno" : c.aimharder_pago_id || "";
      const estadoTxt = par ? `✓ emparejado con AimHarder (${par.d})` : c.sin_aimharder ? "Sin AimHarder" : "⚠ sin pareja en AimHarder";
      return h("div", { key: c.id, style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${SOFT}` } },
        h("span", { style: { color: MUTED, minWidth: 78 } }, c.fecha),
        h("b", { style: { flex: "1 1 180px" } }, c.concepto, c.cliente_nombre ? ` · ${c.cliente_nombre}` : "", c.notas ? h("span", { style: { fontWeight: 400, color: MUTED } }, ` — ${c.notas}`) : null),
        h("span", { style: { color: MUTED } }, c.estado === "cobrado" ? c.forma_pago : "pendiente", c.vendedor ? ` · ${c.vendedor}` : ""),
        h("b", null, eur2(c.importe_cents / 100)),
        h("span", { style: { fontSize: 12, color: par || c.sin_aimharder ? GOOD : WARN } }, estadoTxt),
        caja.puedeEditar && h("select", { className: "axis-input", style: { width: 170 }, value: valor, disabled: busy, "aria-label": "Vínculo con AimHarder",
          onChange: (e) => { const v = e.target.value; ejecutar(() => caja.api.vincular(c.id, v && v !== "__ninguno" ? v : null, v === "__ninguno"), "Vínculo actualizado."); } },
          h("option", { value: "" }, "Emparejar automático"), h("option", { value: "__ninguno" }, "No existe en AimHarder"),
          cand.map((p) => h("option", { key: p.id, value: String(p.id) }, `${p.d} · ${p.co} · AH ${eur2(p.amt)}`))),
        caja.puedeEditar && h("button", { className: "axis-btn ghost", style: { padding: "3px 8px" }, onClick: () => editar(c) }, "Editar"),
        caja.puedeEditar && h("button", { className: "axis-btn ghost", style: { padding: "3px 8px" }, disabled: busy, "aria-label": "Eliminar pago", onClick: () => {
          if (window.confirm(`¿Eliminar el pago "${c.concepto}" de ${eur2(c.importe_cents / 100)}?`)) ejecutar(() => caja.api.borrarPago(c.id), "Pago eliminado.");
        } }, "\u{1F5D1}"));
    };

    return h("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 14 } },
        h("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, -1)), "aria-label": "Mes anterior" }, "←"),
        h("input", { type: "month", className: "axis-input", style: { width: 160 }, value: month, onChange: (e) => e.target.value && setMonth(e.target.value) }),
        h("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, 1)), "aria-label": "Mes siguiente" }, "→"),
        h("span", { style: { marginLeft: "auto", fontSize: 12, color: caja.desactualizado ? WARN : MUTED } },
          caja.desactualizado ? "⚠ Sin conexión con la Caja: datos guardados · " : caja.enVivo ? "● En tiempo real · " : "Conectando… · ",
          caja.sesion.user.email, ` (${caja.rol}) `, h("button", { className: "axis-btn ghost", style: { padding: "2px 8px", marginLeft: 6 }, onClick: () => caja.api.salir() }, "Salir"))),
      caja.error && h("p", { style: { margin: 0, fontSize: 13, color: BAD } }, caja.error),
      caja.puedeEditar && h("section", { style: box },
        h("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, editId ? "Editar pago" : "Registrar pago de producto"),
        h("p", { style: { margin: "0 0 12px", fontSize: 13, color: MUTED } }, "Apunta el importe real y la fecha en la que se hace el pago: con cliente, producto y fecha se empareja solo con el pago de AimHarder (el de 0 € que trae las sesiones y el bono)."),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 } },
          h("label", { style: lbl }, h("b", { style: { color: INK } }, "Fecha del pago"), h("input", { type: "date", className: "axis-input", value: f.fecha, onChange: set("fecha") })),
          h("label", { style: lbl }, "Cliente", h("input", { className: "axis-input", list: "caja-clientes", value: f.cliente_nombre, onChange: set("cliente_nombre"), placeholder: "Nombre como en AimHarder" })),
          h("label", { style: lbl }, "Producto / concepto", h("input", { className: "axis-input", list: "caja-conceptos", value: f.concepto, onChange: set("concepto"), placeholder: "Ej. Bono 4 sesiones" })),
          h("label", { style: lbl }, "Importe (€)", h("input", { className: "axis-input", inputMode: "decimal", value: f.importe, onChange: set("importe"), placeholder: "0,00" })),
          h("label", { style: lbl }, "Estado", h("select", { className: "axis-input", value: f.estado, onChange: set("estado") }, h("option", { value: "cobrado" }, "Cobrado"), h("option", { value: "pendiente" }, "Pendiente de cobro"))),
          h("label", { style: lbl }, "Forma de pago", h("select", { className: "axis-input", value: f.forma_pago, onChange: set("forma_pago") }, FORMAS.map(([v, t]) => h("option", { key: v, value: v }, t)))),
          h("label", { style: lbl }, "Vendedor", h("select", { className: "axis-input", value: f.vendedor, onChange: set("vendedor") }, h("option", { value: "" }, "El de AimHarder"), VENDEDORES.map((v) => h("option", { key: v, value: v }, v)))),
          h("label", { style: lbl }, "Notas (opcional)", h("input", { className: "axis-input", value: f.notas, onChange: set("notas") }))),
        h("datalist", { id: "caja-clientes" }, caja.clientes.map((c) => h("option", { key: c.id, value: c.nombre }))),
        h("datalist", { id: "caja-conceptos" }, conceptos.map((c) => h("option", { key: c, value: c }))),
        h("label", { style: { ...lbl, display: "flex", gap: 6, alignItems: "center", marginTop: 10 } }, h("input", { type: "checkbox", checked: f.sin_aimharder, onChange: set("sin_aimharder") }), "Este pago no existe en AimHarder (no se empareja)"),
        h("div", { style: { marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" } },
          h("button", { className: "axis-btn primary", onClick: guardar, disabled: !valido || busy }, editId ? "Guardar cambios" : "Registrar pago"),
          editId && h("button", { className: "axis-btn ghost", onClick: () => { setEditId(null); setF(vacio()); } }, "Cancelar"),
          msg.t && h("span", { style: { fontSize: 13, color: msg.ok ? GOOD : BAD } }, msg.t))),
      h("section", { style: box },
        h("div", { style: { display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 } },
          h("div", null, h("div", { style: { fontSize: 12, color: MUTED } }, "Cobrado en la Caja"), h("div", { className: "axis-display", style: { fontSize: 28, fontWeight: 700 } }, eur2(cobrado))),
          h("div", null, h("div", { style: { fontSize: 12, color: MUTED } }, "Pendiente"), h("div", { className: "axis-display", style: { fontSize: 28, fontWeight: 700, color: pendiente > 0 ? WARN : INK } }, eur2(pendiente))),
          h("div", null, h("div", { style: { fontSize: 12, color: MUTED } }, "Pagos del mes"), h("div", { className: "axis-display", style: { fontSize: 28, fontWeight: 700 } }, delMes.length))),
        delMes.length === 0 ? h("p", { style: { fontSize: 13, color: MUTED, margin: 0 } }, "No hay pagos registrados en este mes.") : h("div", null, delMes.map(fila))),
      ceroMes.length > 0 && h("section", { style: { ...box, borderColor: WARN } },
        h("h3", { style: { margin: "0 0 4px", fontSize: 15, color: WARN } }, `Pagos de AimHarder a 0 € sin cobro en la Caja (${ceroMes.length})`),
        h("p", { style: { margin: "0 0 8px", fontSize: 12, color: MUTED } }, "Tienen sesiones o bono en AimHarder pero no hay un pago registrado aquí que los empareje: ahora mismo cuentan 0 €. Regístralos con la fecha del pago, o revísalos si son gratuitos."),
        h("div", null, ceroMes.sort((a, b) => (a.d || "").localeCompare(b.d || "")).map((p) => h("div", { key: p.id, style: { fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${SOFT}` } }, `${p.d} · ${p.cl} · ${p.co}`)))));
  }

  window.CajaAxis = { useCaja, aplicar, CajaTab };
})();
