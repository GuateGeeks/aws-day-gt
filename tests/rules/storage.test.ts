import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rules = readFileSync("firebase/storage.rules", "utf8");

describe("Storage evidence boundaries", () => {
  it("binds uploads to the authenticated user path", () => {
    expect(rules).toContain("request.auth.uid == uid");
    expect(rules).toContain("match /evidence/{eventId}/{uid}/{challengeId}/{fileName}");
    expect(rules).toContain("challengeId in ['C15', 'C16', 'C17']");
  });

  it("limits upload size and image MIME types", () => {
    expect(rules).toContain("request.resource.size <= 1572864");
    expect(rules).toContain("image/(webp|jpeg|png)");
  });

  it("closes photo submissions at 4:00 p.m. Guatemala time on October 10", () => {
    expect(rules).toContain("request.time < timestamp.value(1791669600000)");
  });

  it("prevents client updates and deletes", () => {
    expect(rules).toContain("allow update, delete: if false");
  });
});
