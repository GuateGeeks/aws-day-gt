export type DomainErrorCode =
  | "INVALID_WORD"
  | "TEXT_TOO_SHORT"
  | "TEXT_TOO_LONG"
  | "URL_NOT_ALLOWED"
  | "INVALID_EVIDENCE"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "EVENT_CLOSED"
  | "MISSION_UNAVAILABLE"
  | "DUPLICATE_SUBMISSION"
  | "REPLACEMENTS_EXHAUSTED"
  | "INVALID_SELECTION"
  | "DUPLICATE_SELECTION"
  | "INVALID_SELECTION_COUNT";

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message = code) {
    super(message);
    this.name = "DomainError";
  }
}

export const errorMessages: Record<DomainErrorCode, string> = {
  INVALID_WORD: "Escribe solamente una palabra.",
  TEXT_TOO_SHORT: "Tu respuesta necesita un poco más de detalle.",
  TEXT_TOO_LONG: "Tu respuesta supera el límite permitido.",
  URL_NOT_ALLOWED: "Las respuestas de una palabra no aceptan enlaces.",
  INVALID_EVIDENCE: "La evidencia no coincide con esta misión.",
  UNAUTHENTICATED: "Inicia sesión para continuar.",
  FORBIDDEN: "No tienes permiso para realizar esta acción.",
  EVENT_CLOSED: "La participación está cerrada por ahora.",
  MISSION_UNAVAILABLE: "Esta misión ya no está disponible.",
  DUPLICATE_SUBMISSION: "Esta misión ya recibió una respuesta.",
  REPLACEMENTS_EXHAUSTED: "Ya utilizaste tus dos reemplazos.",
  INVALID_SELECTION: "La selección no pertenece a esta misión.",
  DUPLICATE_SELECTION: "No puedes seleccionar la misma opción dos veces.",
  INVALID_SELECTION_COUNT: "Selecciona la cantidad indicada de opciones."
};
