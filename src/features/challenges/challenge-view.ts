import { isBonusPhotoChallengeId } from "../../../shared/challenges/photo";
import { isAwsServiceChallengeId } from "../../../shared/challenges/bonus";
import type { AssignedChallenge } from "./useChallenges";

function orderKey(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function orderChallengesForUser<T extends Pick<AssignedChallenge, "challenge">>(items: T[], userId: string): T[] {
  const pending = [...items].sort((a, b) => orderKey(`${userId}:${a.challenge.id}`) - orderKey(`${userId}:${b.challenge.id}`));
  const result: T[] = [];
  while (pending.length) {
    const previous = result.at(-1)?.challenge.category;
    const availableCategories = [...new Set(pending.map((item) => item.challenge.category))];
    const alternatives = availableCategories.filter((category) => category !== previous);
    const options = alternatives.length ? alternatives : availableCategories;
    options.sort((a, b) =>
      pending.filter((item) => item.challenge.category === b).length - pending.filter((item) => item.challenge.category === a).length ||
      orderKey(`${userId}:${result.length}:${a}`) - orderKey(`${userId}:${result.length}:${b}`)
    );
    const index = pending.findIndex((item) => item.challenge.category === options[0]);
    result.push(pending.splice(index, 1)[0]!);
  }
  return result;
}

export function challengeSummary(items: AssignedChallenge[]) {
  const main = items.filter(({ challenge }) => !isBonusPhotoChallengeId(challenge.id) && !isAwsServiceChallengeId(challenge.id));
  const awsBonus = items.filter(({ challenge }) => isAwsServiceChallengeId(challenge.id));
  const selfies = items.filter(({ challenge }) => isBonusPhotoChallengeId(challenge.id));
  return {
    main,
    awsBonus,
    selfies,
    mainCompleted: main.filter(({ progress }) => progress.status === "completed").length,
    bonusCompleted: awsBonus.filter(({ progress }) => progress.status === "completed").length,
    selfieCompleted: selfies.filter(({ progress }) => progress.status === "completed").length,
    totalCompleted: items.filter(({ progress }) => progress.status === "completed").length,
    aura: items.reduce((sum, { progress }) => sum + (progress.auraAwarded ?? 0) - (progress.auraDeducted ?? 0), 0),
    auraPotential: items.reduce((sum, { challenge, progress }) => sum + (challenge.active && ["available", "in_progress", "rejected"].includes(progress.status) ? challenge.auraReward : 0), 0),
    auraInReview: items.reduce((sum, { challenge, progress }) => sum + (progress.status === "processing" ? challenge.auraReward : 0), 0)
  };
}

export function nextAvailableChallenge(items: AssignedChallenge[], currentId?: string) {
  return items.find(({ challenge, progress }) => challenge.id !== currentId && challenge.active && (progress.status === "available" || progress.status === "in_progress" || progress.status === "rejected"));
}
