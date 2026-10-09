import { describe, expect, it } from "vitest";
import { incorrectAnswerPenalty } from "../../shared/challenges/credit-policy";

describe("incorrect answer credit penalty", () => {
  it("deducts 10 credits for every incorrect AWS knowledge answer", () => {
    expect(incorrectAnswerPenalty({ validationType: "interactive_architecture" })).toBe(10);
    expect(incorrectAnswerPenalty({ validationType: "interactive_sequence" })).toBe(10);
  });

  it("deducts 10 credits for AWS questions and matching", () => {
    expect(incorrectAnswerPenalty({ validationType: "interactive_question" })).toBe(10);
    expect(incorrectAnswerPenalty({ validationType: "interactive_matching" })).toBe(10);
  });
});
