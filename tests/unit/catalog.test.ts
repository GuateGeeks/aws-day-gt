import { describe, expect, it } from "vitest";
import { missions } from "../../scripts/data/missions";
import { missionSchema } from "../../shared/schemas";

describe("mission catalog", () => {
  it("contains every stable mission id exactly once", () => {
    expect(missions).toHaveLength(50);
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(50);
    expect(missions.map((mission) => mission.id)).toEqual(
      Array.from({ length: 50 }, (_, index) => `M${String(index + 1).padStart(2, "0")}`),
    );
  });

  it("passes the mission schema and point invariants", () => {
    expect(() => missions.forEach((mission) => missionSchema.parse(mission))).not.toThrow();
    expect(missions.filter((mission) => mission.evidenceType === "photo")).toHaveLength(15);
    expect(missions.filter((mission) => mission.evidenceType === "comment")).toHaveLength(20);
    expect(missions.filter((mission) => mission.evidenceType === "word")).toHaveLength(15);
  });
});
