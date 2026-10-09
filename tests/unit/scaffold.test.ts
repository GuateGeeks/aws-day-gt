import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("project scaffold", () => {
  it("loads the shared event identifier", async () => {
    const { EVENT_ID } = await import("../../shared/constants");
    expect(EVENT_ID).toBe("aws-community-day-gt-2026");
  });

  it("loads heavy participant and administration routes lazily", () => {
    const router = readFileSync("src/app/router.tsx", "utf8");
    expect(router).toContain('lazy(() => import("../features/admin/AdminPage")');
    expect(router).toContain('lazy(() => import("../features/leaderboard/LeaderboardPage")');
    expect(router).not.toContain('import { AdminPage } from "../features/admin/AdminPage"');
  });
});
