import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { challengeSecrets } from "../../scripts/data/challenge-secrets";
import { eventCodeCommitWrites, eventCodeUpdates } from "../../scripts/data/event-code-updates";

describe("private event code deployment", () => {
  it("keeps distributable codes out of the public seed", () => {
    for (const id of ["C13"]) {
      const secret = challengeSecrets.find((item) => item.challengeId === id);
      expect(secret?.sharedCodeHash).toBeUndefined();
    }
  });

  it("writes only private challenge secret paths with normalized hashes", () => {
    const writes = eventCodeUpdates({ C13: "StandExample03" });
    expect(writes.map((item) => item.path)).toEqual(["challengeSecrets/C13"]);
    expect(writes[0]?.data).toEqual({ challengeId: "C13", sharedCodeHash: createHash("sha256").update("STANDEXAMPLE03").digest("hex"), sharedCodeActive: true });
    expect(JSON.stringify(writes)).not.toContain("StandExample03");
  });

  it("rejects a missing code before any write is prepared", () => {
    expect(() => eventCodeUpdates({ C13: "" })).toThrow("EVENT_CODE_REQUIRED");
  });

  it("limits production writes to the VR code fields", () => {
    const writes = eventCodeCommitWrites("aws-day-gt", { C13: "StandExample03" });
    expect(writes).toHaveLength(1);
    expect(writes[0]?.update.name).toBe("projects/aws-day-gt/databases/(default)/documents/challengeSecrets/C13");
    expect(writes[0]?.updateMask.fieldPaths).toEqual(["challengeId", "sharedCodeHash", "sharedCodeActive"]);
    expect(Object.keys(writes[0]?.update.fields ?? {})).toEqual(["challengeId", "sharedCodeHash", "sharedCodeActive"]);
  });
});
