import { describe, expect, it } from "vitest";
import { missions } from "../../scripts/data/missions";
import { missionAnswerKeys } from "../../scripts/data/mission-selections";
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

  it("defines valid public selections and private keys for every non-photo mission", () => {
    const selectable = missions.filter((mission) => mission.evidenceType !== "photo");
    const quizIds = [
      ...Array.from({ length: 11 }, (_, index) => `M${index + 16}`),
      "M28", "M29", "M30", "M31",
      ...Array.from({ length: 12 }, (_, index) => `M${index + 33}`)
    ];
    expect(selectable).toHaveLength(35);
    expect(selectable.filter((mission) => mission.selection?.validationKind === "quiz").map((mission) => mission.id)).toEqual(quizIds);
    for (const mission of selectable) {
      expect(mission.selection?.options.length).toBeGreaterThanOrEqual(4);
      expect(mission.selection?.options.length).toBeLessThanOrEqual(6);
      expect(new Set(mission.selection?.options.map((option) => option.id)).size).toBe(mission.selection?.options.length);
      expect(JSON.stringify(mission)).not.toMatch(/correctOptionIds/u);
    }
    expect(["M17", "M20", "M21", "M39"].every((id) => missions.find((mission) => mission.id === id)?.selection?.mode === "multiple")).toBe(true);
    expect(Object.keys(missionAnswerKeys)).toHaveLength(27);
    for (const [missionId, key] of Object.entries(missionAnswerKeys)) {
      const publicIds = new Set(missions.find((mission) => mission.id === missionId)?.selection?.options.map((option) => option.id));
      expect(key.correctOptionIds.every((id) => publicIds.has(id))).toBe(true);
    }
  });
});
