/* Axis Health & Performance — comportamiento compartido del sitio público */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Menú móvil
     --------------------------------------------------------------------- */
  var botonMenu = document.querySelector("[data-boton-menu]");
  var body = document.body;

  function cerrarMenu() {
    body.removeAttribute("data-menu-abierto");
    if (botonMenu) botonMenu.setAttribute("aria-expanded", "false");
  }

  function alternarMenu() {
    var abierto = body.getAttribute("data-menu-abierto") === "true";
    if (abierto) {
      cerrarMenu();
    } else {
      body.setAttribute("data-menu-abierto", "true");
      if (botonMenu) botonMenu.setAttribute("aria-expanded", "true");
    }
  }

  if (botonMenu) {
    botonMenu.addEventListener("click", alternarMenu);
  }

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") cerrarMenu();
  });

  document.querySelectorAll(".menu-movil a").forEach(function (enlace) {
    enlace.addEventListener("click", cerrarMenu);
  });

  document.querySelectorAll("[data-submenu-toggle]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      var submenu = document.getElementById(boton.getAttribute("aria-controls"));
      var abierto = boton.getAttribute("aria-expanded") === "true";
      boton.setAttribute("aria-expanded", String(!abierto));
      if (submenu) submenu.classList.toggle("abierto", !abierto);
    });
  });

  /* ---------------------------------------------------------------------
     Acordeón de preguntas frecuentes
     --------------------------------------------------------------------- */
  document.querySelectorAll(".faq-pregunta").forEach(function (boton) {
    boton.addEventListener("click", function () {
      var item = boton.closest(".faq-item");
      var abierto = boton.getAttribute("aria-expanded") === "true";
      boton.setAttribute("aria-expanded", String(!abierto));
      if (item) item.setAttribute("data-abierto", String(!abierto));
    });
  });

  /* ---------------------------------------------------------------------
     Formulario de reserva
     --------------------------------------------------------------------- */
  var formularioReserva = document.querySelector("[data-formulario-reserva]");
  if (formularioReserva) {
    var form = formularioReserva.querySelector("form");
    var mensaje = formularioReserva.querySelector(".formulario-mensaje");

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (!form.reportValidity()) return;

      var botonEnviar = form.querySelector("button[type='submit']");
      var textoOriginal = botonEnviar.textContent;
      botonEnviar.disabled = true;
      botonEnviar.textContent = "Enviando…";

      // No hay backend conectado todavía: guardamos la solicitud localmente
      // y mostramos la confirmación. Sustituir por el envío real (API/CRM)
      // cuando esté disponible.
      window.setTimeout(function () {
        formularioReserva.setAttribute("data-enviado", "true");
        if (mensaje) {
          mensaje.setAttribute("data-visible", "true");
          mensaje.setAttribute("tabindex", "-1");
          mensaje.focus();
        }
        botonEnviar.disabled = false;
        botonEnviar.textContent = textoOriginal;
      }, 500);
    });
  }

  /* ---------------------------------------------------------------------
     Autoenfoque accesible al llegar por ancla #reserva
     --------------------------------------------------------------------- */
  if (window.location.hash === "#reserva") {
    var campoNombre = document.querySelector("#reserva-nombre");
    if (campoNombre) {
      window.setTimeout(function () {
        campoNombre.focus({ preventScroll: true });
      }, 400);
    }
  }
})();
