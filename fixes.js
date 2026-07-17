/* Axis · Panel de salas — correcciones
   1) Añade a Sergio a la lista de coaches (no estaba y por eso ni aparecía
      como usuario ni se le asignaban sus sesiones al importar).
   2) Reparte lado a lado las sesiones que coinciden en hora y sala, en vez
      de dibujarlas una encima de otra (AimHarder no envía la sala, así que
      todo cae en Sala 1 y las sesiones simultáneas se tapaban — p. ej. el
      Grupo Reducido de Marc a las 10h quedaba oculto tras las de Erik).
   IMPORTANTE: este script debe cargarse ANTES que panel.js en index.html.
*/
(function () {
  /* ---------- 1) Coaches que faltan ---------- */
  var DEFAULTS = [
    { id: "erik", name: "Erik Benavides", role: "Entrenador personal / Fisio", color: "#0D9488", email: "" },
    { id: "marc", name: "Marc Rosa", role: "Entrenador personal", color: "#2563EB", email: "" },
    { id: "daniel", name: "Daniel Rodriguez", role: "Entrenador personal", color: "#D97706", email: "" }
  ];
  var MISSING = [
    { id: "sergio", name: "Sergio", role: "Entrenador personal", color: "#7C3AED", email: "" }
  ];
  try {
    var raw = window.localStorage.getItem("axis-coaches");
    var coaches = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(coaches)) coaches = DEFAULTS.slice();
    var changed = !raw;
    MISSING.forEach(function (fix) {
      if (!coaches.some(function (c) { return c && c.id === fix.id; })) {
        coaches.push(fix);
        changed = true;
      }
    });
    if (changed) window.localStorage.setItem("axis-coaches", JSON.stringify(coaches));

    /* Re-vincular sesiones ya importadas que quedaron sin coach porque
       Sergio no existía cuando se importaron. */
    var sraw = window.localStorage.getItem("axis-sessions");
    var sessions = sraw ? JSON.parse(sraw) : [];
    if (Array.isArray(sessions) && sessions.length) {
      var fixedAny = false;
      sessions.forEach(function (s) {
        if (s && !s.coachId && s.coachRaw) {
          var rawName = String(s.coachRaw).toLowerCase();
          MISSING.forEach(function (fix) {
            if (rawName.indexOf(fix.name.toLowerCase()) !== -1) {
              s.coachId = fix.id;
              fixedAny = true;
            }
          });
        }
      });
      if (fixedAny) window.localStorage.setItem("axis-sessions", JSON.stringify(sessions));
    }
  } catch (e) { /* nunca romper el panel por esto */ }

  /* ---------- 2) Sesiones solapadas lado a lado ---------- */
  function layoutColumn(col) {
    var blocks = Array.prototype.slice.call(col.querySelectorAll(":scope > .sess-block"));
    if (!blocks.length) return;
    var items = blocks.map(function (b) {
      return { el: b, top: parseFloat(b.style.top) || 0, h: parseFloat(b.style.height) || 0 };
    }).sort(function (a, b) { return a.top - b.top || a.h - b.h; });

    var clusters = [];
    var current = [];
    var currentEnd = -1;
    items.forEach(function (it) {
      if (!current.length || it.top < currentEnd - 1) {
        current.push(it);
        currentEnd = Math.max(currentEnd, it.top + it.h);
      } else {
        clusters.push(current);
        current = [it];
        currentEnd = it.top + it.h;
      }
    });
    if (current.length) clusters.push(current);

    clusters.forEach(function (cluster) {
      var n = cluster.length;
      cluster.forEach(function (it, i) {
        if (n === 1) {
          it.el.style.left = "4px";
          it.el.style.right = "4px";
          it.el.style.width = "";
        } else {
          var w = 100 / n;
          it.el.style.left = "calc(" + (i * w).toFixed(3) + "% + 3px)";
          it.el.style.right = "auto";
          it.el.style.width = "calc(" + w.toFixed(3) + "% - 6px)";
        }
      });
    });
  }

  var scheduled = false;
  function relayoutAll() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      var parents = [];
      document.querySelectorAll(".sess-block").forEach(function (b) {
        if (parents.indexOf(b.parentElement) === -1) parents.push(b.parentElement);
      });
      parents.forEach(layoutColumn);
    });
  }

  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].type === "childList") { relayoutAll(); return; }
    }
  });

  function startObserver() {
    var root = document.getElementById("root");
    if (!root) { setTimeout(startObserver, 300); return; }
    mo.observe(root, { childList: true, subtree: true });
    relayoutAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
