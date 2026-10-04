import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

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
    await setDoc(doc(db, "scores/aws-community-day-gt-2026_u1"), { userId: "u1", alias: "cloudquetzal", totalPoints: 0, completedMissions: 0 });
    await setDoc(doc(db, "submissions/aws-community-day-gt-2026_u1_M01"), { userId: "u1", status: "pending" });
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
  });

  it("allows active mission reads and owner submission reads", async () => {
    const db = environment.authenticatedContext("u1", { role: "participant" }).firestore();
    await assertSucceeds(getDoc(doc(db, "missions/M01")));
    await assertSucceeds(getDoc(doc(db, "submissions/aws-community-day-gt-2026_u1_M01")));
  });

  it("allows moderators to inspect submissions", async () => {
    const db = environment.authenticatedContext("staff", { role: "moderator" }).firestore();
    await assertSucceeds(getDoc(doc(db, "submissions/aws-community-day-gt-2026_u1_M01")));
  });
});
