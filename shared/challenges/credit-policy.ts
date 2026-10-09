import type { Challenge } from "./types";

export function incorrectAnswerPenalty(_challenge: Pick<Challenge, "validationType">): number {
  return 10;
}
