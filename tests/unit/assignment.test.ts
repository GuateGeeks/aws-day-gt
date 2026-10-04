import { describe, expect, it } from "vitest";
import { selectMissionPack } from "../../shared/assignment";
import { missions } from "../../scripts/data/missions";

describe("mission assignment", () => {
  it("assigns 2 photos, 5 comments, and 4 words for 100 points", () => {
    const pack = selectMissionPack({ missions, interests: ["IA & Agentes"], seed: "uid-1" });
    expect(pack.filter((mission) => mission.evidenceType === "photo")).toHaveLength(2);
    expect(pack.filter((mission) => mission.evidenceType === "comment")).toHaveLength(5);
    expect(pack.filter((mission) => mission.evidenceType === "word")).toHaveLength(4);
    expect(pack.reduce((sum, mission) => sum + mission.points, 0)).toBe(100);
  });

  it("is deterministic for the same user seed", () => {
    const first = selectMissionPack({ missions, interests: ["Seguridad"], seed: "same-user" });
    const second = selectMissionPack({ missions, interests: ["Seguridad"], seed: "same-user" });
    expect(second.map((mission) => mission.id)).toEqual(first.map((mission) => mission.id));
  });

  it("never assigns two attendance missions in the same slot", () => {
    const pack = selectMissionPack({ missions, interests: [], seed: "uid-2" });
    const slots = pack.flatMap((mission) => mission.requiresAttendance && mission.slot ? [mission.slot] : []);
    expect(new Set(slots).size).toBe(slots.length);
  });

  it("includes general, session, and closing coverage", () => {
    const pack = selectMissionPack({ missions, interests: [], seed: "uid-3" });
    expect(pack.some((mission) => mission.tags.includes("general"))).toBe(true);
    expect(pack.some((mission) => mission.tags.includes("session"))).toBe(true);
    expect(pack.some((mission) => mission.tags.includes("closing"))).toBe(true);
  });
});
