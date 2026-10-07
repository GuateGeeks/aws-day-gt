import { describe, expect, it } from "vitest";
import { authAlreadyInitialized } from "../../scripts/data/auth-initialization";

describe("existing Firebase Authentication setup", () => {
  it("accepts the response from an already-enabled Identity Platform project", () => {
    expect(authAlreadyInitialized(400, '{"error":{"message":"INVALID_PROJECT_ID : Identity Platform has already been enabled for this project."}}')).toBe(true);
  });

  it("does not hide unrelated project configuration errors", () => {
    expect(authAlreadyInitialized(400, '{"error":{"message":"INVALID_PROJECT_ID : Project not found."}}')).toBe(false);
  });
});
