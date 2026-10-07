import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { EVENT_ID } from "../../shared/constants";
import { challengeSecrets } from "../../scripts/data/challenge-secrets";
import { experienceStations } from "../../shared/challenges/stations";
import { completeChallengeForUid } from "../../functions/src/challenges/complete";
import { issueVerifiedExperienceToken } from "../../functions/src/challenges/experience-adapter";
import { configureCloudQuestionForAdmin, configureSessionForAdmin, configureTrackPulseForAdmin, updateChallengeSettingsForAdmin, updateExperienceStationForAdmin } from "../../functions/src/challenges/admin-config";
import * as adminConfig from "../../functions/src/challenges/admin-config";
import { issueGeekIdForUid, issueStationTokenForStaff } from "../../functions/src/challenges/tokens";
import { database, refs } from "../../functions/src/shared/refs";

async function participant(uid: string, ids: string[], primaryRole: string, firstAwsCommunityDay = false) {
  await refs.user(uid).set({ uid, alias: uid, onboardingComplete: true, primaryRole, experienceLevel: primaryRole === "Development" ? "Junior" : "Senior", firstAwsCommunityDay, awsInterest: ["Serverless"] });
  await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, totalPoints: 15, auraTotal: 0, completedChallenges: 0 });
  await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: ids, version: 2 });
  await Promise.all(ids.map((id) => refs.challengeProgress(uid, id).set({ eventId: EVENT_ID, userId: uid, challengeId: id, status: "available" })));
}

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("Challenge validation", () => {
  beforeAll(async () => {
    await Promise.all(challenges.map((item) => refs.challenge(item.id).set(item)));
    await Promise.all(challengeSecrets.map((secret) => refs.challengeSecret(secret.challengeId).set(secret)));
    await Promise.all(experienceStations.map((station) => refs.experienceStation(station.id).set(station)));
    await participant("val-owner", ["C01", "C03", "C06", "C10", "C11", "C13"], "Development");
    await participant("val-peer-1", ["C13"], "Data", true);
    await participant("val-peer-2", [], "Cloud");
    await participant("val-vr-1", ["C14"], "Development");
    await participant("val-vr-2", ["C14"], "Cloud");
  });

  it("deducts 150 Aura once for an incorrect AWS selection and reveals the solution", async () => {
    const uid = `val-cloud-fail-${crypto.randomUUID()}`;
    await participant(uid, ["C06"], "Cloud");
    const first = await completeChallengeForUid(uid, { challengeId: "C06", operationId: "cloud-wrong", response: { sequence: ["lambda", "api-gateway", "dynamodb"] } });
    expect(first).toMatchObject({ status: "failed", auraAwarded: 0, auraDeducted: 150 });
    expect(first.solution).toContain("Amazon API Gateway");
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: -150, auraDeductedTotal: 150, completedChallenges: 0 });
    expect((await refs.challengeProgress(uid, "C06").get()).data()).toMatchObject({ status: "failed", auraDeducted: 150 });
    expect(await completeChallengeForUid(uid, { challengeId: "C06", operationId: "cloud-wrong", response: { sequence: ["lambda", "api-gateway", "dynamodb"] } })).toEqual(first);
    expect(await completeChallengeForUid(uid, { challengeId: "C06", operationId: "cloud-right-after-fail", response: { sequence: ["api-gateway", "lambda", "dynamodb"] } })).toEqual(first);
    expect((await refs.score(uid).get()).data()?.auraTotal).toBe(-150);
  });

  it("awards a correct Cloud answer once", async () => {
    expect(await completeChallengeForUid("val-owner", { challengeId: "C06", operationId: "cloud-right", response: { sequence: ["api-gateway", "lambda", "dynamodb"] } })).toMatchObject({ status: "completed", auraAwarded: 150 });
  });

  it("does not charge for incomplete Cloud answers and closes C07 and C09 after wrong answers", async () => {
    const matchingUid = `val-matching-fail-${crypto.randomUUID()}`;
    const questionUid = `val-question-fail-${crypto.randomUUID()}`;
    await participant(matchingUid, ["C07"], "Cloud");
    await participant(questionUid, ["C09"], "Cloud");
    await expect(completeChallengeForUid(matchingUid, { challengeId: "C07", operationId: "missing", response: { matches: { files: "s3" } } })).rejects.toThrow("INVALID_CHALLENGE_RESPONSE");
    await expect(completeChallengeForUid(questionUid, { challengeId: "C09", operationId: "missing", response: {} })).rejects.toThrow("INVALID_CHALLENGE_RESPONSE");
    expect((await refs.score(matchingUid).get()).data()?.auraTotal).toBe(0);
    const matching = await completeChallengeForUid(matchingUid, { challengeId: "C07", operationId: "wrong", response: { matches: { files: "lambda", code: "s3", nosql: "dynamodb", genai: "bedrock" } } });
    const question = await completeChallengeForUid(questionUid, { challengeId: "C09", operationId: "wrong", response: { optionId: "s3" } });
    expect(matching).toMatchObject({ status: "failed", auraDeducted: 150 });
    expect(matching.solution).toContain("Guardar archivos / imágenes → Amazon S3");
    expect(question).toMatchObject({ status: "failed", auraDeducted: 150, solution: "Respuesta correcta: AWS Lambda." });
    expect((await refs.score(questionUid).get()).data()?.auraTotal).toBe(-150);
  });

  it("charges only once when two incorrect AWS answers arrive together", async () => {
    const uid = `val-concurrent-fail-${crypto.randomUUID()}`;
    await participant(uid, ["C09"], "Cloud");
    const [first, second] = await Promise.all([
      completeChallengeForUid(uid, { challengeId: "C09", operationId: "wrong-one", response: { optionId: "s3" } }),
      completeChallengeForUid(uid, { challengeId: "C09", operationId: "wrong-two", response: { optionId: "ec2" } })
    ]);
    expect(first).toMatchObject({ status: "failed", auraDeducted: 150 });
    expect(second).toMatchObject({ status: "failed", auraDeducted: 150 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: -150, auraDeductedTotal: 150 });
  });

  it.each([
    ["C18", "sns", "distribuye avisos"], ["C19", "sqs", "guarda mensajes"],
    ["C20", "cloudwatch", "observar el sistema"], ["C21", "sns", "distribuye mensajes"],
    ["C22", "s3", "almacena objetos"], ["C23", "route53", "administra DNS"]
  ])("explains why %s is wrong and deducts Aura once", async (challengeId, optionId, reason) => {
    const uid = `val-service-fail-${crypto.randomUUID()}`;
    await participant(uid, [challengeId], "Cloud");
    const result = await completeChallengeForUid(uid, { challengeId, operationId: "wrong", response: { optionId } });
    expect(result).toMatchObject({ status: "failed", auraDeducted: 150 });
    expect(result.incorrectReason).toContain(reason);
    expect(result.solution).toContain("Respuesta correcta");
    expect((await refs.challengeProgress(uid, challengeId).get()).data()).toMatchObject({ status: "failed", incorrectReason: result.incorrectReason, solution: result.solution });
    expect((await refs.score(uid).get()).data()?.auraTotal).toBe(-150);
  });

  it("awards 150 Aura for a correct extra AWS service question", async () => {
    const uid = `val-service-correct-${crypto.randomUUID()}`;
    await participant(uid, ["C18"], "Cloud");
    expect(await completeChallengeForUid(uid, { challengeId: "C18", operationId: "correct", response: { optionId: "sqs" } })).toMatchObject({ status: "completed", auraAwarded: 150 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 150, completedChallenges: 1 });
  });

  it("accepts a new AWS question assigned only as a bonus", async () => {
    const uid = `val-bonus-only-${crypto.randomUUID()}`;
    await participant(uid, ["C10"], "Cloud");
    await refs.challengeAssignment(uid).update({ bonusChallengeIds: ["C18"] });
    await refs.challengeProgress(uid, "C18").set({ eventId: EVENT_ID, userId: uid, challengeId: "C18", status: "available" });
    expect(await completeChallengeForUid(uid, { challengeId: "C18", operationId: "bonus-correct", response: { optionId: "sqs" } })).toMatchObject({ status: "completed", auraAwarded: 150 });
    expect((await refs.score(uid).get()).data()?.auraTotal).toBe(150);
  });

  it("credits C08 only after both ordered selections", async () => {
    const uid = `val-architecture-${crypto.randomUUID()}`;
    await participant(uid, ["C08"], "Cloud");
    await expect(completeChallengeForUid(uid, { challengeId: "C08", operationId: "skip", response: { stage: 1, optionId: "lambda" } })).rejects.toThrow("CHALLENGE_STAGE_MISMATCH");
    await expect(completeChallengeForUid(uid, { challengeId: "C08", operationId: "empty", response: { stage: 0 } })).rejects.toThrow("INVALID_CHALLENGE_RESPONSE");
    expect(await completeChallengeForUid(uid, { challengeId: "C08", operationId: "first", response: { stage: 0, optionId: "dynamo" } })).toMatchObject({ status: "in_progress", stage: 1, auraAwarded: 0 });
    expect((await refs.score(uid).get()).data()?.auraTotal).toBe(0);
    expect((await refs.challengeProgress(uid, "C08").get()).data()).toMatchObject({ status: "in_progress", architectureStep: 1, auraAwarded: 0 });
    expect(await completeChallengeForUid(uid, { challengeId: "C08", operationId: "second", response: { stage: 1, optionId: "lambda" } })).toMatchObject({ status: "completed", auraAwarded: 150 });
    expect(await completeChallengeForUid(uid, { challengeId: "C08", operationId: "second-again", response: { stage: 1, optionId: "lambda" } })).toMatchObject({ status: "completed", auraAwarded: 150 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 150, completedChallenges: 1 });
  });

  it.each([{ stage: 0, optionId: "sqs", solution: "DynamoDB" }, { stage: 1, optionId: "dynamo", solution: "Lambda" }])("ends C08 after a wrong answer on stage $stage", async ({ stage, optionId, solution }) => {
    const uid = `val-architecture-fail-${crypto.randomUUID()}`;
    await participant(uid, ["C08"], "Cloud");
    if (stage === 1) await completeChallengeForUid(uid, { challengeId: "C08", operationId: "correct-first", response: { stage: 0, optionId: "dynamo" } });
    const result = await completeChallengeForUid(uid, { challengeId: "C08", operationId: "wrong", response: { stage, optionId } });
    expect(result).toMatchObject({ status: "failed", auraDeducted: 150 });
    expect(result.solution).toContain(solution);
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: -150, auraDeductedTotal: 150 });
  });

  it("rejects self-scans and refuses retired Cloud Trio even when the stored catalog is active", async () => {
    const own = await issueGeekIdForUid("val-owner");
    await expect(completeChallengeForUid("val-owner", { challengeId: "C01", operationId: "self", response: { geekToken: own.token } })).rejects.toThrow("SELF_SCAN");
    const first = await issueGeekIdForUid("val-peer-1");
    expect(await completeChallengeForUid("val-owner", { challengeId: "C01", operationId: "pair", response: { geekToken: first.token } })).toMatchObject({ status: "completed" });
    await refs.challenge("C03").update({ active: true });
    await expect(completeChallengeForUid("val-owner", { challengeId: "C03", operationId: "retired-trio", response: { geekToken: first.token } })).rejects.toThrow("CHALLENGE_RETIRED");
    expect((await database.doc(`connections/${EVENT_ID}_val-owner_val-peer-1`).get()).data()?.challengeIds).toEqual(["C01"]);
    expect((await refs.challengeProgress("val-owner", "C03").get()).data()?.status).toBe("available");
    expect((await refs.score("val-owner").get()).data()?.auraTotal).toBe(300);
  });

  it("replays a confirmed C03 operation while refusing a new C03 operation", async () => {
    const uid = `val-c03-replay-${crypto.randomUUID()}`;
    await participant(uid, ["C03"], "Development");
    const priorResult = { status: "completed", auraAwarded: 200 };
    await refs.operation(uid, "challenge_C03_confirmed").set({ result: priorResult, createdAt: new Date() });
    await refs.score(uid).update({ auraTotal: 200, completedChallenges: 1 });
    expect(await completeChallengeForUid(uid, { challengeId: "C03", operationId: "confirmed" })).toEqual(priorResult);
    await expect(completeChallengeForUid(uid, { challengeId: "C03", operationId: "new" })).rejects.toThrow("CHALLENGE_RETIRED");
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 200, completedChallenges: 1 });
  });

  it("uses one workshop code and one independent talk code, crediting each once", async () => {
    await expect(completeChallengeForUid("val-owner", { challengeId: "C11", operationId: "not-configured", response: { code: "CHARLAPRUEBA02" } })).rejects.toThrow("CODE_NOT_CONFIGURED");
    await refs.challengeSecret("C10").set({ sharedCodeHash: createHash("sha256").update("TALLERPRUEBA01").digest("hex"), sharedCodeActive: true }, { merge: true });
    await refs.challengeSecret("C11").set({ sharedCodeHash: createHash("sha256").update("CHARLAPRUEBA02").digest("hex"), sharedCodeActive: true }, { merge: true });
    expect(await completeChallengeForUid("val-owner", { challengeId: "C11", operationId: "talk-wrong", response: { code: "NOPE" } })).toMatchObject({ status: "retry", auraAwarded: 0 });
    expect(await completeChallengeForUid("val-owner", { challengeId: "C11", operationId: "talk-right", response: { code: "charlaprueba02" } })).toMatchObject({ status: "completed", auraAwarded: 150 });
    expect(await completeChallengeForUid("val-owner", { challengeId: "C10", operationId: "workshop-right", response: { code: "tallerprueba01" } })).toMatchObject({ status: "completed", auraAwarded: 100 });
    expect(await completeChallengeForUid("val-owner", { challengeId: "C10", operationId: "workshop-again", response: { code: "TALLERPRUEBA01" } })).toMatchObject({ status: "completed", auraAwarded: 100 });
    expect((await refs.score("val-owner").get()).data()).toMatchObject({ auraTotal: 550, completedChallenges: 4 });
  });

  it("pauses repeated incorrect session-code guesses", async () => {
    await participant("val-code-tries", ["C10"], "Development");
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(await completeChallengeForUid("val-code-tries", { challengeId: "C10", operationId: `guess-${attempt}`, response: { code: "WRONG" } })).toMatchObject({ status: "retry" });
    }
    await expect(completeChallengeForUid("val-code-tries", { challengeId: "C10", operationId: "guess-11", response: { code: "TALLERPRUEBA01" } })).rejects.toThrow("SESSION_CODE_COOLDOWN");
    expect((await refs.score("val-code-tries").get()).data()?.auraTotal).toBe(0);
  });

  it("accepts the common stand code once and keeps staff tokens available", async () => {
    const uid = `val-stand-code-${crypto.randomUUID()}`;
    await participant(uid, ["C13"], "Cloud");
    await refs.challengeSecret("C13").set({ sharedCodeHash: createHash("sha256").update("STANDPRUEBA03").digest("hex"), sharedCodeActive: true }, { merge: true });
    expect(await completeChallengeForUid(uid, { challengeId: "C13", operationId: "stand-wrong", response: { code: "WRONG" } })).toMatchObject({ status: "retry", auraAwarded: 0 });
    expect(await completeChallengeForUid(uid, { challengeId: "C13", operationId: "stand-right", response: { code: "standprueba03" } })).toMatchObject({ status: "completed", auraAwarded: 250 });
    expect(await completeChallengeForUid(uid, { challengeId: "C13", operationId: "stand-repeat", response: { code: "STANDPRUEBA03" } })).toMatchObject({ status: "completed", auraAwarded: 250 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 250, completedChallenges: 1 });
  });

  it("accepts only an official unexpired, single-use station token", async () => {
    const token = await issueStationTokenForStaff("test-admin", "cloudforge", "val-owner");
    await expect(completeChallengeForUid("val-peer-1", { challengeId: "C13", operationId: "wrong-user", response: { stationToken: token.token } })).rejects.toThrow("STATION_TOKEN_PARTICIPANT_MISMATCH");
    expect(await completeChallengeForUid("val-owner", { challengeId: "C13", operationId: "vr", response: { stationToken: token.token } })).toMatchObject({ status: "completed", auraAwarded: 250 });
    expect((await refs.score("val-owner").get()).data()?.auraTotal).toBe(800);
    expect((await refs.score("val-owner").get()).data()?.totalPoints).toBe(15);
    const shared = await issueStationTokenForStaff("test-admin", "vr-explorer");
    expect(await completeChallengeForUid("val-vr-1", { challengeId: "C14", operationId: "shared-first", response: { stationToken: shared.token } })).toMatchObject({ status: "completed" });
    await expect(completeChallengeForUid("val-vr-2", { challengeId: "C14", operationId: "shared-second", response: { stationToken: shared.token } })).rejects.toThrow("INVALID_STATION_TOKEN");
    const expired = await issueStationTokenForStaff("test-admin", "vr-explorer");
    await refs.challengeProgress("val-vr-2", "C14").set({ eventId: EVENT_ID, userId: "val-vr-2", challengeId: "C14", status: "available" });
    const tokenHash = createHash("sha256").update(expired.token).digest("hex");
    await database.doc(`experienceTokens/${tokenHash}`).update({ expiresAtMillis: Date.now() - 1 });
    await expect(completeChallengeForUid("val-vr-2", { challengeId: "C14", operationId: "expired", response: { stationToken: expired.token } })).rejects.toThrow("INVALID_STATION_TOKEN");
  });

  it("issues a station token only after a trusted VR adapter verifies completion", async () => {
    await expect(issueVerifiedExperienceToken(null, "cloudforge", { participantUid: "val-vr-2", stationId: "vr-explorer", providerProof: "proof" })).rejects.toThrow("EXPERIENCE_ADAPTER_NOT_CONFIGURED");
    await expect(issueVerifiedExperienceToken({ verify: async () => false }, "cloudforge", { participantUid: "val-vr-2", stationId: "vr-explorer", providerProof: "bad" })).rejects.toThrow("INVALID_EXPERIENCE_PROOF");
    const verified = await issueVerifiedExperienceToken({ verify: async (input) => input.providerProof === "verified" }, "vr-provider", { participantUid: "val-vr-2", stationId: "vr-explorer", providerProof: "verified" });
    expect(await completeChallengeForUid("val-vr-2", { challengeId: "C14", operationId: "adapter-verified", response: { stationToken: verified.token } })).toMatchObject({ status: "completed" });
  });

  it("audits administrative controls and stops token issuance at an inactive station", async () => {
    await expect(updateChallengeSettingsForAdmin("test-admin", { challengeId: "C13", active: false, auraReward: 250, description: "CloudForge" })).rejects.toThrow("CLOUDFORGE_REQUIRED");
    await updateExperienceStationForAdmin("test-admin", { stationId: "cloudforge", name: "CloudForge VR", active: false });
    await expect(issueStationTokenForStaff("test-admin", "cloudforge")).rejects.toThrow("STATION_UNAVAILABLE");
  });

  it("prevents pausing a Challenge already assigned to a participant", async () => {
    await expect(updateChallengeSettingsForAdmin("test-admin", { challengeId: "C06", active: false, auraReward: 150, description: "Architecture Builder" })).rejects.toThrow("CHALLENGE_ALREADY_ASSIGNED");
    expect((await refs.challenge("C06").get()).data()?.active).toBe(true);
  });

  it("allows administrators to configure the new selfie rewards", async () => {
    expect(await updateChallengeSettingsForAdmin("test-admin", {
      challengeId: "C16", active: true, auraReward: 100,
      description: "Selfie junto a un speaker del evento."
    })).toMatchObject({ updated: true, challengeId: "C16" });
  });

  it("keeps edited Cloud answers private and updates Track Pulse options", async () => {
    await configureCloudQuestionForAdmin("test-admin", { challengeId: "C09", prompt: "Pista uno\nPista dos", options: [{ id: "lambda", label: "AWS Lambda" }, { id: "s3", label: "Amazon S3" }], correctOptionId: "lambda" });
    expect((await refs.challenge("C09").get()).data()?.configuration?.clues).toEqual(["Pista uno", "Pista dos"]);
    expect((await refs.challenge("C09").get()).data()?.configuration?.correctOptionId).toBeUndefined();
    expect((await refs.challengeSecret("C09").get()).data()?.correctOptionId).toBe("lambda");
    await configureTrackPulseForAdmin("test-admin", { tracks: [{ id: "ai", label: "Inteligencia artificial" }, { id: "cloud", label: "Cloud" }] });
    expect((await refs.challenge("C12").get()).data()?.configuration?.tracks).toHaveLength(2);
  });

  it("does not accept obsolete C08 question edits from administration", async () => {
    await expect(configureCloudQuestionForAdmin("test-admin", {
      challengeId: "C08", prompt: "Old architecture question", options: [
        { id: "sqs", label: "SQS" }, { id: "lambda", label: "Lambda" }, { id: "dynamo", label: "DynamoDB" }
      ], correctOptionId: "dynamo"
    })).rejects.toThrow("INVALID_CLOUD_CONFIGURATION");
  });

  it("lets an administrator rotate a private shared code", async () => {
    const configure = (adminConfig as unknown as { configureEventCodeForAdmin?: (actorUid: string, input: { challengeId: string; code: string; active: boolean }) => Promise<unknown> }).configureEventCodeForAdmin;
    expect(configure).toBeTypeOf("function");
    await configure!("test-admin", { challengeId: "C10", code: "NUEVAPRUEBA04", active: true });
    expect((await refs.challengeSecret("C10").get()).data()).toMatchObject({
      sharedCodeHash: createHash("sha256").update("NUEVAPRUEBA04").digest("hex"), sharedCodeActive: true
    });
    const uid = `val-rotated-${crypto.randomUUID()}`;
    await participant(uid, ["C10"], "Cloud");
    expect(await completeChallengeForUid(uid, { challengeId: "C10", operationId: "old", response: { code: "TALLERPRUEBA01" } })).toMatchObject({ status: "retry" });
    expect(await completeChallengeForUid(uid, { challengeId: "C10", operationId: "new", response: { code: "NUEVAPRUEBA04" } })).toMatchObject({ status: "completed", auraAwarded: 100 });
  });
});
