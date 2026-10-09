import { describe, expect, it } from "vitest";
import { isSubmissionWindowOpen, SUBMISSION_CUTOFF_AT, submissionNoticeState } from "../../shared/submission-window";

describe("challenge submission window", () => {
  it("accepts responses before 4:00 p.m. Guatemala time", () => {
    expect(SUBMISSION_CUTOFF_AT).toBe(Date.parse("2026-10-10T16:00:00-06:00"));
    expect(isSubmissionWindowOpen(new Date("2026-10-10T15:59:59-06:00"))).toBe(true);
  });

  it("closes exactly at 4:00 p.m. Guatemala time", () => {
    expect(isSubmissionWindowOpen(new Date("2026-10-10T16:00:00-06:00"))).toBe(false);
    expect(isSubmissionWindowOpen(new Date("2026-10-10T16:00:01-06:00"))).toBe(false);
  });

  it("only shows a reminder in the final 30 minutes and keeps it separate from simulated event time", () => {
    expect(submissionNoticeState(SUBMISSION_CUTOFF_AT - 30 * 60_000 - 1)).toBe("hidden");
    expect(submissionNoticeState(SUBMISSION_CUTOFF_AT - 30 * 60_000)).toBe("closing");
    expect(submissionNoticeState(SUBMISSION_CUTOFF_AT - 1)).toBe("closing");
    expect(submissionNoticeState(SUBMISSION_CUTOFF_AT)).toBe("closed");
    // Previewing October 10 at 10 a.m. changes the agenda clock, not the delivery cutoff.
    expect(submissionNoticeState(Date.parse("2026-10-10T10:00:00-06:00"))).toBe("hidden");
  });
});
