import { onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import { requireUid } from "../shared/auth";
import { database } from "../shared/refs";

export const getLeaderboardSnapshot = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const uid = requireUid(request);
  const snapshot = await database.collection("scores").where("eventId", "==", EVENT_ID)
    .orderBy("totalPoints", "desc").orderBy("completedMissions", "desc").orderBy("finalScoreReachedAt", "asc").limit(50).get();
  const rows = snapshot.docs.map((doc, index) => ({
    rank: index + 1,
    alias: doc.data().alias,
    totalPoints: doc.data().totalPoints,
    completedMissions: doc.data().completedMissions
  }));
  const personalIndex = snapshot.docs.findIndex((doc) => doc.data().userId === uid);
  return { rows, personalRank: personalIndex >= 0 ? personalIndex + 1 : null };
});
