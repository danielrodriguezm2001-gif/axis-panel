# -*- coding: utf-8 -*-
"""Ensamblado del documento HTML completo para cada pagina."""
import json

from render import (
    BASE_URL,
    SITE_NAME,
    INSTAGRAM_URL,
    PHONE_TEL,
    ADDRESS,
    esc,
    render_header,
    render_footer,
    render_barra_movil,
    render_migas,
    render_cierre_loop,
    breadcrumb_schema,
    BLOCK_RENDERERS,
    block_faq,
)

ORGANIZATION_SCHEMA = {
    "@context": "https://schema.org",
    "@type": ["HealthClub", "ExerciseGym"],
    "name": SITE_NAME,
    "url": BASE_URL + "/es/",
    "telephone": PHONE_TEL,
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Carrer de la Creativitat, 4B",
        "postalCode": "08850",
        "addressLocality": "Gavà",
        "addressRegion": "Barcelona",
        "addressCountry": "ES",
    },
    "areaServed": ["Gavà", "Viladecans", "Castelldefels"],
    "sameAs": [INSTAGRAM_URL],
}


def render_document(page):
    """page: dict con slug, title, meta_description, h1, breadcrumb, blocks, faq, etc."""
    url_path = page["path"]
    canonical = BASE_URL + url_path
    schemas = [ORGANIZATION_SCHEMA]

    if page.get("breadcrumb"):
        schemas.append(breadcrumb_schema(page["breadcrumb"]))

    body_blocks_html = []
    faq_flat = []
    for block in page["blocks"]:
        btype = block["type"]
        if btype == "faq":
            html_out, items = block_faq(block)
            body_blocks_html.append(html_out)
            faq_flat.extend(items)
        else:
            body_blocks_html.append(BLOCK_RENDERERS[btype](block))

    if faq_flat:
        schemas.append({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": item["pregunta_schema"] if "pregunta_schema" in item else item["pregunta"],
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": item.get("respuesta_schema", item["respuesta"]),
                    },
                }
                for item in faq_flat
            ],
        })

    for extra in page.get("extra_schema", []):
        schemas.append(extra)

    schema_scripts = "\n".join(
        f'<script type="application/ld+json">{json.dumps(s, ensure_ascii=False)}</script>'
        for s in schemas
    )

    migas_html = render_migas(page["breadcrumb"]) if page.get("breadcrumb") else ""
    cierre_html = render_cierre_loop() if page.get("cierre_loop", True) else ""

    og_image = page.get("og_image", "/assets/logos/axis-logo-verde-960.png")

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{esc(page['title'])}</title>
<meta name="description" content="{esc(page['meta_description'])}" />
<link rel="canonical" href="{esc(canonical)}" />
<meta name="theme-color" content="#2f6f6d" />
<link rel="icon" href="/assets/favicon/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon/favicon-192.png" />
<link rel="apple-touch-icon" href="/assets/favicon/apple-touch-icon.png" />

<meta property="og:type" content="{esc(page.get('og_type', 'website'))}" />
<meta property="og:title" content="{esc(page['title'])}" />
<meta property="og:description" content="{esc(page['meta_description'])}" />
<meta property="og:url" content="{esc(canonical)}" />
<meta property="og:image" content="{esc(BASE_URL + og_image)}" />
<meta property="og:locale" content="es_ES" />
<meta name="twitter:card" content="summary_large_image" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/css/styles.css" />
{schema_scripts}
</head>
<body>
{render_header()}
<main id="contenido-principal">
{migas_html}
{''.join(body_blocks_html)}
{cierre_html}
</main>
{render_footer()}
{render_barra_movil()}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
"""
