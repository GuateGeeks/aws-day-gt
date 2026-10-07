export type ChallengeCategory = "CONNECT" | "CLOUD" | "SESSION" | "EXPERIENCE" | "COMMUNITY";

export type ChallengeValidationType =
  | "participant_role_difference"
  | "participant_first_timer"
  | "participant_role_group"
  | "participant_shared_interest"
  | "participant_experience_difference"
  | "interactive_sequence"
  | "interactive_matching"
  | "interactive_architecture"
  | "interactive_question"
  | "session_code"
  | "session_question"
  | "survey"
  | "experience_completion"
  | "community_photo";

export interface ChallengeOption { id: string; label: string }

export interface ChallengeConfiguration {
  subtitle?: string;
  conversationPrompt?: string;
  items?: ChallengeOption[];
  prompts?: ChallengeOption[];
  options?: ChallengeOption[];
  clues?: string[];
  scenario?: string;
  sessionId?: string;
  stationId?: string;
  tracks?: ChallengeOption[];
  sessions?: { id: string; label: string; question: string; options: ChallengeOption[] }[];
}

export interface Challenge {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  auraReward: number;
  validationType: ChallengeValidationType;
  active: boolean;
  required: boolean;
  configuration: ChallengeConfiguration;
  version: 2;
}

export type ChallengeState = "locked" | "available" | "in_progress" | "processing" | "completed" | "failed" | "rejected";

export interface ChallengeAssignment {
  eventId: string;
  userId: string;
  challengeIds: string[];
  bonusChallengeIds?: string[];
  signature: string;
  version: 2;
  createdAt?: unknown;
}

export interface ChallengeProgress {
  eventId: string;
  userId: string;
  challengeId: string;
  status: ChallengeState;
  scannedUserIds?: string[];
  selectionId?: string;
  architectureStep?: number;
  completedAt?: unknown;
  auraAwarded?: number;
  auraDeducted?: number;
  solution?: string;
  incorrectReason?: string;
  sessionAttempts?: number;
  sessionBlockedUntilMillis?: number | null;
}
