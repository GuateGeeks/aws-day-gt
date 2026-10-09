export const SUBMISSION_CUTOFF_AT = Date.parse("2026-10-10T16:00:00-06:00");
export const SUBMISSION_NOTICE_WINDOW_MS = 30 * 60 * 1000;

export const SUBMISSION_DEADLINE_LABEL = "sábado 10 de octubre a las 4:00 p. m. (hora de Guatemala)";
export const SUBMISSIONS_OPEN_MESSAGE = `Envía tus respuestas, fotos y selfies hasta el ${SUBMISSION_DEADLINE_LABEL}.`;
export const SUBMISSIONS_CLOSED_MESSAGE = `El periodo para enviar respuestas, fotos y selfies cerró el ${SUBMISSION_DEADLINE_LABEL}.`;

export function isSubmissionWindowOpen(now: Date | number = Date.now()): boolean {
  const timestamp = typeof now === "number" ? now : now.getTime();
  return timestamp < SUBMISSION_CUTOFF_AT;
}

export function submissionNoticeState(now: Date | number = Date.now()): "hidden" | "closing" | "closed" {
  const timestamp = typeof now === "number" ? now : now.getTime();
  if (timestamp >= SUBMISSION_CUTOFF_AT) return "closed";
  if (timestamp >= SUBMISSION_CUTOFF_AT - SUBMISSION_NOTICE_WINDOW_MS) return "closing";
  return "hidden";
}
