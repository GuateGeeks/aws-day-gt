import { AGENDA, ROOMS, sessionDate, type AgendaSession } from "./agenda";
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

export function quetziFact(index: number): string {
  return QUETZI_FACTS[index % QUETZI_FACTS.length] ?? "";
}

export type CurrentMomentKind = "pre" | "registration" | "plenary" | "sessions" | "meal" | "closing" | "social" | "between" | "post";

export type CurrentMissionCandidate = {
  missionId: string;
  status: string;
  points: number;
  mission: { title: string; slot?: string; room?: string };
};

export type CurrentMoment<T extends CurrentMissionCandidate> = {
  phase: EventPhase;
  kind: CurrentMomentKind;
  summary: string;
  detail: string;
  loading: boolean;
  mission?: T;
  session?: AgendaSession;
};

type CurrentMomentInput<T extends CurrentMissionCandidate> = {
  now: Date;
  items: readonly T[];
  loading: boolean;
  alias?: string;
};

function named(alias?: string) {
  return alias ? `, ${alias}` : "";
}

export function getCurrentMoment<T extends CurrentMissionCandidate>({ now, items, loading, alias }: CurrentMomentInput<T>): CurrentMoment<T> {
  const phase = getEventPhase(now);
  const name = named(alias);
  if (phase === "pre") {
    const { days, hours } = countdownTo(now, sessionDate(DAY_START));
    const amount = days > 0 ? `${days} ${days === 1 ? "día" : "días"}` : `${hours} ${hours === 1 ? "hora" : "horas"}`;
    return { phase, kind: "pre", summary: `Faltan ${amount}${name}`, detail: "Prepárate para el Community Day y consulta tus charlas en la agenda oficial.", loading: false };
  }
  if (phase === "post") {
    return { phase, kind: "post", summary: `Gracias por volar conmigo${name}`, detail: "El Community Day terminó. Gracias por ser parte de la comunidad AWS de Guatemala.", loading: false };
  }

  const current = sessionsAt(now);
  const special = current.find((session) => session.title === "Registro")
    ?? current.find((session) => session.title === "Almuerzo")
    ?? current.find((session) => session.kind === "social")
    ?? current.find((session) => session.title === "Palabras de cierre" || session.title === "Cierre");

  if (special?.title === "Registro") return { phase, kind: "registration", summary: `Es momento del registro${name}`, detail: "Completa tu ingreso y prepárate para comenzar el día.", loading: false };
  if (special?.title === "Almuerzo") return { phase, kind: "meal", summary: `Es hora del almuerzo${name}`, detail: "Recarga energía y disfruta este espacio con la comunidad.", loading: false };
  if (special?.kind === "social") return { phase, kind: "social", summary: `La cena de la comunidad ya empezó${name}`, detail: "Celebremos lo aprendido y las conexiones de hoy.", loading: false };
  if (special && (special.title === "Palabras de cierre" || special.title === "Cierre")) return { phase, kind: "closing", summary: `Estamos en el cierre${name}`, detail: "Acompaña los últimos momentos del Community Day.", loading: false };
  const [plenary] = current;
  if (plenary && current.every((session) => session.kind === "plenary" || session.kind === "keynote")) {
    return { phase, kind: "plenary", summary: `La comunidad está reunida${name}`, detail: `Ahora: ${plenary.title}.`, loading: false };
  }

  if (!current.length) return { phase, kind: "between", summary: `Estamos entre actividades${name}`, detail: "No hay una actividad identificada en este momento. Consulta la agenda oficial si necesitas orientarte.", loading: false };
  if (loading) return { phase, kind: "sessions", summary: `Hay actividades en curso${name}`, detail: "Estoy buscando si tienes una misión relacionada con este momento…", loading: true };

  const match = items.find((item) => {
    if (item.status !== "available" && item.status !== "rejected") return false;
    const session = findSessionForMission(item.mission);
    return session ? current.some((candidate) => candidate.id === session.id) : false;
  });
  const session = match ? findSessionForMission(match.mission) : undefined;
  if (match && session) {
    return { phase, kind: "sessions", summary: `Tienes una misión para este momento${name}`, detail: `“${session.title}” está ocurriendo ahora en ${ROOMS[session.room].short}.`, loading: false, mission: match, session };
  }
  return { phase, kind: "sessions", summary: `Hay actividades en curso${name}`, detail: "No tienes una misión relacionada con este momento. Disfruta la actividad que elegiste.", loading: false };
}
