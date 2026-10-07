export const BONUS_PHOTO_CHALLENGE_IDS = ["C16", "C17"] as const;
export const PHOTO_CHALLENGE_IDS = ["C15", ...BONUS_PHOTO_CHALLENGE_IDS] as const;

export function isBonusPhotoChallengeId(id: string): id is typeof BONUS_PHOTO_CHALLENGE_IDS[number] {
  return BONUS_PHOTO_CHALLENGE_IDS.some((value) => value === id);
}

export function isPhotoChallengeId(id: string): id is typeof PHOTO_CHALLENGE_IDS[number] {
  return PHOTO_CHALLENGE_IDS.some((value) => value === id);
}
