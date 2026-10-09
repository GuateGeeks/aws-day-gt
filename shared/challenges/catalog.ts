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
  challenge("C01", "Different Stack", "Conversa con alguien de un área tecnológica distinta a la tuya y registra el encuentro con su Geek ID.", "CONNECT", 150, "participant_role_difference", { conversationPrompt: "Pregúntale qué tecnología está usando o aprendiendo actualmente." }),
  challenge("C02", "First Timer", "Encuentra a alguien que vive su primer AWS Community Day y registra el encuentro con su Geek ID.", "CONNECT", 150, "participant_first_timer"),
  { ...challenge("C03", "Cloud Trio", "Forma una conexión con dos participantes de áreas diferentes.", "CONNECT", 200, "participant_role_group"), active: false },
  challenge("C04", "Same Cloud Interest", "Habla con alguien sobre sus intereses en AWS y registra la conexión si comparten alguno.", "CONNECT", 100, "participant_shared_interest"),
  { ...challenge("C05", "Cross Level", "Actividad retirada del recorrido.", "CONNECT", 125, "participant_experience_difference"), active: false },
  challenge("C06", "Build Serverless", "Organiza los servicios AWS para mostrar cómo una solicitud se recibe, se procesa y se guarda.", "CLOUD", 150, "interactive_sequence", { items: services }),
  challenge("C07", "Cloud Match", "Elige el servicio AWS adecuado para guardar archivos, ejecutar código, almacenar datos NoSQL y usar IA generativa.", "CLOUD", 100, "interactive_matching", {
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
  challenge("C08", "Rescata la señal", "Resuelve dos incidentes del sistema de inscripciones: registros duplicados y eventos que frenan el procesamiento.", "CLOUD", 150, "interactive_architecture", {
    scenario: "Dos fallas en el registro de participantes y el procesamiento de eventos.",
    options: [
      { id: "sqs", label: "Amazon SQS" }, { id: "lambda", label: "AWS Lambda" },
      { id: "dynamo", label: "Amazon DynamoDB" }
    ]
  }, true),
  challenge("C09", "Who Am I?", "Lee las pistas e identifica cuál de las opciones corresponde al servicio AWS descrito.", "CLOUD", 100, "interactive_question", {
    clues: ["Puedo ejecutar código cuando ocurre un evento.", "No necesitas administrar servidores.", "Pagas por ejecución."],
    options: [
      { id: "s3", label: "Amazon S3" }, { id: "lambda", label: "AWS Lambda" },
      { id: "ec2", label: "Amazon EC2" }, { id: "cloudfront", label: "Amazon CloudFront" }
    ]
  }),
  { ...challenge("C10", "Código del speaker · taller", "Actividad retirada del recorrido.", "SESSION", 100, "session_code"), active: false },
  { ...challenge("C11", "Código del speaker · charla", "Actividad retirada del recorrido.", "SESSION", 150, "session_code"), active: false },
  challenge("C12", "Track Pulse", "Selecciona el track que más te aportó durante las charlas y actividades del evento.", "SESSION", 50, "survey", {
    tracks: [
      { id: "ai", label: "IA & Agentes" }, { id: "data", label: "Datos & Analítica" },
      { id: "architecture", label: "Arquitectura & Serverless" }, { id: "security", label: "Seguridad" },
      { id: "devops", label: "DevOps & Operaciones" }, { id: "community", label: "Carrera & Comunidad" },
      { id: "finops", label: "FinOps - Operaciones" }
    ]
  }, true),
  { ...challenge("C13", "Experiencia VR GuateGeeks", "Actividad retirada del recorrido.", "EXPERIENCE", 250, "experience_completion", { stationId: "cloudforge" }), active: false },
  { ...challenge("C14", "VR Explorer", "Actividad retirada del recorrido.", "EXPERIENCE", 150, "experience_completion", { stationId: "vr-explorer" }), active: false },
  challenge("C15", "Comparte la experiencia GuateGeeks", "Visita el stand de GuateGeeks, comparte la experiencia en tus redes, etiqueta a GuateGeeks y adjunta una captura de la publicación para revisión.", "COMMUNITY", 350, "community_photo", {}, true),
  challenge("C16", "Selfie con speaker", "Comparte una selfie donde aparezcas junto a un speaker; el equipo revisará la imagen.", "COMMUNITY", 100, "community_photo"),
  challenge("C17", "Selfie en un stand", "Comparte una selfie en uno de los stands; el equipo verificará que se distingan tu rostro y el lugar.", "COMMUNITY", 100, "community_photo"),
  challenge("C18", "Inscripciones sin perder el ritmo", "Elige cómo conservar y procesar solicitudes mientras el servicio de confirmación está pausado.", "CLOUD", 150, "interactive_question", {
    scenario: "Miles de personas se inscriben en pocos minutos. Necesitas conservar cada solicitud y procesarla de forma ordenada, aun si el sistema de confirmación se detiene temporalmente.",
    options: [{ id: "sqs", label: "Amazon SQS" }, { id: "sns", label: "Amazon SNS" }, { id: "cloudwatch", label: "Amazon CloudWatch" }]
  }),
  challenge("C19", "Un aviso, muchos destinos", "Selecciona el servicio que distribuye una notificación a varios suscriptores desde una sola publicación.", "CLOUD", 150, "interactive_question", {
    scenario: "La confirmación debe llegar desde una sola publicación a un correo electrónico y a dos sistemas suscritos.",
    options: [{ id: "sns", label: "Amazon SNS" }, { id: "sqs", label: "Amazon SQS" }, { id: "rds", label: "Amazon RDS" }]
  }),
  challenge("C20", "Cada evento a su lugar", "Elige el servicio que enruta eventos a destinos distintos según la información que contienen.", "CLOUD", 150, "interactive_question", {
    scenario: "Inscripciones, cancelaciones y entradas deben dirigirse a destinos distintos según los campos de cada evento.",
    options: [{ id: "eventbridge", label: "Amazon EventBridge" }, { id: "cloudwatch", label: "Amazon CloudWatch" }, { id: "ebs", label: "Amazon EBS" }]
  }),
  challenge("C21", "Tres pasos, un flujo", "Coordina la verificación, reserva y confirmación de una inscripción, y consulta el estado de cada paso.", "CLOUD", 150, "interactive_question", {
    scenario: "Debes verificar la inscripción, reservar el cupo y enviar la confirmación. El equipo quiere observar el estado de cada paso.",
    options: [{ id: "step-functions", label: "AWS Step Functions" }, { id: "sns", label: "Amazon SNS" }, { id: "cloudfront", label: "Amazon CloudFront" }]
  }),
  challenge("C22", "Alerta antes del caos", "Vigila los errores de una función y avisa al equipo cuando superen el umbral definido.", "CLOUD", 150, "interactive_question", {
    scenario: "Los errores de una función superan un umbral durante varios minutos. Necesitas una alarma basada en esa métrica.",
    options: [{ id: "cloudwatch", label: "Amazon CloudWatch" }, { id: "s3", label: "Amazon S3" }, { id: "iam", label: "AWS IAM" }]
  }),
  challenge("C23", "Permiso justo", "Concede a una función permiso para guardar fotos únicamente en el bucket autorizado.", "CLOUD", 150, "interactive_question", {
    scenario: "Una función puede guardar fotos en el bucket autorizado, pero no debe acceder a los demás recursos. ¿Dónde defines ese permiso?",
    options: [{ id: "iam", label: "AWS IAM" }, { id: "route53", label: "Amazon Route 53" }, { id: "sns", label: "Amazon SNS" }]
  })
];
