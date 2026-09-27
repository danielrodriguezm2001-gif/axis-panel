# -*- coding: utf-8 -*-
"""Genera el sitio estatico /es/... a partir del contenido en content_*.py.

Uso:
    python3 tools/site/build.py

Escribe los archivos HTML finales dentro de <repo>/es/...
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from document import render_document, BASE_URL  # noqa: E402

import content_home
import content_valoracion
import content_servicios_pages
import content_otras
import content_blog
import content_legal

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def write_page(path, html_content):
    """path: p.ej. '/es/valoracion-inicial/' -> es/valoracion-inicial/index.html"""
    rel = path.strip("/")
    out_dir = os.path.join(REPO_ROOT, rel)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "index.html")
    with open(out_file, "w", encoding="utf-8") as fh:
        fh.write(html_content)
    print("  ->", os.path.relpath(out_file, REPO_ROOT))


def finalize_page(page):
    """Añade el bloque de enlaces internos (si existe) antes de renderizar."""
    page = dict(page)
    blocks = list(page["blocks"])
    if page.get("enlaces_internos"):
        blocks.append({"type": "enlaces_internos", "items": page["enlaces_internos"]})
    page["blocks"] = blocks
    page.setdefault("cierre_loop", True)
    return page


def build_simple_pages():
    pages = [content_home.PAGE, content_valoracion.PAGE]
    pages += content_servicios_pages.SERVICE_PAGES
    pages += [
        content_otras.SERVICIOS_INDEX,
        content_otras.METODO_LIVE_IN_LOOP,
        content_otras.EQUIPO,
        content_otras.FAQ_PAGE,
    ]
    pages += content_legal.LEGAL_PAGES

    for page in pages:
        final = finalize_page(page)
        html_out = render_document(final)
        write_page(final["path"], html_out)


def build_blog():
    # Portada del blog
    tarjetas_html = ""
    for post in content_blog.BLOG_POSTS:
        tarjetas_html += f"""
        <article class="blog-tarjeta">
          <span class="blog-categoria">{post['categoria']}</span>
          <h3><a href="{post['path']}">{post['h1']}</a></h3>
          <p class="truncar-3">{post['meta_description']}</p>
          <span class="blog-firma">Por {post['autor']} · {post['fecha_display']}</span>
        </article>
        """

    categorias_html = "".join(f"<span>{c}</span>" for c in content_blog.CATEGORIAS)

    index_page = dict(content_blog.BLOG_INDEX)
    index_page["blocks"] = [
        {
            "type": "hero_servicio",
            "antetitulo": "Blog",
            "h1": index_page["h1"],
            "texto": "Lo que explicamos cada día en el centro, por escrito. Criterio profesional, sin mitos y sin atajos.",
            "ctas": [],
        },
        {"type": "__raw__", "html": f'<section class="seccion"><div class="contenedor">'
                                     f'<div class="categorias-blog">{categorias_html}</div>'
                                     f'<div class="blog-grid">{tarjetas_html}</div>'
                                     f'</div></section>'},
    ]
    index_page["cierre_loop"] = True
    final = finalize_page(index_page)
    html_out = render_document(final)
    write_page(final["path"], html_out)

    # Articulos individuales
    for post in content_blog.BLOG_POSTS:
        enlace_texto, enlace_href = post["enlaza_a"]
        page = {
            "slug": post["slug"],
            "path": post["path"],
            "title": post["title"],
            "meta_description": post["meta_description"],
            "h1": post["h1"],
            "breadcrumb": [("Inicio", "/es/"), ("Blog", "/es/blog/"), (post["h1"], None)],
            "og_type": "article",
            "cierre_loop": True,
            "extra_schema": [
                {
                    "@context": "https://schema.org",
                    "@type": "Article",
                    "headline": post["h1"],
                    "datePublished": post["fecha_iso"],
                    "author": {"@type": "Person", "name": post["autor"]},
                    "publisher": {"@type": "Organization", "name": "Axis Health & Performance"},
                    "mainEntityOfPage": BASE_URL + post["path"],
                }
            ],
            "blocks": [
                {
                    "type": "articulo",
                    "h1": post["h1"],
                    "categoria": post["categoria"],
                    "autor": post["autor"],
                    "fecha_iso": post["fecha_iso"],
                    "fecha_display": post["fecha_display"],
                    "secciones": post["secciones"],
                },
                {"type": "enlaces_internos", "items": [(enlace_texto, enlace_href), ("Volver al blog", "/es/blog/")]},
            ],
        }
        html_out = render_document(page)
        write_page(page["path"], html_out)


def main():
    print("Generando sitio Axis en", REPO_ROOT)
    build_simple_pages()
    build_blog()
    print("Listo.")


if __name__ == "__main__":
    main()
