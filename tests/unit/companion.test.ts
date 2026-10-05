import { describe, expect, it } from "vitest";
import { AGENDA, OFFICIAL_AGENDA_URL, ROOMS, sessionDate } from "../../shared/agenda";
import {
  countdownTo,
  findSessionForMission,
  getCurrentMoment,
  getEventPhase,
  missionTiming,
  nextSessions,
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

describe("current moment", () => {
  const base = { evidenceType: "comment" as const, points: 10 };
  const items = [
    { missionId: "M01", status: "available" as const, points: 15, mission: { title: "Llegué", slot: undefined, room: undefined } },
    { missionId: "M16", status: "available" as const, points: 10, mission: { ...base, title: "Talento + IA", slot: "09:50", room: "Tajumulco" } },
    { missionId: "M19", status: "available" as const, points: 10, mission: { ...base, title: "Pregúntale a los datos", slot: "10:45", room: "Tajumulco" } }
  ] as const;

  it("offers only an actionable mission tied to a session running now", () => {
    const moment = getCurrentMoment({ now: at("10:00"), alias: "ana", items, loading: false });
    expect(moment).toMatchObject({ phase: "live", kind: "sessions", loading: false });
    expect(moment.mission?.missionId).toBe("M16");
    expect(moment.session?.title).toBe("Transformando el talento con AWS e IA: del temor a la ventaja");
    expect(moment.summary).toMatch(/momento/i);
    expect(moment.detail).toMatch(/Tajumulco/);
  });

  it("never substitutes a future or general mission", () => {
    const moment = getCurrentMoment({ now: at("10:42"), items: [items[0], items[2]], loading: false });
    expect(moment.mission).toBeUndefined();
    expect(moment.detail).toMatch(/no tienes una misión relacionada/i);
  });

  it("allows a rejected mission but excludes non-actionable statuses", () => {
    const rejected = { ...items[1], status: "rejected" as const };
    const submitted = { ...items[1], status: "submitted" as const };
    expect(getCurrentMoment({ now: at("10:00"), items: [rejected], loading: false }).mission?.missionId).toBe("M16");
    expect(getCurrentMoment({ now: at("10:00"), items: [submitted], loading: false }).mission).toBeUndefined();
  });

  it("keeps loading distinct from having no related mission", () => {
    const loading = getCurrentMoment({ now: at("10:00"), items: [], loading: true });
    expect(loading.loading).toBe(true);
    expect(loading.detail).toMatch(/buscando/i);
    expect(loading.detail).not.toMatch(/no tienes/i);
  });

  it.each([
    ["07:45", "registration", /registro/i],
    ["08:40", "plenary", /comunidad/i],
    ["13:30", "meal", /almuerzo/i],
    ["17:05", "closing", /cierre/i],
    ["20:30", "social", /cena/i]
  ] as const)("describes the %s event moment", (time, kind, copy) => {
    const moment = getCurrentMoment({ now: at(time), alias: "ana", items: [], loading: false });
    expect(moment.kind).toBe(kind);
    expect(moment.summary).toMatch(copy);
    expect(moment.mission).toBeUndefined();
  });

  it("handles pre-event, gaps and post-event without inventing details", () => {
    expect(getCurrentMoment({ now: new Date("2026-10-08T09:00:00-06:00"), items: [], loading: false })).toMatchObject({ phase: "pre", kind: "pre" });
    const gap = getCurrentMoment({ now: at("09:45"), items: items.slice(0, 1), loading: false });
    expect(gap).toMatchObject({ phase: "live", kind: "between" });
    expect(gap.mission).toBeUndefined();
    expect(gap.detail).not.toMatch(/Tajumulco|Tacaná/);
    expect(getCurrentMoment({ now: new Date("2026-10-10T22:00:00-06:00"), items: [], loading: false })).toMatchObject({ phase: "post", kind: "post" });
  });
});
