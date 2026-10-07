import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { challengeProfileSchema } from "../../../shared/challenges/profile";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";

export async function setChallengeProfileForUid(uid: string, input: unknown) {
  const parsed = challengeProfileSchema.safeParse(input);
  if (!parsed.success) throw new HttpsError("invalid-argument", "INVALID_CHALLENGE_PROFILE");
  return database.runTransaction(async (transaction) => {
    const profileRef = refs.user(uid);
    const profile = await transaction.get(profileRef);
    if (!profile.exists || !profile.data()?.onboardingComplete) throw new HttpsError("failed-precondition", "ONBOARDING_REQUIRED");
    if (profile.data()?.primaryRole !== undefined) throw new HttpsError("failed-precondition", "PROFILE_LOCKED");
    transaction.update(profileRef, { ...parsed.data, challengeProfileCompletedAt: FieldValue.serverTimestamp() });
    return { saved: true };
  });
}

export const setChallengeProfile = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return setChallengeProfileForUid(requireUid(request), request.data);
});
