import { AGENDA, ROOMS, sessionDate, type AgendaSession, type Track } from "./agenda";
import { QUETZI_FACTS } from "./companion-lines";

export type EventPhase = "pre" | "live" | "post";

const DAY_START = "07:30";
const DAY_END = "22:00";
const MINUTE = 60_000;

const INTEREST_TRACKS: Record<string, readonly Track[]> = {
  "IA & Agentes": ["IA & Agentes"],
  "Cloud Native": ["Arquitectura & Serverless", "DevOps & Operaciones"],
  "Datos & Analytics": ["Datos & Analítica"],
  Seguridad: ["Seguridad"],
  Serverless: ["Arquitectura & Serverless"],
  Comunidad: ["Carrera & Comunidad"]
};

export function getEventPhase(now: Date): EventPhase {
  if (now < sessionDate(DAY_START)) return "pre";
  return now < sessionDate(DAY_END) ? "live" : "post";
}

export function sessionsAt(now: Date, sessions: readonly AgendaSession[] = AGENDA): AgendaSession[] {
  return sessions.filter((session) => sessionDate(session.start) <= now && now < sessionDate(session.end));
}

export function nextSessions(now: Date, sessions: readonly AgendaSession[] = AGENDA): AgendaSession[] {
  const upcoming = sessions.filter((session) => sessionDate(session.start) > now);
  if (!upcoming.length) return [];
  const first = upcoming.map((session) => session.start).sort()[0];
  return upcoming.filter((session) => session.start === first);
}

export function countdownTo(now: Date, target: Date) {
  const totalMinutes = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / MINUTE));
  return { days: Math.floor(totalMinutes / 1440), hours: Math.floor(totalMinutes % 1440 / 60), minutes: totalMinutes % 60, totalMinutes };
}

export function tracksForInterests(interests: readonly string[]): Set<Track> {
  return new Set(interests.flatMap((interest) => INTEREST_TRACKS[interest] ?? []));
}

export function isRecommended(session: AgendaSession, interests: readonly string[]): boolean {
  return Boolean(session.track && tracksForInterests(interests).has(session.track));
}

export function sortByRecommendation(sessions: readonly AgendaSession[], interests: readonly string[]): AgendaSession[] {
  const score = (session: AgendaSession) => (isRecommended(session, interests) ? 0 : 1);
  return [...sessions].sort((a, b) => score(a) - score(b));
}

export function findSessionForMission(mission: { slot?: string; room?: string }): AgendaSession | undefined {
  if (!mission.slot || !mission.room) return undefined;
  return AGENDA.find((session) => session.start === mission.slot && ROOMS[session.room].short === mission.room);
}

export function findConflicts(ids: readonly string[]): Array<[AgendaSession, AgendaSession]> {
  const picked = AGENDA.filter((session) => ids.includes(session.id));
  return picked.flatMap((a, index) => picked.slice(index + 1)
    .filter((b) => a.start < b.end && b.start < a.end)
    .map((b) => [a, b] as [AgendaSession, AgendaSession]));
}

const STAGES = [
  { level: 0, min: 0, name: "Huevo", description: "Quetzi está por nacer. Completa tu primera misión." },
  { level: 1, min: 1, name: "Polluelo", description: "¡Quetzi salió del cascarón! Cada misión le da una pluma." },
  { level: 2, min: 4, name: "Quetzal joven", description: "Ya tiene cresta y su cola empieza a brillar." },
  { level: 3, min: 8, name: "Quetzal", description: "Plumas largas y orgullo chapín. Ya casi vuela libre." },
  { level: 4, min: 11, name: "Quetzal resplandeciente", description: "Completaste todo tu reto. ¡Quetzi vuela libre!" }
] as const;

export type QuetziStage = { level: 0 | 1 | 2 | 3 | 4; name: string; description: string; nextAt?: number };

export function quetziStage(completed: number): QuetziStage {
  const reached = STAGES.filter((stage) => completed >= stage.min);
  const { level, name, description } = reached[reached.length - 1] ?? STAGES[0];
  return { level, name, description, nextAt: STAGES.find((stage) => stage.level === level + 1)?.min };
}

type ChallengeCandidate = { missionId: string; status: string; mission: { slot?: string; room?: string } };

export function pickChallenge<T extends ChallengeCandidate>(items: readonly T[], now: Date): T | undefined {
  const available = items.filter((item) => item.status === "available" || item.status === "rejected");
  const forSessions = (sessions: AgendaSession[]) => available.find((item) => {
    const session = findSessionForMission(item.mission);
    return session && sessions.some((candidate) => candidate.id === session.id);
  });
  return forSessions(sessionsAt(now)) ?? forSessions(nextSessions(now)) ?? available.find((item) => !item.mission.slot) ?? available[0];
}

export function quetziFact(index: number): string {
  return QUETZI_FACTS[index % QUETZI_FACTS.length] ?? "";
}

export type LineContext = { phase: EventPhase; alias?: string; now: Date; tap?: number };

export function quetziLine({ phase, alias, now, tap = 0 }: LineContext): string {
  const name = alias ? `, ${alias}` : "";
  if (tap > 0) return quetziFact(tap - 1);
  if (phase === "pre") {
    const { days, hours } = countdownTo(now, sessionDate(DAY_START));
    const when = days > 0 ? `${days} ${days === 1 ? "día" : "días"}` : `${hours} ${hours === 1 ? "hora" : "horas"}`;
    return `¡Hola${name}! Soy Quetzi. Faltan ${when} para el Community Day. Armemos tu ruta en la Agenda.`;
  }
  if (phase === "post") return `¡Gracias por volar conmigo${name}! Fue un día increíble para la comunidad AWS de Guatemala.`;
  const current = sessionsAt(now);
  if (current.some((session) => session.title === "Almuerzo")) return `¡Hora del almuerzo${name}! Recarga energía y aprovecha para conocer a alguien nuevo.`;
  if (current.some((session) => session.title === "Registro")) return `¡Bienvenido${name}! Pasa por registro y luego busca tu primera sesión.`;
  if (current.some((session) => session.kind === "social")) return `La cena de la comunidad ya empezó${name}. ¡A celebrar lo aprendido!`;
  const next = nextSessions(now);
  const minutes = next[0] ? countdownTo(now, sessionDate(next[0].start)).totalMinutes : undefined;
  if (minutes !== undefined && minutes <= 10) return `¡Vuela${name}! En ${minutes} min empieza el siguiente bloque. Revisa a dónde te toca ir.`;
  return `Estoy contigo${name}. Te muestro qué pasa ahora y qué reto te queda cerca.`;
}
