import { describe, expect, it } from "vitest";
import { applyApprovedMission } from "../../functions/src/scoring/calculate";
import { isAllowedRole } from "../../functions/src/shared/auth";

describe("authoritative score transitions", () => {
  it("adds one approved word mission", () => {
    const updated = applyApprovedMission({
      userId: "u1",
      eventId: "aws-community-day-gt-2026",
      alias: "cloudquetzal",
      totalPoints: 0,
      completedMissions: 0,
      photoMissions: 0,
      commentMissions: 0,
      wordMissions: 0,
      updatedAt: "before"
    }, "word", 5, "2026-10-10T15:30:00.000Z");
    expect(updated).toMatchObject({ totalPoints: 5, completedMissions: 1, wordMissions: 1 });
  });

  it("records when 100 points is first reached", () => {
    const updated = applyApprovedMission({
      userId: "u1", eventId: "e", alias: "a", totalPoints: 90, completedMissions: 9,
      photoMissions: 1, commentMissions: 5, wordMissions: 3, updatedAt: "before"
    }, "comment", 10, "2026-10-10T16:00:00.000Z");
    expect(updated.finalScoreReachedAt).toBe("2026-10-10T16:00:00.000Z");
  });
});

describe("role authorization", () => {
  it("permits admins where moderators are accepted, but never participants", () => {
    expect(isAllowedRole("admin", ["moderator", "admin"])).toBe(true);
    expect(isAllowedRole("participant", ["moderator", "admin"])).toBe(false);
  });
});
