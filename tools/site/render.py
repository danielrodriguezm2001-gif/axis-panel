# -*- coding: utf-8 -*-
"""Motor de plantillas del sitio publico de Axis (sin dependencias externas)."""
import html
import re

SITE_NAME = "Axis Health & Performance"
BASE_URL = "https://www.theaxistraining.es"
PHONE_DISPLAY = "+34 638 09 89 07"
PHONE_TEL = "+34638098907"
WHATSAPP_MSG = "Hola, quiero información sobre la sesión de presentación de Axis."
WHATSAPP_URL = "https://wa.me/34638098907?text=" + WHATSAPP_MSG.replace(" ", "%20")
INSTAGRAM_URL = "https://www.instagram.com/axis.athletes/"
ADDRESS = "Carrer de la Creativitat, 4B · 08850 Gavà (Barcelona)"
MAPS_EMBED = "https://www.google.com/maps?q=Carrer+de+la+Creativitat+4B+08850+Gav%C3%A0&output=embed"
MAPS_LINK = "https://www.google.com/maps/search/?api=1&query=Carrer+de+la+Creativitat+4B+08850+Gav%C3%A0"
RESERVA_HREF = "/es/valoracion-inicial/#reserva"

SERVICIOS_MENU = [
    ("Entrenamiento personal", "/es/entrenamiento-personal/"),
    ("The Axis Club", "/es/axis-club/"),
    ("Performance Group", "/es/preparacion-fisica-deportistas/"),
    ("Fisioterapia", "/es/fisioterapia/"),
    ("Readaptación de lesiones", "/es/readaptacion-lesiones/"),
    ("Nutrición", "/es/nutricion/"),
    ("Psicología", "/es/psicologia/"),
]

FOOTER_SERVICIOS = SERVICIOS_MENU

FOOTER_AXIS = [
    ("Método Live in Loop", "/es/metodo-live-in-loop/"),
    ("Equipo", "/es/equipo/"),
    ("Preguntas frecuentes", "/es/preguntas-frecuentes/"),
    ("Blog", "/es/blog/"),
]

FOOTER_LEGAL = [
    ("Aviso legal", "/es/legal/aviso-legal/"),
    ("Privacidad", "/es/legal/privacidad/"),
    ("Cookies", "/es/legal/cookies/"),
    ("Accesibilidad", "/es/legal/accesibilidad/"),
]


def esc(texto):
    return html.escape(texto, quote=True)


def svg_check():
    return (
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">'
        '<circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.14"/>'
        '<path d="M6 10.2l2.4 2.4L14 7" stroke="currentColor" stroke-width="1.8" '
        'stroke-linecap="round" stroke-linejoin="round"/></svg>'
    )


def svg_arrow():
    return (
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">'
        '<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" '
        'stroke-linecap="round" stroke-linejoin="round"/></svg>'
    )


def svg_chevron():
    return (
        '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">'
        '<path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" stroke-width="1.8" '
        'stroke-linecap="round" stroke-linejoin="round"/></svg>'
    )


def enlace_flecha(texto, href):
    return (
        f'<a class="enlace-flecha" href="{esc(href)}">{esc(texto)} {svg_arrow()}</a>'
    )


def slugify(texto):
    texto = texto.lower()
    reemplazos = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n", "ü": "u",
    }
    for k, v in reemplazos.items():
        texto = texto.replace(k, v)
    texto = re.sub(r"[^a-z0-9]+", "-", texto).strip("-")
    return texto


# ---------------------------------------------------------------------------
# Cabecera / navegacion
# ---------------------------------------------------------------------------

def render_header(idioma_activo="ES"):
    servicios_desktop = "".join(
        f'<li><a href="{esc(href)}">{esc(nombre)}</a></li>'
        for nombre, href in SERVICIOS_MENU
    )
    servicios_movil = "".join(
        f'<li><a href="{esc(href)}">{esc(nombre)}</a></li>'
        for nombre, href in SERVICIOS_MENU
    )

    return f"""
<a class="skip-link" href="#contenido-principal">Saltar al contenido principal</a>
<header class="header-site">
  <div class="contenedor header-barra">
    <a class="logo-enlace" href="/es/" aria-label="Axis Health & Performance — ir al inicio">
      <img src="/assets/logos/axis-logo-verde-480.png" alt="Axis Health &amp; Performance" width="220" height="82" />
    </a>

    <nav class="nav-principal" aria-label="Navegación principal">
      <ul style="display:flex;align-items:center;gap:6px;">
        <li class="grupo-nav">
          <button class="nav-enlace" aria-haspopup="true" aria-expanded="false" type="button">
            Servicios {svg_chevron()}
          </button>
          <ul class="nav-desplegable">{servicios_desktop}</ul>
        </li>
        <li><a class="nav-enlace" href="/es/metodo-live-in-loop/">Método</a></li>
        <li><a class="nav-enlace" href="/es/equipo/">Equipo</a></li>
        <li><a class="nav-enlace" href="/es/blog/">Blog</a></li>
        <li><a class="nav-enlace" href="{esc(RESERVA_HREF)}">Contacto</a></li>
      </ul>
    </nav>

    <div class="header-acciones">
      <div class="selector-idioma" role="group" aria-label="Selector de idioma">
        <button type="button" aria-current="true">ES</button>
        <button type="button" disabled title="Disponible próximamente">CA</button>
      </div>
      <a class="boton boton-primario header-cta" href="{esc(RESERVA_HREF)}">Reserva tu sesión</a>
      <button class="boton-menu-movil" type="button" data-boton-menu aria-expanded="false" aria-controls="menu-movil" aria-label="Abrir menú">
        <svg class="icono-abrir" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <svg class="icono-cerrar" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>
</header>

  <div class="menu-movil" id="menu-movil">
    <ul>
      <li>
        <button class="menu-movil-enlace" type="button" data-submenu-toggle aria-expanded="false" aria-controls="submenu-servicios">
          Servicios {svg_chevron()}
        </button>
        <div class="submenu-movil" id="submenu-servicios">
          <ul>{servicios_movil}</ul>
        </div>
      </li>
      <li><a class="menu-movil-enlace" href="/es/metodo-live-in-loop/">Método</a></li>
      <li><a class="menu-movil-enlace" href="/es/equipo/">Equipo</a></li>
      <li><a class="menu-movil-enlace" href="/es/blog/">Blog</a></li>
      <li><a class="menu-movil-enlace" href="{esc(RESERVA_HREF)}">Contacto</a></li>
    </ul>
    <div class="menu-movil-cta">
      <a class="boton boton-primario" href="{esc(RESERVA_HREF)}">Reserva tu sesión</a>
      <a class="boton boton-whatsapp" href="{esc(WHATSAPP_URL)}" target="_blank" rel="noopener">Habla con nosotros por WhatsApp</a>
    </div>
    <div class="menu-movil-idiomas" role="group" aria-label="Selector de idioma">
      <button type="button" aria-current="true">ES</button>
      <button type="button" disabled title="Disponible próximamente">CA</button>
    </div>
  </div>
"""


def render_barra_movil():
    return f"""
<div class="barra-movil">
  <a class="boton boton-primario" href="{esc(RESERVA_HREF)}">Reserva tu sesión</a>
  <a class="boton boton-whatsapp" href="{esc(WHATSAPP_URL)}" target="_blank" rel="noopener" aria-label="Habla con nosotros por WhatsApp">WhatsApp</a>
</div>
"""


def render_footer():
    servicios = "".join(f'<li><a href="{esc(h)}">{esc(n)}</a></li>' for n, h in FOOTER_SERVICIOS)
    axis_links = "".join(f'<li><a href="{esc(h)}">{esc(n)}</a></li>' for n, h in FOOTER_AXIS)
    legal_links = "".join(f'<li><a href="{esc(h)}">{esc(n)}</a></li>' for n, h in FOOTER_LEGAL)

    return f"""
<footer class="footer-site">
  <div class="contenedor">
    <div class="footer-top">
      <div class="footer-marca">
        <img src="/assets/logos/axis-logo-blanco-480.png" alt="Axis Health &amp; Performance" width="180" height="67" />
        <p>Centro de entrenamiento personal, fisioterapia y readaptación en Gavà.</p>
        <div class="footer-contacto">
          <a href="tel:{esc(PHONE_TEL)}">{esc(PHONE_DISPLAY)}</a>
          <a href="{esc(WHATSAPP_URL)}" target="_blank" rel="noopener">WhatsApp</a>
          <a href="{esc(MAPS_LINK)}" target="_blank" rel="noopener">{esc(ADDRESS)} — Cómo llegar</a>
          <span>Horario: [pendiente]</span>
        </div>
        <a class="footer-social" href="{esc(INSTAGRAM_URL)}" target="_blank" rel="noopener">Instagram @axis.athletes</a>
      </div>
      <div class="footer-col">
        <h4>Servicios</h4>
        <ul>{servicios}</ul>
      </div>
      <div class="footer-col">
        <h4>Axis</h4>
        <ul>{axis_links}</ul>
      </div>
    </div>
    <div class="footer-legal">
      <span>© {{anio}} The Athlete Loop Fisioterapia y Entrenamiento, S.L. [pendiente confirmar razón social] — {esc(SITE_NAME)}</span>
      <ul>{legal_links}</ul>
    </div>
    <p class="footer-logos-kit">Cofinanciado por los fondos NextGenerationEU en el marco del programa Kit Digital (logos del Kit Digital pendientes de incorporar).</p>
  </div>
</footer>
""".replace("{anio}", "2026")


# ---------------------------------------------------------------------------
# Bloque de cierre "Entra en el Loop"
# ---------------------------------------------------------------------------

def render_cierre_loop():
    return f"""
<section class="seccion" aria-labelledby="cierre-loop-titulo">
  <div class="cierre-loop">
    <h2 id="cierre-loop-titulo">Entra en el Loop.</h2>
    <p>Empieza con una sesión de presentación de 20 a 30 minutos, sin coste. Nos cuentas qué buscas, te explicamos cómo trabajamos y decidimos juntos el punto de partida.</p>
    <div class="grupo-botones">
      <a class="boton boton-primario" href="{esc(RESERVA_HREF)}">Reserva tu sesión de presentación</a>
    </div>
  </div>
</section>
"""


# ---------------------------------------------------------------------------
# Migas de pan
# ---------------------------------------------------------------------------

def render_migas(items):
    # items: list of (texto, href_or_None)
    lis = []
    for texto, href in items:
        if href:
            lis.append(f'<li><a href="{esc(href)}">{esc(texto)}</a></li>')
        else:
            lis.append(f'<li aria-current="page">{esc(texto)}</li>')
    return f"""
<nav class="migas contenedor" aria-label="Migas de pan">
  <ol>{"".join(lis)}</ol>
</nav>
"""


def breadcrumb_schema(items):
    elementos = []
    for i, (texto, href) in enumerate(items, start=1):
        item = {"@type": "ListItem", "position": i, "name": texto}
        if href:
            item["item"] = BASE_URL + href
        elementos.append(item)
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": elementos,
    }


# ---------------------------------------------------------------------------
# Bloques de contenido
# ---------------------------------------------------------------------------

def block_hero_home(b):
    cta_html = ""
    for cta in b.get("ctas", []):
        variant = cta.get("variant", "boton-primario")
        target = ' target="_blank" rel="noopener"' if cta.get("externo") else ""
        cta_html += f'<a class="boton {variant}" href="{esc(cta["href"])}"{target}>{esc(cta["texto"])}</a>'
    return f"""
<section class="hero" data-hero aria-labelledby="hero-h1">
  <div class="contenedor hero-texto">
    <p class="antetitulo">{esc(b["antetitulo"])}</p>
    <p class="claim-visual">{b["claim"]}</p>
    <h1 id="hero-h1" class="h1-descriptivo">{esc(b["h1"])}</h1>
    <p class="texto-grande">{b["texto"]}</p>
    <div class="grupo-botones">{cta_html}</div>
  </div>
  <img class="hero-marca-agua" src="/assets/logos/axis-mark-negro-480.png" alt="" aria-hidden="true" width="360" height="311" />
</section>
"""


def block_hero_servicio(b):
    cta_html = ""
    for cta in b.get("ctas", []):
        variant = cta.get("variant", "boton-primario")
        target = ' target="_blank" rel="noopener"' if cta.get("externo") else ""
        cta_html += f'<a class="boton {variant}" href="{esc(cta["href"])}"{target}>{esc(cta["texto"])}</a>'
    claim_html = ""
    if b.get("claim"):
        claim_html = f'<p class="claim-visual" style="font-size:clamp(1.8rem,4vw,2.6rem);">{b["claim"]}</p>'
    return f"""
<section class="hero hero--servicio" data-hero aria-labelledby="hero-h1">
  <div class="contenedor hero-texto">
    <p class="antetitulo">{esc(b["antetitulo"])}</p>
    {claim_html}
    <h1 id="hero-h1" class="claim-visual" style="font-size:clamp(1.9rem,4.4vw,2.9rem);">{esc(b["h1"])}</h1>
    <p class="texto-grande">{b["texto"]}</p>
    <div class="grupo-botones">{cta_html}</div>
  </div>
</section>
"""


def block_texto(b):
    parrafos = "".join(
        f'<p class="texto-grande" style="margin-top:16px;">{p}</p>' for p in b["parrafos"] if p
    )
    verde = " seccion--verde" if b.get("verde") else ""
    estrecha = " seccion--estrecha" if b.get("estrecha", True) else ""
    titulo_html = (
        f'<h2 id="{b["id"]}-titulo" class="titulo-seccion">{b["h2"]}</h2>' if b.get("h2") else ""
    )
    aria = f' aria-labelledby="{b["id"]}-titulo"' if b.get("h2") else ""
    return f"""
<section class="seccion{verde}{estrecha}"{aria}>
  <div class="contenedor">
    {titulo_html}
    {parrafos}
  </div>
</section>
"""


def block_cards(b):
    tarjetas = ""
    numerar = b.get("numbered", False)
    variant = "tarjeta--verde" if b.get("verde_tarjetas") else ""
    for i, card in enumerate(b["cards"], start=1):
        numero_html = f'<span class="tarjeta-numero" aria-hidden="true">{i}</span>' if numerar else ""
        enlace_html = ""
        if card.get("enlace_href"):
            enlace_html = enlace_flecha(card["enlace_texto"], card["enlace_href"])
        tarjetas += f"""
        <article class="tarjeta {variant}">
          {numero_html}
          <h3>{esc(card['titulo'])}</h3>
          <p>{card['texto']}</p>
          {enlace_html}
        </article>
        """
    cols = b.get("cols", 3)
    intro_html = f'<p class="intro-seccion">{b["intro"]}</p>' if b.get("intro") else ""
    verde = " seccion--verde" if b.get("verde") else ""
    return f"""
<section class="seccion{verde}" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor">
    <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
    {intro_html}
    <div class="cuadricula cuadricula--{cols}">{tarjetas}</div>
  </div>
</section>
"""


def block_pasos(b):
    pasos_html = ""
    for p in b["pasos"]:
        pasos_html += f"""
        <div class="paso">
          <p class="paso-numero" aria-hidden="true">{esc(p['numero'])}</p>
          <h3>{esc(p['titulo'])}</h3>
          <p>{p['texto']}</p>
        </div>
        """
    enlace_html = enlace_flecha(b["enlace_texto"], b["enlace_href"]) if b.get("enlace_href") else ""
    return f"""
<section class="seccion" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor">
    <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
    <div class="pasos">{pasos_html}</div>
    <div style="margin-top:32px;">{enlace_html}</div>
  </div>
</section>
"""


def block_lista_check(b):
    items_html = "".join(
        f'<li>{svg_check()}<div><strong>{esc(it["titulo"])}</strong><p style="margin-top:2px;">{it["texto"]}</p></div></li>'
        if isinstance(it, dict) else f'<li>{svg_check()}<p>{it}</p></li>'
        for it in b["items"]
    )
    intro_html = f'<p class="intro-seccion">{b["intro"]}</p>' if b.get("intro") else ""
    post_html = f'<p class="texto-grande" style="margin-top:24px;">{b["post"]}</p>' if b.get("post") else ""
    return f"""
<section class="seccion seccion--estrecha" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor">
    <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
    {intro_html}
    <ul class="lista-check">{items_html}</ul>
    {post_html}
  </div>
</section>
"""


def block_tabla(b):
    thead = "".join(f"<th scope='col'>{esc(h)}</th>" for h in b["headers"])
    filas = ""
    for fila in b["rows"]:
        celdas = f"<th scope='row'>{esc(fila[0])}</th>" + "".join(f"<td>{c}</td>" for c in fila[1:])
        filas += f"<tr>{celdas}</tr>"
    nota = f'<p class="nota-tabla">{b["nota"]}</p>' if b.get("nota") else ""
    return f"""
<section class="seccion" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor">
    <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
    <div class="tabla-envoltorio">
      <table class="tabla-axis">
        <thead><tr>{thead}</tr></thead>
        <tbody>{filas}</tbody>
      </table>
    </div>
    {nota}
  </div>
</section>
"""


def block_resenas(b):
    resenas_html = ""
    for r in b["resenas"]:
        resenas_html += f"""
        <figure class="resena">
          <div class="resena-estrellas" aria-label="Valoración 5 de 5 estrellas">★★★★★</div>
          <blockquote><p>&ldquo;{r['texto']}&rdquo;</p></blockquote>
          <footer>{esc(r['autor'])}</footer>
        </figure>
        """
    dato_html = f'<p class="dato-destacado">{b["dato"]}</p>' if b.get("dato") else ""
    return f"""
<section class="seccion" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor">
    <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
    <div class="cuadricula cuadricula--3">{resenas_html}</div>
    {dato_html}
  </div>
</section>
"""


def block_ubicacion(b):
    return f"""
<section class="seccion" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor ubicacion-grid">
    <div>
      <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
      <p class="texto-grande">{b['texto']}</p>
      <dl class="ubicacion-datos" style="margin-top:26px;">
        <div><dt>Dirección</dt><dd><a class="enlace-flecha" href="{esc(MAPS_LINK)}" target="_blank" rel="noopener">{esc(ADDRESS)} {svg_arrow()}</a></dd></div>
        <div><dt>Teléfono</dt><dd><a href="tel:{esc(PHONE_TEL)}">{esc(PHONE_DISPLAY)}</a></dd></div>
        <div><dt>Horario</dt><dd>[pendiente]</dd></div>
      </dl>
    </div>
    <div class="mapa-envoltorio">
      <iframe src="{esc(MAPS_EMBED)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa de Axis Health &amp; Performance en Gavà"></iframe>
    </div>
  </div>
</section>
"""


def block_deportes(b):
    chips = "".join(f"<span>{esc(d)}</span>" for d in b["lista"])
    return f"""
<section class="seccion seccion--estrecha" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor">
    <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
    <div class="categorias-blog">{chips}</div>
    <p class="texto-grande">{b['texto']}</p>
  </div>
</section>
"""


def block_perfiles(b):
    perfiles_html = ""
    for p in b["perfiles"]:
        pendiente_html = f'<span class="aviso-pendiente">{p["pendiente"]}</span>' if p.get("pendiente") else ""
        iniciales = "".join(w[0] for w in p["nombre"].split()[:2]).upper()
        perfiles_html += f"""
        <article class="perfil">
          <div class="perfil-avatar" aria-hidden="true">{esc(iniciales)}</div>
          <div style="min-width:0;">
            <h3>{esc(p['nombre'])}</h3>
            <span class="perfil-rol">{esc(p['rol'])}</span>
            <p>{p['texto']}</p>
            {pendiente_html}
          </div>
        </article>
        """
    intro_html = f'<p class="intro-seccion">{b["intro"]}</p>' if b.get("intro") else ""
    return f"""
<section class="seccion" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor">
    <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
    {intro_html}
    <div class="cuadricula cuadricula--2">{perfiles_html}</div>
  </div>
</section>
"""


def block_formulario_reserva(b):
    return f"""
<section class="seccion seccion-reserva" id="reserva" aria-labelledby="reserva-titulo">
  <div class="contenedor">
    <div>
      <h2 id="reserva-titulo" class="titulo-seccion">{b['h2']}</h2>
      <p class="intro-seccion">{b.get('intro', '')}</p>
      <div class="formulario-contacto-extra">
        <a href="tel:{esc(PHONE_TEL)}">Llámanos: {esc(PHONE_DISPLAY)}</a>
        <a href="{esc(WHATSAPP_URL)}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>
        <a href="{esc(MAPS_LINK)}" target="_blank" rel="noopener">{esc(ADDRESS)}</a>
      </div>
      <div class="mapa-envoltorio" style="margin-top:24px;">
        <iframe src="{esc(MAPS_EMBED)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa de Axis Health &amp; Performance en Gavà"></iframe>
      </div>
    </div>

    <div class="formulario-reserva" data-formulario-reserva data-enviado="false">
      <h3 style="font-size:1.3rem;margin-bottom:20px;">Reserva tu sesión de presentación</h3>
      <form novalidate>
        <div class="campo">
          <label for="reserva-nombre">Nombre</label>
          <input id="reserva-nombre" name="nombre" type="text" autocomplete="name" required />
        </div>
        <div class="campo">
          <label for="reserva-telefono">Teléfono</label>
          <input id="reserva-telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel" required />
        </div>
        <div class="campo">
          <label for="reserva-motivo">¿Qué te trae a Axis?</label>
          <select id="reserva-motivo" name="motivo" required>
            <option value="">Selecciona una opción…</option>
            <option value="dolor">Tengo dolor o una lesión</option>
            <option value="forma">Quiero ponerme en forma con criterio</option>
            <option value="rendimiento">Quiero rendir más en mi deporte</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div class="campo-check">
          <input id="reserva-privacidad" name="privacidad" type="checkbox" required />
          <label for="reserva-privacidad">He leído y acepto la <a href="/es/legal/privacidad/">política de privacidad</a>. *</label>
        </div>
        <div class="campo-check">
          <input id="reserva-comunicaciones" name="comunicaciones" type="checkbox" />
          <label for="reserva-comunicaciones">Quiero recibir novedades y consejos de Axis por email o WhatsApp.</label>
        </div>
        <button class="boton boton-primario" type="submit">Quiero mi sesión</button>
      </form>
      <div class="formulario-mensaje" data-visible="false" role="status">
        Recibido. Te llamamos en menos de 24 horas laborables para cerrar día y hora. Si lo prefieres, escríbenos por <a href="{esc(WHATSAPP_URL)}" target="_blank" rel="noopener">WhatsApp</a>.
      </div>
    </div>
  </div>
</section>
"""


def block_faq(b):
    # b["grupos"]: list of (titulo_grupo_or_None, [ {pregunta, respuesta} ])
    html_out = ""
    faq_items_flat = []
    for grupo_titulo, items in b["grupos"]:
        if grupo_titulo:
            html_out += f'<h3 class="faq-grupo-titulo">{esc(grupo_titulo)}</h3>'
        html_out += '<div class="faq-lista">'
        for item in items:
            item_id = "faq-" + slugify(item["pregunta"])[:60]
            html_out += f"""
            <div class="faq-item" data-abierto="false">
              <h4 style="margin:0;">
                <button class="faq-pregunta" type="button" aria-expanded="false" aria-controls="{item_id}" id="{item_id}-boton">
                  <span>{esc(item['pregunta'])}</span>
                  {svg_chevron()}
                </button>
              </h4>
              <div class="faq-respuesta" id="{item_id}" role="region" aria-labelledby="{item_id}-boton"><div>
                <p>{item['respuesta']}</p>
              </div></div>
            </div>
            """
            faq_items_flat.append(item)
        html_out += "</div>"
    intro_html = f'<p class="intro-seccion">{b["intro"]}</p>' if b.get("intro") else ""
    section = f"""
<section class="seccion seccion--estrecha" id="preguntas-frecuentes" aria-labelledby="{b['id']}-titulo">
  <div class="contenedor">
    <h2 id="{b['id']}-titulo" class="titulo-seccion">{b['h2']}</h2>
    {intro_html}
    {html_out}
  </div>
</section>
"""
    return section, faq_items_flat


def block_enlaces_internos(items):
    lis = "".join(
        f'<li>{enlace_flecha(texto, href)}</li>' for texto, href in items
    )
    return f"""
<section class="seccion seccion--estrecha">
  <div class="contenedor">
    <h2 class="titulo-seccion" style="font-size:1.3rem;">Sigue explorando</h2>
    <ul style="display:flex;flex-direction:column;gap:14px;margin-top:8px;">{lis}</ul>
  </div>
</section>
"""


def block_articulo(b):
    secciones_html = ""
    for sec in b["secciones"]:
        secciones_html += f"<h2>{esc(sec['h2'])}</h2>"
        for p in sec.get("parrafos", []):
            secciones_html += f"<p>{p}</p>"
        if sec.get("lista"):
            items = "".join(f"<li>{it}</li>" for it in sec["lista"])
            secciones_html += f"<ul>{items}</ul>"

    return f"""
<article class="seccion">
  <div class="contenedor">
    <header class="articulo-cabecera">
      <span class="blog-categoria">{esc(b['categoria'])}</span>
      <h1 style="font-size:clamp(1.8rem,4vw,2.6rem);margin-top:10px;">{esc(b['h1'])}</h1>
      <div class="articulo-meta">
        <span>Por {esc(b['autor'])}</span>
        <span aria-hidden="true">·</span>
        <time datetime="{esc(b['fecha_iso'])}">{esc(b['fecha_display'])}</time>
      </div>
    </header>
    <div class="articulo-cuerpo">
      {secciones_html}
    </div>
  </div>
</article>
"""


def block_enlaces_internos_wrapper(b):
    return block_enlaces_internos(b["items"])


BLOCK_RENDERERS = {
    "hero_home": block_hero_home,
    "hero_servicio": block_hero_servicio,
    "texto": block_texto,
    "cards": block_cards,
    "pasos": block_pasos,
    "lista_check": block_lista_check,
    "tabla": block_tabla,
    "resenas": block_resenas,
    "ubicacion": block_ubicacion,
    "deportes": block_deportes,
    "perfiles": block_perfiles,
    "formulario_reserva": block_formulario_reserva,
    "enlaces_internos": block_enlaces_internos_wrapper,
    "articulo": block_articulo,
    "__raw__": lambda b: b["html"],
}
