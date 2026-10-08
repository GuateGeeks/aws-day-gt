import type { Challenge, ChallengeCategory } from "./types";
import { isBonusPhotoChallengeId } from "./photo";
import { isAwsServiceChallengeId } from "./bonus";

type Pattern = Record<ChallengeCategory, number>;

const patterns: Pattern[] = [
  { CONNECT: 3, CLOUD: 4, SESSION: 1, EXPERIENCE: 0, COMMUNITY: 1 }
];

const categories: ChallengeCategory[] = ["CONNECT", "CLOUD", "SESSION", "EXPERIENCE", "COMMUNITY"];

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function challengePackSignature(pack: Challenge[]): string {
  return pack.map((item) => item.id).sort().join(",");
}

export function selectChallengePack(pool: Challenge[], seed: string, recentSignatures: ReadonlySet<string> = new Set()): Challenge[] {
  const active = pool.filter((item) => item.active && !["C03", "C05", "C10", "C11", "C13", "C14"].includes(item.id) && !isBonusPhotoChallengeId(item.id) && !isAwsServiceChallengeId(item.id));
  const required = ["C08", "C12", "C15"].map((id) => active.find((item) => item.id === id));
  if (required.some((item) => !item) || required.some((item) => !item?.required)) throw new Error("CHALLENGE_POOL_INCOMPATIBLE");
  const requiredChallenges = required as Challenge[];
  const optional = active.filter((item) => !requiredChallenges.some((entry) => entry.id === item.id));
  const orderedPatterns = [...patterns].sort((a, b) => hash(`${seed}:${patterns.indexOf(a)}`) - hash(`${seed}:${patterns.indexOf(b)}`));
  let fallback: Challenge[] | undefined;

  for (let salt = 0; salt < 24; salt += 1) {
    for (const pattern of orderedPatterns) {
      const selected = [...requiredChallenges];
      for (const category of categories) {
        const choices = optional.filter((item) => item.category === category)
          .sort((a, b) => hash(`${seed}:${salt}:${category}:${a.id}`) - hash(`${seed}:${salt}:${category}:${b.id}`));
        const chosen = choices.slice(0, pattern[category] - selected.filter((item) => item.category === category).length);
        selected.push(...chosen);
      }
      if (selected.length !== 9 || new Set(selected.map((item) => item.id)).size !== 9) continue;
      fallback ??= selected;
      if (!recentSignatures.has(challengePackSignature(selected))) return selected;
    }
  }
  if (fallback) return fallback;
  throw new Error("CHALLENGE_POOL_INCOMPATIBLE");
}

/** Keep completed, still-active challenges visible when an older pack is updated. */
export function migrateChallengePack(pool: Challenge[], currentIds: string[], completedIds: ReadonlySet<string>, seed: string): Challenge[] {
  const fresh = selectChallengePack(pool, seed);
  const eligible = new Map(pool.filter((item) => item.active && !["C03", "C05", "C10", "C11", "C13", "C14"].includes(item.id) && !isBonusPhotoChallengeId(item.id) && !isAwsServiceChallengeId(item.id)).map((item) => [item.id, item]));
  const required = fresh.filter((item) => item.required);
  const chosen = [...required];
  const add = (id: string) => {
    const challenge = eligible.get(id);
    if (challenge && chosen.length < 9 && !chosen.some((item) => item.id === id)) chosen.push(challenge);
  };
  currentIds.filter((id) => completedIds.has(id)).forEach(add);
  fresh.forEach((item) => add(item.id));
  currentIds.forEach(add);
  if (chosen.length !== 9) throw new Error("CHALLENGE_POOL_INCOMPATIBLE");
  return chosen;
}
