import type { Challenge, ChallengeCategory } from "./types";
import { isBonusPhotoChallengeId } from "./photo";
import { isAwsServiceChallengeId } from "./bonus";

type Pattern = Record<ChallengeCategory, number>;

const patterns: Pattern[] = [
  { CONNECT: 3, CLOUD: 2, SESSION: 3, EXPERIENCE: 1, COMMUNITY: 1 },
  { CONNECT: 2, CLOUD: 3, SESSION: 3, EXPERIENCE: 1, COMMUNITY: 1 },
  { CONNECT: 3, CLOUD: 3, SESSION: 3, EXPERIENCE: 1, COMMUNITY: 0 },
  { CONNECT: 4, CLOUD: 2, SESSION: 3, EXPERIENCE: 1, COMMUNITY: 0 }
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
  const active = pool.filter((item) => item.active && item.id !== "C03" && !isBonusPhotoChallengeId(item.id) && !isAwsServiceChallengeId(item.id));
  const required = ["C08", "C10", "C11", "C12", "C13"].map((id) => active.find((item) => item.id === id));
  if (required.some((item) => !item) || !required[4]?.required) throw new Error("CHALLENGE_POOL_INCOMPATIBLE");
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
      if (selected.length !== 10 || new Set(selected.map((item) => item.id)).size !== 10) continue;
      fallback ??= selected;
      if (!recentSignatures.has(challengePackSignature(selected))) return selected;
    }
  }
  if (fallback) return fallback;
  throw new Error("CHALLENGE_POOL_INCOMPATIBLE");
}
