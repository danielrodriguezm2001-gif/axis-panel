const { useState, useEffect, useMemo, useRef } = React;
const DAY_START = 7;
const DAY_END = 22;
const PX_PER_MIN = 1.35;
const DEFAULT_COACHES = [
  { id: "erik", name: "Erik Benavides", role: "Entrenador personal / Fisio", color: "#0D9488", email: "" },
  { id: "marc", name: "Marc Rosa", role: "Entrenador personal", color: "#2563EB", email: "" },
  { id: "daniel", name: "Daniel Rodriguez", role: "Entrenador personal", color: "#D97706", email: "" },
  { id: "sergio", name: "Sergio Mar\xEDn", role: "Entrenador personal", color: "#9333EA", email: "" }
];
const DEFAULT_ROOMS = [
  { id: "sala1", name: "Sala 1" },
  { id: "sala2", name: "Sala 2" }
];
const UNKNOWN_COLOR = "#6B7280";
const PAYMENTS_SEED = [{ "id": "224", "d": "2026-07-13", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Alex Ruiz Gutierrez", "st": "fin", "met": "Efectivo" }, { "id": "100", "d": "2026-07-13", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Alex Ruiz Gutierrez", "st": "fin", "met": "Efectivo" }, { "id": "263", "d": "2026-07-13", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Emma Stanley Carneiro", "st": "fin", "met": "Efectivo" }, { "id": "251", "d": "2026-07-13", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Pablo S\xE1nchez", "st": "fin", "met": "Transferencia" }, { "id": "65", "d": "2026-05-14", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Hashim Almadani", "st": "fin", "met": "Transferencia" }, { "id": "117", "d": "2026-06-03", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Mali Fari\xF1a", "st": "fin", "met": "Transferencia" }, { "id": "248", "d": "2026-07-03", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Mali Fari\xF1a", "st": "fin", "met": "Transferencia" }, { "id": "261", "d": "2026-07-06", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Jan Barbero", "st": "fin", "met": "Transferencia" }, { "id": "260", "d": "2026-07-12", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Victor Lebron", "st": "fin", "met": "Transferencia" }, { "id": "172", "d": "2026-06-25", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Arnau Skufca Vieit", "st": "fin", "met": "Transferencia" }, { "id": "178", "d": "2026-06-25", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Arnau Skufca Vieit", "st": "fin", "met": "Transferencia" }, { "id": "96", "d": "2026-06-25", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Arnau Skufca Vieit", "st": "fin", "met": "Transferencia" }, { "id": "47", "d": "2026-05-01", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Arnau Skufca Vieit", "st": "fin", "met": "Transferencia" }, { "id": "243", "d": "2026-05-11", "c": "marc", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Abel Rodriguez", "st": "fin", "met": "Transferencia" }, { "id": "76", "d": "2026-06-25", "c": "marc", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "John Mulero", "st": "fin", "met": "Transferencia" }, { "id": "87", "d": "2026-05-31", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Xavi Cabrera", "st": "fin", "met": "Transferencia" }, { "id": "128", "d": "2026-05-24", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Xavi Cabrera", "st": "fin", "met": "Transferencia" }, { "id": "188", "d": "2026-07-10", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Karina Caelles", "st": "fin", "met": "Efectivo" }, { "id": "111", "d": "2026-07-10", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Karina Caelles", "st": "fin", "met": "Efectivo" }, { "id": "59", "d": "2026-05-31", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Karina Caelles", "st": "fin", "met": "Efectivo" }, { "id": "150", "d": "2026-06-11", "c": "marc", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Gemma Carrete", "st": "fin", "met": "Efectivo" }, { "id": "177", "d": "2026-06-11", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Gemma Carrete", "st": "fin", "met": "Efectivo" }, { "id": "115", "d": "2026-06-08", "c": "axis", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Derek Puig", "st": "fin", "met": "Efectivo" }, { "id": "113", "d": "2026-06-01", "c": "marc", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Derek Puig", "st": "fin", "met": "Efectivo" }, { "id": "116", "d": "2026-06-08", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Giovani Puig", "st": "fin", "met": "Efectivo" }, { "id": "131", "d": "2026-06-02", "c": "marc", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Giovani Puig", "st": "fin", "met": "Efectivo" }, { "id": "138", "d": "2026-06-23", "c": "marc", "cat": "Online", "amt": 60, "cl": "Gerard F\xE9rnandez Castellanos", "st": "fin", "met": "Transferencia" }, { "id": "137", "d": "2026-06-23", "c": "marc", "cat": "Online", "amt": 60, "cl": "Gerard F\xE9rnandez Castellanos", "st": "fin", "met": "Transferencia" }, { "id": "98", "d": "2026-06-04", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Fatima Ginard Aguilera", "st": "fin", "met": "Efectivo" }, { "id": "53", "d": "2026-05-19", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Fatima Ginard Aguilera", "st": "fin", "met": "Efectivo" }, { "id": "187", "d": "2026-06-26", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Emma Stanley Carneiro", "st": "fin", "met": "Efectivo" }, { "id": "94", "d": "2026-05-28", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Emma Stanley Carneiro", "st": "fin", "met": "Efectivo" }, { "id": "50", "d": "2026-05-04", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Emma Stanley Carneiro", "st": "fin", "met": "Efectivo" }, { "id": "51", "d": "2026-05-19", "c": "marc", "cat": "Pack 8", "amt": 440, "cl": "Alex Ruiz Gutierrez", "st": "fin", "met": "Efectivo" }, { "id": "49", "d": "2026-05-03", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Victor Lebron", "st": "fin", "met": "Transferencia" }, { "id": "101", "d": "2026-06-14", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 240, "cl": "Victor Lebron", "st": "fin", "met": "Transferencia" }, { "id": "148", "d": "2026-07-06", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Savi Moschillo", "st": "fin", "met": "Transferencia" }, { "id": "64", "d": "2026-07-06", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Savi Moschillo", "st": "fin", "met": "Transferencia" }, { "id": "70", "d": "2026-05-08", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Sara G\xF3mez Gonz\xE1lez", "st": "fin", "met": "Efectivo" }, { "id": "71", "d": "2026-05-14", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Rafa Moreu", "st": "fin", "met": "Transferencia" }, { "id": "146", "d": "2026-06-14", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Rafa Moreu", "st": "fin", "met": "Transferencia" }, { "id": "56", "d": "2026-06-27", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Pau G\xF3mez", "st": "fin", "met": "Transferencia" }, { "id": "223", "d": "2026-06-27", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Pau G\xF3mez", "st": "fin", "met": "Transferencia" }, { "id": "95", "d": "2026-06-23", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Pau Fern\xE1ndez Peque", "st": "fin", "met": "Transferencia" }, { "id": "92", "d": "2026-06-23", "c": "marc", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Pau Fern\xE1ndez Peque", "st": "fin", "met": "Transferencia" }, { "id": "181", "d": "2026-07-08", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 135, "cl": "Pau Fern\xE1ndez", "st": "fin", "met": "Transferencia" }, { "id": "102", "d": "2026-07-08", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Pau Fern\xE1ndez", "st": "fin", "met": "Transferencia" }, { "id": "93", "d": "2026-07-08", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Pau Fern\xE1ndez", "st": "fin", "met": "Transferencia" }, { "id": "68", "d": "2026-07-07", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Pablo S\xE1nchez", "st": "fin", "met": "Transferencia" }, { "id": "147", "d": "2026-06-07", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Pablo S\xE1nchez", "st": "fin", "met": "Tarjeta" }, { "id": "79", "d": "2026-07-03", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Marc Esteban", "st": "fin", "met": "Transferencia" }, { "id": "175", "d": "2026-07-03", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Marc Esteban", "st": "fin", "met": "Transferencia" }, { "id": "118", "d": "2026-06-11", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Manel Ram\xEDrez", "st": "fin", "met": "Efectivo" }, { "id": "69", "d": "2026-05-08", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Manel Ram\xEDrez", "st": "fin", "met": "Transferencia" }, { "id": "54", "d": "2026-05-12", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Mali Fari\xF1a", "st": "fin", "met": "Efectivo" }, { "id": "127", "d": "2026-05-28", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Jan Barbero", "st": "fin", "met": "Transferencia" }, { "id": "48", "d": "2026-04-30", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Jan Barbero", "st": "fin", "met": "Transferencia" }, { "id": "110", "d": "2026-06-29", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Guille Ferr\xEDn", "st": "fin", "met": "Transferencia" }, { "id": "52", "d": "2026-06-22", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Guille Ferr\xEDn", "st": "fin", "met": "Transferencia" }, { "id": "77", "d": "2026-07-12", "c": "marc", "cat": "Bono 3 sesiones", "amt": 180, "cl": "George Andrews", "st": "fin", "met": "Transferencia" }, { "id": "99", "d": "2026-05-29", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Carlos Mart\xEDn", "st": "fin", "met": "Efectivo" }, { "id": "85", "d": "2026-05-22", "c": "marc", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Carlos Mart\xEDn", "st": "fin", "met": "Efectivo" }, { "id": "72", "d": "2026-05-31", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Ana Mar\xEDa Torres Hug", "st": "fin", "met": "Transferencia" }, { "id": "123", "d": "2026-06-04", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Ana Mar\xEDa Torres Hug", "st": "fin", "met": "Transferencia" }, { "id": "13", "d": "2026-05-15", "c": "marc", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "\xC1ngel Fontova", "st": "fin", "met": "Transferencia" }, { "id": "14", "d": "2026-05-15", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "\xC1ngel Fontova", "st": "fin", "met": "Transferencia" }, { "id": "204", "d": "2026-07-11", "c": "eric", "cat": "Pack 4", "amt": 204, "cl": "Claudia D\xF6rr", "st": "fin", "met": "Efectivo" }, { "id": "209", "d": "2026-07-11", "c": "eric", "cat": "Pack 4", "amt": 204, "cl": "Lara D\xEDaz", "st": "fin", "met": "Transferencia" }, { "id": "105", "d": "2026-07-11", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Gemma Sanmart\xED", "st": "fin", "met": "Transferencia" }, { "id": "202", "d": "2026-06-29", "c": "eric", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Mat\xEDas Dupraz", "st": "fin", "met": "Transferencia" }, { "id": "195", "d": "2026-07-04", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Victor del Barrio", "st": "fin", "met": "Transferencia" }, { "id": "193", "d": "2026-06-30", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "In\xE9s Freitas", "st": "fin", "met": "Transferencia" }, { "id": "164", "d": "2026-06-30", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "In\xE9s Freitas", "st": "fin", "met": "Transferencia" }, { "id": "124", "d": "2026-06-30", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "In\xE9s Freitas", "st": "fin", "met": "Transferencia" }, { "id": "34", "d": "2026-06-30", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "In\xE9s Freitas", "st": "fin", "met": "Transferencia" }, { "id": "201", "d": "2026-06-29", "c": "eric", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Mat\xEDas Dupraz", "st": "fin", "met": "Transferencia" }, { "id": "156", "d": "2026-06-19", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 50, "cl": "Victor Ort\xEDz", "st": "fin", "met": "Transferencia" }, { "id": "200", "d": "2026-06-30", "c": "eric", "cat": "Pack 4", "amt": 240, "cl": "Aitor Roura", "st": "fin", "met": "Transferencia" }, { "id": "199", "d": "2026-06-29", "c": "eric", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Luca Dupraz", "st": "fin", "met": "Transferencia" }, { "id": "198", "d": "2026-06-29", "c": "eric", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Luca Dupraz", "st": "fin", "met": "Transferencia" }, { "id": "197", "d": "2026-06-30", "c": "sergio", "cat": "Sesi\xF3n individual", "amt": 60, "cl": "Luke", "st": "fin", "met": "Efectivo" }, { "id": "196", "d": "2026-06-30", "c": "sergio", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Luke", "st": "fin", "met": "Efectivo" }, { "id": "145", "d": "2026-06-26", "c": "sergio", "cat": "Pack 4", "amt": 240, "cl": "Liam Sierra Burke", "st": "fin", "met": "Efectivo" }, { "id": "27", "d": "2026-06-27", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Alessandra Pellini", "st": "fin", "met": "Transferencia" }, { "id": "165", "d": "2026-06-28", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 50, "cl": "Sebastian Diaz", "st": "fin", "met": "Transferencia" }, { "id": "192", "d": "2026-06-28", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Ivan Caba\xF1as", "st": "fin", "met": "Transferencia" }, { "id": "168", "d": "2026-06-28", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Jos\xE9 David Fuentes", "st": "fin", "met": "Efectivo" }, { "id": "191", "d": "2026-06-28", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Josue Moreno", "st": "fin", "met": "Efectivo" }, { "id": "167", "d": "2026-06-28", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 90, "cl": "Sheff JJ Agent", "st": "fin", "met": "Transferencia" }, { "id": "163", "d": "2026-06-28", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Edu Vila", "st": "fin", "met": "Efectivo" }, { "id": "161", "d": "2026-06-28", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Edu Vila", "st": "fin", "met": "Efectivo" }, { "id": "190", "d": "2026-06-28", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Eugenia Freniche", "st": "fin", "met": "Transferencia" }, { "id": "189", "d": "2026-06-28", "c": "eric", "cat": "Pack 4", "amt": 204, "cl": "Paula Rojals", "st": "fin", "met": "Transferencia" }, { "id": "169", "d": "2026-06-25", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Marco Cuoco", "st": "fin", "met": "Transferencia" }, { "id": "166", "d": "2026-06-25", "c": "eric", "cat": "Pack 4", "amt": 240, "cl": "I\xF1aki Echeandia", "st": "fin", "met": "Transferencia" }, { "id": "5", "d": "2026-06-20", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Diego Navarrete", "st": "fin", "met": "Transferencia" }, { "id": "160", "d": "2026-06-20", "c": "eric", "cat": "Pack 4", "amt": 110, "cl": "Diego Navarrete", "st": "fin", "met": "Transferencia" }, { "id": "162", "d": "2026-06-19", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Sheff JJ Agent", "st": "fin", "met": "Transferencia" }, { "id": "141", "d": "2026-06-19", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Patricia Benito", "st": "fin", "met": "Transferencia" }, { "id": "142", "d": "2026-06-19", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Oscar D\xEDaz", "st": "fin", "met": "Transferencia" }, { "id": "159", "d": "2026-06-19", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Alessandra Pellini", "st": "fin", "met": "Transferencia" }, { "id": "158", "d": "2026-06-19", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Manel Ram\xEDrez", "st": "fin", "met": "Transferencia" }, { "id": "155", "d": "2026-06-19", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Victor del Barrio", "st": "fin", "met": "Transferencia" }, { "id": "153", "d": "2026-06-19", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Edu Vila", "st": "fin", "met": "Transferencia" }, { "id": "152", "d": "2026-06-19", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Roger Vila", "st": "fin", "met": "Transferencia" }, { "id": "125", "d": "2026-06-19", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Ariadna Calvet", "st": "fin", "met": "Transferencia" }, { "id": "157", "d": "2026-06-19", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Iv\xE1n Reche", "st": "fin", "met": "Efectivo" }, { "id": "154", "d": "2026-06-19", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Mart\xEDn Cahisa", "st": "fin", "met": "Transferencia" }, { "id": "151", "d": "2026-06-19", "c": "eric", "cat": "Pack 4", "amt": 204, "cl": "Husa Vallecillos", "st": "fin", "met": "Efectivo" }, { "id": "144", "d": "2026-06-14", "c": "axis", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Liam Sierra Burke", "st": "fin", "met": "Efectivo" }, { "id": "143", "d": "2026-06-12", "c": "eric", "cat": "Pack 4", "amt": 240, "cl": "Ariel Larralde", "st": "fin", "met": "Transferencia" }, { "id": "97", "d": "2026-06-11", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "fin", "met": "Tarjeta" }, { "id": "84", "d": "2026-06-11", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "fin", "met": "Tarjeta" }, { "id": "46", "d": "2026-06-07", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Ariadna G\xF3mez", "st": "fin", "met": "Transferencia" }, { "id": "107", "d": "2026-05-31", "c": "eric", "cat": "Bono 2 sesiones para las 10", "amt": 130, "cl": "Isabel De Arcos", "st": "fin", "met": "Transferencia" }, { "id": "106", "d": "2026-05-31", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Cristina Griego", "st": "fin", "met": "Efectivo" }, { "id": "44", "d": "2026-05-04", "c": "eric", "cat": "Pack 8", "amt": 520, "cl": "Isabel De Arcos", "st": "fin", "met": "Transferencia" }, { "id": "75", "d": "2026-05-31", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "fin", "met": "Transferencia" }, { "id": "73", "d": "2026-05-31", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Abel Rodriguez", "st": "fin", "met": "Transferencia" }, { "id": "63", "d": "2026-05-31", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "fin", "met": "Transferencia" }, { "id": "60", "d": "2026-05-31", "c": "axis", "cat": "Pack 4", "amt": 240, "cl": "Pavel Kadochnikov", "st": "fin", "met": "Efectivo" }, { "id": "55", "d": "2026-05-31", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "John Mulero", "st": "fin", "met": "Transferencia" }, { "id": "36", "d": "2026-05-30", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Marco Cuoco", "st": "fin", "met": "Transferencia" }, { "id": "45", "d": "2026-05-30", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Jordi Cascos", "st": "fin", "met": "Efectivo" }, { "id": "43", "d": "2026-05-25", "c": "eric", "cat": "Pack 4", "amt": 240, "cl": "I\xF1aki Echeandia", "st": "fin", "met": "Transferencia" }, { "id": "42", "d": "2026-05-23", "c": "eric", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Ariel Larralde", "st": "fin", "met": "Transferencia" }, { "id": "7", "d": "2026-04-27", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Jordi Cascos", "st": "fin", "met": "Efectivo" }, { "id": "38", "d": "2026-05-23", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Ana Dom\xEDnguez", "st": "fin", "met": "Transferencia" }, { "id": "41", "d": "2026-05-23", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Manel Ram\xEDrez", "st": "fin", "met": "Transferencia" }, { "id": "37", "d": "2026-05-22", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Nacho Felechosa", "st": "fin", "met": "Transferencia" }, { "id": "8", "d": "2026-05-22", "c": "eric", "cat": "Pack 4", "amt": 204, "cl": "Lara D\xEDaz", "st": "fin", "met": "Transferencia" }, { "id": "6", "d": "2026-05-22", "c": "eric", "cat": "Pack 4", "amt": 204, "cl": "Paula Rojals", "st": "fin", "met": "Transferencia" }, { "id": "10", "d": "2026-05-22", "c": "eric", "cat": "Pack 8", "amt": 400, "cl": "Mart\xEDn Cahisa", "st": "fin", "met": "Transferencia" }, { "id": "16", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Isabel De Arcos", "st": "fin", "met": "Transferencia" }, { "id": "17", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Isabel De Arcos", "st": "fin", "met": "Transferencia" }, { "id": "18", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Isabel De Arcos", "st": "fin", "met": "Transferencia" }, { "id": "19", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Isabel De Arcos", "st": "fin", "met": "Transferencia" }, { "id": "20", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Isabel De Arcos", "st": "fin", "met": "Transferencia" }, { "id": "31", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Jos\xE9 David Fuentes", "st": "fin", "met": "Efectivo" }, { "id": "30", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Laura Mart\xEDnez", "st": "fin", "met": "Efectivo" }, { "id": "29", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 50, "cl": "Alfredo Varela", "st": "fin", "met": "Efectivo" }, { "id": "26", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Claudia D\xF6rr", "st": "fin", "met": "Efectivo" }, { "id": "24", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Abel M\xE1rquez", "st": "fin", "met": "Efectivo" }, { "id": "1", "d": "2026-05-16", "c": "eric", "cat": "Pack 8", "amt": 400, "cl": "Oscar D\xEDaz", "st": "fin", "met": "Transferencia" }, { "id": "2", "d": "2026-05-16", "c": "eric", "cat": "Pack 8", "amt": 400, "cl": "Patricia Benito", "st": "fin", "met": "Transferencia" }, { "id": "25", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Iago Ib\xE1\xF1ez", "st": "fin", "met": "Transferencia" }, { "id": "23", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 50, "cl": "David Pulido", "st": "fin", "met": "Transferencia" }, { "id": "22", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Vivi Bienefeld", "st": "fin", "met": "Efectivo" }, { "id": "21", "d": "2026-05-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 55, "cl": "Ana Jimenez", "st": "fin", "met": "Efectivo" }, { "id": "28", "d": "2026-05-16", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Dirk Hahneiser", "st": "fin", "met": "Transferencia" }, { "id": "12", "d": "2026-05-05", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "In\xE9s Freitas", "st": "fin", "met": "Transferencia" }, { "id": "11", "d": "2026-05-05", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "In\xE9s Freitas", "st": "fin", "met": "Transferencia" }, { "id": "9", "d": "2026-05-05", "c": "eric", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "In\xE9s Freitas", "st": "fin", "met": "Transferencia" }, { "id": "4", "d": "2026-05-13", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Rosa Buld\xF3", "st": "fin", "met": "Efectivo" }, { "id": "3", "d": "2026-05-13", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Iv\xE1n Reche", "st": "fin", "met": "Transferencia" }, { "id": "231", "d": "2026-04-27", "c": "marc", "cat": "Pack 4", "amt": 210, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "62", "d": "2026-05-01", "c": "axis", "cat": "Pack 4", "amt": 240, "cl": "Toni Fern\xE1ndez", "st": "pen", "met": "" }, { "id": "67", "d": "2026-05-07", "c": "axis", "cat": "Online", "amt": 60, "cl": "Iker Bravo", "st": "pen", "met": "" }, { "id": "230", "d": "2026-05-11", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "66", "d": "2026-05-14", "c": "axis", "cat": "Online", "amt": 60, "cl": "Iker Bravo", "st": "pen", "met": "" }, { "id": "78", "d": "2026-05-15", "c": "axis", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Sergio S\xE1nchez", "st": "pen", "met": "" }, { "id": "233", "d": "2026-05-18", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "236", "d": "2026-05-20", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "86", "d": "2026-05-22", "c": "axis", "cat": "Pack 4", "amt": 240, "cl": "Sergio S\xE1nchez", "st": "pen", "met": "" }, { "id": "81", "d": "2026-05-25", "c": "axis", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "82", "d": "2026-05-25", "c": "axis", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Khairo", "st": "pen", "met": "" }, { "id": "89", "d": "2026-05-25", "c": "axis", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Pavel Kadochnikov", "st": "pen", "met": "" }, { "id": "240", "d": "2026-05-25", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Khairo", "st": "pen", "met": "" }, { "id": "61", "d": "2026-05-27", "c": "marc", "cat": "Pack 4", "amt": 120, "cl": "Toni Fern\xE1ndez", "st": "pen", "met": "" }, { "id": "206", "d": "2026-06-01", "c": "sergio", "cat": "Pack 4", "amt": 240, "cl": "Lucas Gabriel", "st": "pen", "met": "" }, { "id": "129", "d": "2026-06-01", "c": "axis", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Pau Fern\xE1ndez Peque", "st": "pen", "met": "" }, { "id": "139", "d": "2026-06-01", "c": "axis", "cat": "Pack 8", "amt": 440, "cl": "Gerard F\xE9rnandez Castellanos", "st": "pen", "met": "" }, { "id": "140", "d": "2026-06-04", "c": "axis", "cat": "Small group / Grupo reducido", "amt": 405, "cl": "Gerard F\xE9rnandez Castellanos", "st": "pen", "met": "" }, { "id": "119", "d": "2026-06-04", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "pen", "met": "" }, { "id": "237", "d": "2026-06-05", "c": "axis", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "228", "d": "2026-06-08", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "241", "d": "2026-06-08", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Lucas Gabriel", "st": "pen", "met": "" }, { "id": "149", "d": "2026-06-11", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "pen", "met": "" }, { "id": "242", "d": "2026-06-15", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Lucas Gabriel", "st": "pen", "met": "" }, { "id": "234", "d": "2026-06-16", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "176", "d": "2026-06-18", "c": "axis", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Savi Moschillo", "st": "pen", "met": "" }, { "id": "173", "d": "2026-06-18", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "pen", "met": "" }, { "id": "174", "d": "2026-06-18", "c": "axis", "cat": "Pack 8", "amt": 440, "cl": "Gerard F\xE9rnandez Castellanos", "st": "pen", "met": "" }, { "id": "235", "d": "2026-06-19", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "226", "d": "2026-06-22", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Giorgi  Kochorashvili", "st": "pen", "met": "" }, { "id": "227", "d": "2026-06-22", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Giorgi  Kochorashvili", "st": "pen", "met": "" }, { "id": "232", "d": "2026-06-22", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "180", "d": "2026-06-22", "c": "axis", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Pavel Kadochnikov", "st": "pen", "met": "" }, { "id": "239", "d": "2026-06-23", "c": "axis", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "182", "d": "2026-06-23", "c": "axis", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Pau Fern\xE1ndez Peque", "st": "pen", "met": "" }, { "id": "238", "d": "2026-06-24", "c": "axis", "cat": "Pack 4", "amt": 240, "cl": "JJ Gabriel", "st": "pen", "met": "" }, { "id": "183", "d": "2026-06-24", "c": "axis", "cat": "Pack 8", "amt": 440, "cl": "Fatima Ginard Aguilera", "st": "pen", "met": "" }, { "id": "185", "d": "2026-06-25", "c": "axis", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "pen", "met": "" }, { "id": "225", "d": "2026-06-27", "c": "marc", "cat": "Pack 4", "amt": 90, "cl": "Giorgi  Kochorashvili", "st": "pen", "met": "" }, { "id": "244", "d": "2026-06-29", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Alex Sala", "st": "pen", "met": "" }, { "id": "245", "d": "2026-06-29", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Arnau Tenas", "st": "pen", "met": "" }, { "id": "221", "d": "2026-06-29", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Manel Ram\xEDrez", "st": "pen", "met": "" }, { "id": "246", "d": "2026-06-29", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Marc Tenas", "st": "pen", "met": "" }, { "id": "262", "d": "2026-07-01", "c": "marc", "cat": "Small group / Grupo reducido", "amt": 360, "cl": "Pau Fern\xE1ndez Peque", "st": "pen", "met": "" }, { "id": "247", "d": "2026-07-02", "c": "marc", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "pen", "met": "" }, { "id": "205", "d": "2026-07-03", "c": "sergio", "cat": "Pack 4", "amt": 240, "cl": "Liam Sierra Burke", "st": "pen", "met": "" }, { "id": "210", "d": "2026-07-04", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Oscar D\xEDaz", "st": "pen", "met": "" }, { "id": "208", "d": "2026-07-06", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "In\xE9s Freitas", "st": "pen", "met": "" }, { "id": "250", "d": "2026-07-06", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Marc Tenas", "st": "pen", "met": "" }, { "id": "249", "d": "2026-07-06", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Alex Sala", "st": "pen", "met": "" }, { "id": "207", "d": "2026-07-06", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Roger Vila", "st": "pen", "met": "" }, { "id": "211", "d": "2026-07-08", "c": "eric", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Paula Guti\xE9rrez", "st": "pen", "met": "" }, { "id": "252", "d": "2026-07-08", "c": "marc", "cat": "Valoraci\xF3n inicial", "amt": 100, "cl": "Diego silva", "st": "pen", "met": "" }, { "id": "213", "d": "2026-07-09", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Susana Moya", "st": "pen", "met": "" }, { "id": "212", "d": "2026-07-09", "c": "eric", "cat": "Pack 8", "amt": 376, "cl": "Jordi Cascos", "st": "pen", "met": "" }, { "id": "214", "d": "2026-07-09", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Paula Guti\xE9rrez", "st": "pen", "met": "" }, { "id": "253", "d": "2026-07-09", "c": "marc", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Graciano Carrillo Pousa", "st": "pen", "met": "" }, { "id": "254", "d": "2026-07-09", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Ruben Bonachera", "st": "pen", "met": "" }, { "id": "255", "d": "2026-07-09", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Diego silva", "st": "pen", "met": "" }, { "id": "256", "d": "2026-07-10", "c": "marc", "cat": "Pack 4", "amt": 240, "cl": "Carlos Mart\xEDn", "st": "pen", "met": "" }, { "id": "215", "d": "2026-07-11", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Patricia Benito", "st": "pen", "met": "" }, { "id": "216", "d": "2026-07-13", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "In\xE9s Freitas", "st": "pen", "met": "" }, { "id": "217", "d": "2026-07-15", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Gemma Sanmart\xED", "st": "pen", "met": "" }, { "id": "218", "d": "2026-07-15", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Marco Cuoco", "st": "pen", "met": "" }, { "id": "219", "d": "2026-07-16", "c": "eric", "cat": "Sesi\xF3n individual", "amt": 65, "cl": "Victor del Barrio", "st": "pen", "met": "" }, { "id": "220", "d": "2026-07-17", "c": "eric", "cat": "Pack 8", "amt": 440, "cl": "Mart\xEDn Cahisa", "st": "pen", "met": "" }];
const pad = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toMin = (hhmm) => {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
};
const fmtDateHuman = (iso) => {
  try {
    const d = /* @__PURE__ */ new Date(iso + "T12:00:00");
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  } catch (e) {
    return iso;
  }
};
const shiftDay = (iso, delta) => {
  const d = /* @__PURE__ */ new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const uid = () => Math.random().toString(36).slice(2, 10);
const stripAccents = (s) => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const nameKey = (s) => stripAccents(s).replace(/[^a-zñ\s]/g, " ").replace(/qu/g, "k").replace(/ck/g, "k").replace(/c(?=[aouñ\s]|$)/g, "k").replace(/\s+/g, " ").trim();
const matchCoach = (apiName, coaches) => {
  const apiTokens = nameKey(apiName).split(" ").filter(Boolean);
  if (!apiTokens.length) return void 0;
  let best;
  let bestScore = 0;
  for (const c of coaches) {
    const cTokens = nameKey(c.name).split(" ").filter(Boolean);
    const score = cTokens.filter((t) => apiTokens.includes(t)).length;
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best;
};
const PRODUCT_ORDER = [
  "Sesi\xF3n individual",
  "Pack 4",
  "Pack 8",
  "Small group / Grupo reducido",
  "Online",
  "Valoraci\xF3n inicial",
  "Fisio"
];
function categorize(title) {
  const t = stripAccents(title);
  if (!t) return "Sin tipo";
  if (t.includes("valoracion")) return "Valoraci\xF3n inicial";
  if (/pack\s*4|bono\s*4|4\s*sesiones/.test(t)) return "Pack 4";
  if (/pack\s*8|bono\s*8|8\s*sesiones/.test(t)) return "Pack 8";
  if (t.includes("small group") || t.includes("grupo reducido") || t.includes("grupo")) return "Small group / Grupo reducido";
  if (t.includes("online")) return "Online";
  if (t.includes("fisio")) return "Fisio";
  if (t.includes("individual") || t.includes("sesion")) return "Sesi\xF3n individual";
  return title.trim().charAt(0).toUpperCase() + title.trim().slice(1);
}
const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const CREATOR_LABELS = { marc: "Marc", eric: "Eric", sergio: "Sergio", marti: "Mart\xED", marina: "Marina", axis: "Axis (gen\xE9rico)" };
function creatorId(name) {
  const c = stripAccents((name || "").replace(/&amp/g, "&"));
  if (c.includes("erik") || c.includes("eric")) return "erik";
  if (c.includes("marc") && !c.includes("marcos")) return "marc";
  if (c.includes("daniel")) return "daniel";
  if (c.includes("sergio")) return "sergio";
  if (c.includes("marti")) return "marti";
  if (c.includes("marina")) return "marina";
  return "axis";
}
function catFromConcept(concept) {
  const t = stripAccents(concept);
  if (t.includes("bono 4")) return "Pack 4";
  if (t.includes("bono 8")) return "Pack 8";
  if (t.includes("grupo")) return "Small group / Grupo reducido";
  if (t.includes("valoraci")) return "Valoraci\xF3n inicial";
  if (t.includes("online")) return "Online";
  if (t.includes("individual")) return "Sesi\xF3n individual";
  return concept.replace(/\s*\d{1,2}\/\d{4}\s*$/, "").trim() || "Sin concepto";
}
const dmyToISO = (s) => {
  const m = (s || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
function parseAimHarderPayments(payments) {
  if (!payments) return [];
  const toAmt = (v) => (typeof v === "number" ? v : parseFloat(String(v ?? "0").replace("€", "").replace(",", ".")) || 0);
  const out = [];
  for (const p of payments.pending || []) {
    if (p.id == null) continue;
    const d = (p.date || "").slice(0, 10); // "2026-06-01 00:00:00" -> "2026-06-01"
    if (!d) continue;
    out.push({ id: String(p.id), cl: p.name || "", cat: catFromConcept(p.concept || ""), amt: toAmt(p.amount), c: creatorId(p.creator || ""), d, st: "pen", met: "" });
  }
  for (const p of payments.paid || []) {
    if (p.id == null) continue;
    const d = dmyToISO(p.date || "");
    if (!d) continue;
    out.push({ id: String(p.id), cl: p.name || "", cat: catFromConcept(p.concept || ""), amt: toAmt(p.amount), c: creatorId(p.creator || ""), d, st: "fin", met: "" });
  }
  return out;
}
function parsePaymentsCSV(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const parseLine = (l) => {
    const cells = [];
    let cur = "", inQ = false;
    for (const ch of l) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ";" && !inQ) {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };
  const header = parseLine(lines[0]).map(stripAccents);
  const idx = (names) => header.findIndex((h) => names.some((n) => h.includes(n)));
  const iId = idx(["id"]), iCl = idx(["cliente"]), iCon = idx(["concepto"]), iAmt = idx(["cantidad", "importe"]), iEst = idx(["estado"]), iFec = idx(["fecha"]), iCre = idx(["creado"]);
  const isPending = iEst === -1 && iFec !== -1;
  const out = [];
  for (const line of lines.slice(1)) {
    const c = parseLine(line);
    if (!c[iId]) continue;
    const amount = parseFloat((c[iAmt] || "0").replace(/€/g, "").replace(/\./g, "").replace(",", ".")) || 0;
    const estado = iEst !== -1 ? c[iEst] : "";
    const met = (estado.match(/^([A-Za-zÁ-ú]+)/) || [])[1] || "";
    out.push({
      id: c[iId],
      cl: c[iCl] || "",
      cat: catFromConcept(c[iCon] || ""),
      amt: amount,
      c: creatorId(c[iCre] || ""),
      d: dmyToISO(isPending ? c[iFec] : estado),
      st: isPending ? "pen" : "fin",
      met: isPending ? "" : met
    });
  }
  return out.filter((p) => p.d);
}
const monthLabel = (ym) => {
  try {
    const d = /* @__PURE__ */ new Date(ym + "-15T12:00:00");
    const s = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch (e) {
    return ym;
  }
};
const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 15);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== void 0 && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return void 0;
}
function asName(v) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") return (v.name || v.fullName || v.title || v.label || "").trim();
  return String(v).trim();
}
function splitDateTime(v) {
  if (v == null) return { date: null, time: null };
  if (typeof v === "number") {
    const d2 = new Date(v);
    return {
      date: `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-${pad(d2.getDate())}`,
      time: `${pad(d2.getHours())}:${pad(d2.getMinutes())}`
    };
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  const t = s.match(/^(\d{1,2}):(\d{2})/);
  if (t) return { date: null, time: `${pad(+t[1])}:${t[2]}` };
  const d = s.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (d) return { date: d[1], time: null };
  return { date: null, time: null };
}
function extractRecords(json) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    for (const key of ["data", "appointments", "bookings", "classes", "sessions", "items", "results", "calendar"]) {
      if (Array.isArray(json[key])) return json[key];
      if (json[key] && typeof json[key] === "object") {
        const inner = extractRecords(json[key]);
        if (inner.length) return inner;
      }
    }
    const vals = Object.values(json).filter(Array.isArray);
    if (vals.length) return vals.flat();
  }
  return [];
}
function parseAimHarder(json, fallbackDate, coaches, rooms) {
  var _a, _b, _c, _d, _e, _f;
  const records = extractRecords(json);
  const out = [];
  for (const r of records) {
    if (!r || typeof r !== "object") continue;
    const startRaw = pick(r, ["start", "startDate", "start_date", "startTime", "start_time", "from", "begin", "datetime", "date"]);
    const endRaw = pick(r, ["end", "endDate", "end_date", "endTime", "end_time", "to", "finish"]);
    const s = splitDateTime(startRaw);
    const e = splitDateTime(endRaw);
    const date0 = s.date || pick(r, ["day"]) || fallbackDate;
    const date = /^\d{8}$/.test(String(date0)) ? `${String(date0).slice(0, 4)}-${String(date0).slice(4, 6)}-${String(date0).slice(6, 8)}` : date0;
    let start = s.time;
    let end = e.time;
    if (!start) {
      const tRaw = String((_a = pick(r, ["time", "timeSlot", "hora", "hour"])) != null ? _a : "");
      const mm = tRaw.match(/(\d{1,2}):(\d{2})\s*[^\d]*\s*(?:(\d{1,2}):(\d{2}))?/);
      if (mm) {
        start = `${pad(+mm[1])}:${mm[2]}`;
        if (mm[3]) end = `${pad(+mm[3])}:${mm[4]}`;
      } else {
        const tid = String((_b = pick(r, ["timeid", "timeId"])) != null ? _b : "");
        const tm = tid.match(/^(\d{2})(\d{2})_(\d+)/);
        if (tm) {
          start = `${tm[1]}:${tm[2]}`;
          const em = toMin(start) + Number(tm[3]);
          end = `${pad(Math.floor(em / 60))}:${pad(em % 60)}`;
        }
      }
    }
    const dur = pick(r, ["duration", "durationMinutes", "duration_minutes", "minutes"]);
    if (start && !end && dur) {
      const em = toMin(start) + Number(dur);
      end = `${pad(Math.floor(em / 60))}:${pad(em % 60)}`;
    }
    if (!start) continue;
    if (!end) end = `${pad(Math.floor((toMin(start) + 60) / 60))}:${pad((toMin(start) + 60) % 60)}`;
    const coachName = asName(pick(r, ["coachName", "coach", "staff", "trainer", "professional", "employee", "teacher", "instructor", "createdBy", "created_by"]));
    const roomName = asName(pick(r, ["salaname", "room", "trainingRoom", "training_room", "roomName", "space", "location"]));
    const title = asName(pick(r, ["className", "name", "class", "activity", "concept", "title", "type"])) || "Sesi\xF3n";
    const athletesArr = Array.isArray(r.athletes) ? r.athletes : [];
    const client = asName(((_c = athletesArr[0]) == null ? void 0 : _c.realName) || ((_d = athletesArr[0]) == null ? void 0 : _d.name)) || asName(pick(r, ["client", "customer", "member", "athlete"]));
    const cMatch = matchCoach(coachName, coaches);
    const rn = stripAccents(roomName);
    let roomId = rooms[0].id;
    let roomGuessed = true;
    for (const room of rooms) {
      const target = stripAccents(room.name);
      if (rn && (rn.includes(target) || target.includes(rn) || rn.replace(/\D/g, "") === target.replace(/\D/g, "") && rn.replace(/\D/g, ""))) {
        roomId = room.id;
        roomGuessed = false;
        break;
      }
    }
    if (rn && roomGuessed) {
      const num = rn.match(/\d+/);
      if (num && +num[0] === 2) {
        roomId = ((_e = rooms[1]) == null ? void 0 : _e.id) || roomId;
        roomGuessed = false;
      }
      if (num && +num[0] === 1) {
        roomId = rooms[0].id;
        roomGuessed = false;
      }
    }
    out.push({
      id: String((_f = pick(r, ["id", "uuid", "appointmentId"])) != null ? _f : uid()),
      date,
      start,
      end,
      roomId,
      roomRaw: roomName,
      roomGuessed: roomGuessed && !!rn === false ? !rn : roomGuessed,
      coachId: cMatch ? cMatch.id : null,
      coachRaw: coachName,
      title,
      client,
      sent: false
    });
  }
  const grupos = /* @__PURE__ */ new Map();
  for (const s of out) {
    const key = `${s.date}|${s.start}|${s.end}|${stripAccents(s.coachRaw)}|${stripAccents(s.title)}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(s);
  }
  const fusionadas = [];
  for (const grupo of grupos.values()) {
    if (grupo.length === 1) {
      fusionadas.push(grupo[0]);
      continue;
    }
    grupo.sort((a, b) => String(a.id).localeCompare(String(b.id), void 0, { numeric: true }));
    const base = { ...grupo[0] };
    const conSala = grupo.find((s) => !s.roomGuessed);
    if (conSala) {
      base.roomId = conSala.roomId;
      base.roomRaw = conSala.roomRaw;
      base.roomGuessed = false;
    }
    const clientes = [...new Set(grupo.map((s) => (s.client || "").trim()).filter(Boolean))];
    base.client = clientes.join(", ");
    fusionadas.push(base);
  }
  return fusionadas;
}
async function loadKey(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("storage", e);
  }
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function icsDate(dateISO, hhmm) {
  const [y, m, d] = dateISO.split("-");
  const [hh, mm] = hhmm.split(":");
  return `${y}${m}${d}T${pad2(hh)}${pad2(mm)}00`;
}
function icsEscape(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function buildIcs(sessions, coaches, rooms) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Axis//Panel Horarios//ES", "CALSCALE:GREGORIAN"];
  for (const s of sessions) {
    const c = coaches.find((x) => x.id === s.coachId);
    const room = rooms.find((x) => x.id === s.roomId);
    const uidStr = `${s.id}@axis-panel`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uidStr}`,
      `DTSTAMP:${icsDate(todayISO(), "00:00")}Z`,
      `DTSTART;TZID=Europe/Madrid:${icsDate(s.date, s.start)}`,
      `DTEND;TZID=Europe/Madrid:${icsDate(s.date, s.end)}`,
      `SUMMARY:${icsEscape(`Axis \xB7 ${s.title} \u2014 ${(c == null ? void 0 : c.name) || s.coachRaw || "?"} (${(room == null ? void 0 : room.name) || "?"})`)}`,
      `DESCRIPTION:${icsEscape(`Sala: ${(room == null ? void 0 : room.name) || "?"}${s.client ? ` \xB7 Cliente: ${s.client}` : ""}`)}`
    );
    if (c == null ? void 0 : c.email) lines.push(`ATTENDEE;CN=${icsEscape(c.name)}:mailto:${c.email}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function downloadIcs(sessions, coaches, rooms, filename) {
  const content = buildIcs(sessions, coaches, rooms);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "axis-sesiones.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function AxisPanel() {
  const [coaches, setCoaches] = useState(DEFAULT_COACHES);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [sessions, setSessions] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState("horario");
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState({});
  const [sendState, setSendState] = useState({ status: "idle", msg: "" });
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState("");
  const [nowMin, setNowMin] = useState(() => {
    const d = /* @__PURE__ */ new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [payments, setPayments] = useState([]);
  const [payFilter, setPayFilter] = useState("fin");
  const [payCsvText, setPayCsvText] = useState("");
  const [payImportMsg, setPayImportMsg] = useState("");
  const [ahTokens, setAhTokens] = useState({ access: "", refresh: "" });
  const [syncState, setSyncState] = useState({ status: "idle", msg: "" });
  const [quickDate, setQuickDate] = useState(todayISO());
  const [autoSyncUrl, setAutoSyncUrl] = useState("");
  const [autoSyncState, setAutoSyncState] = useState({ status: "idle", msg: "" });
  const [boxCfg, setBoxCfg] = useState({ sub: "axishealthyperfomance", boxId: "" });
  useEffect(() => {
    (async () => {
      setCoaches(await loadKey("axis-coaches", DEFAULT_COACHES));
      setRooms(await loadKey("axis-rooms", DEFAULT_ROOMS));
      setSessions(await loadKey("axis-sessions", []));
      const storedPay = await loadKey("axis-payments", null);
      setPayments(storedPay && storedPay.length ? storedPay : PAYMENTS_SEED);
      setAhTokens(await loadKey("axis-ah-tokens", { access: "", refresh: "" }));
      setBoxCfg(await loadKey("axis-box-cfg", { sub: "axishealthyperfomance", boxId: "" }));
      setAutoSyncUrl(await loadKey("axis-autosync-url", ""));
      setLoaded(true);
    })();
    const t = setInterval(() => {
      const d = /* @__PURE__ */ new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }, 6e4);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (loaded) saveKey("axis-coaches", coaches);
  }, [coaches, loaded]);
  useEffect(() => {
    if (loaded) saveKey("axis-rooms", rooms);
  }, [rooms, loaded]);
  useEffect(() => {
    if (loaded) saveKey("axis-sessions", sessions);
  }, [sessions, loaded]);
  useEffect(() => {
    if (loaded) saveKey("axis-payments", payments);
  }, [payments, loaded]);
  useEffect(() => {
    if (loaded && (ahTokens.access || ahTokens.refresh)) saveKey("axis-ah-tokens", ahTokens);
  }, [ahTokens, loaded]);
  useEffect(() => {
    if (loaded && (boxCfg.sub || boxCfg.boxId)) saveKey("axis-box-cfg", boxCfg);
  }, [boxCfg, loaded]);
  useEffect(() => {
    if (loaded && autoSyncUrl) saveKey("axis-autosync-url", autoSyncUrl);
  }, [autoSyncUrl, loaded]);
  const AH_BASE = "https://api.aimharder.com/api";
  const boxReady = boxCfg.sub.trim().length > 0;
  const bookingsUrl = (iso) => `https://${boxCfg.sub.trim().toLowerCase()}.aimharder.com/api/coachBookings?appointments=1&day=${iso.replaceAll("-", "")}&_=${Date.now()}`;
  async function ahFetch(path, token) {
    const res = await fetch(`${AH_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  async function handleAutoSync(silent) {
    if (!autoSyncUrl.trim()) return;
    if (!silent) setAutoSyncState({ status: "sync", msg: "Descargando datos actualizados\u2026" });
    try {
      const res = await fetch(`${autoSyncUrl.trim()}${autoSyncUrl.includes("?") ? "&" : "?"}_=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      let json = raw;
      if (raw && raw.files && raw.files["axis-sessions.json"] && typeof raw.files["axis-sessions.json"].content === "string") {
        json = JSON.parse(raw.files["axis-sessions.json"].content);
      }
      const daysObj = json.days || {};
      let allRecords = [];
      for (const [d, records] of Object.entries(daysObj)) {
        allRecords = allRecords.concat(parseAimHarder(records, d, coaches, rooms));
      }
      setSessions((prev) => {
        const oldById = new Map(prev.map((s) => [s.id, s]));
        const nuevos = allRecords.map((s) => {
          const old = oldById.get(s.id);
          if (!old) return s;
          const kept = {};
          for (const k of old.manualKeys || []) if (k in old) kept[k] = old[k];
          return { ...s, sent: old.sent, manualKeys: old.manualKeys, ...kept };
        });
        const nuevosIds = new Set(nuevos.map((s) => s.id));
        const fechasSincronizadas = new Set(Object.keys(daysObj));
        const restantes = prev.filter(
          (s) => !nuevosIds.has(s.id) && (!fechasSincronizadas.has(s.date) || s.manualCreated)
        );
        return [...restantes, ...nuevos];
      });

      // Pagos: reemplazo COMPLETO en cada sincronización (a diferencia de
      // las sesiones, aquí no hay ediciones manuales que proteger). Así,
      // si borras un pago en AimHarder, en la siguiente sincronización
      // deja de aparecer también en el panel.
      let nPagos = 0;
      if (json.payments) {
        const parsedPayments = parseAimHarderPayments(json.payments);
        nPagos = parsedPayments.length;
        setPayments(parsedPayments);
      }

      setAutoSyncState({
        status: "done",
        msg: `\xDAltima sincronizaci\xF3n: ${(/* @__PURE__ */ new Date()).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} \xB7 ${allRecords.length} sesi\xF3n(es)${nPagos ? ` \xB7 ${nPagos} pago(s)` : ""} cargados.`
      });
    } catch (e) {
      setAutoSyncState({ status: "error", msg: `No se pudo leer la URL de sincronizaci\xF3n (${e.message}). Comprueba que la has pegado bien.` });
    }
  }
  useEffect(() => {
    if (loaded && autoSyncUrl.trim()) handleAutoSync(true);
  }, [loaded]);
  async function handleSyncMonth() {
    if (!ahTokens.access) {
      setSyncState({ status: "error", msg: "Pega primero tu Access Token en el campo de arriba." });
      return;
    }
    setSyncState({ status: "sync", msg: "Probando conexi\xF3n directa con AimHarder\u2026" });
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
    try {
      await ahFetch(`/calendar/${dates[0]}`, ahTokens.access);
    } catch (e) {
      if (e.message === "Failed to fetch" || e instanceof TypeError) {
        setSyncState({
          status: "error",
          msg: "Tu navegador ha bloqueado la conexi\xF3n directa a AimHarder (restricci\xF3n de seguridad de tu navegador, no un fallo tuyo ni del token). Usa el importador de JSON/CSV de m\xE1s abajo, que s\xED funciona siempre."
        });
        return;
      }
      if (e.status === 401 || e.status === 410) {
        setSyncState({ status: "error", msg: "El Access Token ha caducado o no es v\xE1lido. Pide uno nuevo en AimHarder (Configuraci\xF3n > API) y p\xE9galo de nuevo." });
        return;
      }
      setSyncState({ status: "error", msg: `AimHarder respondi\xF3 con un error (${e.message}). Usa el importador manual mientras tanto.` });
      return;
    }
    let allRecords = [];
    let failed = 0;
    for (const d of dates) {
      try {
        const json = await ahFetch(`/calendar/${d}`, ahTokens.access);
        allRecords = allRecords.concat(parseAimHarder(json, d, coaches, rooms));
      } catch (e) {
        failed++;
      }
    }
    setSessions((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      for (const s of allRecords) {
        const old = map.get(s.id);
        if (!old) {
          map.set(s.id, s);
          continue;
        }
        const kept = {};
        for (const k of old.manualKeys || []) if (k in old) kept[k] = old[k];
        map.set(s.id, { ...s, sent: old.sent, manualKeys: old.manualKeys, ...kept });
      }
      return [...map.values()];
    });
    setSyncState({
      status: "done",
      msg: `Sincronizado ${monthLabel(month)}: ${allRecords.length} sesi\xF3n(es) importadas${failed ? `, ${failed} d\xEDa(s) no se pudieron leer` : ""}.`
    });
  }
  const payStats = useMemo(() => {
    const inMonth = payments.filter((p) => (p.d || "").startsWith(month));
    const filtered = payFilter === "todos" ? inMonth : inMonth.filter((p) => p.st === payFilter);
    const cols = [...new Set(filtered.map((p) => p.c))].sort(
      (a, b) => ["marc", "eric", "sergio", "marti", "marina", "axis"].indexOf(a) - ["marc", "eric", "sergio", "marti", "marina", "axis"].indexOf(b)
    );
    const cats = /* @__PURE__ */ new Set();
    const matrix = {};
    const totals = {};
    for (const p of filtered) {
      cats.add(p.cat);
      matrix[p.cat] = matrix[p.cat] || {};
      const cell = matrix[p.cat][p.c] = matrix[p.cat][p.c] || { amt: 0, n: 0 };
      cell.amt += p.amt;
      cell.n += 1;
      const t = totals[p.c] = totals[p.c] || { amt: 0, n: 0 };
      t.amt += p.amt;
      t.n += 1;
    }
    const orderedCats = [
      ...PRODUCT_ORDER.filter((c) => cats.has(c)),
      ...[...cats].filter((c) => !PRODUCT_ORDER.includes(c)).sort()
    ];
    const sumFin = inMonth.filter((p) => p.st === "fin").reduce((a, p) => a + p.amt, 0);
    const sumPen = inMonth.filter((p) => p.st === "pen").reduce((a, p) => a + p.amt, 0);
    const grand = filtered.reduce((a, p) => a + p.amt, 0);
    return { cols, matrix, totals, orderedCats, sumFin, sumPen, grand, nFin: inMonth.filter((p) => p.st === "fin").length, nPen: inMonth.filter((p) => p.st === "pen").length, n: filtered.length };
  }, [payments, month, payFilter]);
  function handleImportPayments() {
    setPayImportMsg("");
    try {
      const parsed = parsePaymentsCSV(payCsvText);
      if (!parsed.length) {
        setPayImportMsg("No he reconocido pagos en ese texto. Pega el CSV tal cual lo exporta AimHarder (con cabecera y punto y coma).");
        return;
      }
      setPayments((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        let nuevos = 0, actualizados = 0;
        for (const p of parsed) {
          const old = map.get(p.id);
          if (!old) {
            map.set(p.id, p);
            nuevos++;
          } else if (old.st === "pen" && p.st === "fin") {
            map.set(p.id, p);
            actualizados++;
          } else map.set(p.id, { ...old, ...p });
        }
        setPayImportMsg(`Importados ${nuevos} pago(s) nuevo(s)${actualizados ? ` y ${actualizados} pendiente(s) marcados como cobrados` : ""}. Total en el panel: ${map.size}.`);
        return [...map.values()];
      });
      setPayCsvText("");
    } catch (e) {
      setPayImportMsg("Error al leer el CSV: " + e.message);
    }
  }
  const daySessions = useMemo(
    () => sessions.filter((s) => s.date === date).sort((a, b) => toMin(a.start) - toMin(b.start)),
    [sessions, date]
  );
  const coachOf = (s) => coaches.find((c) => c.id === s.coachId);
  const colorOf = (s) => {
    var _a;
    return ((_a = coachOf(s)) == null ? void 0 : _a.color) || UNKNOWN_COLOR;
  };
  const monthStats = useMemo(() => {
    const monthSessions = sessions.filter((s) => (s.date || "").startsWith(month));
    const colIds = [...coaches.map((c) => c.id)];
    const hasUnassigned = monthSessions.some((s) => !s.coachId || !coaches.find((c) => c.id === s.coachId));
    if (hasUnassigned) colIds.push("__none__");
    const cats = /* @__PURE__ */ new Set();
    const matrix = {};
    const totalsByCoach = {};
    for (const s of monthSessions) {
      const cat = categorize(s.title);
      cats.add(cat);
      const col = coaches.find((c) => c.id === s.coachId) ? s.coachId : "__none__";
      matrix[cat] = matrix[cat] || {};
      matrix[cat][col] = (matrix[cat][col] || 0) + 1;
      totalsByCoach[col] = (totalsByCoach[col] || 0) + 1;
    }
    const orderedCats = [
      ...PRODUCT_ORDER.filter((c) => cats.has(c)),
      ...[...cats].filter((c) => !PRODUCT_ORDER.includes(c)).sort()
    ];
    return { total: monthSessions.length, colIds, matrix, totalsByCoach, orderedCats, hasUnassigned };
  }, [sessions, month, coaches]);
  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const selectedSessions = daySessions.filter((s) => selectedIds.includes(s.id));
  function handlePreview() {
    setImportError("");
    setImportPreview(null);
    try {
      const json = JSON.parse(importText);
      const parsed = parseAimHarder(json, date, coaches, rooms);
      if (!parsed.length) {
        setImportError("No he encontrado sesiones en ese JSON. Comprueba que sea la respuesta del endpoint de calendario/citas.");
        return;
      }
      setImportPreview(parsed);
    } catch (e) {
      setImportError("El texto no es JSON v\xE1lido: " + e.message);
    }
  }
  function handleImport() {
    var _a;
    if (!importPreview) return;
    setSessions((prev) => {
      const existing = new Set(prev.map((s) => s.id));
      const nuevos = importPreview.filter((s) => !existing.has(s.id));
      const actualizados = prev.map((s) => {
        const upd = importPreview.find((p) => p.id === s.id);
        return upd ? { ...upd, sent: s.sent } : s;
      });
      return [...actualizados, ...nuevos];
    });
    const firstDate = (_a = importPreview[0]) == null ? void 0 : _a.date;
    if (firstDate) setDate(firstDate);
    setImportPreview(null);
    setImportText("");
    setTab("horario");
  }
  function handleSend(toSend) {
    if (!toSend.length) return;
    try {
      const porCoach = /* @__PURE__ */ new Map();
      const sinCoach = [];
      for (const s of toSend) {
        const c = coachOf(s);
        if (c) {
          if (!porCoach.has(c.id)) porCoach.set(c.id, []);
          porCoach.get(c.id).push(s);
        } else {
          sinCoach.push(s);
        }
      }
      let descargados = 0;
      const sinEmail = [];
      let i = 0;
      for (const [coachId, ses] of porCoach) {
        const c = coaches.find((x) => x.id === coachId);
        if (!(c == null ? void 0 : c.email)) {
          sinEmail.push((c == null ? void 0 : c.name) || coachId);
          continue;
        }
        const slug = stripAccents(c.name).replace(/\s+/g, "-");
        setTimeout(() => downloadIcs(ses, coaches, rooms, `axis-${slug}-${date}.ics`), i * 400);
        descargados += ses.length;
        i++;
      }
      const ids = new Set(toSend.filter((s) => {
        const c = coachOf(s);
        return c && c.email;
      }).map((s) => s.id));
      setSessions((prev) => prev.map((s) => ids.has(s.id) ? { ...s, sent: true } : s));
      setSelected({});
      const partes = [];
      if (descargados) partes.push(`Descargado un archivo por coach: al abrir cada uno, su calendario invita SOLO a ese coach a sus sesiones (${descargados} en total).`);
      if (sinEmail.length) partes.push(`Sin email configurado (no se gener\xF3 archivo): ${sinEmail.join(", ")} \u2014 a\xF1\xE1delo en la pesta\xF1a Equipo.`);
      if (sinCoach.length) partes.push(`${sinCoach.length} sesi\xF3n(es) sin coach asignado se han omitido.`);
      setSendState({ status: descargados ? "done" : "error", msg: partes.join(" ") || "Nada que enviar." });
    } catch (e) {
      setSendState({ status: "error", msg: "Error al generar los archivos de calendario: " + e.message });
    }
  }
  function addManual() {
    const s = {
      id: uid(),
      date,
      start: "09:00",
      end: "10:00",
      roomId: rooms[0].id,
      coachId: coaches[0].id,
      title: "Sesi\xF3n individual",
      client: "",
      sent: false,
      coachRaw: "",
      roomRaw: "",
      manualCreated: true
    };
    setSessions((p) => [...p, s]);
    setTab("sesiones");
  }
  const updateSession = (id, patch) => setSessions((p) => p.map((s) => {
    if (s.id !== id) return s;
    const manualKeys = [.../* @__PURE__ */ new Set([...s.manualKeys || [], ...Object.keys(patch)])];
    return { ...s, ...patch, manualKeys };
  }));
  const deleteSession = (id) => setSessions((p) => p.filter((s) => s.id !== id));
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap');
    .axis-root { font-family:'Barlow',system-ui,sans-serif; background:#F2F4F3; min-height:100vh; color:#12211B; }
    .axis-display { font-family:'Barlow Condensed','Barlow',sans-serif; letter-spacing:.02em; }
    .axis-tab { border:none; background:transparent; padding:10px 14px; font:600 14px 'Barlow'; color:#5A6B63; cursor:pointer; border-bottom:3px solid transparent; }
    .axis-tab.on { color:#12211B; border-bottom-color:#12211B; }
    .axis-btn { border:none; border-radius:8px; padding:9px 14px; font:600 13px 'Barlow'; cursor:pointer; }
    .axis-btn:focus-visible, .axis-tab:focus-visible { outline:2px solid #2563EB; outline-offset:2px; }
    .axis-btn.primary { background:#12211B; color:#fff; }
    .axis-btn.ghost { background:#fff; color:#12211B; border:1px solid #C9D2CD; }
    .axis-btn:disabled { opacity:.45; cursor:not-allowed; }
    input, select, textarea { font-family:'Barlow',sans-serif; }
    .axis-input { border:1px solid #C9D2CD; border-radius:6px; padding:7px 9px; font-size:13px; background:#fff; width:100%; box-sizing:border-box; }
    .sess-block { position:absolute; left:4px; right:4px; border-radius:8px; padding:6px 8px; color:#fff; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.18); cursor:pointer; transition:transform .08s; }
    .sess-block:hover { transform:scale(1.012); }
    @media (prefers-reduced-motion: reduce) { .sess-block { transition:none; } .sess-block:hover { transform:none; } }
  `;
  const totalH = (DAY_END - DAY_START) * 60 * PX_PER_MIN;
  const hours = [];
  for (let h = DAY_START; h <= DAY_END; h++) hours.push(h);
  const coachName = (s) => {
    var _a;
    return ((_a = coachOf(s)) == null ? void 0 : _a.name) || s.coachRaw || "\xBFCoach?";
  };
  return /* @__PURE__ */ React.createElement("div", { className: "axis-root" }, /* @__PURE__ */ React.createElement("style", null, css), /* @__PURE__ */ React.createElement("header", { style: { background: "#12211B", color: "#fff", padding: "18px 22px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("h1", { className: "axis-display", style: { margin: 0, fontSize: 30, fontWeight: 700, textTransform: "uppercase" } }, "Axis \xB7 Panel de salas"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#9DB4A9" } }, "Horarios por sala \xB7 exporta a Google Calendar / Outlook")), /* @__PURE__ */ React.createElement("nav", { style: { marginTop: 10, display: "flex" } }, [["horario", "Horario"], ["sesiones", "Sesiones e import"], ["stats", "Resumen mensual"], ["equipo", "Equipo y salas"]].map(([id, label]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: id,
      className: `axis-tab ${tab === id ? "on" : ""}`,
      style: { color: tab === id ? "#fff" : "#9DB4A9", borderBottomColor: tab === id ? "#7CC98F" : "transparent" },
      onClick: () => setTab(id)
    },
    label
  )))), (tab === "horario" || tab === "sesiones") && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setDate(shiftDay(date, -1)), "aria-label": "D\xEDa anterior" }, "\u2190"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "axis-input", style: { width: 150 }, value: date, onChange: (e) => setDate(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setDate(shiftDay(date, 1)), "aria-label": "D\xEDa siguiente" }, "\u2192"), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setDate(todayISO()) }, "Hoy"), /* @__PURE__ */ React.createElement("span", { className: "axis-display", style: { fontSize: 18, fontWeight: 600, textTransform: "capitalize" } }, fmtDateHuman(date)), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 13, color: "#5A6B63" } }, daySessions.length, " sesi\xF3n(es)")), sendState.status !== "idle" && /* @__PURE__ */ React.createElement("div", { style: {
    margin: "0 22px 12px",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    background: sendState.status === "error" ? "#FDE8E8" : sendState.status === "done" ? "#E5F4E9" : "#EEF2FF",
    color: sendState.status === "error" ? "#9B1C1C" : "#1F3A2A"
  } }, sendState.status === "sending" ? "\u23F3 " : sendState.status === "done" ? "\u2705 " : "\u26A0\uFE0F ", sendState.msg, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { marginLeft: 10, padding: "2px 8px" }, onClick: () => setSendState({ status: "idle", msg: "" }) }, "Cerrar")), tab === "horario" && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" } }, coaches.map((c) => /* @__PURE__ */ React.createElement("span", { key: c.id, style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 12, height: 12, borderRadius: 3, background: c.color, display: "inline-block" } }), c.name)), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: addManual }, "+ A\xF1adir sesi\xF3n"), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "axis-btn primary",
      disabled: !daySessions.length || sendState.status === "sending",
      onClick: () => handleSend(daySessions.filter((s) => !s.sent))
    },
    "Descargar .ics del d\xEDa (",
    daySessions.filter((s) => !s.sent).length,
    ")"
  ))), !daySessions.length ? /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px dashed #C9D2CD", borderRadius: 12, padding: 40, textAlign: "center", color: "#5A6B63" } }, "No hay sesiones para este d\xEDa. Importa el JSON de AimHarder en la pesta\xF1a ", /* @__PURE__ */ React.createElement("b", null, "Sesiones e import"), " o a\xF1ade una sesi\xF3n manual.") : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: `56px repeat(${rooms.length}, 1fr)`, background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "2px solid #12211B" } }), rooms.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, className: "axis-display", style: { padding: "10px 12px", fontSize: 18, fontWeight: 700, textTransform: "uppercase", borderBottom: "2px solid #12211B", borderLeft: "1px solid #EDF1EF" } }, r.name, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "Barlow", fontSize: 12, fontWeight: 500, color: "#5A6B63", marginLeft: 8 } }, daySessions.filter((s) => s.roomId === r.id).length, " sesiones"))), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: totalH } }, hours.map((h) => /* @__PURE__ */ React.createElement("div", { key: h, style: { position: "absolute", top: (h - DAY_START) * 60 * PX_PER_MIN - 7, right: 8, fontSize: 11, color: "#8A978F" } }, pad(h), ":00"))), rooms.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: { position: "relative", height: totalH, borderLeft: "1px solid #EDF1EF" } }, hours.map((h) => /* @__PURE__ */ React.createElement("div", { key: h, style: { position: "absolute", top: (h - DAY_START) * 60 * PX_PER_MIN, left: 0, right: 0, borderTop: "1px solid #EDF1EF" } })), date === todayISO() && nowMin >= DAY_START * 60 && nowMin <= DAY_END * 60 && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: (nowMin - DAY_START * 60) * PX_PER_MIN, left: 0, right: 0, borderTop: "2px solid #E11D48", zIndex: 3 } }), daySessions.filter((s) => s.roomId === r.id).map((s) => {
    const top = Math.max(0, (toMin(s.start) - DAY_START * 60) * PX_PER_MIN);
    const h = Math.max(26, (toMin(s.end) - toMin(s.start)) * PX_PER_MIN - 2);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: s.id,
        className: "sess-block",
        role: "button",
        tabIndex: 0,
        style: { top, height: h, background: colorOf(s), opacity: s.sent ? 0.85 : 1 },
        title: `${s.title} \xB7 ${coachName(s)} \xB7 ${s.start}\u2013${s.end}${s.client ? " \xB7 " + s.client : ""}`,
        onClick: () => {
          setSelected((p) => ({ ...p, [s.id]: !p[s.id] }));
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, display: "flex", justifyContent: "space-between", gap: 6 } }, /* @__PURE__ */ React.createElement("span", null, coachName(s)), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500 } }, s.start, "\u2013", s.end, " ", s.sent ? "\u{1F4C5}" : "", selected[s.id] ? " \u2611" : "")),
      h > 40 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.9, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" } }, s.title, s.client ? ` \xB7 ${s.client}` : "")
    );
  })))), selectedSessions.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13 } }, selectedSessions.length, " sesi\xF3n(es) seleccionada(s) (toca los bloques para seleccionar)"), /* @__PURE__ */ React.createElement("button", { className: "axis-btn primary", disabled: sendState.status === "sending", onClick: () => handleSend(selectedSessions) }, "Descargar .ics de la selecci\xF3n"), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setSelected({}) }, "Quitar selecci\xF3n"))), tab === "sesiones" && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18 } }, /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "2px solid #12211B", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, "Sincronizaci\xF3n autom\xE1tica (recomendado)"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 13, color: "#5A6B63" } }, "Pega aqu\xED la URL que te da el script ", /* @__PURE__ */ React.createElement("code", null, "sync_axis.py"), " una sola vez. A partir de ah\xED, cada vez que abras este panel se actualizar\xE1n solas las sesiones Y los pagos (pesta\xF1a Resumen mensual), sin copiar ni pegar nada m\xE1s. Si borras algo en AimHarder, tambi\xE9n desaparece de aqu\xED en la siguiente sincronizaci\xF3n."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      style: { flex: 1, minWidth: 260 },
      placeholder: "https://api.github.com/gists/xxxxxxxxxxxx",
      value: autoSyncUrl,
      onChange: (e) => setAutoSyncUrl(e.target.value)
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "axis-btn primary", onClick: () => handleAutoSync(false), disabled: !autoSyncUrl.trim() || autoSyncState.status === "sync" }, autoSyncState.status === "sync" ? "Sincronizando\u2026" : "Sincronizar ahora")), autoSyncState.status !== "idle" && /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10, fontSize: 13, color: autoSyncState.status === "error" ? "#9B1C1C" : "#1F3A2A" } }, autoSyncState.status === "sync" ? "\u23F3 " : autoSyncState.status === "done" ? "\u2705 " : "\u26A0\uFE0F ", autoSyncState.msg)), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16, opacity: 0.85 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, "Sincronizaci\xF3n directa con AimHarder (respaldo)"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 13, color: "#5A6B63" } }, 'Pega aqu\xED tus tokens de la API una sola vez (se guardan solo en este navegador). Al pulsar "Sincronizar", el panel intenta traer directamente las sesiones del mes seleccionado (', monthLabel(month), "). Si tu navegador bloquea la conexi\xF3n te lo dir\xE1 claramente, y seguir\xE1s pudiendo usar el importador manual de m\xE1s abajo."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      type: "password",
      placeholder: "Access Token",
      value: ahTokens.access,
      onChange: (e) => setAhTokens((p) => ({ ...p, access: e.target.value }))
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      type: "password",
      placeholder: "Refresh Token",
      value: ahTokens.refresh,
      onChange: (e) => setAhTokens((p) => ({ ...p, refresh: e.target.value }))
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn primary", onClick: handleSyncMonth, disabled: syncState.status === "sync" }, syncState.status === "sync" ? "Sincronizando\u2026" : `Sincronizar ${monthLabel(month)}`)), syncState.status !== "idle" && /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10, fontSize: 13, color: syncState.status === "error" ? "#9B1C1C" : "#1F3A2A" } }, syncState.status === "sync" ? "\u23F3 " : syncState.status === "done" ? "\u2705 " : "\u26A0\uFE0F ", syncState.msg)), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, "Importar desde AimHarder (JSON manual)"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 13, color: "#5A6B63" } }, /* @__PURE__ */ React.createElement("b", null, "Configuraci\xF3n (solo la primera vez):"), " escribe el subdominio de Axis en AimHarder \u2014 la palabra que va justo antes de ", /* @__PURE__ */ React.createElement("code", null, ".aimharder.com"), " en tu barra de direcciones cuando tienes abierto el horario."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      style: { width: 260 },
      placeholder: "subdominio (p. ej. axishealthyperfomance)",
      value: boxCfg.sub,
      onChange: (e) => setBoxCfg((p) => ({ ...p, sub: e.target.value }))
    }
  )), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 13, color: "#5A6B63" } }, /* @__PURE__ */ React.createElement("b", null, "Paso 1:"), " pulsa el d\xEDa (la fecha se pone sola). Se abre AimHarder con las sesiones de ese d\xEDa en formato texto \u2014 necesitas tener la sesi\xF3n de AimHarder iniciada en este navegador. ", /* @__PURE__ */ React.createElement("b", null, "Paso 2:"), " selecciona todo (Ctrl+A), copia (Ctrl+C) y p\xE9galo en el cuadro de abajo. Puedes repetir con varios d\xEDas: el panel acumula sin duplicar."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 } }, Array.from({ length: 7 }, (_, i) => {
    const dIso = shiftDay(todayISO(), i);
    const label = i === 0 ? "Hoy" : i === 1 ? "Ma\xF1ana" : (/* @__PURE__ */ new Date(dIso + "T12:00:00")).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }).replace(/^./, (c) => c.toUpperCase());
    return /* @__PURE__ */ React.createElement(
      "a",
      {
        key: dIso,
        className: "axis-btn ghost",
        target: "_blank",
        rel: "noreferrer",
        href: boxReady ? bookingsUrl(dIso) : void 0,
        style: { textDecoration: "none", display: "inline-block", opacity: boxReady ? 1 : 0.45, pointerEvents: boxReady ? "auto" : "none" },
        title: boxReady ? `Abrir sesiones del ${dIso} en AimHarder` : "Rellena antes el subdominio y el ID del box"
      },
      label
    );
  }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#5A6B63" } }, "\xB7 u otro d\xEDa:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      type: "date",
      style: { width: 150 },
      value: quickDate,
      onChange: (e) => setQuickDate(e.target.value),
      "aria-label": "Elegir otro d\xEDa para abrir en AimHarder"
    }
  ), /* @__PURE__ */ React.createElement(
    "a",
    {
      className: "axis-btn primary",
      target: "_blank",
      rel: "noreferrer",
      href: boxReady && quickDate ? bookingsUrl(quickDate) : void 0,
      style: { textDecoration: "none", display: "inline-block", opacity: boxReady && quickDate ? 1 : 0.45, pointerEvents: boxReady && quickDate ? "auto" : "none" }
    },
    "Abrir ese d\xEDa"
  )), !boxReady && /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 13, color: "#9B1C1C" } }, "Los botones se activar\xE1n al escribir el subdominio de arriba (se guarda y no tendr\xE1s que volver a ponerlo)."), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "axis-input",
      rows: 7,
      value: importText,
      onChange: (e) => setImportText(e.target.value),
      placeholder: '[{"start":"2026-07-13T09:00","end":"2026-07-13T10:00","coach":"Marc","room":"Sala 1","name":"Sesi\xF3n individual","client":"..."}]'
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: handlePreview, disabled: !importText.trim() }, "Previsualizar"), importPreview && /* @__PURE__ */ React.createElement("button", { className: "axis-btn primary", onClick: handleImport }, "Importar ", importPreview.length, " sesi\xF3n(es)")), importError && /* @__PURE__ */ React.createElement("p", { style: { color: "#9B1C1C", fontSize: 13 } }, importError), importPreview && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 13 } }, importPreview.slice(0, 8).map((s) => {
    var _a;
    return /* @__PURE__ */ React.createElement("div", { key: s.id, style: { padding: "4px 0", borderBottom: "1px solid #EDF1EF" } }, s.date, " \xB7 ", s.start, "\u2013", s.end, " \xB7 ", /* @__PURE__ */ React.createElement("b", null, s.coachRaw || "\xBFcoach?"), " \xB7 ", (_a = rooms.find((r) => r.id === s.roomId)) == null ? void 0 : _a.name, s.roomGuessed ? " (asignada por defecto)" : "", " \xB7 ", s.title);
  }), importPreview.length > 8 && /* @__PURE__ */ React.createElement("div", { style: { color: "#5A6B63", paddingTop: 4 } }, "\u2026y ", importPreview.length - 8, " m\xE1s"))), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 6px", fontSize: 20, textTransform: "uppercase" } }, "Importar pagos (CSV) \u2014 respaldo manual"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px", fontSize: 13, color: "#5A6B63" } }, 'Los pagos ya se sincronizan solos junto con las sesiones (misma URL configurada en la pesta\xF1a Sesiones): si borras algo en AimHarder, tambi\xE9n desaparece de aqu\xED en la siguiente sincronizaci\xF3n. Usa este cuadro solo si necesitas forzar una carga manual puntual, pegando el export de AimHarder ("Pagos finalizados" o "Pagos pendientes", separado por punto y coma). Ahora mismo hay ', /* @__PURE__ */ React.createElement("b", null, payments.length), " pagos cargados."), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "axis-input",
      rows: 5,
      value: payCsvText,
      onChange: (e) => setPayCsvText(e.target.value),
      placeholder: '"ID";"Cliente";"Correo electr\xF3nico";...;"Concepto";"Cantidad";"Estado";"Creado por"'
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn primary", onClick: handleImportPayments, disabled: !payCsvText.trim() }, "Importar pagos")), payImportMsg && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: payImportMsg.startsWith("Error") || payImportMsg.startsWith("No he") ? "#9B1C1C" : "#1F3A2A" } }, payImportMsg)), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: 0, fontSize: 20, textTransform: "uppercase" } }, "Sesiones del ", fmtDateHuman(date)), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: addManual }, "+ A\xF1adir")), !daySessions.length && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#5A6B63" } }, "Sin sesiones este d\xEDa."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 8, marginTop: 10 } }, daySessions.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.id, style: { display: "grid", gridTemplateColumns: "70px 70px 1fr 1fr 1fr 1fr 60px", gap: 6, alignItems: "center", fontSize: 13 } }, /* @__PURE__ */ React.createElement("input", { className: "axis-input", type: "time", value: s.start, onChange: (e) => updateSession(s.id, { start: e.target.value }) }), /* @__PURE__ */ React.createElement("input", { className: "axis-input", type: "time", value: s.end, onChange: (e) => updateSession(s.id, { end: e.target.value }) }), /* @__PURE__ */ React.createElement("select", { className: "axis-input", value: s.coachId || "", onChange: (e) => updateSession(s.id, { coachId: e.target.value || null }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "(", s.coachRaw || "sin coach", ")"), coaches.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))), /* @__PURE__ */ React.createElement("select", { className: "axis-input", value: s.roomId, onChange: (e) => updateSession(s.id, { roomId: e.target.value }) }, rooms.map((r) => /* @__PURE__ */ React.createElement("option", { key: r.id, value: r.id }, r.name))), /* @__PURE__ */ React.createElement("input", { className: "axis-input", value: s.title, onChange: (e) => updateSession(s.id, { title: e.target.value }), placeholder: "Actividad" }), /* @__PURE__ */ React.createElement("input", { className: "axis-input", value: s.client || "", onChange: (e) => updateSession(s.id, { client: e.target.value }), placeholder: "Cliente" }), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => deleteSession(s.id), "aria-label": "Eliminar sesi\xF3n" }, "\u{1F5D1}")))))), tab === "stats" && (() => {
    const colName = (id) => {
      var _a;
      return id === "__none__" ? "Sin asignar" : ((_a = coaches.find((c) => c.id === id)) == null ? void 0 : _a.name) || id;
    };
    const colColor = (id) => {
      var _a;
      return id === "__none__" ? UNKNOWN_COLOR : ((_a = coaches.find((c) => c.id === id)) == null ? void 0 : _a.color) || UNKNOWN_COLOR;
    };
    const maxCoach = Math.max(1, ...Object.values(monthStats.totalsByCoach));
    const cell = { padding: "8px 10px", borderBottom: "1px solid #EDF1EF", fontSize: 13, textAlign: "center" };
    return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, -1)), "aria-label": "Mes anterior" }, "\u2190"), /* @__PURE__ */ React.createElement("input", { type: "month", className: "axis-input", style: { width: 160 }, value: month, onChange: (e) => setMonth(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", onClick: () => setMonth(shiftMonth(month, 1)), "aria-label": "Mes siguiente" }, "\u2192"), /* @__PURE__ */ React.createElement("span", { className: "axis-display", style: { fontSize: 20, fontWeight: 700, textTransform: "uppercase" } }, monthLabel(month)), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 13, color: "#5A6B63" } }, monthStats.total, " sesi\xF3n(es) en el panel este mes")), monthStats.total === 0 ? /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px dashed #C9D2CD", borderRadius: 12, padding: 40, textAlign: "center", color: "#5A6B63" } }, "No hay sesiones cargadas para ", monthLabel(month), ". El resumen cuenta las sesiones importadas o creadas en el panel.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 12px", fontSize: 20, textTransform: "uppercase" } }, "Sesiones por coach"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 8 } }, monthStats.colIds.map((id) => {
      const n = monthStats.totalsByCoach[id] || 0;
      if (!n) return null;
      return /* @__PURE__ */ React.createElement("div", { key: id, style: { display: "grid", gridTemplateColumns: "110px 1fr 46px", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, colName(id)), /* @__PURE__ */ React.createElement("div", { style: { background: "#EDF1EF", borderRadius: 6, height: 18, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${n / maxCoach * 100}%`, height: "100%", background: colColor(id), borderRadius: 6, minWidth: 6 } })), /* @__PURE__ */ React.createElement("span", { className: "axis-display", style: { fontSize: 18, fontWeight: 700, textAlign: "right" } }, n));
    }))), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 12px", fontSize: 20, textTransform: "uppercase" } }, "Desglose por tipo de producto"), /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 520 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { ...cell, textAlign: "left", borderBottom: "2px solid #12211B", fontSize: 12, color: "#5A6B63" } }, "Producto"), monthStats.colIds.map((id) => /* @__PURE__ */ React.createElement("th", { key: id, style: { ...cell, borderBottom: "2px solid #12211B" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: colColor(id), display: "inline-block" } }), colName(id)))), /* @__PURE__ */ React.createElement("th", { style: { ...cell, borderBottom: "2px solid #12211B", fontSize: 12 } }, "Total"))), /* @__PURE__ */ React.createElement("tbody", null, monthStats.orderedCats.map((cat) => {
      const row = monthStats.matrix[cat] || {};
      const rowTotal = Object.values(row).reduce((a, b) => a + b, 0);
      return /* @__PURE__ */ React.createElement("tr", { key: cat }, /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "left", fontWeight: 600 } }, cat), monthStats.colIds.map((id) => /* @__PURE__ */ React.createElement("td", { key: id, style: { ...cell, color: row[id] ? "#12211B" : "#C4CDC8" } }, row[id] || "\u2013")), /* @__PURE__ */ React.createElement("td", { style: { ...cell, fontWeight: 700 } }, rowTotal));
    }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "left", fontWeight: 700, borderTop: "2px solid #12211B" } }, "Total"), monthStats.colIds.map((id) => /* @__PURE__ */ React.createElement("td", { key: id, style: { ...cell, fontWeight: 700, borderTop: "2px solid #12211B" } }, monthStats.totalsByCoach[id] || 0)), /* @__PURE__ */ React.createElement("td", { style: { ...cell, fontWeight: 800, borderTop: "2px solid #12211B" } }, monthStats.total)))), monthStats.hasUnassigned && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#9B1C1C", marginBottom: 0 } }, 'Hay sesiones sin coach asignado: as\xEDgnalas en "Sesiones e import" para que cuenten a su profesional.'), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#5A6B63", marginBottom: 0 } }, "El tipo de producto se detecta del nombre de la actividad (individual, pack 4/8, small group o grupo, online, valoraci\xF3n, fisio). Lo no reconocido aparece con su propio nombre."))), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: 0, fontSize: 20, textTransform: "uppercase" } }, "Facturaci\xF3n \xB7 pagos AimHarder"), /* @__PURE__ */ React.createElement("span", { style: { display: "flex", gap: 6, marginLeft: "auto" } }, [["fin", "Cobrados"], ["pen", "Pendientes"], ["todos", "Todos"]].map(([id, label]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: id,
        className: "axis-btn",
        onClick: () => setPayFilter(id),
        style: { padding: "5px 12px", background: payFilter === id ? "#12211B" : "#fff", color: payFilter === id ? "#fff" : "#12211B", border: "1px solid #C9D2CD" }
      },
      label
    )))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A6B63" } }, "Cobrado en ", monthLabel(month)), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 30, fontWeight: 700 } }, eur(payStats.sumFin)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A6B63" } }, payStats.nFin, " pago(s)")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A6B63" } }, "Pendiente de cobro"), /* @__PURE__ */ React.createElement("div", { className: "axis-display", style: { fontSize: 30, fontWeight: 700, color: payStats.sumPen > 0 ? "#B45309" : "#12211B" } }, eur(payStats.sumPen)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A6B63" } }, payStats.nPen, " pago(s)"))), payStats.n === 0 ? /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#5A6B63" } }, "No hay pagos ", payFilter === "fin" ? "cobrados" : payFilter === "pen" ? "pendientes" : "", " en ", monthLabel(month), ".") : /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 560 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { padding: "8px 10px", borderBottom: "2px solid #12211B", fontSize: 12, color: "#5A6B63", textAlign: "left" } }, "Producto"), payStats.cols.map((c) => {
      var _a;
      return /* @__PURE__ */ React.createElement("th", { key: c, style: { padding: "8px 10px", borderBottom: "2px solid #12211B", fontSize: 12, fontWeight: 700, textAlign: "right" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: ((_a = coaches.find((x) => x.id === c)) == null ? void 0 : _a.color) || "#3A4A42", display: "inline-block" } }), CREATOR_LABELS[c] || c));
    }), /* @__PURE__ */ React.createElement("th", { style: { padding: "8px 10px", borderBottom: "2px solid #12211B", fontSize: 12, textAlign: "right" } }, "Total"))), /* @__PURE__ */ React.createElement("tbody", null, payStats.orderedCats.map((cat) => {
      const row = payStats.matrix[cat] || {};
      const rowAmt = Object.values(row).reduce((a, x) => a + x.amt, 0);
      const rowN = Object.values(row).reduce((a, x) => a + x.n, 0);
      return /* @__PURE__ */ React.createElement("tr", { key: cat }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", borderBottom: "1px solid #EDF1EF", fontSize: 13, fontWeight: 600 } }, cat), payStats.cols.map((c) => /* @__PURE__ */ React.createElement("td", { key: c, style: { padding: "8px 10px", borderBottom: "1px solid #EDF1EF", fontSize: 13, textAlign: "right", color: row[c] ? "#12211B" : "#C4CDC8" } }, row[c] ? /* @__PURE__ */ React.createElement(React.Fragment, null, eur(row[c].amt), " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#5A6B63" } }, "(", row[c].n, ")")) : "\u2013")), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", borderBottom: "1px solid #EDF1EF", fontSize: 13, textAlign: "right", fontWeight: 700 } }, eur(rowAmt), " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#5A6B63" } }, "(", rowN, ")")));
    }), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", borderTop: "2px solid #12211B", fontSize: 13, fontWeight: 700 } }, "Total"), payStats.cols.map((c) => {
      var _a, _b;
      return /* @__PURE__ */ React.createElement("td", { key: c, style: { padding: "8px 10px", borderTop: "2px solid #12211B", fontSize: 13, textAlign: "right", fontWeight: 700 } }, eur(((_a = payStats.totals[c]) == null ? void 0 : _a.amt) || 0), " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#5A6B63" } }, "(", ((_b = payStats.totals[c]) == null ? void 0 : _b.n) || 0, ")"));
    }), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", borderTop: "2px solid #12211B", fontSize: 13, textAlign: "right", fontWeight: 800 } }, eur(payStats.grand), " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#5A6B63" } }, "(", payStats.n, ")"))))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#5A6B63", marginBottom: 0 } }, '"Creado por" indica qui\xE9n registr\xF3 el cobro, no necesariamente qui\xE9n dio la sesi\xF3n. Los pagos de la cuenta "Axis (gen\xE9rico)" no permiten atribuir la venta a Marc, Mart\xED o Marina individualmente.')));
  })(), tab === "equipo" && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 22px 30px", display: "grid", gap: 18, maxWidth: 760 } }, /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 4px", fontSize: 20, textTransform: "uppercase" } }, "Equipo"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 12px", fontSize: 13, color: "#5A6B63" } }, "El email es el que se a\xF1adir\xE1 como invitado dentro del archivo .ics. Sin email, el evento se genera igualmente pero sin invitado."), coaches.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: c.id, style: { display: "grid", gridTemplateColumns: "36px 110px 150px 1fr auto", gap: 8, alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "color",
      value: c.color,
      style: { width: 34, height: 34, border: "none", background: "none", cursor: "pointer" },
      onChange: (e) => setCoaches((p) => p.map((x, j) => j === i ? { ...x, color: e.target.value } : x)),
      "aria-label": `Color de ${c.name}`
    }
  ), /* @__PURE__ */ React.createElement("input", { className: "axis-input", value: c.name, onChange: (e) => setCoaches((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x)) }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#5A6B63" } }, c.role), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "axis-input",
      type: "email",
      placeholder: "email@dominio.com",
      value: c.email,
      onChange: (e) => setCoaches((p) => p.map((x, j) => j === i ? { ...x, email: e.target.value } : x))
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { padding: "4px 8px", fontSize: 12 }, title: `Quitar a ${c.name}`, onClick: () => setCoaches((p) => p.filter((x, j) => j !== i)) }, "Quitar"))), /* @__PURE__ */ React.createElement("button", { className: "axis-btn ghost", style: { marginTop: 4 }, onClick: () => setCoaches((p) => [...p, { id: uid(), name: "Nuevo coach", role: "Entrenador personal", color: "#6B7280", email: "" }]) }, "+ A\xF1adir coach")), /* @__PURE__ */ React.createElement("section", { style: { background: "#fff", border: "1px solid #DDE4E0", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "axis-display", style: { margin: "0 0 12px", fontSize: 20, textTransform: "uppercase" } }, "Salas"), rooms.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: { marginBottom: 8, maxWidth: 260 } }, /* @__PURE__ */ React.createElement("input", { className: "axis-input", value: r.name, onChange: (e) => setRooms((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x)) }))))));
}
const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(/* @__PURE__ */ React.createElement(AxisPanel, null));
