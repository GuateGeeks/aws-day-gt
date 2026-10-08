import { AGENDA, EVENT_DATE, EVENT_UTC_OFFSET, ROOMS, sessionDate, type AgendaSession } from "./agenda";
import { QUETZI_FACTS } from "./companion-lines";

export type EventPhase = "pre" | "live" | "post";

const DAY_START = "07:30";
const DAY_END = "22:00";
const MINUTE = 60_000;

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

export function nextAgendaReminder(now: Date): { key: string; start: string; minutes: number; sessions: AgendaSession[] } | undefined {
  const sessions = nextSessions(now);
  const first = sessions[0];
  if (!first) return undefined;
  const start = first.start;
  const remaining = sessionDate(start).getTime() - now.getTime();
  if (remaining <= 0 || remaining > 5 * MINUTE) return undefined;
  return { key: `${EVENT_DATE}-${start}`, start, minutes: Math.ceil(remaining / MINUTE), sessions };
}

export type AgendaSpotlight = { status: "preview" | "upcoming" | "live" | "ended"; sessions: AgendaSession[] };

/** Show the registration card immediately, then switch to the real Guatemala schedule. */
export function getAgendaSpotlight(now: Date): AgendaSpotlight {
  if (now < new Date(`${EVENT_DATE}T00:00:00${EVENT_UTC_OFFSET}`)) {
    return { status: "preview", sessions: AGENDA.filter((session) => session.title === "Registro") };
  }
  const current = sessionsAt(now);
  if (current.length) return { status: "live", sessions: current.sort((a, b) => b.start.localeCompare(a.start)) };
  const upcoming = nextSessions(now);
  return upcoming.length ? { status: "upcoming", sessions: upcoming } : { status: "ended", sessions: [] };
}

export function countdownTo(now: Date, target: Date) {
  const totalMinutes = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / MINUTE));
  return { days: Math.floor(totalMinutes / 1440), hours: Math.floor(totalMinutes % 1440 / 60), minutes: totalMinutes % 60, totalMinutes };
}

export function findSessionForMission(mission: { slot?: string; room?: string }): AgendaSession | undefined {
  if (!mission.slot || !mission.room) return undefined;
  return AGENDA.find((session) => session.start === mission.slot && ROOMS[session.room].short === mission.room);
}

/** Whether the session tied to a mission is running now or is in the next slot. */
export function missionTiming(mission: { slot?: string; room?: string }, now: Date): "now" | "next" | undefined {
  const session = findSessionForMission(mission);
  if (!session) return undefined;
  if (sessionsAt(now).some((candidate) => candidate.id === session.id)) return "now";
  return nextSessions(now).some((candidate) => candidate.id === session.id) ? "next" : undefined;
}

const STAGES = [
  { level: 0, min: 0, name: "Huevo", description: "Geek está por nacer. Completa tu primer Challenge." },
  { level: 1, min: 1, name: "Polluelo", description: "¡Geek salió del cascarón! Sigue completando Challenges." },
  { level: 2, min: 4, name: "Quetzal joven", description: "Ya tiene cresta y su cola empieza a brillar." },
  { level: 3, min: 8, name: "Quetzal", description: "Plumas largas y orgullo chapín. Ya casi vuela libre." },
  { level: 4, min: 10, name: "Quetzal resplandeciente", description: "Completaste todos tus Challenges. ¡Geek vuela libre!" }
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
    return `¡Hola${name}! Soy Geek, tu guía GuateGeeks. Explora la agenda oficial y prepárate para vivir el Community Day conmigo.`;
  }
  if (phase === "post") return `¡Gracias por volar conmigo${name}! Fue un día increíble para la comunidad AWS de Guatemala.`;
  const current = sessionsAt(now);
  if (current.some((session) => session.title === "Almuerzo")) return `¡Hora del almuerzo${name}! Recarga energía y aprovecha para conocer a alguien nuevo.`;
  if (current.some((session) => session.title === "Registro")) return `¡Bienvenido${name}! Pasa por registro y luego busca tu primera sesión.`;
  if (current.some((session) => session.kind === "social")) return `La cena de la comunidad ya empezó${name}. ¡A celebrar lo aprendido!`;
  const next = nextSessions(now);
  const minutes = next[0] ? countdownTo(now, sessionDate(next[0].start)).totalMinutes : undefined;
  if (minutes !== undefined && minutes <= 10) return `¡Vuela${name}! En ${minutes} min empieza el siguiente bloque. Revisa la agenda oficial para ver a dónde ir.`;
  return `Estoy contigo${name}. Te aviso qué reto tienes cerca; horarios y salas están en la agenda oficial.`;
}
