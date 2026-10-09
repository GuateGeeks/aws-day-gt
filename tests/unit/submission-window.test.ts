import { describe, expect, it } from "vitest";
import { isSubmissionWindowOpen, SUBMISSION_CUTOFF_AT } from "../../shared/submission-window";

describe("challenge submission window", () => {
  it("accepts responses before 4:00 p.m. Guatemala time", () => {
    expect(SUBMISSION_CUTOFF_AT).toBe(Date.parse("2026-10-10T16:00:00-06:00"));
    expect(isSubmissionWindowOpen(new Date("2026-10-10T15:59:59-06:00"))).toBe(true);
  });

  it("closes exactly at 4:00 p.m. Guatemala time", () => {
    expect(isSubmissionWindowOpen(new Date("2026-10-10T16:00:00-06:00"))).toBe(false);
    expect(isSubmissionWindowOpen(new Date("2026-10-10T16:00:01-06:00"))).toBe(false);
  });
});
