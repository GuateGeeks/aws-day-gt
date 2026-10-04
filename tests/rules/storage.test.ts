import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rules = readFileSync("firebase/storage.rules", "utf8");

describe("Storage evidence boundaries", () => {
  it("binds uploads to the authenticated user path", () => {
    expect(rules).toContain("request.auth.uid == uid");
    expect(rules).toContain("match /evidence/{eventId}/{uid}/{missionId}/{fileName}");
  });

  it("limits upload size and image MIME types", () => {
    expect(rules).toContain("request.resource.size <= 1572864");
    expect(rules).toContain("image/(webp|jpeg|png)");
  });

  it("prevents client updates and deletes", () => {
    expect(rules).toContain("allow update, delete: if false");
  });
});
