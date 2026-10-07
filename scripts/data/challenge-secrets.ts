export interface ChallengeSecret {
  challengeId: string;
  expectedSequence?: string[];
  expectedMatches?: Record<string, string>;
  correctOptionId?: string;
  correctExplanation?: string;
  wrongReasons?: Record<string, string>;
  sharedCodeHash?: string;
  sharedCodeActive?: boolean;
  sessionCodes?: Record<string, { codeHash: string; active: boolean; startAt?: string; endAt?: string }>;
  sessionQuestions?: Record<string, { correctOptionId: string }>;
}

// Event codes are configured separately so they never enter the public seed.
export const challengeSecrets: ChallengeSecret[] = [
  { challengeId: "C06", expectedSequence: ["api-gateway", "lambda", "dynamodb"] },
  { challengeId: "C07", expectedMatches: { files: "s3", code: "lambda", nosql: "dynamodb", genai: "bedrock" } },
  { challengeId: "C08", correctOptionId: "dynamodb" },
  { challengeId: "C09", correctOptionId: "lambda" },
  { challengeId: "C10" },
  { challengeId: "C11" },
  { challengeId: "C18", correctOptionId: "sqs", correctExplanation: "Amazon SQS mantiene los trabajos en una cola; el consumidor puede procesarlos a su ritmo.", wrongReasons: {
    sns: "Amazon SNS distribuye avisos a suscriptores, pero no es la cola donde un consumidor conserva trabajos pendientes.",
    cloudwatch: "Amazon CloudWatch observa métricas y genera alertas; no guarda inscripciones pendientes de procesar."
  } },
  { challengeId: "C19", correctOptionId: "sns", correctExplanation: "Un tema de Amazon SNS publica un mensaje a varios suscriptores, incluidos correo y colas SQS.", wrongReasons: {
    sqs: "Amazon SQS guarda mensajes para consumidores de una cola; por sí solo no publica el mismo aviso a correo y varios suscriptores.",
    rds: "Amazon RDS administra bases de datos relacionales; no distribuye avisos a suscriptores."
  } },
  { challengeId: "C20", correctOptionId: "eventbridge", correctExplanation: "Las reglas de Amazon EventBridge comparan los campos del evento y lo envían al destino definido.", wrongReasons: {
    cloudwatch: "Amazon CloudWatch ayuda a observar el sistema y crear alarmas; no es el enrutador de estos eventos de negocio.",
    ebs: "Amazon EBS proporciona almacenamiento en bloques; no examina eventos para enviarlos a otros destinos."
  } },
  { challengeId: "C21", correctOptionId: "step-functions", correctExplanation: "AWS Step Functions coordina los pasos del flujo y permite ver el estado de cada ejecución.", wrongReasons: {
    sns: "Amazon SNS distribuye mensajes, pero no mantiene el estado del proceso de verificación, reserva y confirmación.",
    cloudfront: "Amazon CloudFront entrega contenido con baja latencia; no coordina estos tres pasos."
  } },
  { challengeId: "C22", correctOptionId: "cloudwatch", correctExplanation: "Una alarma de Amazon CloudWatch puede vigilar la métrica de errores y activarse cuando supera un umbral.", wrongReasons: {
    s3: "Amazon S3 almacena objetos; no evalúa la métrica de errores para lanzar una alarma.",
    iam: "AWS IAM controla permisos; no vigila los errores de ejecución de la función."
  } },
  { challengeId: "C23", correctOptionId: "iam", correctExplanation: "Una política de AWS IAM en el rol de la función puede conceder solo la acción y el bucket necesarios.", wrongReasons: {
    route53: "Amazon Route 53 administra DNS y enrutamiento de tráfico; no define los permisos del rol de la función.",
    sns: "Amazon SNS distribuye mensajes; no limita qué bucket puede usar una función."
  } }
];
