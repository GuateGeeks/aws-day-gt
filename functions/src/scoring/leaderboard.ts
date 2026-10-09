import { onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import { requireUid } from "../shared/auth";
import { database } from "../shared/refs";

type LeaderboardRow = { rank: number; userId: string; alias: string; auraTotal: number; completedChallenges: number };
const rowCache = new Map<string, { expiresAt: number; rows: LeaderboardRow[] }>();

export async function getRegisteredLeaderboardForUid(uid: string, eventId = EVENT_ID) {
  const snapshot = await database.collection("scores").where("eventId", "==", eventId)
    .where("registeredForRanking", "==", true)
    .orderBy("auraTotal", "desc")
    .orderBy("completedChallenges", "desc")
    .orderBy("auraReachedAt", "asc")
    .get();
  const candidates = snapshot.docs.filter((doc) => {
    const userId = doc.data().userId;
    return typeof userId === "string" && typeof doc.data().alias === "string" && doc.id === `${eventId}_${userId}`;
  });
  const rows = candidates.map((doc, index) => {
    const score = doc.data();
    return {
      rank: index + 1,
      userId: score.userId,
      alias: score.alias,
      auraTotal: score.auraTotal ?? 0,
      completedChallenges: score.completedChallenges ?? 0
    };
  });
  const personalIndex = rows.findIndex((row) => row.userId === uid);
  return { rows, personalRank: personalIndex >= 0 ? personalIndex + 1 : null };
}

export const getLeaderboardSnapshot = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const uid = requireUid(request);
  const cached = rowCache.get(EVENT_ID);
  if (cached && cached.expiresAt > Date.now()) {
    const personalIndex = cached.rows.findIndex((row) => row.userId === uid);
    return { rows: cached.rows, personalRank: personalIndex >= 0 ? personalIndex + 1 : null };
  }
  const result = await getRegisteredLeaderboardForUid(uid);
  rowCache.set(EVENT_ID, { rows: result.rows, expiresAt: Date.now() + 15_000 });
  return result;
});
