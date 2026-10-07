export const AWS_SERVICE_CHALLENGE_IDS = ["C18", "C19", "C20", "C21", "C22", "C23"] as const;
export const BONUS_CHALLENGE_IDS = ["C16", "C17", ...AWS_SERVICE_CHALLENGE_IDS] as const;

export function isAwsServiceChallengeId(id: string): id is typeof AWS_SERVICE_CHALLENGE_IDS[number] {
  return AWS_SERVICE_CHALLENGE_IDS.some((challengeId) => challengeId === id);
}
