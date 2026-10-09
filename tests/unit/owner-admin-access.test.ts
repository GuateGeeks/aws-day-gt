import { describe, expect, it } from "vitest";
import { isOwnerAdminIdentity } from "../../functions/src/shared/auth";
import { canOpenAdminConsole } from "../../src/app/RouteGuards";

describe("owner-only administration", () => {
  it("accepts only the configured GuateGeeks admin identity", () => {
    expect(isOwnerAdminIdentity("admin", "guategeeks3d@gmail.com")).toBe(true);
    expect(isOwnerAdminIdentity("moderator", "guategeeks3d@gmail.com")).toBe(false);
    expect(isOwnerAdminIdentity("admin", "another@example.com")).toBe(false);
    expect(canOpenAdminConsole({ role: "admin", email: "GuateGeeks3D@gmail.com" })).toBe(true);
    expect(canOpenAdminConsole({ role: "moderator", email: "guategeeks3d@gmail.com" })).toBe(false);
  });
});
