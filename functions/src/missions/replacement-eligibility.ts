export function isReplacementEligible(assignment: { status?: unknown; attemptsUsed?: unknown }): boolean {
  return assignment.status === "available" || (assignment.status === "failed" && assignment.attemptsUsed === 2);
}
