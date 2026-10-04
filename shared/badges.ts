export const BADGES = [
  { id: "first-step", name: "Primer paso", description: "Completa tu primera misión", threshold: 1 },
  { id: "explorer", name: "Explorador cloud", description: "Completa 5 misiones", threshold: 5 },
  { id: "community-builder", name: "Community Builder", description: "Completa las 11 misiones", threshold: 11 }
] as const;
export function earnedBadges(completedMissions: number) { return BADGES.filter((badge) => completedMissions >= badge.threshold); }
