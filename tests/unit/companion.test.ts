import { describe, expect, it } from "vitest";
import { AGENDA, ROOMS, sessionDate } from "../../shared/agenda";
import {
  countdownTo,
  findConflicts,
  findSessionForMission,
  getEventPhase,
  isRecommended,
  nextSessions,
  pickChallenge,
  quetziLine,
  quetziStage,
  sessionsAt,
  sortByRecommendation
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

  it("counts down to registration", () => {
    expect(countdownTo(new Date("2026-10-08T07:00:00-06:00"), at("07:30"))).toEqual({ days: 2, hours: 0, minutes: 30, totalMinutes: 2910 });
    expect(countdownTo(at("08:00"), at("07:30")).totalMinutes).toBe(0);
  });
});

describe("recommendations", () => {
  it("maps onboarding interests to agenda tracks", () => {
    const security = AGENDA.find((session) => session.track === "Seguridad")!;
    const serverless = AGENDA.find((session) => session.track === "Arquitectura & Serverless")!;
    expect(isRecommended(security, ["Seguridad"])).toBe(true);
    expect(isRecommended(serverless, ["Serverless"])).toBe(true);
    expect(isRecommended(serverless, ["Seguridad"])).toBe(false);
  });

  it("puts recommended sessions first without mutating input", () => {
    const slot = sessionsAt(at("10:50"));
    const copy = [...slot];
    const sorted = sortByRecommendation(slot, ["Seguridad"]);
    expect(sorted[0]?.track).toBe("Seguridad");
    expect(slot).toEqual(copy);
  });

  it("flags overlapping picks as conflicts", () => {
    expect(findConflicts(["0950-tacana", "0950-acatenango"])).toHaveLength(1);
    expect(findConflicts(["0950-tacana", "1045-tacana"])).toHaveLength(0);
    expect(findConflicts(["1000-lab", "1140-tacana"])).toHaveLength(1);
  });
});

describe("Quetzi evolution", () => {
  it("evolves from egg to resplendent quetzal", () => {
    expect(quetziStage(0)).toMatchObject({ level: 0, name: "Huevo", nextAt: 1 });
    expect(quetziStage(2)).toMatchObject({ level: 1, name: "Polluelo", nextAt: 4 });
    expect(quetziStage(5)).toMatchObject({ level: 2, nextAt: 8 });
    expect(quetziStage(9)).toMatchObject({ level: 3, nextAt: 11 });
    expect(quetziStage(11)).toMatchObject({ level: 4, name: "Quetzal resplandeciente", nextAt: undefined });
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
