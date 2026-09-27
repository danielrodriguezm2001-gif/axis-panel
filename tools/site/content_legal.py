# -*- coding: utf-8 -*-
"""Paginas legales (borrador minimo, pendientes de redaccion definitiva por asesoria)."""

def _legal_page(slug, titulo_h1, titulo_meta):
    return {
        "slug": slug,
        "path": f"/es/legal/{slug}/",
        "title": f"{titulo_meta} | Axis",
        "meta_description": f"{titulo_h1} de Axis Health & Performance, centro de entrenamiento y fisioterapia en Gavà.",
        "h1": titulo_h1,
        "breadcrumb": [("Inicio", "/es/"), (titulo_h1, None)],
        "cierre_loop": False,
        "blocks": [
            {
                "type": "hero_servicio",
                "antetitulo": "Legal",
                "h1": titulo_h1,
                "texto": "",
                "ctas": [],
            },
            {
                "type": "texto",
                "id": "aviso",
                "h2": "",
                "estrecha": True,
                "parrafos": [
                    "Este texto es un borrador pendiente de redacción y validación por parte de la asesoría legal de Axis, incluyendo la razón social definitiva del titular (prevista: The Athlete Loop Fisioterapia y Entrenamiento, S.L.), su NIF y su domicilio social. No debe considerarse contenido legal definitivo hasta esa revisión.",
                    "Mientras se completa, puedes escribirnos por WhatsApp o llamarnos al +34 638 09 89 07 para cualquier duda relacionada con esta página.",
                ],
            },
        ],
    }


AVISO_LEGAL = _legal_page("aviso-legal", "Aviso legal", "Aviso legal")
PRIVACIDAD = _legal_page("privacidad", "Política de privacidad", "Política de privacidad")
COOKIES = _legal_page("cookies", "Política de cookies", "Política de cookies")
ACCESIBILIDAD = _legal_page("accesibilidad", "Accesibilidad", "Declaración de accesibilidad")

LEGAL_PAGES = [AVISO_LEGAL, PRIVACIDAD, COOKIES, ACCESIBILIDAD]
