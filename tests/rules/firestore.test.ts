import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, documentId, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

let environment: RulesTestEnvironment;
const projectId = "aws-day-gt-rules-test";

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync("firebase/firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 }
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/u1"), { uid: "u1", email: "u1@example.com", alias: "cloudquetzal", role: "participant", interests: [] });
    await setDoc(doc(db, "users/u2"), { uid: "u2", email: "u2@example.com", alias: "otra", role: "participant", interests: [] });
    await setDoc(doc(db, "missions/M01"), { active: true, title: "Llegué", points: 15 });
    await setDoc(doc(db, "userMissions/aws-community-day-gt-2026_u1_M01"), { userId: "u1", missionId: "M01", status: "available" });
    await setDoc(doc(db, "scores/aws-community-day-gt-2026_u1"), { userId: "u1", alias: "cloudquetzal", totalPoints: 0, completedMissions: 0 });
    await setDoc(doc(db, "submissions/aws-community-day-gt-2026_u1_M01"), { userId: "u1", status: "pending" });
    await setDoc(doc(db, "submissions/aws-community-day-gt-2026_u1_C15"), { userId: "u1", missionId: "C15", kind: "challenge", status: "pending" });
    await setDoc(doc(db, "missionAnswerKeys/M17"), { missionId: "M17", correctOptionIds: ["o1", "o2"] });
    await setDoc(doc(db, "challenges/C01"), { active: true, title: "Different Stack", auraReward: 150 });
    await setDoc(doc(db, "challengeSecrets/C01"), { correctOptionId: "private" });
    await setDoc(doc(db, "challengeAssignments/u1"), { userId: "u1", challengeIds: ["C01"] });
    await setDoc(doc(db, "challengeProgress/aws-community-day-gt-2026_u1_C01"), { userId: "u1", challengeId: "C01", status: "available" });
    await setDoc(doc(db, "experienceStations/cloudforge"), { id: "cloudforge", active: true, completionMethod: "staff_verified_token" });
    await setDoc(doc(db, "experienceTokens/private-token"), { stationId: "cloudforge", usedAt: null });
  });
});

afterAll(async () => environment.cleanup());

describe("Firestore participant boundaries", () => {
  it("allows an owner to read their profile but not another profile", async () => {
    const db = environment.authenticatedContext("u1", { role: "participant" }).firestore();
    await assertSucceeds(getDoc(doc(db, "users/u1")));
    await assertFails(getDoc(doc(db, "users/u2")));
  });

  it("allows safe profile fields but blocks role changes", async () => {
    const db = environment.authenticatedContext("u1", { role: "participant" }).firestore();
    await assertSucceeds(updateDoc(doc(db, "users/u1"), { interests: ["Seguridad"] }));
    await assertFails(updateDoc(doc(db, "users/u1"), { role: "admin" }));
  });

  it("never allows a participant to write scores", async () => {
    const db = environment.authenticatedContext("u1", { role: "participant" }).firestore();
    await assertFails(updateDoc(doc(db, "scores/aws-community-day-gt-2026_u1"), { totalPoints: 100 }));
    await assertFails(updateDoc(doc(db, "scores/aws-community-day-gt-2026_u1"), { auraTotal: 999999 }));
  });

  it("keeps score documents private while allowing an owner to read their own progress", async () => {
    const owner = environment.authenticatedContext("u1", { role: "participant" }).firestore();
    const other = environment.authenticatedContext("u2", { role: "participant" }).firestore();
    const moderator = environment.authenticatedContext("staff", { role: "moderator", email: "moderator@example.com" }).firestore();
    const ownerAdmin = environment.authenticatedContext("owner", { role: "admin", email: "guategeeks3d@gmail.com" }).firestore();
    await assertSucceeds(getDoc(doc(owner, "scores/aws-community-day-gt-2026_u1")));
    await assertFails(getDoc(doc(other, "scores/aws-community-day-gt-2026_u1")));
    await assertFails(getDocs(collection(owner, "scores")));
    await assertFails(getDoc(doc(moderator, "scores/aws-community-day-gt-2026_u1")));
    await assertSucceeds(getDoc(doc(ownerAdmin, "scores/aws-community-day-gt-2026_u1")));
  });

  it("lets an owner read Challenge state but never edit it", async () => {
    const db = environment.authenticatedContext("u1", { role: "participant" }).firestore();
    await assertSucceeds(getDoc(doc(db, "challenges/C01")));
    await assertSucceeds(getDoc(doc(db, "challengeAssignments/u1")));
    await assertSucceeds(getDoc(doc(db, "challengeProgress/aws-community-day-gt-2026_u1_C01")));
    await assertFails(updateDoc(doc(db, "challengeProgress/aws-community-day-gt-2026_u1_C01"), { status: "completed" }));
    await assertFails(getDoc(doc(db, "challengeAssignments/u2")));
    await assertFails(getDoc(doc(db, "challengeSecrets/C01")));
  });

  it("loads assigned Challenges even when an assigned item is paused", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "challenges/C02"), { active: false, title: "First AWS Day", auraReward: 150 });
    });
    const db = environment.authenticatedContext("u1", { role: "participant" }).firestore();
    await assertSucceeds(getDocs(query(collection(db, "challenges"), where(documentId(), "in", ["C01", "C02"]))));
  });

  it("keeps historical mission documents inaccessible to clients, including staff", async () => {
    for (const [uid, role] of [["u1", "participant"], ["staff", "moderator"], ["owner", "admin"]] as const) {
      const db = environment.authenticatedContext(uid, { role }).firestore();
      await assertFails(getDoc(doc(db, "missions/M01")));
      await assertFails(getDoc(doc(db, "userMissions/aws-community-day-gt-2026_u1_M01")));
      await assertFails(getDoc(doc(db, "submissions/aws-community-day-gt-2026_u1_M01")));
    }
  });

  it("allows only the GuateGeeks owner admin to inspect Challenge photo submissions", async () => {
    const moderator = environment.authenticatedContext("staff", { role: "moderator", email: "moderator@example.com" }).firestore();
    const otherAdmin = environment.authenticatedContext("other-admin", { role: "admin", email: "other@example.com" }).firestore();
    const owner = environment.authenticatedContext("owner", { role: "admin", email: "guategeeks3d@gmail.com" }).firestore();
    await assertFails(getDoc(doc(moderator, "submissions/aws-community-day-gt-2026_u1_C15")));
    await assertFails(getDoc(doc(otherAdmin, "submissions/aws-community-day-gt-2026_u1_C15")));
    await assertSucceeds(getDoc(doc(owner, "submissions/aws-community-day-gt-2026_u1_C15")));
  });

  it("shows station availability but never exposes official tokens", async () => {
    const db = environment.authenticatedContext("u1", { role: "participant" }).firestore();
    await assertSucceeds(getDoc(doc(db, "experienceStations/cloudforge")));
    await assertFails(getDoc(doc(db, "experienceTokens/private-token")));
    await assertFails(updateDoc(doc(db, "experienceStations/cloudforge"), { active: false }));
  });

  it("denies answer keys to participants and all staff roles", async () => {
    for (const [uid, role] of [["u1", "participant"], ["staff", "moderator"], ["owner", "admin"]] as const) {
      const db = environment.authenticatedContext(uid, { role }).firestore();
      await assertFails(getDoc(doc(db, "missionAnswerKeys/M17")));
      await assertFails(setDoc(doc(db, "missionAnswerKeys/M17"), { correctOptionIds: ["o4"] }));
    }
  });
});
