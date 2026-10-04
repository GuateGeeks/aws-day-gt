import type { EvidenceType, Score } from "../../../shared/types";

export function applyApprovedMission(score: Score, type: EvidenceType, points: number, now: string): Score {
  const nextPoints = score.totalPoints + points;
  return {
    ...score,
    totalPoints: nextPoints,
    completedMissions: score.completedMissions + 1,
    photoMissions: score.photoMissions + (type === "photo" ? 1 : 0),
    commentMissions: score.commentMissions + (type === "comment" ? 1 : 0),
    wordMissions: score.wordMissions + (type === "word" ? 1 : 0),
    finalScoreReachedAt: score.finalScoreReachedAt ?? (nextPoints >= 100 ? now : undefined),
    updatedAt: now
  };
}
