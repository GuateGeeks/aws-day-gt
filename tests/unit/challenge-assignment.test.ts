import { describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { migrateChallengePack, selectChallengePack } from "../../shared/challenges/assignment";

describe("Credit challenge assignment", () => {
  it("builds a nine-challenge route without retired stand-code or Cross Level tasks", () => {
    const pack = selectChallengePack(challenges, "new-participant");
    expect(pack).toHaveLength(9);
    expect(pack.map((item) => item.id)).toEqual(expect.arrayContaining(["C08", "C12", "C15"]));
    expect(pack.some((item) => ["C05", "C13"].includes(item.id))).toBe(false);
  });
  it("selects nine distinct challenges with architecture, track and publication", () => {
    for (const uid of ["a", "b", "c", "participant-42"]) {
      const pack = selectChallengePack(challenges, uid);
      expect(pack).toHaveLength(9);
      expect(new Set(pack.map((item) => item.id)).size).toBe(9);
      for (const id of ["C08", "C12", "C15"]) expect(pack.some((item) => item.id === id)).toBe(true);
      expect(pack.some((item) => ["C03", "C05", "C10", "C11", "C13", "C14"].includes(item.id))).toBe(false);
      expect(pack.some((item) => ["C16", "C17"].includes(item.id))).toBe(false);
    }
  });

  it("covers available categories without inserting a replacement challenge", () => {
    for (let index = 0; index < 50; index += 1) {
      const pack = selectChallengePack(challenges, `participant-${index}`);
      const count = (category: string) => pack.filter((item) => item.category === category).length;
      expect(count("CONNECT")).toBe(3);
      expect(count("CLOUD")).toBe(4);
      expect(count("SESSION")).toBe(1);
      expect(count("EXPERIENCE")).toBe(0);
      expect(count("COMMUNITY")).toBe(1);
    }
  });

  it("keeps the valid package when there is no alternate combination", () => {
    const first = selectChallengePack(challenges, "same-user");
    const firstSignature = first.map((item) => item.id).sort().join(",");
    const second = selectChallengePack(challenges, "same-user", new Set([firstSignature]));
    expect(second.map((item) => item.id).sort().join(",")).toBe(firstSignature);
  });

  it("preserves completed current challenges when an old package is migrated", () => {
    const ids = migrateChallengePack(challenges, ["C01", "C02", "C04", "C06", "C07", "C08", "C10", "C11", "C12", "C13"], new Set(["C01", "C07", "C10"]), "migrated-user").map((item) => item.id);
    expect(ids).toHaveLength(9);
    expect(ids).toEqual(expect.arrayContaining(["C01", "C07", "C08", "C12", "C15"]));
    expect(ids).not.toEqual(expect.arrayContaining(["C05", "C10", "C11", "C13"]));
  });

  it("fails clearly if the required Challenge is inactive", () => {
    const pool = challenges.map((item) => item.id === "C15" ? { ...item, active: false } : item);
    expect(() => selectChallengePack(pool, "u1")).toThrow("CHALLENGE_POOL_INCOMPATIBLE");
  });
});
