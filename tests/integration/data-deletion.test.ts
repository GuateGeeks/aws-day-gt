// @vitest-environment node
import { getAuth } from "firebase-admin/auth";
import { afterAll, describe, expect, it } from "vitest";
import { EVENT_ID } from "../../shared/constants";
import { reviewDataDeletionForOwner } from "../../functions/src/admin/data-deletion";
import { adminApp } from "../../functions/src/shared/admin";
import { database, refs } from "../../functions/src/shared/refs";
import { evidenceBucket } from "../../functions/src/submissions/register-photo";

const emulatorReady = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST);

describe.skipIf(!emulatorReady)("owner-reviewed data deletion", () => {
  const createdUsers: string[] = [];
  afterAll(async () => {
    await Promise.all(createdUsers.map((uid) => getAuth(adminApp).deleteUser(uid).catch(() => undefined)));
  });

  it("keeps user data when the owner rejects a request with a reason", async () => {
    const uid = `delete-reject-${crypto.randomUUID()}`;
    createdUsers.push(uid);
    await getAuth(adminApp).createUser({ uid, email: `${uid}@example.com` });
    await refs.user(uid).set({ uid, email: `${uid}@example.com`, alias: "keep-me", aliasNormalized: "keep-me" });
    await database.doc(`deletionRequests/${uid}`).set({ uid, status: "requested" });

    await expect(reviewDataDeletionForOwner("owner-admin", { uid, decision: "rejected", note: "La identidad debe verificarse nuevamente." })).resolves.toMatchObject({ status: "rejected" });
    expect((await refs.user(uid).get()).exists).toBe(true);
    expect((await database.doc(`deletionRequests/${uid}`).get()).data()).toMatchObject({ status: "rejected", decisionNote: "La identidad debe verificarse nuevamente." });
  });

  it("removes authentication, private files, and every user-owned record while keeping anonymous audit evidence", async () => {
    const uid = `delete-approve-${crypto.randomUUID()}`;
    createdUsers.push(uid);
    const email = `${uid}@example.com`;
    await getAuth(adminApp).createUser({ uid, email });
    const batch = database.batch();
    batch.set(refs.user(uid), { uid, email, alias: "remove-me", aliasNormalized: "remove-me" });
    batch.set(database.doc("aliases/remove-me"), { uid, alias: "remove-me" });
    batch.set(refs.challengeAssignment(uid), { userId: uid, eventId: EVENT_ID, challengeIds: ["C15"] });
    batch.set(refs.challengeProgress(uid, "C15"), { userId: uid, eventId: EVENT_ID, challengeId: "C15" });
    batch.set(refs.score(uid), { userId: uid, eventId: EVENT_ID, alias: "remove-me" });
    batch.set(refs.submission(uid, "C15"), { userId: uid, eventId: EVENT_ID, missionId: "C15" });
    batch.set(refs.userMission(uid, "M01"), { userId: uid, eventId: EVENT_ID, missionId: "M01" });
    batch.set(database.doc(`connections/${EVENT_ID}_${uid}_peer`), { userId: uid, peerUid: "peer" });
    batch.set(database.doc(`geekIdTokens/token-${uid}`), { uid, eventId: EVENT_ID });
    batch.set(refs.operation(uid, "operation"), { result: { ok: true } });
    batch.set(database.doc(`deletionRequests/${uid}`), { uid, status: "requested", alias: "remove-me", emailMasked: "de••••@example.com" });
    await batch.commit();
    const storagePath = `evidence/${EVENT_ID}/${uid}/C15/photo.png`;
    await evidenceBucket().file(storagePath).save(Buffer.from("private image"), { metadata: { contentType: "image/png" } });

    await expect(reviewDataDeletionForOwner("owner-admin", { uid, decision: "approved" })).resolves.toMatchObject({ status: "completed" });

    await expect(getAuth(adminApp).getUser(uid)).rejects.toMatchObject({ code: "auth/user-not-found" });
    expect((await refs.user(uid).get()).exists).toBe(false);
    expect((await refs.challengeAssignment(uid).get()).exists).toBe(false);
    expect((await refs.challengeProgress(uid, "C15").get()).exists).toBe(false);
    expect((await refs.score(uid).get()).exists).toBe(false);
    expect((await refs.submission(uid, "C15").get()).exists).toBe(false);
    expect((await database.doc(`deletionRequests/${uid}`).get()).exists).toBe(false);
    expect((await evidenceBucket().file(storagePath).exists())[0]).toBe(false);
    const audits = await database.collection("auditLogs").where("action", "==", "USER_DATA_DELETED").get();
    const audit = audits.docs.map((entry) => entry.data()).find((entry) => entry.subjectDigest && entry.actorUid === "owner-admin");
    expect(audit).toBeTruthy();
    expect(JSON.stringify(audit)).not.toContain(uid);
    expect(JSON.stringify(audit)).not.toContain(email);
    expect(JSON.stringify(audit)).not.toContain("remove-me");
  });
});
