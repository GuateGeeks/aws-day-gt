import type { Challenge, ChallengeOption } from "./types";
import type { ChallengeProfile } from "./profile";

export type ChallengeResponse = {
  sequence?: string[];
  matches?: Record<string, string>;
  optionId?: string;
  stage?: number;
  trackId?: string;
  sessionId?: string;
  code?: string;
};

export type ChallengeAnswer = {
  expectedSequence?: string[];
  expectedMatches?: Record<string, string>;
  correctOptionId?: string;
};

export function validateCloudResponse(challenge: Challenge, response: ChallengeResponse, answer: ChallengeAnswer): boolean {
  if (challenge.validationType === "interactive_sequence") {
    return !!answer.expectedSequence && Array.isArray(response.sequence) &&
      response.sequence.length === answer.expectedSequence.length &&
      response.sequence.every((item, index) => item === answer.expectedSequence![index]);
  }
  if (challenge.validationType === "interactive_matching") {
    const expected = answer.expectedMatches;
    return !!expected && !!response.matches && Object.keys(response.matches).length === Object.keys(expected).length &&
      Object.entries(expected).every(([prompt, service]) => response.matches?.[prompt] === service);
  }
  return typeof response.optionId === "string" && response.optionId === answer.correctOptionId;
}

export function validateTrack(trackId: unknown, tracks: ChallengeOption[] | undefined): boolean {
  return typeof trackId === "string" && !!tracks?.some((track) => track.id === trackId);
}

export function validateSocialPair(challengeId: string, owner: ChallengeProfile, peer: ChallengeProfile): boolean {
  switch (challengeId) {
    case "C01": return owner.primaryRole !== peer.primaryRole;
    case "C02": return peer.firstAwsCommunityDay;
    case "C04": return owner.awsInterest.some((interest) => peer.awsInterest.includes(interest));
    case "C05": return owner.experienceLevel !== peer.experienceLevel;
    default: return false;
  }
}

export function validateCloudTrio(owner: ChallengeProfile, peers: ChallengeProfile[]): boolean {
  return peers.length >= 2 && new Set([owner.primaryRole, ...peers.slice(0, 2).map((peer) => peer.primaryRole)]).size === 3;
}
