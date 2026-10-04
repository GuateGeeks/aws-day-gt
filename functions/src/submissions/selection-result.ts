import type { Mission, MissionAnswerKey } from "../../../shared/types";
import { evaluateSelection } from "../../../shared/selection";

export function resolveMissionSelection(mission: Mission, selectionIds: string[], answerKey: MissionAnswerKey | undefined, attemptsUsed: number) {
  if (!mission.selection) throw new Error("MISSING_SELECTION_CONFIG");
  if (mission.selection.validationKind === "quiz" && !answerKey) throw new Error("MISSING_ANSWER_KEY");
  const outcome = evaluateSelection(mission.selection, selectionIds, answerKey?.correctOptionIds ?? [], attemptsUsed);
  const labelsById = new Map(mission.selection.options.map((option) => [option.id, option.label]));
  return { ...outcome, labels: outcome.selectionIds.map((id) => labelsById.get(id)!) };
}
