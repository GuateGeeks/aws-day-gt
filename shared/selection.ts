import { DomainError } from "./errors";
import type { MissionSelection } from "./types";

export type SelectionOutcome =
  | { status: "approved"; selectionIds: string[]; attemptsUsed: number; attemptsRemaining: number }
  | { status: "incorrect"; selectionIds: string[]; attemptsUsed: number; attemptsRemaining: 1 }
  | { status: "failed"; selectionIds: string[]; attemptsUsed: 2; attemptsRemaining: 0 };

export function validateSelection(configuration: MissionSelection, selectionIds: string[]): string[] {
  if (!Array.isArray(selectionIds) || selectionIds.some((id) => typeof id !== "string")) throw new DomainError("INVALID_SELECTION");
  if (new Set(selectionIds).size !== selectionIds.length) throw new DomainError("DUPLICATE_SELECTION");
  if (selectionIds.length < configuration.minSelections || selectionIds.length > configuration.maxSelections) throw new DomainError("INVALID_SELECTION_COUNT");
  const allowed = new Set(configuration.options.map((option) => option.id));
  if (selectionIds.some((id) => !allowed.has(id))) throw new DomainError("INVALID_SELECTION");
  return [...selectionIds].sort();
}

export function evaluateSelection(configuration: MissionSelection, selectionIds: string[], correctOptionIds: string[], attemptsUsed: number): SelectionOutcome {
  const normalized = validateSelection(configuration, selectionIds);
  const correct = [...correctOptionIds].sort();
  if (configuration.validationKind === "opinion" || (normalized.length === correct.length && normalized.every((id, index) => id === correct[index]))) {
    return { status: "approved", selectionIds: normalized, attemptsUsed, attemptsRemaining: Math.max(0, 2 - attemptsUsed) };
  }
  const nextAttempts = attemptsUsed + 1;
  return nextAttempts >= 2
    ? { status: "failed", selectionIds: normalized, attemptsUsed: 2, attemptsRemaining: 0 }
    : { status: "incorrect", selectionIds: normalized, attemptsUsed: nextAttempts, attemptsRemaining: 1 };
}
