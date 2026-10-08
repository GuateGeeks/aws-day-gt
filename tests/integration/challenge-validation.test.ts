// @vitest-environment node
import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { EVENT_ID } from "../../shared/constants";
import { challengeSecrets } from "../../scripts/data/challenge-secrets";
import { experienceStations } from "../../shared/challenges/stations";
import { completeChallengeForUid } from "../../functions/src/challenges/complete";
import { configureEventCodeForAdmin, configureSessionForAdmin } from "../../functions/src/challenges/admin-config";
import { issueGeekIdForUid } from "../../functions/src/challenges/tokens";
import { refs } from "../../functions/src/shared/refs";

async function participant(ids: string[], primaryRole = "Cloud") {
  const uid = `validation-${crypto.randomUUID()}`;
  await refs.user(uid).set({ uid, alias: uid, onboardingComplete: true, primaryRole, experienceLevel: "Junior", firstAwsCommunityDay: false, awsInterest: ["Serverless"] });
  await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: 0, completedChallenges: 0 });
  await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: ids, version: 2 });
  await Promise.all(ids.map((id) => refs.challengeProgress(uid, id).set({ eventId: EVENT_ID, userId: uid, challengeId: id, status: "available" })));
  return uid;
}

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("credit challenge validation", () => {
  beforeAll(async () => {
    await Promise.all(challenges.map((item) => refs.challenge(item.id).set(item)));
    await Promise.all(challengeSecrets.map((secret) => refs.challengeSecret(secret.challengeId).set(secret)));
    await Promise.all(experienceStations.map((station) => refs.experienceStation(station.id).set(station)));
  });

  it("deducts 20 credits once for a wrong architecture sequence and explains the error", async () => {
    const uid = await participant(["C06"]);
    const first = await completeChallengeForUid(uid, { challengeId: "C06", operationId: "wrong", response: { sequence: ["lambda", "api-gateway", "dynamodb"] } });
    expect(first).toMatchObject({ status: "failed", auraAwarded: 0, auraDeducted: 20 });
    expect(first.incorrectReason).toContain("En el paso 1");
    expect(first.solution).toContain("Amazon API Gateway");
    expect(await completeChallengeForUid(uid, { challengeId: "C06", operationId: "later-correct", response: { sequence: ["api-gateway", "lambda", "dynamodb"] } })).toEqual(first);
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: -20, auraDeductedTotal: 20 });
  });

  it("deducts 10 credits for a wrong AWS matching answer, not for an incomplete answer", async () => {
    const uid = await participant(["C07"]);
    await expect(completeChallengeForUid(uid, { challengeId: "C07", operationId: "missing", response: { matches: { files: "s3" } } })).rejects.toThrow("INVALID_CHALLENGE_RESPONSE");
    expect((await refs.score(uid).get()).data()?.auraTotal).toBe(0);
    const result = await completeChallengeForUid(uid, { challengeId: "C07", operationId: "wrong", response: { matches: { files: "lambda", code: "s3", nosql: "dynamodb", genai: "bedrock" } } });
    expect(result).toMatchObject({ status: "failed", auraDeducted: 10 });
    expect(result.incorrectReason).toContain("Guardar archivos");
    expect(result.solution).toContain("Amazon S3");
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: -10, auraDeductedTotal: 10 });
  });

  it("charges a wrong AWS question only once even for concurrent submissions", async () => {
    const uid = await participant(["C09"]);
    const [first, second] = await Promise.all([
      completeChallengeForUid(uid, { challengeId: "C09", operationId: "wrong-one", response: { optionId: "s3" } }),
      completeChallengeForUid(uid, { challengeId: "C09", operationId: "wrong-two", response: { optionId: "ec2" } })
    ]);
    expect(first).toMatchObject({ status: "failed", auraDeducted: 10 });
    expect(second).toMatchObject({ status: "failed", auraDeducted: 10 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: -10, auraDeductedTotal: 10 });
  });

  it.each([
    ["C18", "sns", "distribuye avisos"], ["C19", "sqs", "guarda mensajes"],
    ["C20", "cloudwatch", "observar el sistema"], ["C21", "sns", "distribuye mensajes"],
    ["C22", "s3", "almacena objetos"], ["C23", "route53", "administra DNS"]
  ])("explains why %s is wrong and deducts 10 credits", async (challengeId, optionId, reason) => {
    const uid = await participant([challengeId]);
    const result = await completeChallengeForUid(uid, { challengeId, operationId: "wrong", response: { optionId } });
    expect(result).toMatchObject({ status: "failed", auraDeducted: 10 });
    expect(result.incorrectReason).toContain(reason);
    expect(result.solution).toContain("Respuesta correcta");
    expect((await refs.score(uid).get()).data()?.auraTotal).toBe(-10);
  });

  it("deducts 20 credits for a wrong architecture selection at either step", async () => {
    for (const stage of [0, 1]) {
      const uid = await participant(["C08"]);
      if (stage === 1) await completeChallengeForUid(uid, { challengeId: "C08", operationId: "first", response: { stage: 0, optionId: "dynamo" } });
      const result = await completeChallengeForUid(uid, { challengeId: "C08", operationId: `wrong-${stage}`, response: { stage, optionId: stage === 0 ? "sqs" : "dynamo" } });
      expect(result).toMatchObject({ status: "failed", auraDeducted: 20 });
      expect(result.incorrectReason).toBeTruthy();
      expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: -20, auraDeductedTotal: 20 });
    }
  });

  it("awards the normal reward for correct AWS answers", async () => {
    const uid = await participant(["C18"]);
    expect(await completeChallengeForUid(uid, { challengeId: "C18", operationId: "correct", response: { optionId: "sqs" } })).toMatchObject({ status: "completed", auraAwarded: 150 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 150, completedChallenges: 1 });
  });

  it("rejects retired workshop, talk and duplicate VR challenges even with old assignments", async () => {
    const uid = await participant(["C10", "C11", "C14"]);
    for (const id of ["C10", "C11", "C14"]) {
      await expect(completeChallengeForUid(uid, { challengeId: id, operationId: `new-${id}`, response: { code: "EXAMPLE" } })).rejects.toThrow("CHALLENGE_RETIRED");
    }
    await expect(configureSessionForAdmin("admin", {})).rejects.toThrow("CHALLENGE_RETIRED");
    await expect(configureEventCodeForAdmin("admin", { challengeId: "C10", code: "EXAMPLE", active: true })).rejects.toThrow("INVALID_EVENT_CODE_CONFIGURATION");
  });

  it("keeps the GuateGeeks VR code active and credits it once", async () => {
    const uid = await participant(["C13"]);
    await configureEventCodeForAdmin("admin", { challengeId: "C13", code: "STANDPRUEBA03", active: true });
    expect((await refs.challengeSecret("C13").get()).data()?.sharedCodeHash).toBe(createHash("sha256").update("STANDPRUEBA03").digest("hex"));
    expect(await completeChallengeForUid(uid, { challengeId: "C13", operationId: "wrong", response: { code: "NOPE" } })).toMatchObject({ status: "retry", auraAwarded: 0 });
    expect(await completeChallengeForUid(uid, { challengeId: "C13", operationId: "correct", response: { code: "standprueba03" } })).toMatchObject({ status: "completed", auraAwarded: 250 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 250, completedChallenges: 1 });
  });

  it("still connects two participants through Geek ID", async () => {
    const owner = await participant(["C01"], "Development");
    const peer = await participant([], "Data");
    const ownToken = await issueGeekIdForUid(owner);
    await expect(completeChallengeForUid(owner, { challengeId: "C01", operationId: "self", response: { geekToken: ownToken.token } })).rejects.toThrow("SELF_SCAN");
    const peerToken = await issueGeekIdForUid(peer);
    expect(await completeChallengeForUid(owner, { challengeId: "C01", operationId: "pair", response: { geekToken: peerToken.token } })).toMatchObject({ status: "completed", auraAwarded: 150 });
  });
});
