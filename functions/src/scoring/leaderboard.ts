import type { DocumentSnapshot } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";
import { hasCompletedRegistration } from "../shared/registration";

export async function getRegisteredLeaderboardForUid(uid: string, eventId = EVENT_ID) {
  const rows: Array<{ rank: number; userId: string; alias: string; auraTotal: number; completedChallenges: number }> = [];
  const snapshot = await database.collection("scores").where("eventId", "==", eventId)
    .where("registeredForRanking", "==", true)
    .orderBy("auraTotal", "desc")
    .orderBy("completedChallenges", "desc")
    .orderBy("auraReachedAt", "asc")
    .get();
  const candidates = snapshot.docs.filter((doc) => {
    const userId = doc.data().userId;
    return typeof userId === "string" && doc.id === `${eventId}_${userId}`;
  });
  const profiles: DocumentSnapshot[] = [];
  for (let index = 0; index < candidates.length; index += 100) {
    profiles.push(...await database.getAll(...candidates.slice(index, index + 100).map((doc) => refs.user(doc.data().userId))));
  }
  candidates.forEach((doc, index) => {
    const profile = profiles[index]?.data();
    if (!hasCompletedRegistration(profile)) return;
    const score = doc.data();
    rows.push({
      rank: rows.length + 1,
      userId: score.userId,
      alias: typeof profile?.alias === "string" ? profile.alias : score.alias,
      auraTotal: score.auraTotal ?? 0,
      completedChallenges: score.completedChallenges ?? 0
    });
  });
  const personalIndex = rows.findIndex((row) => row.userId === uid);
  return { rows, personalRank: personalIndex >= 0 ? personalIndex + 1 : null };
}

export const getLeaderboardSnapshot = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return getRegisteredLeaderboardForUid(requireUid(request));
});
