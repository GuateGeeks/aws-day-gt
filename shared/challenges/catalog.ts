import { EVENT_ID } from "../constants";
import type { Challenge, ChallengeConfiguration, ChallengeOption, ChallengeValidationType, ChallengeCategory } from "./types";

function challenge(
  id: string, title: string, description: string, category: ChallengeCategory,
  auraReward: number, validationType: ChallengeValidationType,
  configuration: ChallengeConfiguration = {}, required = false
): Challenge {
  return { id, eventId: EVENT_ID, title, description, category, auraReward, validationType, active: true, required, configuration, version: 2 };
}

const services: ChallengeOption[] = [
  { id: "api-gateway", label: "Amazon API Gateway" },
  { id: "lambda", label: "AWS Lambda" },
  { id: "dynamodb", label: "Amazon DynamoDB" }
];

export const challenges: Challenge[] = [
  challenge("C01", "Different Stack", "Conecta con alguien de un área diferente a la tuya.", "CONNECT", 150, "participant_role_difference", { conversationPrompt: "Pregúntale qué tecnología está usando o aprendiendo actualmente." }),
  challenge("C02", "First Timer", "Conecta con alguien que esté viviendo su primer AWS Community Day.", "CONNECT", 150, "participant_first_timer"),
  { ...challenge("C03", "Cloud Trio", "Forma una conexión con dos participantes de áreas diferentes.", "CONNECT", 200, "participant_role_group"), active: false },
  challenge("C04", "Same Cloud Interest", "Encuentra a alguien que comparta uno de tus intereses tecnológicos.", "CONNECT", 100, "participant_shared_interest"),
  { ...challenge("C05", "Cross Level", "Actividad retirada del recorrido.", "CONNECT", 125, "participant_experience_difference"), active: false },
  challenge("C06", "Build Serverless", "Construye correctamente una arquitectura serverless.", "CLOUD", 150, "interactive_sequence", { items: services }),
  challenge("C07", "Cloud Match", "Relaciona cada necesidad con el servicio AWS correcto.", "CLOUD", 100, "interactive_matching", {
    prompts: [
      { id: "files", label: "Guardar archivos / imágenes" },
      { id: "code", label: "Ejecutar código serverless" },
      { id: "nosql", label: "Base de datos NoSQL" },
      { id: "genai", label: "IA generativa" }
    ],
    options: [
      { id: "s3", label: "Amazon S3" }, { id: "lambda", label: "AWS Lambda" },
      { id: "dynamodb", label: "Amazon DynamoDB" }, { id: "bedrock", label: "Amazon Bedrock" }
    ]
  }),
  challenge("C08", "Rescata la señal", "Selecciona el servicio que resolvería cada falla de la arquitectura.", "CLOUD", 150, "interactive_architecture", {
    scenario: "Dos fallas en el registro de participantes y el procesamiento de eventos.",
    options: [
      { id: "sqs", label: "Amazon SQS" }, { id: "lambda", label: "AWS Lambda" },
      { id: "dynamo", label: "Amazon DynamoDB" }
    ]
  }, true),
  challenge("C09", "Who Am I?", "Descubre el servicio AWS utilizando pistas.", "CLOUD", 100, "interactive_question", {
    clues: ["Puedo ejecutar código cuando ocurre un evento.", "No necesitas administrar servidores.", "Pagas por ejecución."],
    options: [
      { id: "s3", label: "Amazon S3" }, { id: "lambda", label: "AWS Lambda" },
      { id: "ec2", label: "Amazon EC2" }, { id: "cloudfront", label: "Amazon CloudFront" }
    ]
  }),
  { ...challenge("C10", "Código del speaker · taller", "Actividad retirada del recorrido.", "SESSION", 100, "session_code"), active: false },
  { ...challenge("C11", "Código del speaker · charla", "Actividad retirada del recorrido.", "SESSION", 150, "session_code"), active: false },
  challenge("C12", "Track Pulse", "¿Qué track te aportó más durante el evento?", "SESSION", 50, "survey", {
    tracks: [
      { id: "ai", label: "IA & Agentes" }, { id: "data", label: "Datos & Analítica" },
      { id: "architecture", label: "Arquitectura & Serverless" }, { id: "security", label: "Seguridad" },
      { id: "devops", label: "DevOps & Operaciones" }, { id: "community", label: "Carrera & Comunidad" },
      { id: "finops", label: "FinOps - Operaciones" }
    ]
  }, true),
  { ...challenge("C13", "Experiencia VR GuateGeeks", "Actividad retirada del recorrido.", "EXPERIENCE", 250, "experience_completion", { stationId: "cloudforge" }), active: false },
  { ...challenge("C14", "VR Explorer", "Actividad retirada del recorrido.", "EXPERIENCE", 150, "experience_completion", { stationId: "vr-explorer" }), active: false },
  challenge("C15", "Comparte la experiencia GuateGeeks", "Publica una historia o post sobre el stand de GuateGeeks y su experiencia. Etiqueta a GuateGeeks y sube una captura para revisión.", "COMMUNITY", 350, "community_photo", {}, true),
  challenge("C16", "Selfie con speaker", "Sube una selfie en la que aparezcas junto a un speaker del evento. El equipo revisará la foto antes de acreditar tus créditos.", "COMMUNITY", 100, "community_photo"),
  challenge("C17", "Selfie en un stand", "Sube una selfie en la que aparezcas en uno de los stands del evento. El equipo revisará la foto antes de acreditar tus créditos.", "COMMUNITY", 100, "community_photo"),
  challenge("C18", "Pausa el pico", "Las inscripciones llegan de golpe. Elige dónde guardar los trabajos hasta que puedan procesarse.", "CLOUD", 150, "interactive_question", {
    scenario: "Llegan miles de inscripciones en minutos. El proceso de confirmación necesita atenderlas a su ritmo, incluso si se detiene temporalmente.",
    options: [{ id: "sqs", label: "Amazon SQS" }, { id: "sns", label: "Amazon SNS" }, { id: "cloudwatch", label: "Amazon CloudWatch" }]
  }),
  challenge("C19", "Un aviso, muchos destinos", "Publica una confirmación para varios destinatarios a la vez.", "CLOUD", 150, "interactive_question", {
    scenario: "La confirmación debe llegar desde una sola publicación a un correo electrónico y a dos sistemas suscritos.",
    options: [{ id: "sns", label: "Amazon SNS" }, { id: "sqs", label: "Amazon SQS" }, { id: "rds", label: "Amazon RDS" }]
  }),
  challenge("C20", "Cada evento a su lugar", "Envía cada evento del sistema al destino que le corresponde.", "CLOUD", 150, "interactive_question", {
    scenario: "Inscripciones, cancelaciones y entradas deben dirigirse a destinos distintos según los campos de cada evento.",
    options: [{ id: "eventbridge", label: "Amazon EventBridge" }, { id: "cloudwatch", label: "Amazon CloudWatch" }, { id: "ebs", label: "Amazon EBS" }]
  }),
  challenge("C21", "Tres pasos, un flujo", "Coordina un proceso y descubre con claridad en qué paso falló.", "CLOUD", 150, "interactive_question", {
    scenario: "Debes verificar la inscripción, reservar el cupo y enviar la confirmación. El equipo quiere observar el estado de cada paso.",
    options: [{ id: "step-functions", label: "AWS Step Functions" }, { id: "sns", label: "Amazon SNS" }, { id: "cloudfront", label: "Amazon CloudFront" }]
  }),
  challenge("C22", "Alerta antes del caos", "Avisa al equipo cuando una función acumule demasiados errores.", "CLOUD", 150, "interactive_question", {
    scenario: "Los errores de una función superan un umbral durante varios minutos. Necesitas una alarma basada en esa métrica.",
    options: [{ id: "cloudwatch", label: "Amazon CloudWatch" }, { id: "s3", label: "Amazon S3" }, { id: "iam", label: "AWS IAM" }]
  }),
  challenge("C23", "Permiso justo", "Da a una función solo el acceso que necesita para guardar fotos.", "CLOUD", 150, "interactive_question", {
    scenario: "Una función puede guardar fotos en el bucket autorizado, pero no debe acceder a los demás recursos. ¿Dónde defines ese permiso?",
    options: [{ id: "iam", label: "AWS IAM" }, { id: "route53", label: "Amazon Route 53" }, { id: "sns", label: "Amazon SNS" }]
  })
];
