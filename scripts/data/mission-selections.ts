import type { MissionAnswerKey, MissionSelection } from "../../shared/types";

type Definition = { id: string; question: string; kind: "quiz" | "opinion"; options: string[]; correct?: number[]; min?: number; max?: number };
const definitions: Definition[] = [
  { id: "M16", question: "¿Quién presentó la charla sobre talento, AWS e IA?", kind: "quiz", options: ["Ángel Castillo", "Carlos Zambrano", "Roger Girón", "Lucas Vera"], correct: [0] },
  { id: "M17", question: "¿Qué tecnologías aparecían en el título de la sesión sobre sistemas agénticos?", kind: "quiz", options: ["Strands Agents", "Amazon Bedrock AgentCore", "Amazon Redshift", "AWS Glue"], correct: [0, 1], min: 2, max: 2 },
  { id: "M18", question: "¿Qué protocolo se utilizó para construir agentes sobre AWS?", kind: "quiz", options: ["MCP", "SMTP", "FTP", "WebDAV"], correct: [0] },
  { id: "M19", question: "¿Qué escala de datos mencionaba el título de la sesión?", kind: "quiz", options: ["Millones de datos", "Decenas de datos", "Un solo archivo", "Cientos de hojas"], correct: [0] },
  { id: "M20", question: "¿Qué herramientas aparecían en el ABC de IA Generativa publicado en la agenda?", kind: "quiz", options: ["Amazon Bedrock", "Amazon Quick", "Kiro", "Amazon Redshift", "AWS Batch"], correct: [0, 1, 2], min: 3, max: 3 },
  { id: "M21", question: "¿Qué servicios componían el pipeline de eventos de la sesión?", kind: "quiz", options: ["Lambda", "SNS", "SQS", "Step Functions", "EC2", "RDS"], correct: [0, 1, 2, 3], min: 4, max: 4 },
  { id: "M22", question: "¿Quién presentó la sesión de pruebas de seguridad antes de producción?", kind: "quiz", options: ["Byron Laínez", "Alex Archibold", "Víctor Pinzón", "Marlon Coti"], correct: [0] },
  { id: "M23", question: "¿Qué estilo de arquitectura destacaba la sesión Serverless sin miedo?", kind: "quiz", options: ["Event-driven", "Monolito local", "Mainframe", "Procesamiento manual"], correct: [0] },
  { id: "M24", question: "¿Qué herramienta se mencionó para Data Engineering autónomo?", kind: "quiz", options: ["Claude Code", "Photoshop", "Excel VBA", "AutoCAD"], correct: [0] },
  { id: "M25", question: "¿Hacia qué servicio se planteó transformar cargas de VMware?", kind: "quiz", options: ["Amazon EC2", "Amazon S3", "Amazon SES", "Amazon Route 53"], correct: [0] },
  { id: "M26", question: "¿Qué tipos de entrada utilizaba Reu-X para resumir reuniones?", kind: "quiz", options: ["Audio", "Video", "Texto", "Telemetría IoT", "Código fuente"], correct: [0, 1, 2], min: 3, max: 3 },
  { id: "M27", question: "¿Qué ideas te llevas del Foro de Mujeres?", kind: "opinion", options: ["Liderazgo", "Mentoría", "Inclusión", "Comunidad", "Crecimiento profesional"], min: 1, max: 3 },
  { id: "M28", question: "¿Con qué tipo de herramientas se construía el primer agente de IA?", kind: "quiz", options: ["Open source", "Solo propietarias", "Sin código", "Hojas de cálculo"], correct: [0] },
  { id: "M29", question: "¿Sobre qué plataforma trataba la sesión de pensamiento arquitectónico?", kind: "quiz", options: ["AWS", "GCP", "Azure", "On-premises exclusivamente"], correct: [0] },
  { id: "M30", question: "¿Qué dos prácticas destacaba la modernización de Legacy a Cloud Native?", kind: "quiz", options: ["Trazabilidad", "Refactorización", "Impresión 3D", "Diseño gráfico"], correct: [0, 1], min: 2, max: 2 },
  { id: "M31", question: "¿Qué disciplina buscaba superar la sesión de Roger Girón?", kind: "quiz", options: ["Disaster Recovery tradicional", "Diseño responsivo", "Marketing digital", "Gestión de nómina"], correct: [0] },
  { id: "M32", question: "¿Qué acciones tomarías para acercarte a una oportunidad internacional?", kind: "opinion", options: ["Actualizar mi portafolio", "Practicar inglés", "Fortalecer networking", "Aplicar a posiciones", "Preparar entrevistas"], min: 1, max: 3 },
  { id: "M33", question: "¿Qué tipo de bases de datos protagonizaba la sesión?", kind: "quiz", options: ["Vectoriales", "Jerárquicas", "De escritorio", "En papel"], correct: [0] },
  { id: "M34", question: "¿Cuántos incidentes de AWS mencionaba el título?", kind: "quiz", options: ["Cinco", "Dos", "Diez", "Uno"], correct: [0] },
  { id: "M35", question: "¿Qué componentes se mencionaban para modernizar aplicaciones REST?", kind: "quiz", options: ["Amazon Bedrock AgentCore Gateway", "Strands Agents", "Amazon WorkSpaces", "AWS Snowball"], correct: [0, 1], min: 2, max: 2 },
  { id: "M36", question: "¿Qué servicio protagonizaba la sesión de primeros pasos en IA Generativa?", kind: "quiz", options: ["Amazon Bedrock", "Amazon EC2", "Amazon S3", "Amazon VPC"], correct: [0] },
  { id: "M37", question: "¿Cuál era el nombre de la sesión sobre códigos de éxito?", kind: "quiz", options: ["Human.exe", "Cloud.exe", "Career.zip", "Success.js"], correct: [0] },
  { id: "M38", question: "¿Qué mercado guatemalteco se analizaba de forma predictiva?", kind: "quiz", options: ["Mercado eléctrico", "Mercado inmobiliario", "Mercado agrícola", "Mercado turístico"], correct: [0] },
  { id: "M39", question: "¿Qué amenazas aparecían en el título de la sesión de seguridad?", kind: "quiz", options: ["Prompt injection", "Tool poisoning", "MCP rug pulls", "SQL tuning", "Cache warming"], correct: [0, 1, 2], min: 3, max: 3 },
  { id: "M40", question: "¿Desde qué plataforma física partía el ecosistema IoT?", kind: "quiz", options: ["Arduino", "Mainframe", "Laptop", "Impresora"], correct: [0] },
  { id: "M41", question: "¿Qué elementos se convertían en herramientas AI-Native?", kind: "quiz", options: ["Scripts", "CLI", "Presentaciones", "Imágenes"], correct: [0, 1], min: 2, max: 2 },
  { id: "M42", question: "¿Qué asistentes se usaban para construir la aplicación de la sesión?", kind: "quiz", options: ["Claude Code", "Kiro", "Amazon QuickSight", "AWS Glue"], correct: [0, 1], min: 2, max: 2 },
  { id: "M43", question: "¿Qué tema central tenía la sesión de Laura Leiva?", kind: "quiz", options: ["Habilidades que la tecnología no puede reemplazar", "Bases de datos", "Redes privadas", "Contenedores"], correct: [0] },
  { id: "M44", question: "¿Qué recorrido de failover multicloud describía la sesión?", kind: "quiz", options: ["AWS", "GCP", "Azure", "Oracle Cloud"], correct: [0, 1], min: 2, max: 2 },
  { id: "M45", question: "¿Cómo resumirías tu AWS Community Day?", kind: "opinion", options: ["Inspirador", "Práctico", "Intenso", "Sorprendente", "Comunitario"] },
  { id: "M46", question: "¿Cómo describirías a la comunidad que encontraste?", kind: "opinion", options: ["Abierta", "Colaborativa", "Curiosa", "Diversa", "Apasionada"] },
  { id: "M47", question: "¿Qué servicios o conceptos te interesaron más?", kind: "opinion", options: ["Amazon Bedrock", "Serverless", "Agentes", "Datos", "Seguridad", "DevOps"], min: 1, max: 3 },
  { id: "M48", question: "¿Qué track te aportó más?", kind: "opinion", options: ["IA & Agentes", "Arquitectura & Serverless", "Datos & Analítica", "DevOps & Operaciones", "Seguridad", "Carrera & Comunidad"] },
  { id: "M49", question: "¿Cómo describirías tu experiencia en la Landívar?", kind: "opinion", options: ["Cómoda", "Accesible", "Agradable", "Ordenada", "Memorable"] },
  { id: "M50", question: "¿Qué te llevas del evento?", kind: "opinion", options: ["Aprendizaje", "Contactos", "Ideas", "Motivación", "Herramientas"], min: 1, max: 3 }
];

export const missionSelectionData: Record<string, { question: string; selection: MissionSelection }> = Object.fromEntries(definitions.map((definition) => {
  const min = definition.min ?? 1;
  const max = definition.max ?? 1;
  return [definition.id, { question: definition.question, selection: { mode: max === 1 ? "single" : "multiple", validationKind: definition.kind, options: definition.options.map((label, index) => ({ id: `o${index + 1}`, label })), minSelections: min, maxSelections: max } }];
}));

export const missionAnswerKeys: Record<string, MissionAnswerKey> = Object.fromEntries(definitions.filter((definition) => definition.kind === "quiz").map((definition) => [definition.id, { missionId: definition.id, correctOptionIds: (definition.correct ?? []).map((index) => `o${index + 1}`) }]));
