import type { Challenge } from "./types";

export function incorrectAnswerPenalty(challenge: Pick<Challenge, "validationType">): number {
  return challenge.validationType === "interactive_architecture" || challenge.validationType === "interactive_sequence" ? 20 : 10;
}
