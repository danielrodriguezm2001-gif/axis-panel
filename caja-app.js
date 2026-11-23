/* Caja de Axis: pagos de productos, gastos y balance (Supabase, tiempo real,
 * varios usuarios y dispositivos). Aplicación independiente del panel de salas.
 *
 * Los pagos que se registran aquí los lee el panel de salas para poner el importe
 * real a los pagos de AimHarder (que van a 0 €); el emparejado se hace allí.
 */
(function () {
  // Dentro del panel de salas: comparte la conexión de caja.js y no pinta nada por su cuenta.
  const embebida = !!(document.currentScript && document.currentScript.hasAttribute("data-embebida"));
  const SB_URL = "https://jakvmfippiakvfgvzeam.supabase.co";
  const SB_KEY = "sb_publishable_OYbWV66QORfVoj0Gj0NqIw_mkPSgiYQ"; // clave pública: los permisos los da RLS
  const CACHE_KEY = "axis-caja-app-cache";
  const VENDEDORES = ["Marc", "Erik", "Daniel", "Sergio", "Martí", "Marina", "Axis"];
  const INK = "#12211B", MUTED = "#5A6B63", LINE = "#DDE4E0", SOFT = "#EDF1EF", BAD = "#9B1C1C", WARN = "#B45309", GOOD = "#1F3A2A";
  const h = React.createElement;
  const { useState, useEffect, useMemo, useRef, useCallback } = React;

  let sb = null;
  try {
    sb = (embebida && window.__cajaSb) || window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  } catch (e) {
    console.warn("Caja: no se pudo cargar Supabase", e);
  }

  const eur2 = (n) => (Number(n) || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const pad = (n) => String(n).padStart(2, "0");
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const shiftMonth = (ym, delta) => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 15);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  };
  const stripAccents = (s) => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Misma normalización que el panel de salas (nombre_norm de los clientes).
  const normName = (s) => stripAccents(s).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  function catFromConcept(concept) {
    const t = stripAccents(concept);
    if (t.includes("bono 4")) return "Pack 4";
    if (t.includes("bono 8")) return "Pack 8";
    if (t.includes("grupo")) return "Small group / Grupo reducido";
    if (t.includes("valoraci")) return "Valoración inicial";
    if (t.includes("online")) return "Online";
    if (t.includes("individual")) return "Sesión individual";
    return String(concept || "").replace(/\s*\d{1,2}\/\d{4}\s*$/, "").trim() || "Sin concepto";
  }

  const CONFIG_VACIA = { saldo_inicial_efectivo_cents: 0, saldo_inicial_fecha: null };
  const CATEGORIAS_GASTO = ["Alquiler", "Suministros (luz, agua, internet)", "Material y equipamiento", "Mantenimiento y limpieza", "Colaboradores y nóminas", "Seguros", "Gestoría y asesoría", "Software y suscripciones", "Marketing y publicidad", "Formación", "Impuestos y tasas", "Comisiones bancarias", "Otros"];

  // Servicios que puede incluir una tarifa: los que el panel sabe gastar con las sesiones de AimHarder.
  // Cada línea de una tarifa o de un cobro: { fam, n, valor, generico }
  //   n = sesiones; valor = importe fijo de la línea (el resto del precio se reparte entre las demás);
  //   generico = bono de EP "sin especificar" que también puede cubrir fisioterapia.
  const SERVICIOS = ["Entrenamiento personal", "Fisioterapia", "Nutrición", "Performance Group", "Valoración inicial", "Online", "Viaje"];
  const FAM_CORTA = { "Entrenamiento personal": "EP", "Fisioterapia": "Fisio", "Nutrición": "Nutri", "Performance Group": "Performance Group", "Valoración inicial": "Valoración inicial", "Online": "Online", "Viaje": "Viaje" };
  const numLinea = (v) => { const x = parseFloat(String(v == null ? "" : v).replace(",", ".")); return Number.isFinite(x) ? x : 0; };
  const limpiarServicios = (ls) => (ls || []).map((l) => ({ fam: l.fam, n: numLinea(l.n), valor: numLinea(l.valor) > 0 ? numLinea(l.valor) : null, generico: !!l.generico && l.fam === "Entrenamiento personal" })).filter((l) => l.fam && l.n > 0);
  const copiarServicios = (ls) => (Array.isArray(ls) ? ls.map((l) => ({ fam: l.fam, n: l.n, valor: l.valor == null ? "" : String(l.valor).replace(".", ","), generico: !!l.generico })) : []);
  const resumenServicios = (ls) => { const l = limpiarServicios(ls); return l.length ? l.map((x) => `${x.n} ${FAM_CORTA[x.fam] || x.fam}`).join(" + ") : "Sin sesiones"; };
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  /* ---------- conexión: sesión, datos y tiempo real ---------- */
  function useCaja() {
    const [estado, setEstado] = useState(sb ? "cargando" : "error"); // cargando | sin-sesion | sin-acceso | ok | error
    const [error, setError] = useState(sb ? "" : "No se pudo cargar la librería de Supabase.");
    const [sesion, setSesion] = useState(null);
    const [rol, setRol] = useState(null);
    const cache = useRef(null);
    if (cache.current === null) { try { cache.current = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch (e) { cache.current = {}; } }
    const [pagos, setPagos] = useState(() => cache.current.pagos || []);
    const [gastos, setGastos] = useState(() => cache.current.gastos || []);
    const [conceptos, setConceptos] = useState(() => cache.current.conceptos || []);
    const conceptosRef = useRef([]);
    conceptosRef.current = conceptos;
    const [config, setConfig] = useState(() => cache.current.config || CONFIG_VACIA);
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
        const [p, c, g, cfg, cs] = await Promise.all([leer("caja_pagos", { col: "fecha", asc: false }), leer("caja_clientes", { col: "nombre", asc: true }), leer("caja_gastos", { col: "fecha", asc: false }), sb.from("caja_config").select("*").eq("id", 1).maybeSingle(), leer("caja_conceptos", { col: "nombre", asc: true })]);
        if (cfg.error) throw cfg.error;
        setPagos(p);
        setClientes(c);
        setGastos(g);
        setConceptos(cs);
        setConfig(cfg.data || CONFIG_VACIA);
        setDesactualizado(false);
        setError("");
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ pagos: p, gastos: g, config: cfg.data || CONFIG_VACIA, conceptos: cs })); } catch (e) { /* sin caché */ }
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
          .on("postgres_changes", { event: "*", schema: "public", table: "caja_gastos" }, refrescar)
          .on("postgres_changes", { event: "*", schema: "public", table: "caja_config" }, refrescar)
          .on("postgres_changes", { event: "*", schema: "public", table: "caja_conceptos" }, refrescar)
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
        if (!cliente) throw new Error("Elige un cliente.");
        const servicios = limpiarServicios(d.servicios);
        const nombreConcepto = d.concepto.trim();
        if (!conceptosRef.current.some((k) => k.nombre_norm === normName(nombreConcepto))) {
          // Concepto nuevo: queda guardado (como manual) con este importe y estas sesiones como habituales.
          const { error: e } = await sb.from("caja_conceptos").upsert({ nombre: nombreConcepto, nombre_norm: normName(nombreConcepto), precio_cents: Math.round(d.importe * 100), origen: "manual", servicios }, { onConflict: "nombre_norm", ignoreDuplicates: true });
          if (e) throw e;
        }
        // Caja de efectivo: solo cobros, siempre en efectivo. Los importes son totales (sin IVA).
        const total = Math.round(d.importe * 100);
        const fila = { cliente_id: cliente.id, cliente_nombre: cliente.nombre, concepto: d.concepto.trim(), importe_cents: total, base_cents: total, iva_rate: 0, iva_cents: 0, fecha: d.fecha, forma_pago: "efectivo", estado: "cobrado", vendedor: d.vendedor, sin_aimharder: !!d.sin_aimharder, servicios, notas: d.notas.trim(), updated_at: new Date().toISOString() };
        const r = id ? await sb.from("caja_pagos").update(fila).eq("id", id) : await sb.from("caja_pagos").insert({ ...fila, creado_por: sesion.user.email });
        if (r.error) throw r.error;
        await cargar();
      },
      // d: { fecha, concepto, proveedor, categoria, importe (total), factura, notas }
      async guardarGasto(d, id) {
        if (!puedeEditar) throw new Error("Tu usuario solo puede ver la Caja.");
        const total = Math.round(d.importe * 100);
        const fila = { fecha: d.fecha, concepto: d.concepto.trim(), proveedor: d.proveedor.trim(), categoria: d.categoria, base_cents: total, iva_rate: 0, iva_cents: 0, total_cents: total, forma_pago: "efectivo", estado: "pagado", factura: d.factura.trim(), notas: d.notas.trim(), updated_at: new Date().toISOString() };
        const r = id ? await sb.from("caja_gastos").update(fila).eq("id", id) : await sb.from("caja_gastos").insert({ ...fila, creado_por: sesion.user.email });
        if (r.error) throw r.error;
        await cargar();
      },
      async borrarGasto(id) {
        const { error: e } = await sb.from("caja_gastos").delete().eq("id", id);
        if (e) throw e;
        await cargar();
      },
      // Solo admin: con cuánto efectivo se empieza a contar el acumulado.
      async guardarConfig(c) {
        const { error: e } = await sb.from("caja_config").update({ saldo_inicial_efectivo_cents: c.efectivo, saldo_inicial_fecha: c.fecha || null, updated_at: new Date().toISOString() }).eq("id", 1);
        if (e) throw e;
        await cargar();
      },
      async crearConcepto(d) {
        if (!puedeEditar) throw new Error("Tu usuario solo puede ver la Caja.");
        const nombre = String(d.nombre || "").trim();
        if (!nombre) throw new Error("Pon un nombre a la tarifa.");
        if (conceptosRef.current.some((k) => k.nombre_norm === normName(nombre))) throw new Error("Ya existe una tarifa con ese nombre.");
        const { error: e } = await sb.from("caja_conceptos").insert({ nombre, nombre_norm: normName(nombre), precio_cents: d.precio_cents, origen: "manual", servicios: d.servicios });
        if (e) throw e;
        await cargar();
      },
      async actualizarConcepto(id, cambios) {
        if (!puedeEditar) throw new Error("Tu usuario solo puede ver la Caja.");
        const { error: e } = await sb.from("caja_conceptos").update(cambios).eq("id", id);
        if (e) throw e;
        await cargar();
      },
      async borrarConcepto(id) {
        const { error: e } = await sb.from("caja_conceptos").delete().eq("id", id);
        if (e) throw e;
        await cargar();
      },
      async borrarPago(id) {
        const { error: e } = await sb.from("caja_pagos").delete().eq("id", id);
        if (e) throw e;
        await cargar();
      },
    };
    return { estado, error, sesion, rol, puedeEditar, esAdmin: rol === "admin", pagos, clientes, gastos, config, conceptos, enVivo, desactualizado, api };
  }

  /* ---------- pantalla ---------- */
  const box = { background: "#fff", border: "1px solid #E3E9E6", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 2px rgba(18,33,27,.04)" };
  const lbl = { fontSize: 12, color: MUTED, display: "grid", gap: 3 };
  const eurC = (cents) => eur2((cents || 0) / 100);
  const BAR_IN = "#2F7D4F", BAR_OUT = "#B23A3A";
  const vacio = () => ({ fecha: todayISO(), cliente_nombre: "", concepto: "", importe: "", vendedor: "", sin_aimharder: true, servicios: [], notas: "" });
  const vacioGasto = () => ({ fecha: todayISO(), concepto: "", proveedor: "", categoria: CATEGORIAS_GASTO[0], importe: "", factura: "", notas: "" });
  const diaMes = (iso) => `${(iso || "").slice(8, 10)} ${MESES[Number((iso || "").slice(5, 7)) - 1] || ""}`.trim();

  /* --- piezas reutilizables --- */
  function Pills({ opciones, valor, onChange, vacioOk, chica }) {
    return h("div", { className: "cj-pills", role: "group" }, opciones.map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      const on = valor === v;
      return h("button", { key: String(v), type: "button", className: "cj-pill" + (chica ? " sm" : "") + (on ? " on" : ""), "aria-pressed": on, onClick: () => onChange(on && vacioOk ? "" : v) }, l);
    }));
  }
  function Segmentado({ opciones, valor, onChange }) {
    return h("div", { className: "cj-seg", role: "group" }, opciones.map(([v, l]) => h("button", { key: String(v), type: "button", className: valor === v ? "on" : "", "aria-pressed": valor === v, onClick: () => onChange(v) }, l)));
  }
  function Campo({ etiqueta, ayuda, children }) {
    return h("div", { className: "cj-field" }, etiqueta && h("span", { className: "cj-label" }, etiqueta), children, ayuda && h("span", { className: "cj-hint" }, ayuda));
  }
  function InputEuro({ value, onChange, placeholder, etiqueta, grande, style }) {
    return h("div", { className: "cj-euro", style }, h("input", { className: "cj-input" + (grande ? " big" : ""), inputMode: "decimal", value, placeholder: placeholder || "0,00", "aria-label": etiqueta, onChange }), h("span", null, "€"));
  }
  function Aviso({ msg }) {
    return msg && msg.t ? h("div", { className: "cj-aviso " + (msg.ok ? "ok" : "mal"), role: "status" }, msg.t) : null;
  }
  function ChipsServicios({ servicios }) {
    const l = limpiarServicios(servicios);
    return h("div", { className: "cj-chips" }, l.length ? l.map((x, i) => h("span", { key: i, className: "cj-chip" }, `${x.n} ${FAM_CORTA[x.fam] || x.fam}`)) : h("span", { className: "cj-chip mute" }, "Sin sesiones"));
  }
  function BarraMes({ month, setMonth }) {
    return h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
      h("button", { className: "cj-btn sec sm", onClick: () => setMonth(shiftMonth(month, -1)), "aria-label": "Mes anterior" }, "←"),
      h("input", { type: "month", className: "cj-input", style: { width: 190, height: 40 }, value: month, "aria-label": "Mes", onChange: (e) => e.target.value && setMonth(e.target.value) }),
      h("button", { className: "cj-btn sec sm", onClick: () => setMonth(shiftMonth(month, 1)), "aria-label": "Mes siguiente" }, "→"));
  }
  function Marca({ children }) {
    return h("div", { style: { display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" } }, h("h1", { className: "axis-display", style: { margin: 0, fontSize: 28, textTransform: "uppercase" } }, "Caja de Axis"), children);
  }

  // Desplegable con buscador (clientes, tarifas): se escribe parte del nombre, en cualquier orden.
  function SelectorLista({ items, value, onChange, placeholder, nuevo, vacio, detalle }) {
    const [abierto, setAbierto] = useState(false);
    const [texto, setTexto] = useState("");
    const [activo, setActivo] = useState(0);
    const id = useRef("sel-" + Math.random().toString(36).slice(2, 8)).current;
    const q = normName(texto);
    const coincidencias = useMemo(() => {
      const t = q.split(" ").filter(Boolean);
      return items.filter((c) => t.every((x) => c.nombre_norm.includes(x)));
    }, [items, q]);
    const visibles = coincidencias.slice(0, 60);
    const crear = texto.trim() && !items.some((c) => c.nombre_norm === q) ? texto.trim() : null;
    const opciones = [...visibles.map((c) => ({ nombre: c.nombre, nuevo: false, item: c })), ...(crear ? [{ nombre: crear, nuevo: true, item: null }] : [])];
    const elegir = (o) => { onChange(o.nombre, o.item); setTexto(""); setAbierto(false); };
    const teclas = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setAbierto(true); setActivo((a) => Math.min(a + 1, opciones.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActivo((a) => Math.max(a - 1, 0)); }
      else if (e.key === "Enter" && abierto && opciones[activo]) { e.preventDefault(); elegir(opciones[activo]); }
      else if (e.key === "Escape" || e.key === "Tab") setAbierto(false);
    };
    return h("div", { style: { position: "relative" } },
      h("input", { className: "cj-input", role: "combobox", "aria-expanded": abierto, "aria-controls": id, "aria-autocomplete": "list", autoComplete: "off", placeholder,
        value: abierto ? texto : value, style: value && !abierto ? { fontWeight: 600, paddingRight: 36 } : undefined,
        onFocus: () => { setTexto(""); setActivo(0); setAbierto(true); },
        onBlur: () => setAbierto(false),
        onChange: (e) => { setTexto(e.target.value); setActivo(0); setAbierto(true); },
        onKeyDown: teclas }),
      value && !abierto && h("button", { type: "button", "aria-label": "Quitar selección", onMouseDown: (e) => { e.preventDefault(); onChange("", null); }, style: { position: "absolute", right: 8, top: 8, width: 30, height: 30, border: "none", background: "transparent", cursor: "pointer", fontSize: 20, color: MUTED } }, "×"),
      abierto && h("div", { id, role: "listbox", className: "cj-pop" },
        opciones.length === 0 && h("div", { style: { padding: "10px 12px", fontSize: 14, color: MUTED } }, items.length ? "Sin resultados" : vacio),
        opciones.map((o, i) => h("div", { key: (o.nuevo ? "nuevo:" : "") + o.nombre, role: "option", "aria-selected": i === activo, className: "cj-opt" + (i === activo ? " on" : "") + (o.nuevo ? " nuevo" : ""),
          onMouseDown: (e) => { e.preventDefault(); elegir(o); }, onMouseEnter: () => setActivo(i) }, o.nuevo ? nuevo(o.nombre) : o.nombre, !o.nuevo && detalle && h("span", { className: "det" }, detalle(o.item)))),
        coincidencias.length > visibles.length && h("div", { style: { padding: "8px 12px", fontSize: 12, color: MUTED } }, `Mostrando ${visibles.length} de ${coincidencias.length}: sigue escribiendo para filtrar`)));
  }

  // Sesiones por servicio (como «Clases incluidas» de AimHarder): píldoras para elegir el servicio y
  // un selector de sesiones por cada uno. Sirve para una tarifa y para cada cobro.
  function ServiciosPills({ lineas, onChange, disabled }) {
    const por = (fam) => lineas.findIndex((l) => l.fam === fam);
    const alternar = (fam) => { const i = por(fam); onChange(i >= 0 ? lineas.filter((_, j) => j !== i) : [...lineas, { fam, n: 1, valor: "", generico: false }]); };
    const cambia = (i, patch) => onChange(lineas.map((l, j) => (j === i ? { ...l, ...patch } : l)));
    return h("div", { className: "cj-stack", style: { gap: 14 } },
      h("div", { className: "cj-between" }, h("span", { className: "cj-label" }, "Tipo de servicio"), lineas.length > 0 && !disabled && h("button", { type: "button", className: "cj-link", onClick: () => onChange([]) }, "Quitar todos")),
      h("div", { className: "cj-pills" }, SERVICIOS.map((fam) => { const on = por(fam) >= 0; return h("button", { key: fam, type: "button", disabled, className: "cj-pill" + (on ? " on" : ""), "aria-pressed": on, onClick: () => alternar(fam) }, on ? "✓ " + fam : fam); })),
      lineas.length === 0
        ? h("p", { className: "cj-hint", style: { margin: 0 } }, "Sin sesiones: el cobro cuenta como ingreso pero no genera bono (p. ej. las cuotas del Axis Club).")
        : h("div", { className: "cj-lines" }, lineas.map((l, i) => h("div", { key: l.fam, className: "cj-line" },
          h("span", { className: "cj-line-name" }, l.fam),
          h("div", { className: "cj-stepper" },
            h("button", { type: "button", disabled, "aria-label": `Una sesión menos de ${l.fam}`, onClick: () => cambia(i, { n: Math.max(1, numLinea(l.n) - 1) }) }, "−"),
            h("input", { inputMode: "decimal", value: l.n, disabled, "aria-label": `Sesiones de ${l.fam}`, onChange: (e) => cambia(i, { n: e.target.value }) }),
            h("button", { type: "button", disabled, "aria-label": `Una sesión más de ${l.fam}`, onClick: () => cambia(i, { n: numLinea(l.n) + 1 }) }, "+")),
          h("span", { className: "cj-hint" }, numLinea(l.n) === 1 ? "sesión" : "sesiones"),
          (l.valor !== "" && l.valor != null) || l.mostrarValor
            ? h("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, h(InputEuro, { value: l.valor == null ? "" : l.valor, etiqueta: `Valor fijo de ${l.fam}`, placeholder: "Valor", style: { width: 130 }, onChange: (e) => cambia(i, { valor: e.target.value }) }), !disabled && h("button", { type: "button", className: "cj-link", onClick: () => cambia(i, { valor: "", mostrarValor: false }) }, "Quitar valor"))
            : !disabled && h("button", { type: "button", className: "cj-link", title: "Importe fijo de esta línea (p. ej. 100 € de la valoración en un pack): el resto del precio se reparte entre las demás", onClick: () => cambia(i, { mostrarValor: true }) }, "Fijar valor"),
          l.fam === "Entrenamiento personal" && h("button", { type: "button", disabled, className: "cj-pill sm" + (l.generico ? " on" : ""), "aria-pressed": !!l.generico, title: "Bono de EP sin especificar: también puede cubrir sesiones de fisioterapia", onClick: () => cambia(i, { generico: !l.generico }) }, "También cubre fisio")))));
  }

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
    return h("form", { onSubmit: enviar, className: "cj-stack", style: { gap: 16 } },
      Campo({ etiqueta: "Email", children: h("input", { className: "cj-input", type: "email", autoComplete: "username", value: email, onChange: (e) => setEmail(e.target.value), required: true }) }),
      Campo({ etiqueta: "Contraseña", children: h("input", { className: "cj-input", type: "password", autoComplete: "current-password", value: clave, onChange: (e) => setClave(e.target.value), required: true }) }),
      h("button", { className: "cj-btn accent", type: "submit", disabled: busy, style: { justifyContent: "center" } }, busy ? "Entrando…" : "Entrar"),
      msg && h("div", { className: "cj-aviso mal", role: "alert" }, msg));
  }

  function useFormulario(inicial, guardarFn, okNuevo, okEdicion) {
    const [f, setF] = useState(inicial());
    const [editId, setEditId] = useState(null);
    const [msg, setMsg] = useState({ ok: true, t: "" });
    const [busy, setBusy] = useState(false);
    const ejecutar = async (fn, okTxt) => {
      setBusy(true); setMsg({ ok: true, t: "Guardando…" });
      try { await fn(); setMsg({ ok: true, t: okTxt }); return true; }
      catch (e) { setMsg({ ok: false, t: "No se ha guardado: " + (e.message || e) }); return false; }
      finally { setBusy(false); }
    };
    const guardar = async (datos) => {
      const ok = await ejecutar(() => guardarFn(datos, editId), editId ? okEdicion : okNuevo);
      if (ok) { setEditId(null); setF({ ...inicial(), fecha: f.fecha, vendedor: f.vendedor, categoria: f.categoria }); }
    };
    return { f, setF, editId, setEditId, msg, busy, ejecutar, guardar };
  }

  /* ---------- cobros ---------- */
  function PagosCaja({ caja, month, setMonth }) {
    const { f, setF, editId, setEditId, msg, busy, ejecutar, guardar } = useFormulario(vacio, caja.api.guardarPago, "Cobro registrado.", "Cambios guardados.");
    const [verSesiones, setVerSesiones] = useState(false);
    const importe = parseFloat(String(f.importe).replace(",", "."));
    const valido = f.fecha && f.cliente_nombre.trim() && f.concepto.trim() && Number.isFinite(importe) && importe > 0;
    const tarifa = caja.conceptos.find((k) => k.nombre_norm === normName(f.concepto));
    const conceptoNuevo = f.concepto.trim() && !tarifa;
    const precioTarifa = tarifa && tarifa.precio_cents ? tarifa.precio_cents : null;
    // El importe cobrado se puede cambiar siempre (descuentos, packs a medida…): la tarifa es solo una propuesta.
    const distinto = precioTarifa != null && Number.isFinite(importe) && Math.round(importe * 100) !== precioTarifa;
    const editar = (c) => {
      setEditId(c.id); setVerSesiones(false);
      setF({ fecha: c.fecha, cliente_nombre: c.cliente_nombre, concepto: c.concepto, importe: String(c.importe_cents / 100).replace(".", ","), vendedor: c.vendedor, sin_aimharder: c.sin_aimharder, servicios: copiarServicios(c.servicios), notas: c.notas });
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const delMes = caja.pagos.filter((c) => (c.fecha || "").startsWith(month)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const suma = (k) => delMes.reduce((a, c) => a + c[k], 0);
    const fila = (c) => h("div", { key: c.id, className: "cj-fila" },
      h("div", { className: "cj-fecha" }, h("b", null, (c.fecha || "").slice(8, 10)), MESES[Number((c.fecha || "").slice(5, 7)) - 1]),
      h("div", { style: { minWidth: 0 } },
        h("div", { className: "cj-titulo" }, c.concepto),
        h("div", { className: "cj-sub" }, [c.cliente_nombre, c.vendedor, c.notas].filter(Boolean).join(" · ")),
        h(ChipsServicios, { servicios: c.servicios })),
      h("div", { className: "cj-importe" }, h("b", null, eurC(c.importe_cents))),
      caja.puedeEditar && h("div", { className: "cj-acciones", style: { display: "flex" } },
        h("button", { className: "cj-ico", title: "Editar", "aria-label": `Editar ${c.concepto}`, onClick: () => editar(c) }, "✎"),
        h("button", { className: "cj-ico", title: "Eliminar", disabled: busy, "aria-label": `Eliminar ${c.concepto}`, onClick: () => { if (window.confirm(`¿Eliminar el cobro "${c.concepto}" de ${eurC(c.importe_cents)}?`)) ejecutar(() => caja.api.borrarPago(c.id), "Cobro eliminado."); } }, "\u{1F5D1}")));
    return h("div", { className: "cj-stack" },
      caja.puedeEditar && h("section", { className: "cj-card" },
        h("div", { className: "cj-between" },
          h("h2", { className: "axis-display", style: { margin: 0, fontSize: 24, textTransform: "uppercase" } }, editId ? "Editar cobro" : "Registrar cobro"),
          editId && h("button", { className: "cj-link", onClick: () => { setEditId(null); setF(vacio()); } }, "Cancelar edición")),
        h("p", { className: "cj-hint", style: { margin: "6px 0 14px" } }, "Los cobros en efectivo se registran solo aquí, no en AimHarder. El panel convierte las sesiones de la tarifa en el bono del cliente."),
        h("div", { className: "cj-sec" },
          h("span", { className: "cj-eyebrow" }, "Cliente y tarifa"),
          h("div", { className: "cj-grid2" },
            Campo({ etiqueta: "Cliente", children: h(SelectorLista, { items: caja.clientes, value: f.cliente_nombre, placeholder: "Buscar cliente…", vacio: "Aún no hay clientes: escribe un nombre para crearlo", nuevo: (t) => `+ Crear cliente «${t}»`, onChange: (v) => setF((a) => ({ ...a, cliente_nombre: v })) }) }),
            Campo({ etiqueta: "Tarifa", children: h(SelectorLista, { items: caja.conceptos, value: f.concepto, placeholder: "Buscar tarifa…", vacio: "Aún no hay tarifas: escribe un nombre para crear una", nuevo: (t) => `+ Crear tarifa «${t}»`, detalle: (k) => (k.precio_cents ? eurC(k.precio_cents) : "sin precio"),
              // Al elegir una tarifa se rellenan su precio y sus sesiones; un concepto nuevo parte sin sesiones.
              onChange: (v, item) => setF((a) => ({ ...a, concepto: v, servicios: item ? copiarServicios(item.servicios) : [], ...(item ? { ...(item.precio_cents && (!String(a.importe).trim() || a.importe_auto) ? { importe: String(item.precio_cents / 100).replace(".", ","), importe_auto: true } : {}) } : {}) })) }) })),
          f.concepto.trim() && h("div", { className: "cj-stack", style: { gap: 12 } },
            h("div", { className: "cj-between" },
              h("span", { className: "cj-label" }, conceptoNuevo ? "Tarifa nueva · sesiones que incluye" : "Sesiones que incluye"),
              !conceptoNuevo && h("button", { className: "cj-link", onClick: () => setVerSesiones(!verSesiones) }, verSesiones ? "Listo" : "Editar sesiones")),
            conceptoNuevo || verSesiones ? h(ServiciosPills, { lineas: f.servicios, onChange: (servicios) => setF((a) => ({ ...a, servicios })) }) : h(ChipsServicios, { servicios: f.servicios }),
            conceptoNuevo && h("span", { className: "cj-hint" }, "Se guardará en Tarifas con este precio y estas sesiones como habituales."))),
        h("div", { className: "cj-sec" },
          h("span", { className: "cj-eyebrow" }, "Importe"),
          h("div", { style: { maxWidth: 360 } },
            Campo({ etiqueta: "Importe cobrado (total)", children: h(InputEuro, { grande: true, value: f.importe, etiqueta: "Importe cobrado", onChange: (e) => setF((a) => ({ ...a, importe: e.target.value, importe_auto: false })) }) })),
          precioTarifa != null && h("div", { className: "cj-hint", style: { color: distinto ? WARN : MUTED } }, `Tarifa: ${eurC(precioTarifa)}. El importe es editable: escribe lo que realmente se cobra.`, distinto && " Es distinto de la tarifa. ", distinto && h("button", { type: "button", className: "cj-link", onClick: () => setF((a) => ({ ...a, importe: String(precioTarifa / 100).replace(".", ","), importe_auto: true })) }, "Volver a la tarifa"))),
        h("div", { className: "cj-sec" },
          h("span", { className: "cj-eyebrow" }, "Detalles"),
          h("div", { className: "cj-grid2" },
            Campo({ etiqueta: "Fecha del cobro", children: h("input", { type: "date", className: "cj-input", value: f.fecha, onChange: (e) => setF((a) => ({ ...a, fecha: e.target.value })) }) }),
            Campo({ etiqueta: "Notas (opcional)", children: h("input", { className: "cj-input", value: f.notas, onChange: (e) => setF((a) => ({ ...a, notas: e.target.value })) }) })),
          Campo({ etiqueta: "Vendedor", ayuda: "Quién lo vende. Sin elegir, cuenta como Axis.", children: h(Pills, { opciones: VENDEDORES, valor: f.vendedor, vacioOk: true, onChange: (v) => setF((a) => ({ ...a, vendedor: v })) }) })),
        h("div", { style: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", paddingTop: 6 } },
          h("button", { className: "cj-btn accent", onClick: () => guardar({ ...f, importe }), disabled: !valido || busy }, editId ? "Guardar cambios" : "Registrar cobro"),
          h(Aviso, { msg }))),
      h("section", { className: "cj-card" },
        h("div", { className: "cj-between", style: { marginBottom: 16 } },
          h("div", { className: "cj-kpi" },
            h("div", null, h("div", { className: "cj-hint" }, "Cobrado en el mes"), h("div", { className: "n" }, eurC(suma("importe_cents"))), h("div", { className: "cj-hint" }, `${delMes.length} cobro(s)`))),
          h(BarraMes, { month, setMonth })),
        delMes.length === 0 ? h("p", { className: "cj-hint", style: { margin: 0 } }, "No hay cobros registrados en este mes.") : h("div", null, delMes.map(fila))));
  }

  /* ---------- tarifas ---------- */
  function EditorTarifa({ caja, k, onVolver }) {
    const nueva = !k;
    const [tab, setTab] = useState("datos");
    const [nombre, setNombre] = useState(k ? k.nombre : "");
    const [precio, setPrecio] = useState(k && k.precio_cents != null ? String(k.precio_cents / 100).replace(".", ",") : "");
    const [servicios, setServicios] = useState(() => copiarServicios(k ? k.servicios : []));
    const [msg, setMsg] = useState({ ok: true, t: "" });
    const [busy, setBusy] = useState(false);
    const bloqueado = !!k && k.origen === "aimharder";
    const cents = precio.trim() === "" ? null : Math.round(numLinea(precio) * 100);
    const guardar = async () => {
      setBusy(true); setMsg({ ok: true, t: "Guardando…" });
      try {
        if (nueva) await caja.api.crearConcepto({ nombre, precio_cents: cents, servicios: limpiarServicios(servicios) });
        else await caja.api.actualizarConcepto(k.id, { ...(bloqueado ? {} : { nombre: nombre.trim(), nombre_norm: normName(nombre) }), precio_cents: cents, servicios: limpiarServicios(servicios) });
        onVolver();
      } catch (e) { setMsg({ ok: false, t: "No se ha guardado: " + (e.message || e) }); } finally { setBusy(false); }
    };
    const eliminar = async () => {
      if (!window.confirm(`¿Quitar la tarifa "${k.nombre}"? Los cobros ya registrados no cambian.`)) return;
      setBusy(true);
      try { await caja.api.borrarConcepto(k.id); onVolver(); } catch (e) { setMsg({ ok: false, t: "No se ha eliminado: " + (e.message || e) }); setBusy(false); }
    };
    return h("div", { className: "cj-stack" },
      h("div", { className: "cj-between" },
        h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
          h("button", { className: "cj-link", style: { fontSize: 15, color: MUTED }, onClick: onVolver }, "‹ Volver a tarifas"),
          h("span", { style: { color: "#C0CAC5" } }, "/"),
          h("h2", { style: { margin: 0, fontSize: 18 } }, nueva ? "Crear tarifa" : "Editar tarifa")),
        caja.puedeEditar && h("button", { className: "cj-btn accent", disabled: busy || !nombre.trim(), onClick: guardar }, "✓ Guardar")),
      h("section", { className: "cj-card" },
        h("div", { className: "cj-tabs sub", role: "tablist" }, [["datos", "Datos"], ["clases", "Clases incluidas"]].map(([id, t]) => h("button", { key: id, role: "tab", "aria-selected": tab === id, className: "cj-tab" + (tab === id ? " on" : ""), onClick: () => setTab(id) }, t))),
        h("div", { style: { textAlign: "center", fontWeight: 700, padding: "16px 0 8px", borderBottom: "1px solid var(--line)" } }, nombre.trim() || "Tarifa sin nombre"),
        h("div", { className: "cj-stack", style: { padding: "26px 8px 8px", maxWidth: 760 } },
          tab === "datos"
            ? [
              h("span", { key: "e", className: "cj-eyebrow" }, "Datos de la tarifa"),
              Campo({ key: "n", etiqueta: "Nombre", ayuda: bloqueado ? "Es una tarifa de AimHarder: el nombre debe coincidir con el de allí." : "Así saldrá al elegirla en un cobro.", children: h("input", { className: "cj-input", value: nombre, disabled: bloqueado || !caja.puedeEditar, onChange: (e) => setNombre(e.target.value), placeholder: "Ej. Bono 4 sesiones - FISIOTERAPIA" }) }),
              Campo({ key: "p", etiqueta: "Precio", ayuda: "Importe total. Se propone al cobrarla y se puede cambiar en cada cobro.", children: h(InputEuro, { value: precio, etiqueta: "Precio", style: { maxWidth: 240 }, onChange: (e) => setPrecio(e.target.value) }) })]
            : [
              h("span", { key: "e", className: "cj-eyebrow" }, "Clases incluidas"),
              h("p", { key: "d", className: "cj-hint", style: { margin: 0 } }, "Qué sesiones da esta tarifa. Al cobrarla, el panel las convierte en el bono del cliente y las gasta con sus sesiones de AimHarder."),
              h(ServiciosPills, { key: "s", lineas: servicios, onChange: setServicios, disabled: !caja.puedeEditar })]),
        h(Aviso, { msg })),
      !nueva && caja.puedeEditar && h("div", null, h("button", { className: "cj-link bad", onClick: eliminar, disabled: busy }, "Eliminar tarifa")));
  }

  function TarifasCaja({ caja }) {
    const [vista, setVista] = useState({ modo: "lista" });
    const [q, setQ] = useState("");
    if (vista.modo === "editor") return h(EditorTarifa, { caja, k: vista.k, onVolver: () => setVista({ modo: "lista" }), key: vista.k ? vista.k.id : "nueva" });
    const t = normName(q).split(" ").filter(Boolean);
    const items = caja.conceptos.filter((k) => t.every((x) => k.nombre_norm.includes(x)));
    return h("div", { className: "cj-stack" },
      h("div", { className: "cj-between" },
        h("input", { className: "cj-input", style: { maxWidth: 360 }, placeholder: "Buscar tarifa…", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Buscar tarifa" }),
        caja.puedeEditar && h("button", { className: "cj-btn accent", onClick: () => setVista({ modo: "editor", k: null }) }, "+ Nueva tarifa")),
      h("p", { className: "cj-hint", style: { margin: 0 } }, `${caja.conceptos.length} tarifas. Cada una tiene su precio y las sesiones que incluye por servicio; pulsa una para editarla.`),
      items.length === 0 ? h("div", { className: "cj-card" }, h("p", { className: "cj-hint", style: { margin: 0 } }, "Ninguna tarifa coincide.")) :
        h("div", { className: "cj-tarifas" }, items.map((k) => h("button", { key: k.id, className: "cj-tarifa", onClick: () => setVista({ modo: "editor", k }) },
          h("div", { className: "cj-between", style: { alignItems: "flex-start" } }, h("h3", null, k.nombre), h("span", { className: "cj-chip mute" }, k.origen === "manual" ? "Manual" : "AimHarder")),
          h("div", { style: { display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" } }, h("span", { className: "precio" }, k.precio_cents != null ? eurC(k.precio_cents) : "—")),
          h(ChipsServicios, { servicios: k.servicios })))));
  }

  /* ---------- gastos ---------- */
  function GastosCaja({ caja, month, setMonth }) {
    const { f, setF, editId, setEditId, msg, busy, ejecutar, guardar } = useFormulario(vacioGasto, caja.api.guardarGasto, "Gasto registrado.", "Cambios guardados.");
    const [fCat, setFCat] = useState("");
    const [fTexto, setFTexto] = useState("");
    const importe = parseFloat(String(f.importe).replace(",", "."));
    const valido = f.fecha && f.concepto.trim() && Number.isFinite(importe) && importe > 0;
    const cargarEnForm = (g, duplicar) => {
      setEditId(duplicar ? null : g.id);
      setF({ fecha: duplicar ? todayISO() : g.fecha, concepto: g.concepto, proveedor: g.proveedor, categoria: g.categoria, importe: String(g.total_cents / 100).replace(".", ","), factura: duplicar ? "" : g.factura, notas: g.notas });
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const delMes = caja.gastos.filter((g) => (g.fecha || "").startsWith(month));
    const visibles = delMes.filter((g) => (!fCat || g.categoria === fCat) && (!fTexto.trim() || normName([g.concepto, g.proveedor, g.factura, g.notas].join(" ")).includes(normName(fTexto)))).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const suma = (k) => delMes.reduce((a, g) => a + g[k], 0);
    const porCat = {};
    for (const g of delMes) porCat[g.categoria] = (porCat[g.categoria] || 0) + g.total_cents;
    const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(1, ...cats.map((c) => c[1]));
    const proveedores = [...new Set(caja.gastos.map((g) => g.proveedor).filter(Boolean))].sort();
    const conceptos = [...new Set(caja.gastos.map((g) => g.concepto))].sort();
    const fila = (g) => h("div", { key: g.id, className: "cj-fila" },
      h("div", { className: "cj-fecha" }, h("b", null, (g.fecha || "").slice(8, 10)), MESES[Number((g.fecha || "").slice(5, 7)) - 1]),
      h("div", { style: { minWidth: 0 } },
        h("div", { className: "cj-titulo" }, g.concepto),
        h("div", { className: "cj-sub" }, [g.proveedor, g.factura && `Factura ${g.factura}`, g.notas].filter(Boolean).join(" · ")),
        h("div", { className: "cj-chips" }, h("span", { className: "cj-chip mute" }, g.categoria))),
      h("div", { className: "cj-importe" }, h("b", null, eurC(g.total_cents))),
      caja.puedeEditar && h("div", { className: "cj-acciones", style: { display: "flex" } },
        h("button", { className: "cj-ico", title: "Editar", "aria-label": `Editar ${g.concepto}`, onClick: () => cargarEnForm(g, false) }, "✎"),
        h("button", { className: "cj-ico", title: "Copiar con la fecha de hoy (p. ej. un gasto mensual)", "aria-label": `Duplicar ${g.concepto}`, onClick: () => cargarEnForm(g, true) }, "⧉"),
        h("button", { className: "cj-ico", title: "Eliminar", disabled: busy, "aria-label": `Eliminar ${g.concepto}`, onClick: () => { if (window.confirm(`¿Eliminar el gasto "${g.concepto}" de ${eurC(g.total_cents)}?`)) ejecutar(() => caja.api.borrarGasto(g.id), "Gasto eliminado."); } }, "\u{1F5D1}")));
    return h("div", { className: "cj-stack" },
      caja.puedeEditar && h("section", { className: "cj-card" },
        h("div", { className: "cj-between" },
          h("h2", { className: "axis-display", style: { margin: 0, fontSize: 24, textTransform: "uppercase" } }, editId ? "Editar gasto" : "Registrar gasto"),
          editId && h("button", { className: "cj-link", onClick: () => { setEditId(null); setF(vacioGasto()); } }, "Cancelar edición")),
        h("p", { className: "cj-hint", style: { margin: "6px 0 14px" } }, "Salidas de dinero de la caja (en efectivo). Se apunta el importe total que se paga."),
        h("div", { className: "cj-sec" },
          h("span", { className: "cj-eyebrow" }, "Gasto"),
          h("div", { className: "cj-grid2" },
            Campo({ etiqueta: "Concepto", children: h("input", { className: "cj-input", list: "caja-g-conceptos", value: f.concepto, placeholder: "Ej. Material de limpieza", onChange: (e) => setF((a) => ({ ...a, concepto: e.target.value })) }) }),
            Campo({ etiqueta: "Proveedor (opcional)", children: h("input", { className: "cj-input", list: "caja-g-proveedores", value: f.proveedor, onChange: (e) => setF((a) => ({ ...a, proveedor: e.target.value })) }) }),
            Campo({ etiqueta: "Categoría", children: h("select", { className: "cj-input", value: f.categoria, onChange: (e) => setF((a) => ({ ...a, categoria: e.target.value })) }, CATEGORIAS_GASTO.map((c) => h("option", { key: c, value: c }, c))) }),
            Campo({ etiqueta: "Fecha del gasto", children: h("input", { type: "date", className: "cj-input", value: f.fecha, onChange: (e) => setF((a) => ({ ...a, fecha: e.target.value })) }) })),
          h("datalist", { id: "caja-g-conceptos" }, conceptos.map((c) => h("option", { key: c, value: c }))),
          h("datalist", { id: "caja-g-proveedores" }, proveedores.map((c) => h("option", { key: c, value: c })))),
        h("div", { className: "cj-sec" },
          h("span", { className: "cj-eyebrow" }, "Importe"),
          h("div", { style: { maxWidth: 360 } },
            Campo({ etiqueta: "Importe (total)", children: h(InputEuro, { grande: true, value: f.importe, etiqueta: "Importe", onChange: (e) => setF((a) => ({ ...a, importe: e.target.value })) }) }))),
        h("div", { className: "cj-sec" },
          h("span", { className: "cj-eyebrow" }, "Detalles"),
          h("div", { className: "cj-grid2" },
            Campo({ etiqueta: "Nº de factura (opcional)", children: h("input", { className: "cj-input", value: f.factura, onChange: (e) => setF((a) => ({ ...a, factura: e.target.value })) }) }),
            Campo({ etiqueta: "Notas (opcional)", children: h("input", { className: "cj-input", value: f.notas, onChange: (e) => setF((a) => ({ ...a, notas: e.target.value })) }) }))),
        h("div", { style: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", paddingTop: 6 } },
          h("button", { className: "cj-btn accent", onClick: () => guardar({ ...f, importe }), disabled: !valido || busy }, editId ? "Guardar cambios" : "Registrar gasto"),
          h(Aviso, { msg }))),
      h("section", { className: "cj-card" },
        h("div", { className: "cj-between", style: { marginBottom: 16 } },
          h("div", { className: "cj-kpi" },
            h("div", null, h("div", { className: "cj-hint" }, "Gastado en el mes"), h("div", { className: "n" }, eurC(suma("total_cents"))), h("div", { className: "cj-hint" }, `${delMes.length} gasto(s)`))),
          h(BarraMes, { month, setMonth })),
        cats.length > 0 && h("div", { style: { display: "grid", gap: 8, margin: "0 0 18px" } },
          h("span", { className: "cj-eyebrow" }, "Por categoría"),
          cats.map(([c, v]) => h("div", { key: c, style: { display: "grid", gridTemplateColumns: "minmax(120px, 230px) 1fr 90px", gap: 10, alignItems: "center", fontSize: 13 } },
            h("span", null, c), h("div", { style: { background: SOFT, borderRadius: 6, height: 10 } }, h("div", { style: { width: `${Math.max(2, v / maxCat * 100)}%`, background: BAR_OUT, height: 10, borderRadius: 6 } })), h("b", { style: { textAlign: "right" } }, eurC(v))))),
        h("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 } },
          h("input", { className: "cj-input", style: { maxWidth: 300, height: 42 }, placeholder: "Buscar concepto, proveedor, factura…", value: fTexto, onChange: (e) => setFTexto(e.target.value), "aria-label": "Buscar gastos" }),
          h("select", { className: "cj-input", style: { maxWidth: 280, height: 42 }, value: fCat, onChange: (e) => setFCat(e.target.value), "aria-label": "Filtrar por categoría" }, h("option", { value: "" }, "Todas las categorías"), CATEGORIAS_GASTO.map((c) => h("option", { key: c, value: c }, c)))),
        visibles.length === 0 ? h("p", { className: "cj-hint", style: { margin: 0 } }, delMes.length ? "Ningún gasto coincide con el filtro." : "No hay gastos registrados en este mes.") : h("div", null, visibles.map(fila))));
  }

  /* ---------- balance (caja de efectivo) ---------- */
  // Movimientos de la caja en céntimos: entradas (cobros) y salidas (gastos), siempre importes totales.
  function movimientos(pagosCaja, gastos) {
    const m = [];
    for (const c of pagosCaja) if (c.estado === "cobrado" && c.importe_cents > 0) m.push({ fecha: c.fecha, tipo: "in", cents: c.importe_cents, cat: catFromConcept(c.concepto), vend: c.vendedor || "Sin indicar" });
    for (const g of gastos) if (g.estado === "pagado") m.push({ fecha: g.fecha, tipo: "out", cents: g.total_cents, cat: g.categoria });
    return m;
  }

  // Resumen por meses de un año, con el acumulado (efectivo inicial + todo lo anterior).
  function calcularBalance(movs, config, anio, hoy) {
    const desde = (config && config.saldo_inicial_fecha) || "0000-00-00";
    const validos = movs.filter((m) => m.fecha >= desde);
    const firmado = (m) => (m.tipo === "in" ? m.cents : -m.cents);
    const inicial = (config && config.saldo_inicial_efectivo_cents) || 0;
    let acum = inicial;
    for (const m of validos) if (m.fecha.slice(0, 4) < String(anio)) acum += firmado(m);
    const apertura = acum;
    const meses = [];
    for (let i = 1; i <= 12; i++) {
      const ym = `${anio}-${String(i).padStart(2, "0")}`;
      let ent = 0, sal = 0;
      for (const m of validos) {
        if (m.fecha.slice(0, 7) !== ym) continue;
        if (m.tipo === "in") ent += m.cents; else sal += m.cents;
      }
      acum += ent - sal;
      meses.push({ ym, ent, sal, neto: ent - sal, acum });
    }
    let actual = inicial;
    for (const m of validos) if (m.fecha <= hoy) actual += firmado(m);
    return { apertura, meses, actual, desde: config && config.saldo_inicial_fecha };
  }

  function descargarCSV(nombre, filas) {
    const csv = "\uFEFF" + filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const num = (c) => (c / 100).toFixed(2).replace(".", ",");
  // Un texto que empiece por = + - @ lo ejecutaría Excel como fórmula: se neutraliza con un apóstrofo.
  const txt = (s) => { const t = String(s == null ? "" : s); return /^[=+\-@]/.test(t) ? "'" + t : t; };

  // Todos los cobros y gastos registrados (todas las fechas) en un solo CSV.
  function exportarTodo(caja) {
    const cabecera = ["Fecha", "Tipo", "Concepto", "Cliente / proveedor", "Categoría", "Importe", "Vendedor", "Nº factura", "Sesiones incluidas", "Notas", "Registrado por", "Alta"];
    const filas = [
      ...caja.pagos.map((c) => [c.fecha, "Cobro", txt(c.concepto), txt(c.cliente_nombre), "", num(c.importe_cents), txt(c.vendedor), "", resumenServicios(c.servicios), txt(c.notas), txt(c.creado_por), (c.created_at || "").slice(0, 10)]),
      ...caja.gastos.map((g) => [g.fecha, "Gasto", txt(g.concepto), txt(g.proveedor), txt(g.categoria), num(g.total_cents), "", txt(g.factura), "", txt(g.notas), txt(g.creado_por), (g.created_at || "").slice(0, 10)])
    ].sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
    descargarCSV(`caja-axis-${todayISO()}.csv`, [cabecera, ...filas]);
  }

  function BalanceCaja({ caja, month, setMonth }) {
    const [cfg, setCfg] = useState({ efectivo: "", fecha: "" });
    const [msg, setMsg] = useState("");
    useEffect(() => {
      const c = caja.config;
      setCfg({ efectivo: String((c.saldo_inicial_efectivo_cents || 0) / 100).replace(".", ","), fecha: c.saldo_inicial_fecha || "" });
    }, [caja.config]);
    const anio = Number(month.slice(0, 4)), hoy = todayISO();
    const movs = useMemo(() => movimientos(caja.pagos, caja.gastos), [caja.pagos, caja.gastos]);
    const b = useMemo(() => calcularBalance(movs, caja.config, anio, hoy), [movs, caja.config, anio, hoy]);
    const sel = b.meses.find((m) => m.ym === month) || b.meses[0];
    const total = b.meses.reduce((a, m) => ({ ent: a.ent + m.ent, sal: a.sal + m.sal }), { ent: 0, sal: 0 });
    const max = Math.max(1, ...b.meses.map((m) => Math.max(m.ent, m.sal)));
    const delMes = movs.filter((m) => m.fecha.slice(0, 7) === sel.ym && m.fecha >= (b.desde || "0000"));
    const agrupar = (tipo, clave) => {
      const r = {};
      for (const m of delMes) if (m.tipo === tipo) r[clave(m)] = (r[clave(m)] || 0) + m.cents;
      return Object.entries(r).sort((a, c) => c[1] - a[1]);
    };
    const bloque = (titulo, datos, color) => {
      const mx = Math.max(1, ...datos.map((d) => d[1]));
      return h("div", { style: { display: "grid", gap: 5, alignContent: "start" } },
        h("div", { style: { fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: ".04em" } }, titulo),
        datos.length === 0 ? h("span", { style: { fontSize: 12, color: MUTED } }, "—") : datos.map(([k, v]) => h("div", { key: k, style: { display: "grid", gridTemplateColumns: "minmax(90px, 160px) 1fr 80px", gap: 8, alignItems: "center", fontSize: 12 } },
          h("span", null, k), h("div", { style: { background: SOFT, borderRadius: 4, height: 8 } }, h("div", { style: { width: `${Math.max(2, v / mx * 100)}%`, background: color, height: 8, borderRadius: 4 } })), h("b", { style: { textAlign: "right" } }, eurC(v)))));
    };
    const tarjeta = (titulo, valor, color, sub) => h("div", { style: { ...box, padding: 12, minWidth: 150, flex: "1 1 150px" } },
      h("div", { style: { fontSize: 12, color: MUTED } }, titulo), h("div", { className: "axis-display", style: { fontSize: 26, fontWeight: 700, color: color || INK } }, valor), sub && h("div", { style: { fontSize: 11, color: MUTED } }, sub));
    const guardarCfg = async () => {
      const cents = Math.round((parseFloat(String(cfg.efectivo).replace(",", ".")) || 0) * 100);
      try { await caja.api.guardarConfig({ efectivo: cents, fecha: cfg.fecha }); setMsg("Efectivo inicial guardado."); } catch (e) { setMsg("No se ha guardado: " + (e.message || e)); }
    };
    const exportar = () => descargarCSV(`balance-caja-${anio}.csv`, [
      ["Mes", "Entradas", "Salidas", "Neto", "Acumulado"],
      ...b.meses.map((m) => [m.ym, num(m.ent), num(m.sal), num(m.neto), num(m.acum)]),
      ["Total " + anio, num(total.ent), num(total.sal), num(total.ent - total.sal), ""]]);
    const exportarMov = () => descargarCSV(`movimientos-caja-${anio}.csv`, [
      ["Fecha", "Tipo", "Concepto", "Cliente / proveedor", "Categoría", "Importe", "Vendedor", "Factura", "Notas"],
      ...[...caja.pagos.filter((c) => c.fecha.startsWith(String(anio))).map((c) => [c.fecha, "Cobro", c.concepto, c.cliente_nombre, "", num(c.importe_cents), c.vendedor, "", c.notas]),
        ...caja.gastos.filter((g) => g.fecha.startsWith(String(anio))).map((g) => [g.fecha, "Gasto", g.concepto, g.proveedor, g.categoria, num(g.total_cents), "", g.factura, g.notas])].sort((a, c) => a[0].localeCompare(c[0]))]);
    const th = { padding: "6px 8px", borderBottom: `2px solid ${INK}`, fontSize: 12, color: MUTED, textAlign: "right", whiteSpace: "nowrap" };
    const td = { padding: "7px 8px", borderBottom: `1px solid ${SOFT}`, fontSize: 13, textAlign: "right", whiteSpace: "nowrap" };
    const col = (v) => (v > 0 ? BAR_IN : v < 0 ? BAD : INK);

    return h("div", { className: "cj-stack" },
      h("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
        tarjeta("Efectivo en caja ahora", eurC(b.actual), col(b.actual), `a ${hoy}`),
        tarjeta(`Entradas · ${MESES[Number(sel.ym.slice(5)) - 1]}`, eurC(sel.ent), BAR_IN, "cobros del mes"),
        tarjeta(`Salidas · ${MESES[Number(sel.ym.slice(5)) - 1]}`, eurC(sel.sal), sel.sal ? BAR_OUT : INK, "gastos del mes"),
        tarjeta(`Neto · ${MESES[Number(sel.ym.slice(5)) - 1]}`, eurC(sel.neto), col(sel.neto), "entradas − salidas")),
      h("section", { style: box },
        h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
          h("button", { className: "axis-btn ghost", onClick: () => setMonth(`${anio - 1}-${month.slice(5)}`), "aria-label": "Año anterior" }, "←"),
          h("h2", { className: "axis-display", style: { margin: 0, fontSize: 22 } }, anio),
          h("button", { className: "axis-btn ghost", onClick: () => setMonth(`${anio + 1}-${month.slice(5)}`), "aria-label": "Año siguiente" }, "→"),
          h("span", { style: { marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" } },
            h("button", { className: "axis-btn ghost", onClick: exportar }, "Descargar balance (CSV)"),
            h("button", { className: "axis-btn ghost", onClick: exportarMov }, "Descargar movimientos (CSV)"))),
        h("div", { role: "img", "aria-label": "Entradas y salidas por mes", style: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4, alignItems: "end", height: 130, marginBottom: 6 } },
          b.meses.map((m, i) => h("button", { key: m.ym, onClick: () => setMonth(m.ym), title: `${MESES[i]}: entradas ${eurC(m.ent)} · salidas ${eurC(m.sal)}`, style: { all: "unset", cursor: "pointer", display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center", height: "100%", borderRadius: 4, background: m.ym === sel.ym ? SOFT : "transparent" } },
            h("div", { style: { width: "36%", height: `${m.ent / max * 100}%`, minHeight: m.ent ? 2 : 0, background: BAR_IN, borderRadius: "3px 3px 0 0" } }),
            h("div", { style: { width: "36%", height: `${m.sal / max * 100}%`, minHeight: m.sal ? 2 : 0, background: BAR_OUT, borderRadius: "3px 3px 0 0" } })))),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4, fontSize: 11, color: MUTED, textAlign: "center", marginBottom: 12 } }, MESES.map((n) => h("span", { key: n }, n))),
        h("div", { style: { fontSize: 12, color: MUTED, marginBottom: 10 } }, h("span", { style: { color: BAR_IN } }, "■ "), "Entradas  ", h("span", { style: { color: BAR_OUT } }, "■ "), "Salidas"),
        h("div", { style: { overflowX: "auto" } }, h("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 560 } },
          h("thead", null, h("tr", null, h("th", { style: { ...th, textAlign: "left" } }, "Mes"), ["Entradas", "Salidas", "Neto del mes", "Efectivo acumulado"].map((t) => h("th", { key: t, style: th }, t)))),
          h("tbody", null,
            h("tr", null, h("td", { style: { ...td, textAlign: "left", color: MUTED } }, `Efectivo al empezar ${anio}`), h("td", { style: td }), h("td", { style: td }), h("td", { style: td }), h("td", { style: { ...td, color: MUTED } }, eurC(b.apertura))),
            b.meses.map((m, i) => h("tr", { key: m.ym, onClick: () => setMonth(m.ym), style: { cursor: "pointer", background: m.ym === sel.ym ? SOFT : "transparent", opacity: m.ym > hoy.slice(0, 7) && !m.ent && !m.sal ? 0.5 : 1 } },
              h("td", { style: { ...td, textAlign: "left", fontWeight: m.ym === sel.ym ? 700 : 400 } }, MESES[i]),
              h("td", { style: { ...td, color: m.ent ? BAR_IN : MUTED } }, eurC(m.ent)),
              h("td", { style: { ...td, color: m.sal ? BAR_OUT : MUTED } }, eurC(m.sal)),
              h("td", { style: { ...td, fontWeight: 600, color: col(m.neto) } }, eurC(m.neto)),
              h("td", { style: { ...td, fontWeight: 700, color: col(m.acum) } }, eurC(m.acum)))),
            h("tr", null, h("td", { style: { ...td, textAlign: "left", fontWeight: 700, borderTop: `2px solid ${INK}` } }, `Total ${anio}`),
              h("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${INK}` } }, eurC(total.ent)), h("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${INK}` } }, eurC(total.sal)),
              h("td", { style: { ...td, fontWeight: 700, borderTop: `2px solid ${INK}`, color: col(total.ent - total.sal) } }, eurC(total.ent - total.sal)),
              h("td", { style: { ...td, borderTop: `2px solid ${INK}` } }))))),
        b.desde && h("p", { style: { margin: "8px 0 0", fontSize: 12, color: MUTED } }, `Se cuenta desde el ${b.desde}: lo anterior a esa fecha se ignora.`)),
      h("section", { style: box },
        h("h3", { style: { margin: "0 0 4px", fontSize: 16 } }, `${MESES[Number(sel.ym.slice(5)) - 1]} ${anio}: `, h("span", { style: { color: col(sel.neto) } }, eurC(sel.neto)), h("span", { style: { fontSize: 13, fontWeight: 400, color: MUTED } }, `  (entradas ${eurC(sel.ent)} − salidas ${eurC(sel.sal)})`)),
        h("p", { style: { margin: "0 0 12px", fontSize: 12, color: MUTED } }, `Efectivo acumulado a final de mes: ${eurC(sel.acum)}.`),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 } },
          bloque("Entradas por producto", agrupar("in", (m) => m.cat), BAR_IN),
          bloque("Entradas por vendedor", agrupar("in", (m) => m.vend), BAR_IN),
          bloque("Salidas por categoría", agrupar("out", (m) => m.cat), BAR_OUT)),
        h("p", { style: { margin: "12px 0 0", fontSize: 12, color: MUTED } }, "Es una caja de efectivo: cada cobro y cada gasto se cuenta en su fecha, por su importe total.")),
      caja.esAdmin && h("details", { style: box },
        h("summary", { style: { cursor: "pointer", fontWeight: 600, fontSize: 14 } }, "Efectivo inicial de la caja"),
        h("p", { style: { margin: "10px 0", fontSize: 13, color: MUTED } }, "Con cuánto efectivo empieza a contar el acumulado. Si indicas una fecha, solo se cuentan los movimientos desde ese día (todo lo anterior se ignora)."),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, maxWidth: 420 } },
          h("label", { style: lbl }, "Efectivo inicial (€)", h("input", { className: "axis-input", inputMode: "decimal", value: cfg.efectivo, onChange: (e) => setCfg({ ...cfg, efectivo: e.target.value }) })),
          h("label", { style: lbl }, "Contar desde (opcional)", h("input", { type: "date", className: "axis-input", value: cfg.fecha, onChange: (e) => setCfg({ ...cfg, fecha: e.target.value }) }))),
        h("div", { style: { marginTop: 10, display: "flex", gap: 12, alignItems: "center" } }, h("button", { className: "axis-btn primary", onClick: guardarCfg }, "Guardar"), msg && h("span", { style: { fontSize: 13, color: GOOD } }, msg))));
  }

  /* ---------- contenedor: acceso, cabecera y pestañas ---------- */
  const PESTANAS = [["pagos", "Cobros"], ["gastos", "Gastos"], ["balance", "Balance"], ["tarifas", "Tarifas"]];
  function CajaTab({ caja, month, setMonth }) {
    const [sub, setSub] = useState(() => { try { return localStorage.getItem("axis-caja-sub") || "pagos"; } catch (e) { return "pagos"; } });
    const elegir = (id) => { setSub(id); try { localStorage.setItem("axis-caja-sub", id); } catch (e) { /* sin guardar */ } };
    const centrado = (...hijos) => h("div", { style: { maxWidth: 440, margin: "0 auto", padding: "56px 20px" } }, h("div", { className: "cj-card cj-stack", style: { gap: 18 } }, ...hijos));

    if (caja.estado === "cargando") return h("div", { style: { padding: "56px 20px", textAlign: "center", color: MUTED } }, "Conectando con la Caja…");
    if (caja.estado === "sin-sesion" || caja.estado === "error" && !caja.sesion) {
      return centrado(h(Marca), h("p", { className: "cj-hint", style: { margin: 0 } }, "Entra con tu usuario para ver y registrar los cobros, los gastos y el balance. Los cambios se ven al instante en todos los dispositivos."),
        caja.error && h("div", { className: "cj-aviso mal" }, caja.error), caja.estado === "sin-sesion" && h(Login, { caja }));
    }
    if (caja.estado === "sin-acceso") {
      return centrado(h(Marca), h("p", { style: { margin: 0 } }, `Has entrado como ${caja.sesion.user.email}, pero ese usuario no tiene acceso a la Caja. Pide que te añadan.`), h("button", { className: "cj-btn sec", onClick: () => caja.api.salir() }, "Salir"));
    }
    return h("div", { style: { maxWidth: 1100, margin: "0 auto", padding: "0 22px 56px" } },
      h("header", { className: "cj-between", style: { padding: "22px 0 4px" } },
        h(Marca, null),
        h("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } },
          h("span", { style: { fontSize: 12.5, color: caja.desactualizado ? WARN : MUTED } }, caja.desactualizado ? "⚠ Sin conexión: datos guardados" : caja.enVivo ? "● En tiempo real" : "Conectando…", ` · ${caja.sesion.user.email} (${caja.rol})`),
          h("button", { className: "cj-btn sec sm", disabled: !caja.pagos.length && !caja.gastos.length, title: "Un único CSV con todos los cobros y gastos registrados, de todas las fechas", onClick: () => exportarTodo(caja) }, "⬇ Descargar CSV"),
          h("button", { className: "cj-link", style: { color: MUTED }, onClick: () => caja.api.salir() }, "Salir"))),
      h("nav", { className: "cj-tabs", role: "tablist", "aria-label": "Secciones de la Caja", style: { marginBottom: 22 } }, PESTANAS.map(([id, t]) => h("button", { key: id, role: "tab", "aria-selected": sub === id, className: "cj-tab" + (sub === id ? " on" : ""), onClick: () => elegir(id) }, t))),
      caja.error && h("div", { className: "cj-aviso mal", style: { marginBottom: 18 } }, caja.error),
      sub === "pagos" && h(PagosCaja, { caja, month, setMonth }),
      sub === "gastos" && h(GastosCaja, { caja, month, setMonth }),
      sub === "balance" && h(BalanceCaja, { caja, month, setMonth }),
      sub === "tarifas" && h(TarifasCaja, { caja }));
  }

  function App() {
    const caja = useCaja();
    const [month, setMonth] = useState(todayISO().slice(0, 7));
    return h(CajaTab, { caja, month, setMonth });
  }

  if (embebida) {
    window.CajaApp = { useCaja, CajaTab, App };
  } else {
    window.CajaAxis = { movimientos, calcularBalance, CajaTab, SelectorLista };
    const raiz = document.getElementById("root");
    if (raiz) ReactDOM.createRoot(raiz).render(h(App));
  }
})();
