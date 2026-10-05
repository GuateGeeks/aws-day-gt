// Official agenda copied from https://awscommunitygt.com/agenda/ (snapshot 2026-10-04).
// Times are local America/Guatemala (UTC-6, no daylight saving).

export const EVENT_DATE = "2026-10-10";
export const EVENT_UTC_OFFSET = "-06:00";
export const EVENT_SITE_URL = "https://awscommunitygt.com/";

export type Track =
  | "IA & Agentes"
  | "Arquitectura & Serverless"
  | "Datos & Analítica"
  | "DevOps & Operaciones"
  | "Seguridad"
  | "Carrera & Comunidad";

export const TRACKS: readonly Track[] = [
  "IA & Agentes",
  "Arquitectura & Serverless",
  "Datos & Analítica",
  "DevOps & Operaciones",
  "Seguridad",
  "Carrera & Comunidad"
];

export type RoomId = "plenaria" | "tajumulco" | "tacana" | "acatenango" | "santa-maria" | "agua" | "fuego" | "kiro" | "lab";

export interface Room {
  id: RoomId;
  name: string;
  short: string;
  building: string;
  capacity?: number;
}

export const ROOMS: Record<RoomId, Room> = {
  plenaria: { id: "plenaria", name: "Plenaria", short: "Plenaria", building: "Edificio O" },
  tajumulco: { id: "tajumulco", name: "Auditorio Principal Tajumulco", short: "Tajumulco", building: "Edificio O", capacity: 300 },
  tacana: { id: "tacana", name: "Ignacio Loyola Tacaná", short: "Tacaná", building: "Edificio H", capacity: 200 },
  acatenango: { id: "acatenango", name: "Francisco Borja Acatenango", short: "Acatenango", building: "Edificio H", capacity: 100 },
  "santa-maria": { id: "santa-maria", name: "Pedro Javier 1 Santa María", short: "Santa María", building: "Edificio H", capacity: 60 },
  agua: { id: "agua", name: "Salón 1 Agua", short: "Agua", building: "Edificio H", capacity: 50 },
  fuego: { id: "fuego", name: "Salón 2 Fuego", short: "Fuego", building: "Edificio H", capacity: 50 },
  kiro: { id: "kiro", name: "Casa de Kiro", short: "Casa de Kiro", building: "Biblioteca", capacity: 20 },
  lab: { id: "lab", name: "Laboratorio", short: "Laboratorio", building: "Laboratorio", capacity: 20 }
};

export type SessionKind = "talk" | "keynote" | "workshop" | "activity" | "plenary" | "break" | "social";

export interface AgendaSession {
  id: string;
  start: string;
  end: string;
  room: RoomId;
  title: string;
  kind: SessionKind;
  track?: Track;
  speaker?: string;
  origin?: string;
  org?: string;
  note?: string;
}

type Row = [start: string, end: string, room: RoomId, kind: SessionKind, title: string, track?: Track, speaker?: string, origin?: string, org?: string, note?: string];

const rows: Row[] = [
  ["07:30", "08:30", "plenaria", "break", "Registro"],
  ["08:30", "09:00", "plenaria", "plenary", "Presentación: Community Day y Comunidad AWS"],
  ["09:00", "09:40", "plenaria", "keynote", "Keynote de apertura", undefined, "Magali Pinto", undefined, "Solutions Architect, AWS"],

  ["09:50", "10:40", "tajumulco", "talk", "Transformando el talento con AWS e IA: del temor a la ventaja", "Carrera & Comunidad", "Ángel Castillo", "Guatemala", "Universidad Rafael Landívar", "Cupo limitado a 100 personas"],
  ["09:50", "10:40", "tacana", "talk", "Strands Agents + Amazon Bedrock AgentCore: el dúo dinámico para construir tu sistema agéntico", "IA & Agentes", "Manuela Ballén", "Colombia"],
  ["09:50", "10:40", "acatenango", "talk", "The Event Happened Twice", "Arquitectura & Serverless", "Mauricio Alvarado", "Colombia", "Mercado Libre"],
  ["09:50", "10:40", "santa-maria", "talk", "Construyendo agentes con MCP sobre AWS", "IA & Agentes", "Víctor Pinzón", "Guatemala", "Justo MX"],
  ["09:50", "10:40", "kiro", "activity", "Actividad con Bárbara Gaspar", "IA & Agentes", "Bárbara Gaspar"],
  ["10:00", "13:30", "lab", "workshop", "Workshop práctico", "IA & Agentes", "Jacobo De León", "Guatemala", "Escala24x7 inc", "Tema pendiente de definir"],

  ["10:45", "11:35", "tajumulco", "talk", "¿Y si pudieras preguntarle a millones de datos y obtener la respuesta en segundos?", "Datos & Analítica", "Carlos Zambrano", "Colombia", "Globant LLC"],
  ["10:45", "11:35", "tacana", "talk", "El ABC de la IA Generativa en AWS: Amazon Bedrock, Amazon Quick y Kiro", "IA & Agentes", "Claudia Izquierdo", undefined, "AWS"],
  ["10:45", "11:35", "acatenango", "talk", "AWS Descuentos, Incentivos y Programas", "Carrera & Comunidad", "Miguel Mateo", "Guatemala", "INTCOMEX"],
  ["10:45", "11:35", "santa-maria", "talk", "Tu primer pipeline de eventos en AWS: Lambda, SNS, SQS y Step Functions en la práctica", "Arquitectura & Serverless", "Pablo Medrano", "Guatemala", "Improving"],
  ["10:45", "11:35", "agua", "talk", "Cómo la IA está cambiando el trabajo del analista (y por qué no da miedo)", "Carrera & Comunidad", "Luciano Tom", "Guatemala", "CCDatos"],
  ["10:45", "11:35", "fuego", "talk", "Seguridad comprobable: tests que tu aplicación web en AWS debe pasar antes de producción", "Seguridad", "Byron Laínez", "Guatemala"],

  ["11:40", "12:30", "tajumulco", "talk", "Tema por confirmar", undefined, "Por confirmar", undefined, "Banco Industrial"],
  ["11:40", "12:30", "tacana", "talk", "Serverless sin miedo: arquitectura event-driven para tu primer proyecto real", "Arquitectura & Serverless", "Fernanda Osorio", "México"],
  ["11:40", "12:30", "acatenango", "talk", "De pipelines a agentes: Data Engineering autónomo con Claude Code en AWS", "IA & Agentes", "Joseph Arriola", "Guatemala"],
  ["11:40", "12:30", "santa-maria", "talk", "De VMware a EC2 en tiempo récord: la ruta rápida con AWS Transform", "DevOps & Operaciones", "Blanca Navarro", "Costa Rica", "AWS"],
  ["11:40", "12:30", "agua", "talk", "From Commit to Impact: Connecting DevOps, AI and AWS to Business Outcomes", "DevOps & Operaciones", "Edgar Vela", "Guatemala", "Ikigai Consulting"],
  ["11:40", "12:30", "fuego", "talk", "Reu-X: resumen automático de reuniones a partir de audio, video y texto utilizando AWS", "IA & Agentes", "Erick Pineda", "Guatemala"],
  ["11:40", "16:50", "kiro", "activity", "Actividad con Bárbara Gaspar", "IA & Agentes", "Bárbara Gaspar"],

  ["12:35", "13:25", "tajumulco", "talk", "Foro de Mujeres", "Carrera & Comunidad", "Panel (3 panelistas)"],
  ["12:35", "13:25", "tacana", "talk", "Construye tu primer Agente de IA usando herramientas Open Source", "IA & Agentes", "Ramsés Mata", "México", "AWS"],
  ["12:35", "13:25", "acatenango", "talk", "Más allá del diagrama: cómo pensar como arquitecto en AWS", "Arquitectura & Serverless", "Lucas Vera", "Colombia", "sls.guru"],
  ["12:35", "13:25", "santa-maria", "talk", "De Legacy a Cloud Native: trazabilidad y refactorización con AWS Transform", "DevOps & Operaciones", "Victor Reyes", "Guatemala", "GMB"],

  ["13:25", "14:10", "plenaria", "break", "Almuerzo"],

  ["14:10", "15:00", "tajumulco", "talk", "Más allá del Disaster Recovery tradicional", "DevOps & Operaciones", "Roger Girón", "Guatemala", "GBM"],
  ["14:10", "15:00", "tacana", "talk", "Cómo conseguir oportunidades internacionales en Big Data e IA", "Carrera & Comunidad", "Mario Gómez", "Guatemala", "Factored.ai"],
  ["14:10", "15:00", "acatenango", "talk", "Bases de datos vectoriales en AWS: la clave para la IA Generativa", "Datos & Analítica", "Mario García", "México"],
  ["14:10", "16:50", "santa-maria", "workshop", "Kiro: el nuevo aliado de FinOps", undefined, "Bárbara Gaspar", "México", "FinOps Foundation"],
  ["14:10", "15:00", "agua", "talk", "Cinco incidentes de AWS que no se resolvieron reiniciando", "DevOps & Operaciones", "Alexis Velásquez", "Colombia"],
  ["14:10", "15:00", "fuego", "talk", "Modernización de aplicaciones REST con Amazon Bedrock AgentCore Gateway y Strands Agents", "IA & Agentes", "Marlon Coti", "Guatemala", "Proticket.io | CSN"],

  ["15:05", "15:55", "tajumulco", "talk", "Primeros pasos con Amazon Bedrock: inicio en la IA Generativa", "IA & Agentes", "Odilia Marisol Choc Cac", "Guatemala", "Escala 24x7", "Cupo limitado a 100 personas"],
  ["15:05", "15:55", "tacana", "talk", "Códigos de Éxito: Human.exe", "Carrera & Comunidad", "Mar García", "Perú", "HOPE Consulting Group"],
  ["15:05", "15:55", "acatenango", "talk", "Análisis predictivo del mercado eléctrico guatemalteco con AWS", "Datos & Analítica", "Samuel Palacios", "Guatemala", "JB Analytica"],
  ["15:05", "15:55", "santa-maria", "talk", "Prompt Injection, Tool Poisoning y MCP Rug Pulls", "Seguridad", "Alex Archibold", "Panamá", "SoftwareOne"],
  ["15:05", "15:55", "agua", "talk", "De Arduino a la nube: construyendo un ecosistema IoT con AWS", "Arquitectura & Serverless", "Jorge Romero", "Guatemala"],
  ["15:05", "15:55", "fuego", "talk", "Convierte tus scripts y CLI en herramientas AI-Native usando Skills", "IA & Agentes", "Jonathan Búcaro", "Guatemala", "HTEC"],

  ["16:00", "16:50", "tajumulco", "keynote", "Keynote de cierre", undefined, "Luis Carlo Arias", undefined, "AWS"],
  ["16:00", "16:50", "tacana", "talk", "Construyendo una app con Claude Code y Kiro siendo psicólogo", "IA & Agentes", "Estefano Bullón", "Perú"],
  ["16:00", "16:50", "acatenango", "talk", "Las habilidades que la tecnología no puede reemplazar", "Carrera & Comunidad", "Laura Leiva", "Guatemala", "Grupo Intelecto & Money Growth Partners"],
  ["16:00", "16:50", "santa-maria", "talk", "Never Down: failover multicloud AWS→GCP decidido por un agente de IA", "DevOps & Operaciones", "Hernán Villavicencio", "Ecuador", "Datafast"],

  ["17:00", "17:15", "plenaria", "plenary", "Palabras de cierre", undefined, "Alejandra Bricio", undefined, "Community Manager LATAM, AWS"],
  ["17:10", "18:00", "plenaria", "plenary", "Cierre"],
  ["20:00", "22:00", "plenaria", "social", "Cena de la comunidad", undefined, undefined, undefined, undefined, "Hora de fin no publicada"]
];

export const AGENDA: readonly AgendaSession[] = rows.map(([start, end, room, kind, title, track, speaker, origin, org, note]) => ({
  id: `${start.replace(":", "")}-${room}`,
  start,
  end,
  room,
  kind,
  title,
  track,
  speaker,
  origin,
  org,
  note
}));

export function sessionDate(time: string): Date {
  return new Date(`${EVENT_DATE}T${time}:00${EVENT_UTC_OFFSET}`);
}

export function agendaSlots(sessions: readonly AgendaSession[] = AGENDA): string[] {
  return [...new Set(sessions.map((session) => session.start))].sort();
}
