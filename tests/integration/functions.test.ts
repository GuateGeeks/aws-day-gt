import { describe, expect, it } from "vitest";
import { applyApprovedMission } from "../../functions/src/scoring/calculate";
import { isAllowedRole } from "../../functions/src/shared/auth";
import { resolveMissionSelection } from "../../functions/src/submissions/selection-result";
import { missionAnswerKeys } from "../../scripts/data/mission-selections";
import { missions } from "../../scripts/data/missions";

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

describe("authoritative selection transitions", () => {
  const mission = (id: string) => missions.find((entry) => entry.id === id)!;

  it("approves exact quiz answers on either attempt and snapshots labels", () => {
    expect(resolveMissionSelection(mission("M21"), ["o4", "o3", "o2", "o1"], missionAnswerKeys.M21, 1)).toMatchObject({ status: "approved", attemptsUsed: 1, labels: ["Lambda", "SNS", "SQS", "Step Functions"] });
  });

  it("uses two attempts before failing a quiz", () => {
    expect(resolveMissionSelection(mission("M16"), ["o2"], missionAnswerKeys.M16, 0)).toMatchObject({ status: "incorrect", attemptsUsed: 1, attemptsRemaining: 1 });
    expect(resolveMissionSelection(mission("M16"), ["o2"], missionAnswerKeys.M16, 1)).toMatchObject({ status: "failed", attemptsUsed: 2, attemptsRemaining: 0 });
  });

  it("accepts configured opinions and fails closed without a quiz key", () => {
    expect(resolveMissionSelection(mission("M45"), ["o3"], undefined, 0)).toMatchObject({ status: "approved", labels: ["Intenso"] });
    expect(() => resolveMissionSelection(mission("M16"), ["o1"], undefined, 0)).toThrowError("MISSING_ANSWER_KEY");
  });
});
