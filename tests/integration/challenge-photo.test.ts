// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { EVENT_ID } from "../../shared/constants";
import { challenges } from "../../shared/challenges/catalog";
import { reviewSubmissionForStaff } from "../../functions/src/moderation/review-submission";
import { evidenceBucket, registerPhotoForUid } from "../../functions/src/submissions/register-photo";
import { refs } from "../../functions/src/shared/refs";

async function pendingPhoto(uid: string) {
  await refs.challengeProgress(uid, "C15").set({ eventId: EVENT_ID, userId: uid, challengeId: "C15", status: "processing", auraAwarded: 0 });
  await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: 0, completedChallenges: 0, totalPoints: 20 });
  await refs.submission(uid, "C15").set({ eventId: EVENT_ID, userId: uid, missionId: "C15", kind: "challenge", status: "pending", provisionalPoints: 350, finalPoints: 0, image: { storagePath: `evidence/${EVENT_ID}/${uid}/C15/photo.webp` } });
}

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("publication and selfie moderation", () => {
  beforeAll(async () => { await Promise.all(challenges.filter((item) => ["C15", "C16", "C17"].includes(item.id)).map((item) => refs.challenge(item.id).set(item))); });
  it("rejects archived mission photo registration before opening storage", async () => {
    await expect(registerPhotoForUid("photo-legacy", { missionId: "M01", operationId: "legacy", storagePath: `evidence/${EVENT_ID}/photo-legacy/M01/old.webp` })).rejects.toThrow("CHALLENGE_REQUIRED");
  });
  it("rejects archived mission moderation without changing its records", async () => {
    const uid = "legacy-review";
    await refs.userMission(uid, "M01").set({ eventId: EVENT_ID, userId: uid, missionId: "M01", status: "submitted", points: 15 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, totalPoints: 20, completedMissions: 1, auraTotal: 0, completedChallenges: 0 });
    await refs.submission(uid, "M01").set({ eventId: EVENT_ID, userId: uid, missionId: "M01", kind: "mission", status: "pending", provisionalPoints: 15 });
    await expect(reviewSubmissionForStaff("staff", { userId: uid, missionId: "M01", decision: "approved" })).rejects.toThrow("CHALLENGE_REQUIRED");
    expect((await refs.submission(uid, "M01").get()).data()?.status).toBe("pending");
    expect((await refs.score(uid).get()).data()).toMatchObject({ totalPoints: 20, auraTotal: 0 });
  });
  it.skipIf(!process.env.FIREBASE_STORAGE_EMULATOR_HOST)("inspects uploaded bytes before queuing manual review", async () => {
    const uid = `photo-${crypto.randomUUID()}`;
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: ["C15"] });
    await refs.challengeProgress(uid, "C15").set({ eventId: EVENT_ID, userId: uid, challengeId: "C15", status: "available" });
    const bucket = evidenceBucket();
    const badPath = `evidence/${EVENT_ID}/${uid}/C15/bad.webp`;
    await bucket.file(badPath).save(Buffer.from("not really an image"), { metadata: { contentType: "image/webp" } });
    await expect(registerPhotoForUid(uid, { missionId: "C15", operationId: "bad", storagePath: badPath })).rejects.toThrow("INVALID_PHOTO_SIGNATURE");
    const largePath = `evidence/${EVENT_ID}/${uid}/C15/large.png`;
    await bucket.file(largePath).save(Buffer.alloc(1_572_865, 1), { metadata: { contentType: "image/png" } });
    await expect(registerPhotoForUid(uid, { missionId: "C15", operationId: "large", storagePath: largePath })).rejects.toThrow("INVALID_PHOTO");
    const goodPath = `evidence/${EVENT_ID}/${uid}/C15/good.png`;
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/v5kAAAAASUVORK5CYII=", "base64");
    await bucket.file(goodPath).save(png, { metadata: { contentType: "image/png" } });
    expect(await registerPhotoForUid(uid, { missionId: "C15", operationId: "good", storagePath: goodPath })).toMatchObject({ status: "pending", scoreDelta: 0 });
    expect((await refs.challengeProgress(uid, "C15").get()).data()?.status).toBe("processing");
    expect((await refs.submission(uid, "C15").get()).data()?.moderationStatus).toBe("manual_review");
    expect((await refs.submission(uid, "C15").get()).data()?.provisionalPoints).toBe(350);
  });
  it("awards only once after approval and leaves historical points alone", async () => {
    await pendingPhoto("photo-approved");
    expect(await reviewSubmissionForStaff("staff", { userId: "photo-approved", missionId: "C15", decision: "approved" })).toMatchObject({ status: "approved" });
    await expect(reviewSubmissionForStaff("staff", { userId: "photo-approved", missionId: "C15", decision: "approved" })).rejects.toThrow("ALREADY_REVIEWED");
    expect((await refs.score("photo-approved").get()).data()).toMatchObject({ auraTotal: 350, completedChallenges: 1, totalPoints: 20 });
  });
  it("awards zero for rejection", async () => {
    await pendingPhoto("photo-rejected");
    expect(await reviewSubmissionForStaff("staff", { userId: "photo-rejected", missionId: "C15", decision: "rejected" })).toMatchObject({ status: "rejected" });
    expect((await refs.score("photo-rejected").get()).data()).toMatchObject({ auraTotal: 0, completedChallenges: 0 });
  });
  it("uses the credit reward captured when a photo was submitted", async () => {
    await pendingPhoto("photo-custom-reward");
    await refs.submission("photo-custom-reward", "C15").update({ provisionalPoints: 125 });
    await reviewSubmissionForStaff("staff", { userId: "photo-custom-reward", missionId: "C15", decision: "approved" });
    expect((await refs.score("photo-custom-reward").get()).data()).toMatchObject({ auraTotal: 125, totalPoints: 20 });
    expect((await refs.challengeProgress("photo-custom-reward", "C15").get()).data()).toMatchObject({ auraAwarded: 125 });
    expect((await refs.submission("photo-custom-reward", "C15").get()).data()).toMatchObject({ finalPoints: 125 });
  });

  it.each(["C16", "C17"])("queues %s for manual review and awards Aura only once after approval", async (challengeId) => {
    const uid = `photo-bonus-${challengeId}-${crypto.randomUUID()}`;
    await refs.user(uid).set({ uid, onboardingComplete: true });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: ["C13"], bonusChallengeIds: ["C16", "C17"] });
    await refs.challengeProgress(uid, challengeId).set({ eventId: EVENT_ID, userId: uid, challengeId, status: "available", auraAwarded: 0 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, auraTotal: 0, completedChallenges: 0 });
    const path = `evidence/${EVENT_ID}/${uid}/${challengeId}/selfie.png`;
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/v5kAAAAASUVORK5CYII=", "base64");
    await evidenceBucket().file(path).save(png, { metadata: { contentType: "image/png" } });
    expect(await registerPhotoForUid(uid, { missionId: challengeId, operationId: `selfie_${challengeId}`, storagePath: path })).toMatchObject({ status: "pending", scoreDelta: 0 });
    expect((await refs.submission(uid, challengeId).get()).data()).toMatchObject({ moderationStatus: "manual_review", publicationEligible: false });
    expect((await refs.score(uid).get()).data()?.auraTotal).toBe(0);
    expect(await reviewSubmissionForStaff("staff", { userId: uid, missionId: challengeId, decision: "approved" })).toMatchObject({ status: "approved" });
    await expect(reviewSubmissionForStaff("staff", { userId: uid, missionId: challengeId, decision: "approved" })).rejects.toThrow("ALREADY_REVIEWED");
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 100, completedChallenges: 1 });
  });

  it("refuses a bonus selfie from an account without completed registration", async () => {
    const uid = `photo-unregistered-${crypto.randomUUID()}`;
    const path = `evidence/${EVENT_ID}/${uid}/C16/selfie.png`;
    await evidenceBucket().file(path).save(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/v5kAAAAASUVORK5CYII=", "base64"), { metadata: { contentType: "image/png" } });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: ["C13"], bonusChallengeIds: ["C16", "C17"] });
    await refs.challengeProgress(uid, "C16").set({ eventId: EVENT_ID, userId: uid, challengeId: "C16", status: "available" });
    await expect(registerPhotoForUid(uid, { missionId: "C16", operationId: "unregistered", storagePath: path })).rejects.toThrow("ONBOARDING_REQUIRED");
  });

  it("refuses a bonus selfie without the bonus assignment even if progress exists", async () => {
    const uid = `photo-no-bonus-${crypto.randomUUID()}`;
    const path = `evidence/${EVENT_ID}/${uid}/C17/selfie.png`;
    await evidenceBucket().file(path).save(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/v5kAAAAASUVORK5CYII=", "base64"), { metadata: { contentType: "image/png" } });
    await refs.user(uid).set({ uid, onboardingComplete: true });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: ["C13"] });
    await refs.challengeProgress(uid, "C17").set({ eventId: EVENT_ID, userId: uid, challengeId: "C17", status: "available" });
    await expect(registerPhotoForUid(uid, { missionId: "C17", operationId: "no-bonus", storagePath: path })).rejects.toThrow("CHALLENGE_UNAVAILABLE");
  });
});
