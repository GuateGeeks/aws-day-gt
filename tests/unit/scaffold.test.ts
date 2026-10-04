import { describe, expect, it } from "vitest";

describe("project scaffold", () => {
  it("loads the shared event identifier", async () => {
    const { EVENT_ID } = await import("../../shared/constants");
    expect(EVENT_ID).toBe("aws-community-day-gt-2026");
  });
});
