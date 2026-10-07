import { describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { selectChallengePack } from "../../shared/challenges/assignment";

describe("Aura Challenge assignment", () => {
  it("selects exactly ten distinct Challenges with Enter The Cloud in every pack", () => {
    for (const uid of ["a", "b", "c", "participant-42"]) {
      const pack = selectChallengePack(challenges, uid);
      expect(pack).toHaveLength(10);
      expect(new Set(pack.map((item) => item.id)).size).toBe(10);
      for (const id of ["C08", "C10", "C11", "C12", "C13"]) expect(pack.some((item) => item.id === id)).toBe(true);
      expect(pack.some((item) => ["C16", "C17"].includes(item.id))).toBe(false);
    }
  });

  it("balances categories while varying packs across participants", () => {
    const signatures = new Set<string>();
    for (let index = 0; index < 50; index += 1) {
      const pack = selectChallengePack(challenges, `participant-${index}`);
      const count = (category: string) => pack.filter((item) => item.category === category).length;
      expect(count("CONNECT")).toBeGreaterThanOrEqual(2);
      expect(count("CONNECT")).toBeLessThanOrEqual(4);
      expect(count("CLOUD")).toBeGreaterThanOrEqual(2);
      expect(count("CLOUD")).toBeLessThanOrEqual(3);
      expect(count("SESSION")).toBe(3);
      expect(count("EXPERIENCE")).toBeGreaterThanOrEqual(1);
      expect(count("EXPERIENCE")).toBeLessThanOrEqual(2);
      expect(count("COMMUNITY")).toBeLessThanOrEqual(1);
      signatures.add(pack.map((item) => item.id).sort().join(","));
    }
    expect(signatures.size).toBeGreaterThan(10);
  });

  it("avoids a recently assigned combination when another is available", () => {
    const first = selectChallengePack(challenges, "same-user");
    const firstSignature = first.map((item) => item.id).sort().join(",");
    const second = selectChallengePack(challenges, "same-user", new Set([firstSignature]));
    expect(second.map((item) => item.id).sort().join(",")).not.toBe(firstSignature);
  });

  it("always includes the independent workshop and talk Challenges", () => {
    for (let index = 0; index < 100; index += 1) {
      const ids = selectChallengePack(challenges, `session-${index}`).map((item) => item.id);
      if (ids.includes("C11")) expect(ids).toContain("C10");
    }
  });

  it("fails clearly if the required Challenge is inactive", () => {
    const pool = challenges.map((item) => item.id === "C13" ? { ...item, active: false } : item);
    expect(() => selectChallengePack(pool, "u1")).toThrow("CHALLENGE_POOL_INCOMPATIBLE");
  });
});
