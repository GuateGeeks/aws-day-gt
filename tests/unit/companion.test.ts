import { describe, expect, it } from "vitest";
import { AGENDA, OFFICIAL_AGENDA_URL, ROOMS, sessionDate } from "../../shared/agenda";
import {
  countdownTo,
  findSessionForMission,
  getAgendaSpotlight,
  getEventPhase,
  missionTiming,
  nextAgendaReminder,
  nextSessions,
  pickChallenge,
  quetziLine,
  quetziStage,
  sessionsAt
} from "../../shared/companion";
import { missions } from "../../scripts/data/missions";

const at = (time: string) => sessionDate(time);

describe("agenda integrity", () => {
  it("uses unique ids and valid time ranges", () => {
    expect(new Set(AGENDA.map((session) => session.id)).size).toBe(AGENDA.length);
    for (const session of AGENDA) expect(session.start < session.end).toBe(true);
  });

  it("maps every session-bound mission to an official session", () => {
    const sessionMissions = missions.filter((mission) => mission.slot);
    expect(sessionMissions.length).toBeGreaterThan(0);
    for (const mission of sessionMissions) {
      const session = findSessionForMission(mission);
      expect(session, mission.id).toBeDefined();
      expect(ROOMS[session!.room].short).toBe(mission.room);
    }
  });
});

describe("event clock", () => {
  it("previews registration before the event and uses the real schedule on event day", () => {
    const preview = getAgendaSpotlight(new Date("2026-10-07T18:00:00-06:00"));
    expect(preview.status).toBe("preview");
    expect(preview.sessions.map((session) => session.title)).toEqual(["Registro"]);
    const liveRegistration = getAgendaSpotlight(at("07:45"));
    expect(liveRegistration.status).toBe("live");
    expect(liveRegistration.sessions.map((session) => session.title)).toEqual(["Registro"]);
    const liveTalks = getAgendaSpotlight(at("10:00"));
    expect(liveTalks.status).toBe("live");
    expect(liveTalks.sessions.some((session) => session.title === "The Event Happened Twice")).toBe(true);
    const withWorkshop = getAgendaSpotlight(at("11:04"));
    expect(withWorkshop.sessions[0]?.start).toBe("10:45");
    expect(withWorkshop.sessions.some((session) => session.title === "Workshop práctico")).toBe(true);
  });
  it("points to the official agenda", () => {
    expect(OFFICIAL_AGENDA_URL).toBe("https://awscommunitygt.com/agenda/");
  });

  it("detects pre, live and post phases in Guatemala time", () => {
    expect(getEventPhase(new Date("2026-10-09T20:00:00-06:00"))).toBe("pre");
    expect(getEventPhase(at("07:30"))).toBe("live");
    expect(getEventPhase(at("16:10"))).toBe("live");
    expect(getEventPhase(new Date("2026-10-10T22:00:00-06:00"))).toBe("post");
  });

  it("lists sessions running now and the next slot", () => {
    const now = sessionsAt(at("10:00"));
    expect(now.map((session) => session.room)).toContain("tajumulco");
    expect(now.find((session) => session.room === "lab")?.title).toBe("Workshop práctico");
    const next = nextSessions(at("10:00"));
    expect(new Set(next.map((session) => session.start))).toEqual(new Set(["10:45"]));
    expect(next).toHaveLength(6);
  });

  it("returns empty next sessions after the agenda ends", () => {
    expect(nextSessions(new Date("2026-10-10T21:00:00-06:00"))).toEqual([]);
  });

  it("announces each upcoming block only in its five-minute window", () => {
    expect(nextAgendaReminder(at("08:24"))).toBeUndefined();
    expect(nextAgendaReminder(at("08:25"))).toMatchObject({ key: "2026-10-10-08:30", start: "08:30", minutes: 5 });
    expect(nextAgendaReminder(at("08:26"))?.minutes).toBe(4);
    expect(nextAgendaReminder(at("08:25"))?.sessions.length).toBeGreaterThan(0);
    expect(nextAgendaReminder(at("08:30"))).toBeUndefined();
    expect(nextAgendaReminder(at("10:40"))).toMatchObject({ key: "2026-10-10-10:45", start: "10:45" });
  });

  it("counts down to registration", () => {
    expect(countdownTo(new Date("2026-10-08T07:00:00-06:00"), at("07:30"))).toEqual({ days: 2, hours: 0, minutes: 30, totalMinutes: 2910 });
    expect(countdownTo(at("08:00"), at("07:30")).totalMinutes).toBe(0);
  });
});

describe("mission timing", () => {
  it("tells whether a mission session is happening now or next", () => {
    expect(missionTiming({ slot: "09:50", room: "Tacaná" }, at("10:00"))).toBe("now");
    expect(missionTiming({ slot: "10:45", room: "Tacaná" }, at("10:00"))).toBe("next");
    expect(missionTiming({ slot: "14:10", room: "Tacaná" }, at("10:00"))).toBeUndefined();
    expect(missionTiming({}, at("10:00"))).toBeUndefined();
  });
});

describe("Geek energy", () => {
  it("gains energy as challenges are completed", () => {
    expect(quetziStage(0)).toMatchObject({ level: 0, name: "Primer pulso", nextAt: 1 });
    expect(quetziStage(2)).toMatchObject({ level: 1, name: "Conexión activa", nextAt: 4 });
    expect(quetziStage(5)).toMatchObject({ level: 2, nextAt: 8 });
    expect(quetziStage(9)).toMatchObject({ level: 3, nextAt: 10 });
    expect(quetziStage(10)).toMatchObject({ level: 4, name: "Núcleo radiante", nextAt: undefined });
    expect(quetziStage(11)).toMatchObject({ level: 4, name: "Núcleo radiante", nextAt: undefined });
    expect(quetziStage(30).level).toBe(4);
  });
});

describe("challenge picker", () => {
  const base = { evidenceType: "comment" as const, points: 10 };
  const items = [
    { missionId: "M01", status: "approved" as const, mission: { ...base, slot: undefined, room: undefined } },
    { missionId: "M02", status: "available" as const, mission: { ...base, slot: undefined, room: undefined } },
    { missionId: "M19", status: "available" as const, mission: { ...base, slot: "10:45", room: "Tajumulco" } },
    { missionId: "M16", status: "available" as const, mission: { ...base, slot: "09:50", room: "Tajumulco" } }
  ];

  it("prioritises missions for the session happening now", () => {
    expect(pickChallenge(items, at("10:00"))?.missionId).toBe("M16");
  });

  it("then the upcoming session, then general missions", () => {
    expect(pickChallenge(items, at("10:42"))?.missionId).toBe("M19");
    expect(pickChallenge(items, at("18:00"))?.missionId).toBe("M02");
  });

  it("returns undefined when nothing is available", () => {
    expect(pickChallenge(items.slice(0, 1), at("10:00"))).toBeUndefined();
  });
});

describe("Quetzi lines", () => {
  it("greets by phase and context", () => {
    expect(quetziLine({ phase: "pre", alias: "ana", now: new Date("2026-10-08T07:00:00-06:00") })).toMatch(/ana/);
    expect(quetziLine({ phase: "live", alias: "ana", now: at("13:30") })).toMatch(/almuerzo/i);
    expect(quetziLine({ phase: "post", alias: "ana", now: new Date("2026-10-11T09:00:00-06:00") })).toMatch(/gracias/i);
  });
});
