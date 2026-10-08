import { describe, expect, it } from "vitest";
import { incorrectAnswerPenalty } from "../../shared/challenges/credit-policy";

describe("incorrect answer credit penalty", () => {
  it("deducts 20 credits for architecture and sequence challenges", () => {
    expect(incorrectAnswerPenalty({ validationType: "interactive_architecture" })).toBe(20);
    expect(incorrectAnswerPenalty({ validationType: "interactive_sequence" })).toBe(20);
  });

  it("deducts 10 credits for AWS questions and matching", () => {
    expect(incorrectAnswerPenalty({ validationType: "interactive_question" })).toBe(10);
    expect(incorrectAnswerPenalty({ validationType: "interactive_matching" })).toBe(10);
  });
});
