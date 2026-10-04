import { EVENT_ID } from "../../shared/constants";
import type { EvidenceType, Mission } from "../../shared/types";
import { missionSelectionData } from "./mission-selections";

type Entry = [string, string, string, string, string?, string?, string?];

function makeMission(type: EvidenceType, entry: Entry): Mission {
  const [id, title, category, instructions, slot, room, speaker] = entry;
  const points = type === "photo" ? 15 : type === "comment" ? 10 : 5;
  const isSession = Boolean(slot);
  const tags = [isSession ? "session" : "general"];
  const selectionData = missionSelectionData[id];
  if (["M15", "M45", "M50"].includes(id)) tags.push("closing");
  return {
    id,
    eventId: EVENT_ID,
    title,
    description: selectionData?.question ?? instructions,
    instructions: selectionData?.question ?? instructions,
    evidenceType: type,
    points,
    category,
    validation: {
      evidenceType: type,
      minLength: type === "comment" ? 20 : type === "word" ? 2 : undefined,
      maxLength: type === "comment" ? (id === "M22" ? 300 : 400) : type === "word" ? 30 : undefined,
      requiresConsent: id === "M11",
      allowShortToken: id === "M47"
    },
    selection: selectionData?.selection,
    slot,
    room,
    speaker,
    sessionId: isSession ? `session-${id.toLowerCase()}` : undefined,
    requiresAttendance: isSession,
    tags,
    active: true
  };
}

const photoEntries: Entry[] = [
  ["M01", "Llegué al Community Day", "Evento", "Captura tu acreditación, señalización oficial o un elemento del evento. Evita datos personales legibles."],
  ["M02", "Mi ruta de hoy", "Agenda", "Fotografía una señal o cartel que te ayude a elegir tu siguiente sesión."],
  ["M03", "Rumbo a Tajumulco", "Venue", "Captura la señalización del Auditorio Principal Tajumulco.", undefined, "Tajumulco"],
  ["M04", "Encontré Tacaná", "Venue", "Captura la señalización o acceso a Tacaná sin interrumpir el flujo.", undefined, "Tacaná"],
  ["M05", "Checkpoint Acatenango", "Venue", "Toma una foto de la señalización de Acatenango.", undefined, "Acatenango"],
  ["M06", "Checkpoint Santa María", "Venue", "Toma una foto del rótulo o acceso de Santa María.", undefined, "Santa María"],
  ["M07", "Agua o Fuego", "Venue", "Encuentra Agua o Fuego y fotografía únicamente su señalización o acceso."],
  ["M08", "Casa de Kiro", "IA & Agentes", "Captura la señalización de Casa de Kiro o un elemento oficial asociado."],
  ["M09", "Laboratorio localizado", "Workshop", "Fotografía la señalización del Laboratorio sin mostrar pantallas ni participantes."],
  ["M10", "Mi setup de aprendizaje", "Experiencia", "Fotografía tus apuntes o material de aprendizaje sin mostrar información confidencial."],
  ["M11", "Cloud Crew", "Comunidad", "Toma una foto con una persona nueva únicamente con su consentimiento explícito."],
  ["M12", "Pausa entre nubes", "Venue", "Captura un espacio permitido del campus que utilizaste para descansar o conversar."],
  ["M13", "Landívar anfitriona", "Venue", "Fotografía un elemento institucional público de la Universidad Rafael Landívar."],
  ["M14", "Mi momento técnico", "Experiencia", "Captura un objeto no sensible que represente tu momento técnico favorito."],
  ["M15", "Cierre del día", "Cierre", "Captura una imagen final que represente cómo terminas el Community Day."]
];

const commentEntries: Entry[] = [
  ["M16", "Talento + IA", "Carrera & Comunidad", "¿Qué habilidad humana o técnica gana valor cuando trabajamos con IA?", "09:50", "Tajumulco", "Ángel Castillo"],
  ["M17", "Agentes con Bedrock", "IA & Agentes", "Describe un caso real en el que usarías un sistema agéntico.", "09:50", "Tacaná", "Manuela Ballén"],
  ["M18", "MCP en una arquitectura real", "IA & Agentes", "¿Qué herramienta, fuente o sistema conectarías a un agente mediante MCP?", "09:50", "Santa María", "Víctor Pinzón"],
  ["M19", "Pregúntale a los datos", "Datos & Analítica", "Escribe una pregunta que te gustaría hacerle en lenguaje natural a los datos de tu organización.", "10:45", "Tajumulco", "Carlos Zambrano"],
  ["M20", "Mi puerta de entrada a GenAI", "IA & Agentes", "¿Con qué proyecto comenzarías a experimentar con IA generativa y por qué?", "10:45", "Tacaná", "Claudia Izquierdo"],
  ["M21", "Pipeline de eventos", "Arquitectura & Serverless", "Describe un evento de negocio para una arquitectura orientada a eventos.", "10:45", "Santa María", "Pablo Medrano"],
  ["M22", "Antes de producción", "Seguridad", "Anota una prueba de seguridad para tu checklist antes de publicar una aplicación.", "10:45", "Fuego", "Byron Laínez"],
  ["M23", "Serverless sin ansiedad", "Arquitectura & Serverless", "¿Qué parte de serverless quedó más clara después de la sesión?", "11:40", "Tacaná", "Fernanda Osorio"],
  ["M24", "Data Engineering autónomo", "IA & Agentes", "Describe una tarea repetitiva de datos que delegarías parcialmente a un agente.", "11:40", "Acatenango", "Joseph Arriola"],
  ["M25", "De virtualización a cloud", "DevOps & Operaciones", "¿Qué evaluarías primero antes de migrar una carga virtualizada a AWS?", "11:40", "Santa María", "Blanca Navarro"],
  ["M26", "Reuniones que se resumen solas", "IA & Agentes", "¿Qué salida automática sería más útil después de una reunión y por qué?", "11:40", "Fuego", "Erick Pineda"],
  ["M27", "Una idea del Foro de Mujeres", "Carrera & Comunidad", "Comparte una idea, reflexión o pregunta que te dejó el foro.", "12:35", "Tajumulco", "Foro de Mujeres"],
  ["M28", "Agentes open source", "IA & Agentes", "¿Qué ventaja o reto ves al construir agentes con herramientas open source?", "12:35", "Tacaná", "Ramsés Mata"],
  ["M29", "Pensar como arquitecto", "Arquitectura & Serverless", "Describe una decisión de arquitectura que no debería depender de un diagrama bonito.", "12:35", "Acatenango", "Lucas Vera"],
  ["M30", "Legacy → Cloud Native", "DevOps & Operaciones", "Menciona una señal de que una aplicación legacy necesita modernización.", "12:35", "Santa María", "Victor Reyes"],
  ["M31", "Más allá del DR clásico", "DevOps & Operaciones", "¿Qué pregunta de continuidad llevarías a tu equipo después de esta sesión?", "14:10", "Tajumulco", "Roger Girón"],
  ["M32", "Carrera internacional", "Carrera & Comunidad", "Escribe una acción concreta para acercarte a una oportunidad internacional en 30 días.", "14:10", "Tacaná", "Mario Gómez"],
  ["M33", "Vectoriza una idea", "Datos & Analítica", "Describe contenido que tendría sentido buscar semánticamente en uno de tus proyectos.", "14:10", "Acatenango", "Mario García"],
  ["M34", "Incidente sin reiniciar", "DevOps & Operaciones", "¿Qué evidencia recopilarías antes de reiniciar un servicio durante un incidente?", "14:10", "Agua", "Alexis Velásquez"],
  ["M35", "Moderniza una API", "IA & Agentes", "Elige una API y describe una capacidad AI-native que añadirías alrededor de ella.", "14:10", "Fuego", "Marlon Coti"]
];

const wordEntries: Entry[] = [
  ["M36", "Bedrock en una palabra", "IA & Agentes", "Resume tu impresión de Amazon Bedrock en una palabra.", "15:05", "Tajumulco", "Odilia Marisol Choc Cac"],
  ["M37", "Human.exe", "Carrera & Comunidad", "Escribe la habilidad humana que más quieres fortalecer.", "15:05", "Tacaná", "Mar García"],
  ["M38", "Energía + datos", "Datos & Analítica", "Resume qué te inspira de combinar datos, predicción y un caso guatemalteco.", "15:05", "Acatenango", "Samuel Palacios"],
  ["M39", "Defensa contra prompt injection", "Seguridad", "Escribe el principio de seguridad que no olvidarías al construir agentes.", "15:05", "Santa María", "Alex Archibold"],
  ["M40", "IoT a la nube", "Arquitectura & Serverless", "Resume el proyecto IoT que te gustaría construir.", "15:05", "Agua", "Jorge Romero"],
  ["M41", "CLI AI-native", "IA & Agentes", "Describe qué esperas ganar al volver una herramienta AI-native.", "15:05", "Fuego", "Jonathan Búcaro"],
  ["M42", "Construir con Kiro", "IA & Agentes", "Describe cómo te hace sentir construir software con asistentes de IA.", "16:00", "Tacaná", "Estefano Bullón"],
  ["M43", "Lo irremplazable", "Carrera & Comunidad", "Elige la capacidad humana que consideras más difícil de reemplazar.", "16:00", "Acatenango", "Laura Leiva"],
  ["M44", "Multicloud", "DevOps & Operaciones", "Describe qué priorizarías en un failover multicloud.", "16:00", "Santa María", "Hernán Villavicencio"],
  ["M45", "AWS Day en una palabra", "Evento", "Describe todo tu AWS Community Day Guatemala 2026 con una palabra."],
  ["M46", "La comunidad", "Comunidad", "Describe en una palabra a la comunidad que encontraste hoy."],
  ["M47", "Servicio AWS del día", "AWS", "Escribe el servicio o concepto AWS que más te interesó."],
  ["M48", "Track del día", "Agenda", "Resume en una palabra el track que más te aportó."],
  ["M49", "La Landívar en una palabra", "Venue", "Describe en una palabra tu experiencia del venue."],
  ["M50", "Me llevo…", "Cierre", "Escribe una palabra para aquello que te llevas del evento."]
];

export const missions: Mission[] = [
  ...photoEntries.map((entry) => makeMission("photo", entry)),
  ...commentEntries.map((entry) => makeMission("comment", entry)),
  ...wordEntries.map((entry) => makeMission("word", entry))
];
