import type { EvidenceType, Mission } from "./types";

type AssignmentInput = { missions: Mission[]; interests: string[]; seed: string };

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function ranked(candidates: Mission[], interests: Set<string>, seed: string): Mission[] {
  return [...candidates].sort((left, right) => {
    const leftInterest = interests.has(left.category) ? 1 : 0;
    const rightInterest = interests.has(right.category) ? 1 : 0;
    if (leftInterest !== rightInterest) return rightInterest - leftInterest;
    return hash(`${seed}:${left.id}`) - hash(`${seed}:${right.id}`);
  });
}

export function selectMissionPack({ missions, interests, seed }: AssignmentInput): Mission[] {
  const active = missions.filter((mission) => mission.active);
  const interestSet = new Set(interests);
  const selected: Mission[] = [];
  const slots = new Set<string>();
  const counts: Record<EvidenceType, number> = { photo: 0, comment: 0, word: 0 };
  const targets: Record<EvidenceType, number> = { photo: 2, comment: 5, word: 4 };

  const canAdd = (mission: Mission) =>
    !selected.some((item) => item.id === mission.id) &&
    counts[mission.evidenceType] < targets[mission.evidenceType] &&
    !(mission.requiresAttendance && mission.slot && slots.has(mission.slot));

  const add = (mission: Mission | undefined) => {
    if (!mission || !canAdd(mission)) return false;
    selected.push(mission);
    counts[mission.evidenceType] += 1;
    if (mission.requiresAttendance && mission.slot) slots.add(mission.slot);
    return true;
  };

  add(ranked(active.filter((mission) => mission.evidenceType === "photo" && mission.tags.includes("general")), interestSet, `${seed}:general`)[0]);
  add(ranked(active.filter((mission) => mission.evidenceType === "comment" && mission.tags.includes("session")), interestSet, `${seed}:session`)[0]);
  add(ranked(active.filter((mission) => mission.evidenceType === "word" && mission.tags.includes("closing")), interestSet, `${seed}:closing`)[0]);

  for (const type of ["photo", "comment", "word"] as const) {
    for (const mission of ranked(active.filter((item) => item.evidenceType === type), interestSet, `${seed}:${type}`)) {
      if (counts[type] >= targets[type]) break;
      add(mission);
    }
  }

  if (selected.length !== 11) throw new Error("MISSION_POOL_INCOMPATIBLE");
  return selected;
}
