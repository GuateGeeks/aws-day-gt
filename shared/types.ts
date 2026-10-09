export type Role = "participant" | "moderator" | "admin";
export type EvidenceType = "photo" | "comment" | "word";
export type MissionStatus = "available" | "submitted" | "approved" | "rejected" | "failed" | "replaced" | "cancelled" | "expired";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export type DeletionRequestStatus = "requested" | "processing" | "rejected" | "failed";

export interface DeletionRequest {
  uid: string;
  alias: string;
  emailMasked: string;
  status: DeletionRequestStatus;
  requestedAt?: unknown;
  decidedAt?: unknown;
  decidedBy?: string;
  decisionNote?: string;
  failureCode?: string;
}

export interface EvidenceValidation {
  evidenceType: EvidenceType;
  minLength?: number;
  maxLength?: number;
  requiresConsent?: boolean;
  allowShortToken?: boolean;
}

export type SelectionMode = "single" | "multiple";
export type SelectionValidationKind = "opinion" | "quiz";
export interface SelectionOption { id: string; label: string }
export interface MissionSelection {
  mode: SelectionMode;
  validationKind: SelectionValidationKind;
  options: SelectionOption[];
  minSelections: number;
  maxSelections: number;
}
export interface MissionAnswerKey { missionId: string; correctOptionIds: string[] }

export interface Mission {
  id: string;
  eventId: string;
  title: string;
  description: string;
  instructions: string;
  evidenceType: EvidenceType;
  points: 5 | 10 | 15;
  category: string;
  validation: EvidenceValidation;
  selection?: MissionSelection;
  sessionId?: string;
  slot?: string;
  room?: string;
  speaker?: string;
  requiresAttendance?: boolean;
  tags: string[];
  active: boolean;
}

export interface ScheduleSession {
  id: string;
  eventId: string;
  speaker: string;
  topic: string;
  track: string;
  room: string;
  building?: string;
  startAt: string;
  endAt: string;
  slot: string;
  status: "scheduled" | "changed" | "cancelled";
}

export interface UserConsent {
  termsVersion: string;
  acceptedAt: string;
  photoPublication: boolean;
  marketing: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  alias: string;
  aliasNormalized: string;
  role: Role;
  interests: string[];
  primaryRole?: import("./challenges/profile").ChallengeProfile["primaryRole"];
  experienceLevel?: import("./challenges/profile").ChallengeProfile["experienceLevel"];
  firstAwsCommunityDay?: boolean;
  awsInterest?: import("./challenges/profile").ChallengeProfile["awsInterest"];
  consent: UserConsent;
  onboardingComplete: boolean;
  replacementsUsed: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserMission {
  id: string;
  eventId: string;
  userId: string;
  missionId: string;
  status: MissionStatus;
  evidenceType: EvidenceType;
  points: number;
  assignedAt: string;
  completedAt?: string;
  replacementOf?: string;
  attemptsUsed?: number;
}

export interface Submission {
  id: string;
  operationId: string;
  eventId: string;
  userId: string;
  missionId: string;
  evidenceType: EvidenceType;
  text?: string;
  selection?: { ids: string[]; labels: string[] };
  image?: { storagePath: string; width?: number; height?: number; bytes?: number };
  status: SubmissionStatus;
  provisionalPoints: number;
  finalPoints: number;
  publicationEligible: boolean;
  submittedAt: string;
  updatedAt: string;
}

export interface Score {
  userId: string;
  eventId: string;
  alias: string;
  totalPoints: number;
  auraTotal?: number;
  registeredForRanking?: boolean;
  completedChallenges?: number;
  auraReachedAt?: unknown;
  completedMissions: number;
  photoMissions: number;
  commentMissions: number;
  wordMissions: number;
  finalScoreReachedAt?: string;
  updatedAt: string;
}

export interface EventConfig {
  eventId: string;
  registrationOpen: boolean;
  missionsEnabled: boolean;
  leaderboardEnabled: boolean;
  uploadsEnabled: boolean;
  photoMissionsEnabled: boolean;
  maintenanceMode: boolean;
  maxPhotoSize: number;
  maxReplacements: number;
  eventMode: "PRE_EVENT" | "LIVE" | "CLOSING" | "CLOSED";
  legal: { termsVersion: string; terms: string; privacy: string; retention: string };
  initialAdminEmails: string[];
}
