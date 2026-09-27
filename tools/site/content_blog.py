# -*- coding: utf-8 -*-
"""Contenido: Blog (portada + 6 artículos)."""

BLOG_INDEX = {
    "slug": "blog",
    "path": "/es/blog/",
    "title": "Blog de entrenamiento, lesiones y salud | Axis",
    "meta_description": "Artículos del equipo de Axis sobre entrenamiento, lesiones, readaptación, nutrición y rendimiento. Criterio profesional, explicado claro.",
    "h1": "Blog de Axis: entrenamiento, lesiones y salud",
    "breadcrumb": [("Inicio", "/es/"), ("Blog", None)],
}

CATEGORIAS = ["Entrenamiento", "Lesiones y readaptación", "Nutrición", "Mente", "Rendimiento deportivo"]

ART_RODILLA = {
    "slug": "volver-a-entrenar-despues-lesion-rodilla",
    "path": "/es/blog/volver-a-entrenar-despues-lesion-rodilla/",
    "title": "¿Cuándo volver a entrenar después de una lesión de rodilla? | Axis",
    "meta_description": "El alta de fisioterapia no es el final. Te contamos las 3 fases de la vuelta al entrenamiento tras una lesión de rodilla y los criterios para avanzar sin recaer.",
    "h1": "¿Cuándo volver a entrenar después de una lesión de rodilla?",
    "categoria": "Lesiones y readaptación",
    "keyword": "volver a entrenar después de lesión de rodilla",
    "autor": "Erik",
    "fecha_iso": "2026-10-06",
    "fecha_display": "6 de octubre de 2026",
    "enlaza_a": ("Readaptación de lesiones", "/es/readaptacion-lesiones/"),
    "secciones": [
        {
            "h2": "Por qué el alta no es el final",
            "parrafos": [
                "Es la pregunta que más escuchamos en consulta después de un esguince de rodilla, una rotura de menisco o una reconstrucción de ligamento cruzado: &laquo;¿ya puedo volver a entrenar?&raquo;. La respuesta corta es que el alta de fisioterapia marca el final del dolor, no el final de la recuperación.",
                "Cuando el fisioterapeuta te da el alta, la inflamación ha bajado, el rango de movimiento se ha recuperado y puedes hacer vida normal sin molestias. Pero la fuerza, el control y la confianza de la pierna afectada casi nunca están al mismo nivel que la sana. Volver a entrenar como si no hubiera pasado nada en ese punto es la causa más habitual de recaída.",
            ],
        },
        {
            "h2": "Las 3 fases de la vuelta",
            "parrafos": [
                "En Axis planteamos la vuelta al entrenamiento como un proceso con fases, no como un interruptor que se enciende de golpe.",
            ],
            "lista": [
                "<strong>Fase 1 · Base.</strong> Recuperar fuerza básica, movilidad completa y control de la rodilla en gestos simples (sentadilla, zancada, apoyo monopodal).",
                "<strong>Fase 2 · Progresión.</strong> Introducir carga, velocidad y gestos más parecidos a tu deporte o a tu entrenamiento habitual, siempre por debajo del umbral de molestia.",
                "<strong>Fase 3 · Rendimiento.</strong> Trabajo específico de tu actividad —cambios de dirección, saltos, sprints— hasta igualar o superar tu nivel previo a la lesión.",
            ],
        },
        {
            "h2": "Criterios objetivos para avanzar",
            "parrafos": [
                "No avanzamos de fase por sensaciones ni por calendario, sino por criterios objetivos: fuerza de la pierna lesionada comparada con la sana, control del movimiento en vídeo, ausencia de dolor 24 horas después del esfuerzo y capacidad de repetir el gesto sin compensaciones. Si no se cumplen, nos quedamos una semana más en la fase anterior. Es más rápido a medio plazo que forzar y recaer.",
            ],
        },
        {
            "h2": "Errores que provocan recaídas",
            "lista": [
                "Volver a tu deporte o a tu rutina de gimnasio anterior sin pasar por una fase intermedia de readaptación.",
                "Guiarse solo por &laquo;ya no me duele&raquo; en lugar de por la fuerza y el control reales de la pierna.",
                "Saltarse el trabajo de gestos específicos (saltar, girar, frenar) antes de volver a competir o entrenar a máxima intensidad.",
                "No coordinar al fisioterapeuta y al entrenador, de forma que nadie tiene la foto completa de tu progreso.",
            ],
        },
    ],
}

ART_ENTRENADOR_O_GRUPO = {
    "slug": "entrenador-personal-o-grupo-reducido",
    "path": "/es/blog/entrenador-personal-o-grupo-reducido/",
    "title": "Entrenador personal o grupo reducido: ¿cuál te conviene? | Axis",
    "meta_description": "Comparamos el entrenamiento personal 1 a 1 con los grupos reducidos tipo The Axis Club para que decidas qué formato encaja mejor con tu punto de partida.",
    "h1": "Entrenador personal o grupo reducido: ¿cuál te conviene?",
    "categoria": "Entrenamiento",
    "keyword": "entrenador personal o grupo reducido",
    "autor": "Marc",
    "fecha_iso": "2026-10-20",
    "fecha_display": "20 de octubre de 2026",
    "enlaza_a": ("Entrenamiento personal y The Axis Club", "/es/entrenamiento-personal/"),
    "secciones": [
        {
            "h2": "Qué aporta el 1 a 1",
            "parrafos": [
                "En una sesión de entrenamiento personal el entrenador está solo contigo durante 60 minutos. Eso significa atención completa en cada repetición, ajustes en tiempo real y un programa que se puede modificar sobre la marcha si algo no funciona ese día. Es el formato con más margen de personalización y el más indicado cuando vienes de una lesión, empiezas de cero o preparas algo muy específico.",
            ],
        },
        {
            "h2": "Qué aporta el grupo reducido",
            "parrafos": [
                "En un grupo reducido como The Axis Club compartes espacio —no rutina— con hasta cinco personas más. Cada una sigue su propio programa, pero el entrenador supervisa a todo el grupo a la vez. Ganas en frecuencia (puedes permitirte entrenar más días por semana), en energía de grupo y en constancia: cuesta menos faltar cuando sabes que hay gente esperándote.",
            ],
        },
        {
            "h2": "Tabla comparativa",
            "parrafos": [
                "<strong>Atención:</strong> exclusiva en el 1 a 1; supervisada y compartida en el grupo reducido.<br/>"
                "<strong>Frecuencia habitual:</strong> 1–2 sesiones semanales en el 1 a 1; 2–3 en el Club.<br/>"
                "<strong>Inversión mensual:</strong> mayor en el 1 a 1; más ajustada en el grupo reducido.<br/>"
                "<strong>Mejor para:</strong> lesiones, objetivos muy específicos o preferencia por trabajar solo (1 a 1); constancia, motivación social y entrenar más días (Club).",
            ],
        },
        {
            "h2": "Cómo decidir según tu punto de partida",
            "parrafos": [
                "En Axis no eliges el formato antes de empezar: lo decidimos juntos después de la valoración inicial. Si tienes una molestia activa o necesitas dominar patrones de movimiento básicos, empiezas por el 1 a 1 o por Essentials. Cuando tienes autonomía y quieres sostener el hábito a más largo plazo, The Axis Club suele ser el siguiente paso natural.",
            ],
        },
    ],
}

ART_PADEL = {
    "slug": "ejercicios-fuerza-jugadores-padel",
    "path": "/es/blog/ejercicios-fuerza-jugadores-padel/",
    "title": "Ejercicios de fuerza para jugadores de pádel | Axis",
    "meta_description": "El pádel exige cambios de dirección, golpeo y frenadas constantes. Estos 6 ejercicios de fuerza reducen el riesgo de lesión y mejoran tu rendimiento en pista.",
    "h1": "Ejercicios de fuerza para jugadores de pádel",
    "categoria": "Rendimiento deportivo",
    "keyword": "ejercicios de fuerza pádel",
    "autor": "Marc",
    "fecha_iso": "2026-11-03",
    "fecha_display": "3 de noviembre de 2026",
    "enlaza_a": ("Performance Group", "/es/preparacion-fisica-deportistas/"),
    "secciones": [
        {
            "h2": "Qué exige el pádel al cuerpo",
            "parrafos": [
                "El pádel parece un deporte suave porque la pista es pequeña, pero exige cambios de dirección explosivos, frenadas constantes, rotación de tronco en cada golpeo y muchas horas acumuladas de pie sobre superficie dura. La mayoría de jugadores amateur entrena horas de técnica y táctica, pero cero horas de la fuerza que sostiene esos gestos.",
            ],
        },
        {
            "h2": "Lesiones más comunes",
            "lista": [
                "Epicondilitis (&laquo;codo de tenista&raquo;) por sobrecarga de golpeo.",
                "Molestias lumbares por rotación repetida de tronco.",
                "Sobrecargas y roturas fibrilares en gemelo e isquiotibiales por los frenazos y arrancadas.",
                "Molestias de hombro en jugadores que abusan del remate.",
            ],
        },
        {
            "h2": "6 ejercicios clave",
            "lista": [
                "<strong>Zancadas laterales con carga.</strong> Reproducen el desplazamiento lateral y fortalecen la cadena de frenado.",
                "<strong>Peso muerto rumano a una pierna.</strong> Fuerza y estabilidad de isquiotibiales y glúteo, clave para frenar sin lesionarte.",
                "<strong>Rotaciones de tronco con resistencia.</strong> Fuerza rotacional específica para el golpeo, protegiendo la zona lumbar.",
                "<strong>Saltos laterales con estabilización.</strong> Potencia y control de rodilla en los cambios de dirección explosivos.",
                "<strong>Trabajo de manguito rotador y escápula.</strong> Prevención directa de molestias de hombro por el remate.",
                "<strong>Core anti-rotación (press Pallof y variantes).</strong> Estabilidad de tronco para golpear fuerte sin descompensar la espalda.",
            ],
        },
        {
            "h2": "Cómo encajarlos en tu semana",
            "parrafos": [
                "No hace falta convertirte en culturista para jugar mejor al pádel: con 2 sesiones de fuerza específica por semana, bien programadas y coordinadas con tus partidos, notas la diferencia en pocas semanas, tanto en rendimiento como en menos molestias al día siguiente. En Performance Group diseñamos este trabajo en grupos de máximo 3 deportistas, ajustado a tu calendario de partidos.",
            ],
        },
    ],
}

ART_LUMBAR = {
    "slug": "dolor-lumbar-gimnasio",
    "path": "/es/blog/dolor-lumbar-gimnasio/",
    "title": "Dolor lumbar y gimnasio: qué hacer y qué evitar | Axis",
    "meta_description": "¿Te duele la espalda y no sabes si seguir entrenando? Te explicamos por qué aparece el dolor lumbar, qué ejercicios ayudan y cuándo ir al fisioterapeuta.",
    "h1": "Dolor lumbar y gimnasio: qué hacer y qué evitar",
    "categoria": "Lesiones y readaptación",
    "keyword": "dolor lumbar gimnasio",
    "autor": "Erik",
    "fecha_iso": "2026-11-17",
    "fecha_display": "17 de noviembre de 2026",
    "enlaza_a": ("Fisioterapia", "/es/fisioterapia/"),
    "secciones": [
        {
            "h2": "Por qué duele la espalda",
            "parrafos": [
                "El dolor lumbar casi nunca tiene una sola causa. Combina horas sentado, técnica mejorable en ejercicios como la sentadilla o el peso muerto, falta de fuerza en glúteo y core, y en muchos casos, simplemente, miedo a moverse una vez que ya ha aparecido la molestia. Ese miedo lleva a moverse peor, y moverse peor mantiene el dolor: es un círculo que hay que romper con información y ejercicio, no con reposo indefinido.",
            ],
        },
        {
            "h2": "Moverse sí, pero cómo",
            "parrafos": [
                "La evidencia es clara: el reposo prolongado empeora el pronóstico del dolor lumbar inespecífico. La clave no es dejar de moverte, sino moverte con la técnica y la carga adecuadas a tu momento actual. Eso significa, casi siempre, bajar la carga o cambiar el ejercicio unos días, no abandonar el gimnasio por completo.",
            ],
        },
        {
            "h2": "Ejercicios que ayudan",
            "lista": [
                "Trabajo de control de zona media (plancha, press Pallof, dead bug) para dar estabilidad a la columna en el gesto que sea.",
                "Fuerza de cadera y glúteo (puente de glúteo, hip thrust) para quitarle protagonismo a la zona lumbar en los levantamientos.",
                "Movilidad de cadera y torácica, que suelen estar limitadas y &laquo;obligan&raquo; a la lumbar a compensar.",
                "Progresión de carga controlada en sentadilla y peso muerto, revisando la técnica antes de subir kilos.",
            ],
        },
        {
            "h2": "Cuándo ir al fisioterapeuta",
            "parrafos": [
                "Si el dolor aparece de forma súbita y muy intensa, si baja por la pierna, si notas hormigueo o pérdida de fuerza, o si una molestia leve no mejora en 1–2 semanas a pesar de ajustar el entrenamiento, toca pasar por el fisioterapeuta. En Axis, además, coordinamos ese trabajo directamente con tu entrenador para que el gimnasio deje de ser el problema y pase a ser parte de la solución.",
            ],
        },
    ],
}

ART_VALORACION = {
    "slug": "valoracion-fisica-completa",
    "path": "/es/blog/valoracion-fisica-completa/",
    "title": "Qué incluye una valoración física completa (y por qué importa) | Axis",
    "meta_description": "90 minutos que definen todo tu programa. Te contamos qué se analiza en una valoración física completa, qué pruebas se hacen y qué traer el primer día.",
    "h1": "Qué incluye una valoración física completa (y por qué importa)",
    "categoria": "Entrenamiento",
    "keyword": "valoración física completa",
    "autor": "Marc y Erik",
    "fecha_iso": "2026-12-01",
    "fecha_display": "1 de diciembre de 2026",
    "enlaza_a": ("Valoración inicial", "/es/valoracion-inicial/"),
    "secciones": [
        {
            "h2": "Qué se analiza",
            "parrafos": [
                "Una valoración física completa no es solo &laquo;ver cómo estás de forma&raquo;. Analiza cinco bloques: tu historial de lesiones y antecedentes clínicos, tus patrones de movimiento fundamentales y posibles compensaciones, tu movilidad, fuerza y control articulación por articulación, tu estilo de vida (descanso, estrés, actividad diaria) y tus objetivos y disponibilidad real. Sin estos cinco bloques, cualquier programa es una plantilla genérica con tu nombre puesto encima.",
            ],
        },
        {
            "h2": "Qué pruebas se hacen",
            "parrafos": [
                "En la práctica, esto se traduce en una entrevista clínica a fondo, una exploración de movimientos básicos (sentadilla, bisagra de cadera, empuje, tracción, estabilidad de tronco), pruebas de movilidad articular en las zonas más exigidas por tu actividad y, si vienes de una lesión, pruebas funcionales específicas para esa zona. Todo se hace en 90 minutos, con tiempo suficiente para explicarte qué estamos mirando y por qué.",
            ],
        },
        {
            "h2": "Cómo se traduce en un programa",
            "parrafos": [
                "Con esa información decidimos con qué profesional empiezas —fisioterapia si hay dolor activo, entrenamiento si tu base es sólida, o una combinación desde el primer día— y qué progresión de ejercicios tiene sentido para ti. Es la diferencia entre un programa que se ajusta a tu cuerpo y uno que asume que todos los cuerpos son iguales.",
            ],
        },
        {
            "h2": "Qué traer el primer día",
            "lista": [
                "Ropa y calzado de entrenamiento.",
                "Informes médicos o pruebas de imagen recientes, si los tienes.",
                "Una idea honesta de tu disponibilidad real por semana: es mejor planificar con 2 sesiones seguras que con 4 que luego no se cumplen.",
            ],
        },
    ],
}

ART_FISIO_ENTRENAMIENTO = {
    "slug": "fisioterapia-y-entrenamiento",
    "path": "/es/blog/fisioterapia-y-entrenamiento/",
    "title": "Fisioterapia y entrenamiento: por qué funcionan mejor juntos | Axis",
    "meta_description": "Tratar el cuerpo por partes tiene un límite. Te explicamos qué pasa cuando fisioterapia y entrenamiento se coordinan de verdad, con un historial compartido.",
    "h1": "Fisioterapia y entrenamiento: por qué funcionan mejor juntos",
    "categoria": "Lesiones y readaptación",
    "keyword": "fisioterapia y entrenamiento",
    "autor": "Erik y Marc",
    "fecha_iso": "2026-12-15",
    "fecha_display": "15 de diciembre de 2026",
    "enlaza_a": ("Método Live in Loop", "/es/metodo-live-in-loop/"),
    "secciones": [
        {
            "h2": "El problema de tratar por separado",
            "parrafos": [
                "El circuito habitual es este: te duele algo, vas al fisioterapeuta, te trata la zona afectada y te da el alta cuando el dolor baja. Después vuelves al gimnasio o a tu entrenador, que no tiene ni idea de qué se ha trabajado en fisioterapia ni de qué precauciones tomar. Cada profesional ve una parte del problema, nadie ve el conjunto, y la persona en medio es quien paga el precio en forma de recaídas.",
            ],
        },
        {
            "h2": "Qué pasa cuando se coordinan",
            "parrafos": [
                "Cuando fisioterapeuta y entrenador comparten historial y objetivos, el tratamiento no termina en la camilla: continúa en la sala de entrenamiento con ejercicio terapéutico, control de carga y progresiones acordadas por ambos. El entrenador sabe qué gestos evitar todavía y cuáles ya se pueden reintroducir; el fisioterapeuta ve cómo responde el cuerpo bajo carga real, no solo en la consulta.",
            ],
        },
        {
            "h2": "Un caso real",
            "parrafos": [
                "Es una situación habitual en la sala: alguien arrastra una molestia de rodilla &laquo;de toda la vida&raquo; que aparece y desaparece según la carga de entrenamiento, sin haber sido nunca lo bastante grave como para parar del todo. Cuando fisioterapia y entrenamiento trabajan juntos desde el principio —en lugar de tratar la molestia solo cuando se agrava— el patrón cambia: se ajusta la técnica y la carga en tiempo real, se refuerza la zona débil de forma progresiva, y la molestia deja de reaparecer en lugar de gestionarse ciclo tras ciclo.",
            ],
        },
        {
            "h2": "Cómo lo hacemos en Axis",
            "parrafos": [
                "Por eso Axis no separa entrenamiento y fisioterapia en dos negocios distintos: comparten espacio, comparten tu historial y comparten decisiones sobre tu caso. Es el mismo principio del método Live in Loop aplicado a algo muy concreto: cuando algo falla, afecta a lo demás, así que se trabaja en conjunto, no en compartimentos estancos.",
            ],
        },
    ],
}

BLOG_POSTS = [
    ART_RODILLA,
    ART_ENTRENADOR_O_GRUPO,
    ART_PADEL,
    ART_LUMBAR,
    ART_VALORACION,
    ART_FISIO_ENTRENAMIENTO,
]
