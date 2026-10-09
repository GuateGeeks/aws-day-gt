import type { Challenge } from "../../../shared/challenges/types";

const instructions: Record<string, string> = {
  C01: "Busca a una persona que trabaje o aprenda en otra área tecnológica. Conversen sobre sus proyectos, comparen sus perfiles y escanea su Geek ID para registrar la conexión.",
  C02: "Encuentra a alguien que esté viviendo su primer Community Day. Conoce qué espera aprender hoy y escanea su Geek ID para validar el encuentro.",
  C04: "Habla con otra persona sobre los temas de AWS que le interesan. Si comparten al menos un interés tecnológico, escanea su Geek ID para completar el reto.",
  C06: "Una persona envía una solicitud de registro a una aplicación serverless. Ordena los servicios según cómo reciben la solicitud, ejecutan la lógica y guardan los datos; confirma el recorrido completo.",
  C07: "El equipo tiene cuatro necesidades: guardar archivos, ejecutar código sin servidores, almacenar datos NoSQL y usar IA generativa. Relaciona cada una con el servicio AWS adecuado antes de confirmar.",
  C08: "El sistema de registro tiene dos fallas: se duplican inscripciones y un evento defectuoso detiene el procesamiento. Resuelve una situación a la vez eligiendo el servicio que corrige cada problema.",
  C09: "Lee las tres pistas sobre cómo funciona el servicio oculto. Identifica cuál de las opciones encaja con todas ellas y confirma tu elección.",
  C12: "Piensa en las charlas y actividades que visitaste. Elige el track que más te aportó durante el evento y registra tu respuesta.",
  C15: "Visita el stand de GuateGeeks, comparte la experiencia en una publicación y etiqueta a la comunidad. Después adjunta una captura de tu publicación para que el equipo la revise.",
  C16: "Busca a un speaker del evento y pídele una selfie contigo. Toma la foto o elígela de tu galería; asegúrate de que ambos rostros se distingan antes de enviarla.",
  C17: "Visita un stand del evento y toma una selfie allí, o elige una foto de tu galería. Tu rostro y el stand del evento deben verse con claridad para la revisión.",
  C18: "Imagina una avalancha de registros mientras la confirmación está temporalmente detenida. Elige el servicio que permite conservar cada inscripción y procesarla después sin perder solicitudes.",
  C19: "Una confirmación debe publicarse una sola vez y llegar a varios destinatarios, como un correo y sistemas suscritos. Selecciona el servicio que distribuye ese aviso.",
  C20: "El sistema recibe inscripciones, cancelaciones y entradas. Escoge el servicio que examina los datos de cada evento y lo dirige al destino adecuado mediante reglas.",
  C21: "La inscripción pasa por tres pasos: verificar datos, reservar un cupo y enviar la confirmación. Elige el servicio que coordina el flujo y permite ver dónde ocurrió una falla.",
  C22: "Una función supera el umbral de errores durante varios minutos. Elige el servicio con el que puedes observar esa métrica y avisar al equipo mediante una alarma.",
  C23: "La función que recibe imágenes debe tener permiso para que solo pueda guardar fotos en el bucket autorizado. Elige dónde definirías ese acceso limitado."
};

export function challengeInstructions(challenge: Challenge): string {
  return instructions[challenge.id] ?? challenge.description;
}
