import { describe, expect, it } from "vitest";
import type { MissionSelection } from "../../shared/types";
import { evaluateSelection, validateSelection } from "../../shared/selection";

const singleQuiz: MissionSelection = {
  mode: "single", validationKind: "quiz", minSelections: 1, maxSelections: 1,
  options: [{ id: "o1", label: "Lambda" }, { id: "o2", label: "EC2" }, { id: "o3", label: "S3" }, { id: "o4", label: "RDS" }]
};
const multipleQuiz: MissionSelection = { ...singleQuiz, mode: "multiple", minSelections: 2, maxSelections: 2 };
const opinion: MissionSelection = { ...multipleQuiz, validationKind: "opinion", minSelections: 1, maxSelections: 2 };

describe("selection evidence", () => {
  it("rejects unknown, duplicate, and out-of-range selections", () => {
    expect(() => validateSelection(singleQuiz, ["missing"])).toThrowError("INVALID_SELECTION");
    expect(() => validateSelection(multipleQuiz, ["o1", "o1"])).toThrowError("DUPLICATE_SELECTION");
    expect(() => validateSelection(multipleQuiz, ["o1"])).toThrowError("INVALID_SELECTION_COUNT");
  });

  it("requires the exact quiz answer set", () => {
    expect(evaluateSelection(multipleQuiz, ["o2", "o1"], ["o1", "o2"], 0)).toMatchObject({ status: "approved", selectionIds: ["o1", "o2"], attemptsUsed: 0 });
    expect(evaluateSelection(multipleQuiz, ["o1", "o3"], ["o1", "o2"], 0)).toMatchObject({ status: "incorrect", attemptsUsed: 1, attemptsRemaining: 1 });
    expect(evaluateSelection(multipleQuiz, ["o1", "o3"], ["o1", "o2"], 1)).toMatchObject({ status: "failed", attemptsUsed: 2, attemptsRemaining: 0 });
  });

  it("accepts any configured opinion selection", () => {
    expect(evaluateSelection(opinion, ["o3"], [], 0)).toMatchObject({ status: "approved", selectionIds: ["o3"] });
  });
});
