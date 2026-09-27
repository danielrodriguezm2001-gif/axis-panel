# -*- coding: utf-8 -*-
"""Contenido: páginas de servicio individuales."""

ENTRENAMIENTO_PERSONAL = {
    "slug": "entrenamiento-personal",
    "path": "/es/entrenamiento-personal/",
    "title": "Entrenador personal en Gavà: sesiones 1 a 1 | Axis",
    "meta_description": "Entrenamiento personal 1 a 1 en Gavà: sesiones de 60 minutos con programación individual y un equipo que incluye fisio y nutrición. Reserva tu sesión.",
    "h1": "Entrenador personal en Gavà",
    "breadcrumb": [("Inicio", "/es/"), ("Servicios", "/es/servicios/"), ("Entrenamiento personal", None)],
    "blocks": [
        {
            "type": "hero_servicio",
            "antetitulo": "Entrenamiento 1 a 1",
            "h1": "Entrenador personal en Gavà",
            "texto": "60 minutos de atención exclusiva. Tu entrenador dirige, corrige y ajusta cada variable de la sesión para que avances con seguridad y sin perder el tiempo.",
            "ctas": [{"texto": "Empieza por la valoración", "href": "/es/valoracion-inicial/#reserva"}],
        },
        {
            "type": "lista_check",
            "id": "para-quien",
            "h2": "Para quien quiere resultados y necesita a alguien al lado",
            "items": [
                "Quieres ponerte en forma pero no sabes por dónde empezar o te cuesta ser constante.",
                "Tienes molestias y el gimnasio convencional no te da confianza.",
                "Te preparas para algo concreto: una carrera, un torneo de pádel, una temporada.",
                "Valoras tu tiempo y quieres que cada sesión cuente.",
            ],
        },
        {
            "type": "cards",
            "id": "como-trabajamos",
            "h2": "Metodología de élite, adaptada a ti",
            "intro": "Nuestros entrenadores preparan a deportistas de élite y aplican ese mismo criterio contigo, sea cual sea tu punto de partida. Tu programa parte de la valoración inicial y se ajusta cada semana según cómo respondes.",
            "cols": 2,
            "cards": [
                {"titulo": "Programación individual", "texto": "Nada de rutinas genéricas. Cada ejercicio, carga y descanso tiene un porqué."},
                {"titulo": "Técnica antes que carga", "texto": "Corregimos el movimiento para que ganes fuerza sin acumular molestias."},
                {"titulo": "Seguimiento con datos", "texto": "Registramos tu progreso en la app y ves tu evolución."},
                {"titulo": "Equipo detrás", "texto": "Si aparece una molestia, el fisioterapeuta está en la sala de al lado."},
            ],
        },
        {
            "type": "texto",
            "id": "que-consigues",
            "h2": "Más fuerza, menos dolor, hábitos que se quedan",
            "estrecha": True,
            "parrafos": [
                "Ganas fuerza y movilidad, reduces las molestias del día a día y construyes un hábito que se sostiene. El objetivo no es un reto de 8 semanas. Es que entrenar forme parte de tu vida.",
            ],
        },
        {
            "type": "texto",
            "id": "siguiente-paso",
            "h2": "¿Y después del 1 a 1?",
            "estrecha": True,
            "parrafos": [
                'Cuando dominas la técnica y tienes autonomía, puedes pasar a The Axis Club: sigues con tu programa individual, entrenas más veces por semana y reduces tu inversión mensual. <a class="enlace-flecha" href="/es/axis-club/">Conoce The Axis Club →</a>',
            ],
        },
        {
            "type": "faq",
            "id": "faq",
            "h2": "Preguntas frecuentes",
            "grupos": [
                (None, [
                    {"pregunta": "¿Cuánto dura una sesión?", "respuesta": "60 minutos."},
                    {"pregunta": "¿Cuántas veces por semana necesito entrenar?", "respuesta": "Depende de tu objetivo. La mayoría de personas empieza con 2 sesiones semanales [dato a validar por dirección]."},
                    {"pregunta": "¿Puedo entrenar si tengo una lesión?", "respuesta": "Sí. En la valoración decidimos si empiezas con fisioterapia, con entrenamiento o combinando ambos."},
                    {"pregunta": "¿Trabajáis con personas de Viladecans y Castelldefels?", "respuesta": "Sí, muchos de nuestros clientes vienen de los municipios cercanos."},
                ]),
            ],
        },
    ],
    "enlaces_internos": [
        ("Valoración inicial", "/es/valoracion-inicial/"),
        ("The Axis Club", "/es/axis-club/"),
        ("Fisioterapia", "/es/fisioterapia/"),
        ("Readaptación de lesiones", "/es/readaptacion-lesiones/"),
        ("Artículo: Entrenador personal o grupo reducido", "/es/blog/entrenador-personal-o-grupo-reducido/"),
    ],
}

AXIS_CLUB = {
    "slug": "axis-club",
    "path": "/es/axis-club/",
    "title": "Entrenamiento en grupos reducidos en Gavà | The Axis Club",
    "meta_description": "Entrena en grupos de hasta 6 personas con tu propio programa y un entrenador que te corrige. Más constancia, mismo criterio. The Axis Club en Gavà.",
    "h1": "Entrenamiento en grupos reducidos en Gavà",
    "breadcrumb": [("Inicio", "/es/"), ("Servicios", "/es/servicios/"), ("The Axis Club", None)],
    "blocks": [
        {
            "type": "hero_servicio",
            "antetitulo": "The Axis Club",
            "h1": "Entrenamiento en grupos reducidos en Gavà",
            "texto": "Hasta 6 personas por sesión, cada una con su propio programa. La atención de un entrenador personal, la energía de un grupo y la constancia de entrenar varias veces por semana.",
            "ctas": [{"texto": "Empieza por la valoración", "href": "/es/valoracion-inicial/#reserva"}],
        },
        {
            "type": "texto",
            "id": "que-es",
            "h2": "No es una clase dirigida. Es tu programa, en compañía.",
            "estrecha": True,
            "parrafos": [
                "En una clase colectiva todo el mundo hace lo mismo. En The Axis Club cada persona sigue su programación individual, diseñada a partir de su valoración, mientras el entrenador supervisa y corrige a todo el grupo. Compartes espacio, no rutina.",
            ],
        },
        {
            "type": "lista_check",
            "id": "para-quien",
            "h2": "Para quien quiere entrenar más y mejor",
            "items": [
                "Terminas Essentials o el 1 a 1 y quieres seguir con el mismo criterio, más días por semana.",
                "Arrastras molestias y las clases colectivas de alta intensidad no son para ti, pero quieres entrenar en grupo.",
                "Quieres un entrenamiento personalizado con una inversión mensual más ajustada.",
                "Te motiva entrenar rodeado de gente con tus mismos valores.",
            ],
        },
        {
            "type": "cards",
            "id": "como-funciona",
            "h2": "Así entrenas en The Axis Club",
            "cols": 2,
            "cards": [
                {"titulo": "Grupos de máximo 6", "texto": "Espacio y atención para que ninguna repetición pase sin supervisar."},
                {"titulo": "Programa individual o común", "texto": "Sigues tu programación según objetivos o la del grupo, con adaptaciones."},
                {"titulo": "1, 2 o 3 sesiones por semana", "texto": "Eliges la cuota que encaja con tu ritmo y puedes añadir sesiones sueltas."},
                {"titulo": "Acceso tras la valoración", "texto": "Solo entra quien domina los patrones de movimiento básicos. Es un filtro de seguridad, no de exclusión."},
            ],
        },
        {
            "type": "texto",
            "id": "comunidad",
            "h2": "Más que un grupo, un Loop",
            "estrecha": True,
            "verde": True,
            "parrafos": [
                "Entrenar acompañado sostiene el hábito. The Axis Club es también una comunidad: gente que comparte valores, se cruza cada semana y se empuja a mejorar. Ser atleta es una forma de vivir, y se vive mejor en grupo.",
            ],
        },
        {
            "type": "faq",
            "id": "faq",
            "h2": "Preguntas frecuentes",
            "grupos": [
                (None, [
                    {"pregunta": "¿Puedo empezar directamente en el Club?", "respuesta": "Todo el mundo empieza por Essentials, que incluye un mes de acceso al Club. Así confirmamos que entrenas con seguridad en grupo."},
                    {"pregunta": "¿Qué diferencia hay con un gimnasio?", "respuesta": "En Axis hay siempre un entrenador corrigiendo, y cada persona sigue un programa hecho para ella."},
                    {"pregunta": "¿Puedo combinarlo con fisioterapia o nutrición?", "respuesta": "Sí. Es la esencia de Axis: todos los servicios se coordinan entre sí."},
                    {"pregunta": "¿Qué horarios tenéis?", "respuesta": "[pendiente: franjas horarias de The Axis Club]"},
                ]),
            ],
        },
    ],
    "enlaces_internos": [
        ("Valoración inicial", "/es/valoracion-inicial/"),
        ("Entrenamiento personal", "/es/entrenamiento-personal/"),
        ("Performance Group", "/es/preparacion-fisica-deportistas/"),
        ("Método Live in Loop", "/es/metodo-live-in-loop/"),
        ("Artículo: Entrenador personal o grupo reducido", "/es/blog/entrenador-personal-o-grupo-reducido/"),
    ],
}

PERFORMANCE_GROUP = {
    "slug": "preparacion-fisica-deportistas",
    "path": "/es/preparacion-fisica-deportistas/",
    "title": "Preparación física para deportistas en Gavà | Axis",
    "meta_description": "Preparación física para deportistas en grupos de 3: más rendimiento y menos lesiones en pádel, fútbol, running o tu deporte. Performance Group en Gavà.",
    "h1": "Preparación física para deportistas en Gavà",
    "breadcrumb": [("Inicio", "/es/"), ("Servicios", "/es/servicios/"), ("Performance Group", None)],
    "blocks": [
        {
            "type": "hero_servicio",
            "antetitulo": "Performance Group",
            "h1": "Preparación física para deportistas en Gavà",
            "texto": "Tu club entrena la técnica y la táctica. Nosotros, el motor. Grupos de máximo 3 deportistas con programación individual para rendir más y lesionarte menos.",
            "ctas": [{"texto": "Empieza por la valoración", "href": "/es/valoracion-inicial/#reserva"}],
        },
        {
            "type": "texto",
            "id": "el-problema",
            "h2": "Entrenas mucho, pero ¿entrenas lo que necesitas?",
            "estrecha": True,
            "parrafos": [
                "La mayoría de clubes amateur y semiprofesionales no tienen preparador físico propio. El resultado es conocido: picos de forma que no llegan, lesiones que se repiten y temporadas que se cortan a mitad. El 1 a 1 lo resuelve, pero no siempre encaja en tu presupuesto.",
            ],
        },
        {
            "type": "cards",
            "id": "la-solucion",
            "h2": "Atención casi individual, a precio de grupo",
            "intro": "Performance Group es el punto intermedio entre el entrenamiento personal y The Axis Club: máximo 3 deportistas por sesión, cada uno con un programa diseñado para su deporte, su posición y su calendario.",
            "cols": 2,
            "cards": [
                {"titulo": "Fuerza y potencia específicas", "texto": "Trabajo orientado a los gestos de tu deporte: saltos, cambios de dirección, golpeo, carrera."},
                {"titulo": "Prevención de lesiones", "texto": "Detectamos déficits en la valoración y los trabajamos antes de que se conviertan en lesión."},
                {"titulo": "Planificación por temporada", "texto": "Pretemporada, temporada y transición, ajustadas a tu calendario de competición."},
                {"titulo": "Fisio en el mismo equipo", "texto": "Si algo molesta, lo vemos ese mismo día."},
            ],
        },
        {
            "type": "deportes",
            "id": "deportes",
            "h2": "Para deportistas de cualquier disciplina",
            "lista": ["Pádel", "Fútbol", "Baloncesto", "Running y trail", "Triatlón", "Deportes de raqueta", "Deportes de contacto"],
            "texto": "Trabajamos con deportistas amateur y semiprofesionales, y nuestros preparadores trabajan también con deportistas de élite [pendiente: ejemplos o clubes que se puedan citar].",
        },
        {
            "type": "texto",
            "id": "formato",
            "h2": "Cómo funciona",
            "estrecha": True,
            "parrafos": [
                "Bonos de 8 sesiones en grupo de máximo 3 deportistas. Ideal para pretemporada o para preparar una competición concreta. Empieza con la valoración, que en deportistas incluye pruebas específicas de rendimiento [dato a validar].",
            ],
        },
        {
            "type": "faq",
            "id": "faq",
            "h2": "Preguntas frecuentes",
            "grupos": [
                (None, [
                    {"pregunta": "¿Necesito competir para entrar?", "respuesta": "No. Está pensado para deportistas comprometidos con su deporte, compitan o no."},
                    {"pregunta": "¿Podéis coordinaros con mi club?", "respuesta": "Sí. Podemos adaptar la carga a tus entrenamientos y partidos [a validar según el club]."},
                    {"pregunta": "¿Cuándo conviene empezar?", "respuesta": "Lo ideal es empezar 6 a 8 semanas antes del inicio de temporada o de la competición objetivo."},
                ]),
            ],
        },
    ],
    "enlaces_internos": [
        ("Valoración inicial", "/es/valoracion-inicial/"),
        ("Readaptación de lesiones", "/es/readaptacion-lesiones/"),
        ("Fisioterapia", "/es/fisioterapia/"),
        ("Nutrición", "/es/nutricion/"),
        ("Artículo: Ejercicios de fuerza para jugadores de pádel", "/es/blog/ejercicios-fuerza-jugadores-padel/"),
    ],
}

FISIOTERAPIA = {
    "slug": "fisioterapia",
    "path": "/es/fisioterapia/",
    "title": "Fisioterapeuta en Gavà: fisioterapia deportiva | Axis",
    "meta_description": "Fisioterapia en Gavà con sesiones de una hora y fisioterapeuta colegiado. Tratamos el dolor y coordinamos tu vuelta al entrenamiento. Reserva tu sesión.",
    "h1": "Fisioterapeuta en Gavà",
    "breadcrumb": [("Inicio", "/es/"), ("Servicios", "/es/servicios/"), ("Fisioterapia", None)],
    "blocks": [
        {
            "type": "hero_servicio",
            "antetitulo": "Fisioterapia",
            "h1": "Fisioterapeuta en Gavà",
            "texto": "Sesiones de una hora con fisioterapeuta colegiado. Tratamos el dolor, buscamos la causa y te devolvemos al movimiento con un plan que no termina en la camilla.",
            "ctas": [{"texto": "Reserva tu sesión de presentación", "href": "/es/valoracion-inicial/#reserva"}],
        },
        {
            "type": "texto",
            "id": "diferencial",
            "h2": "Fisioterapia que no se queda en la camilla",
            "estrecha": True,
            "parrafos": [
                "En muchas clínicas la sesión acaba cuando te levantas. En Axis el fisioterapeuta y el entrenador comparten tu historial, así que el tratamiento continúa en la sala: ejercicio terapéutico, fuerza y control para que la molestia no vuelva.",
                "Cuando algo falla, afecta a lo demás. Por eso lo tratamos en conjunto.",
            ],
        },
        {
            "type": "cards",
            "id": "que-tratamos",
            "h2": "Motivos de consulta más habituales",
            "cols": 3,
            "cards": [
                {"titulo": "Dolor de espalda y cuello", "texto": "Lumbalgias, cervicalgias y molestias por postura o sedentarismo."},
                {"titulo": "Lesiones deportivas", "texto": "Esguinces, roturas fibrilares, tendinopatías y sobrecargas."},
                {"titulo": "Rodilla y hombro", "texto": "Dolor femoropatelar, ligamentos, manguito rotador."},
                {"titulo": "Postoperatorios", "texto": "Recuperación tras cirugía de ligamento cruzado, menisco u hombro."},
                {"titulo": "Dolor persistente", "texto": "Molestias que vuelven una y otra vez y no terminan de irse."},
            ],
        },
        {
            "type": "pasos",
            "id": "como-es-sesion",
            "h2": "60 minutos con un solo objetivo: que vuelvas a moverte bien",
            "pasos": [
                {"numero": "01", "titulo": "Evaluación", "texto": "Historial, exploración y pruebas funcionales."},
                {"numero": "02", "titulo": "Tratamiento", "texto": "Terapia manual, punción seca o ejercicio terapéutico según el caso [técnicas concretas a validar]."},
                {"numero": "03", "titulo": "Plan", "texto": "Ejercicios para casa y coordinación con tu entrenador si ya entrenas en Axis."},
            ],
        },
        {
            "type": "texto",
            "id": "siguiente-paso",
            "h2": "Del alta al rendimiento",
            "estrecha": True,
            "parrafos": [
                'Cuando el dolor ya no manda, empieza la readaptación: recuperar fuerza, confianza y capacidad para volver a tu deporte o a tu vida sin límites. <a class="enlace-flecha" href="/es/readaptacion-lesiones/">Readaptación de lesiones en Gavà →</a>',
            ],
        },
        {
            "type": "faq",
            "id": "faq",
            "h2": "Preguntas frecuentes",
            "grupos": [
                (None, [
                    {"pregunta": "¿Necesito volante médico?", "respuesta": "No. Puedes venir directamente."},
                    {"pregunta": "¿Cuánto dura cada sesión?", "respuesta": "Una hora completa con el fisioterapeuta."},
                    {"pregunta": "¿Trabajáis con mutuas?", "respuesta": "[pendiente de confirmar]"},
                    {"pregunta": "¿Cuántas sesiones voy a necesitar?", "respuesta": "Depende de la lesión. Te lo decimos tras la primera evaluación, con un plan claro de principio a fin."},
                ]),
            ],
        },
    ],
    "enlaces_internos": [
        ("Readaptación de lesiones", "/es/readaptacion-lesiones/"),
        ("Entrenamiento personal", "/es/entrenamiento-personal/"),
        ("Equipo (ficha del fisioterapeuta)", "/es/equipo/"),
        ("Artículo: Dolor lumbar y gimnasio, qué hacer", "/es/blog/dolor-lumbar-gimnasio/"),
    ],
}

READAPTACION = {
    "slug": "readaptacion-lesiones",
    "path": "/es/readaptacion-lesiones/",
    "title": "Readaptación de lesiones en Gavà: vuelve más fuerte | Axis",
    "meta_description": "Readaptación deportiva en Gavà: del alta de fisioterapia al rendimiento, con fisioterapeuta y preparador físico en el mismo equipo. Reserva tu sesión.",
    "h1": "Readaptación de lesiones en Gavà",
    "breadcrumb": [("Inicio", "/es/"), ("Servicios", "/es/servicios/"), ("Readaptación de lesiones", None)],
    "blocks": [
        {
            "type": "hero_servicio",
            "antetitulo": "Readaptación",
            "h1": "Readaptación de lesiones en Gavà",
            "texto": "Que ya no duela no significa que estés listo. Te acompañamos desde el alta hasta que vuelves a tu deporte o a tu vida sin límites, y con menos riesgo de recaer.",
            "ctas": [{"texto": "Empieza por la valoración", "href": "/es/valoracion-inicial/#reserva"}],
        },
        {
            "type": "texto",
            "id": "hueco",
            "h2": "El tramo que casi nadie trabaja",
            "estrecha": True,
            "parrafos": [
                "El fisioterapeuta te da el alta. El entrenador te recibe como si nada hubiera pasado. Entre ambos queda un tramo sin dueño: recuperar fuerza, confianza y capacidad específica. Ahí es donde se producen la mayoría de recaídas, y ahí es donde trabaja Axis.",
            ],
        },
        {
            "type": "pasos",
            "id": "como-lo-hacemos",
            "h2": "Un equipo, un solo plan de vuelta",
            "pasos": [
                {"numero": "01", "titulo": "Fisioterapia", "texto": "Controlamos el dolor y recuperamos el rango de movimiento."},
                {"numero": "02", "titulo": "Readaptación", "texto": "Fuerza, control y gestos progresivos, con criterios objetivos para avanzar de fase."},
                {"numero": "03", "titulo": "Vuelta al rendimiento", "texto": "Trabajo específico de tu deporte hasta que estás por encima de tu nivel previo."},
            ],
        },
        {
            "type": "texto",
            "id": "equipo-unico",
            "h2": "",
            "estrecha": True,
            "parrafos": [
                "Fisioterapeuta y preparador físico comparten tu historial y deciden juntos cada paso. Sin saltos al vacío.",
            ],
        },
        {
            "type": "deportes",
            "id": "lesiones-frecuentes",
            "h2": "Lesiones que readaptamos",
            "lista": [
                "Ligamento cruzado anterior", "Esguince de tobillo", "Roturas musculares de isquiotibiales y gemelo",
                "Tendinopatías rotuliana y aquílea", "Hombro doloroso", "Lumbalgia recurrente", "Postoperatorios de rodilla y hombro",
            ],
            "texto": "Readaptamos a deportistas que quieren volver a competir y a personas que solo quieren volver a correr, jugar con sus hijos o subir escaleras sin pensarlo. El criterio es el mismo. El objetivo lo pones tú.",
        },
        {
            "type": "faq",
            "id": "faq",
            "h2": "Preguntas frecuentes",
            "grupos": [
                (None, [
                    {"pregunta": "¿Cuánto dura una readaptación?", "respuesta": "Depende de la lesión. Una ruptura de ligamento cruzado requiere meses; un esguince, semanas. Te damos un plan con fases tras la valoración."},
                    {"pregunta": "¿Puedo venir si me operé en otro centro?", "respuesta": "Sí. Trae tu informe y coordinamos el trabajo con tu cirujano o fisioterapeuta si hace falta."},
                    {"pregunta": "¿Qué diferencia hay con la fisioterapia?", "respuesta": "La fisioterapia trata la lesión. La readaptación te devuelve la capacidad de rendir. En Axis hacemos ambas."},
                ]),
            ],
        },
    ],
    "enlaces_internos": [
        ("Fisioterapia", "/es/fisioterapia/"),
        ("Performance Group", "/es/preparacion-fisica-deportistas/"),
        ("Entrenamiento personal", "/es/entrenamiento-personal/"),
        ("Artículo: Cuándo volver a entrenar después de una lesión de rodilla", "/es/blog/volver-a-entrenar-despues-lesion-rodilla/"),
    ],
}

NUTRICION = {
    "slug": "nutricion",
    "path": "/es/nutricion/",
    "title": "Nutricionista deportivo en Gavà: plan a medida | Axis",
    "meta_description": "Nutrición personalizada en Gavà: consulta inicial de una hora, plan a medida y seguimiento, coordinado con tu entrenamiento. Reserva tu sesión.",
    "h1": "Nutricionista deportivo en Gavà",
    "breadcrumb": [("Inicio", "/es/"), ("Servicios", "/es/servicios/"), ("Nutrición", None)],
    "blocks": [
        {
            "type": "hero_servicio",
            "antetitulo": "Nutrición",
            "h1": "Nutricionista deportivo en Gavà",
            "texto": "Lo que comes decide buena parte de lo que rindes. Un plan nutricional hecho para ti, coordinado con tu entrenamiento y tu recuperación.",
            "ctas": [{"texto": "Reserva tu sesión de presentación", "href": "/es/valoracion-inicial/#reserva"}],
        },
        {
            "type": "texto",
            "id": "diferencial",
            "h2": "Tu nutricionista habla con tu entrenador",
            "estrecha": True,
            "parrafos": [
                "Seguir una dieta de internet es fácil de empezar y difícil de sostener. En Axis tu nutricionista conoce tu programa de entrenamiento, tus lesiones y tus horarios. El plan se ajusta a tu vida real, no al revés.",
            ],
        },
        {
            "type": "lista_check",
            "id": "objetivos",
            "h2": "Para qué te ayudamos",
            "items": [
                "Perder grasa sin perder músculo ni energía",
                "Ganar masa muscular con criterio",
                "Rendir más en tu deporte y recuperar mejor",
                "Ordenar tus hábitos y tu relación con la comida",
                "Acompañar una recuperación de lesión",
            ],
        },
        {
            "type": "pasos",
            "id": "como-funciona",
            "h2": "Tu primer mes y después",
            "pasos": [
                {"numero": "01", "titulo": "Consulta inicial (1 hora)", "texto": "Historia, hábitos, composición corporal y objetivos."},
                {"numero": "02", "titulo": "Plan personalizado", "texto": "Te lo entregamos y resolvemos dudas en una segunda sesión."},
                {"numero": "03", "titulo": "Seguimiento", "texto": "Revisiones periódicas para ajustar el plan a tus resultados."},
            ],
        },
        {
            "type": "faq",
            "id": "faq",
            "h2": "Preguntas frecuentes",
            "grupos": [
                (None, [
                    {"pregunta": "¿Tengo que entrenar en Axis para venir al nutricionista?", "respuesta": "No, aunque el resultado es mejor cuando todo va coordinado."},
                    {"pregunta": "¿Me vais a dar una dieta cerrada?", "respuesta": "Te damos un plan adaptado a tus gustos y horarios, con margen para la vida social."},
                    {"pregunta": "¿Puedo incluirla en Essentials?", "respuesta": "Sí. Los paquetes Balance y Elite incluyen sesiones de nutrición o psicología."},
                ]),
            ],
        },
    ],
    "enlaces_internos": [
        ("Valoración inicial", "/es/valoracion-inicial/"),
        ("Entrenamiento personal", "/es/entrenamiento-personal/"),
        ("Performance Group", "/es/preparacion-fisica-deportistas/"),
        ("Psicología", "/es/psicologia/"),
    ],
}

PSICOLOGIA = {
    "slug": "psicologia",
    "path": "/es/psicologia/",
    "title": "Psicología deportiva en Gavà y Baix Llobregat | Axis",
    "meta_description": "Psicología deportiva y de la salud en Gavà: motivación, adherencia, gestión del estrés y rendimiento, integrada con tu entrenamiento. Reserva tu sesión.",
    "h1": "Psicología deportiva en Gavà",
    "breadcrumb": [("Inicio", "/es/"), ("Servicios", "/es/servicios/"), ("Psicología", None)],
    "blocks": [
        {
            "type": "hero_servicio",
            "antetitulo": "Psicología",
            "h1": "Psicología deportiva en Gavà",
            "texto": "El cuerpo rinde hasta donde la mente le deja. Soporte psicológico para sostener el cambio, gestionar la presión y disfrutar del proceso.",
            "ctas": [{"texto": "Reserva tu sesión de presentación", "href": "/es/valoracion-inicial/#reserva"}],
        },
        {
            "type": "texto",
            "id": "por-que",
            "h2": "La pieza que falta en la mayoría de planes",
            "estrecha": True,
            "parrafos": [
                "Sabes lo que tienes que hacer, pero no lo haces. Empiezas con fuerza y lo dejas a las tres semanas. Te lesionas y el miedo a volver pesa más que la lesión. No es falta de voluntad: es una parte del rendimiento que casi nadie trabaja. En Axis sí.",
            ],
        },
        {
            "type": "cards",
            "id": "areas",
            "h2": "Áreas de intervención",
            "cols": 2,
            "cards": [
                {"titulo": "Adherencia y hábitos", "texto": "Construir constancia y que entrenar deje de depender de la motivación."},
                {"titulo": "Rendimiento deportivo", "texto": "Concentración, gestión de la presión y preparación mental para competir."},
                {"titulo": "Vuelta tras lesión", "texto": "Miedo al movimiento y confianza para volver a rendir."},
                {"titulo": "Estrés y equilibrio", "texto": "Gestionar la carga del día a día para que tu salud no pase a segundo plano."},
            ],
        },
        {
            "type": "texto",
            "id": "como-funciona",
            "h2": "Integrada con el resto del equipo",
            "estrecha": True,
            "parrafos": [
                "Tu psicólogo trabaja coordinado con tu entrenador, fisioterapeuta y nutricionista, siempre con tu consentimiento y respetando la confidencialidad. Sesiones individuales en el centro [pendiente: duración exacta y opción online].",
            ],
        },
        {
            "type": "faq",
            "id": "faq",
            "h2": "Preguntas frecuentes",
            "grupos": [
                (None, [
                    {"pregunta": "¿Es solo para deportistas?", "respuesta": "No. Es para cualquier persona que quiera sostener un cambio de hábitos o gestionar mejor su día a día."},
                    {"pregunta": "¿Lo que hablo con el psicólogo lo sabe el resto del equipo?", "respuesta": "Solo lo que tú autorices y lo necesario para coordinar tu plan."},
                    {"pregunta": "¿El psicólogo está colegiado?", "respuesta": "Sí [pendiente: número de colegiado]."},
                ]),
            ],
        },
    ],
    "enlaces_internos": [
        ("Nutrición", "/es/nutricion/"),
        ("Readaptación de lesiones", "/es/readaptacion-lesiones/"),
        ("Performance Group", "/es/preparacion-fisica-deportistas/"),
        ("Método Live in Loop", "/es/metodo-live-in-loop/"),
    ],
}

SERVICE_PAGES = [
    ENTRENAMIENTO_PERSONAL,
    AXIS_CLUB,
    PERFORMANCE_GROUP,
    FISIOTERAPIA,
    READAPTACION,
    NUTRICION,
    PSICOLOGIA,
]
