import { describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { migrateChallengePack, selectChallengePack } from "../../shared/challenges/assignment";

describe("Credit challenge assignment", () => {
  it("selects ten distinct challenges with VR, architecture, track and publication", () => {
    for (const uid of ["a", "b", "c", "participant-42"]) {
      const pack = selectChallengePack(challenges, uid);
      expect(pack).toHaveLength(10);
      expect(new Set(pack.map((item) => item.id)).size).toBe(10);
      for (const id of ["C08", "C12", "C13", "C15"]) expect(pack.some((item) => item.id === id)).toBe(true);
      expect(pack.some((item) => ["C03", "C10", "C11", "C14"].includes(item.id))).toBe(false);
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
      expect(count("CLOUD")).toBeGreaterThanOrEqual(3);
      expect(count("CLOUD")).toBeLessThanOrEqual(4);
      expect(count("SESSION")).toBe(1);
      expect(count("EXPERIENCE")).toBe(1);
      expect(count("COMMUNITY")).toBe(1);
      signatures.add(pack.map((item) => item.id).sort().join(","));
    }
    expect(signatures.size).toBeGreaterThan(4);
  });

  it("avoids a recently assigned combination when another is available", () => {
    const first = selectChallengePack(challenges, "same-user");
    const firstSignature = first.map((item) => item.id).sort().join(",");
    const second = selectChallengePack(challenges, "same-user", new Set([firstSignature]));
    expect(second.map((item) => item.id).sort().join(",")).not.toBe(firstSignature);
  });

  it("preserves completed current challenges when an old package is migrated", () => {
    const ids = migrateChallengePack(challenges, ["C01", "C02", "C04", "C06", "C07", "C08", "C10", "C11", "C12", "C13"], new Set(["C01", "C07", "C10"]), "migrated-user").map((item) => item.id);
    expect(ids).toHaveLength(10);
    expect(ids).toEqual(expect.arrayContaining(["C01", "C07", "C08", "C12", "C13", "C15"]));
    expect(ids).not.toEqual(expect.arrayContaining(["C10", "C11"]));
  });

  it("fails clearly if the required Challenge is inactive", () => {
    const pool = challenges.map((item) => item.id === "C13" ? { ...item, active: false } : item);
    expect(() => selectChallengePack(pool, "u1")).toThrow("CHALLENGE_POOL_INCOMPATIBLE");
  });
});
