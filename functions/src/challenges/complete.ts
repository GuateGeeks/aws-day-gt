import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import { isAwsServiceChallengeId } from "../../../shared/challenges/bonus";
import { incorrectAnswerPenalty } from "../../../shared/challenges/credit-policy";
import { challengeProfileSchema } from "../../../shared/challenges/profile";
import type { Challenge, ChallengeProgress } from "../../../shared/challenges/types";
import { validateCloudResponse, validateCloudTrio, validateSocialPair, validateTrack, type ChallengeResponse } from "../../../shared/challenges/validators";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";

type CompletionInput = { challengeId: string; operationId: string; response?: ChallengeResponse & { geekToken?: string } };

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const socialIds = new Set(["C01", "C02", "C04"]);
const cloudIds = new Set(["C06", "C07", "C08", "C09", "C18", "C19", "C20", "C21", "C22", "C23"]);
const architectureAnswers = ["dynamo", "lambda"] as const;

function validCloudChoice(challenge: Challenge, response: ChallengeResponse, expected: Record<string, unknown>) {
  const { items, prompts, options } = challenge.configuration;
  if (challenge.id === "C06") return Array.isArray(expected.expectedSequence) && !!items && Array.isArray(response.sequence) && response.sequence.length === items.length &&
    new Set(response.sequence).size === items.length && response.sequence.every((id) => items.some((item) => item.id === id));
  if (challenge.id === "C07") return !!expected.expectedMatches && !!response.matches && !!prompts && !!options &&
    Object.keys(response.matches).length === prompts.length && prompts.every((prompt) => options.some((option) => option.id === response.matches?.[prompt.id]));
  return typeof response.optionId === "string" && !!options?.some((option) => option.id === response.optionId) &&
    typeof expected.correctOptionId === "string";
}

function cloudSolution(challenge: Challenge, answer: Record<string, unknown>) {
  const { items, prompts, options } = challenge.configuration;
  const label = (id: string, choices = options) => choices?.find((choice) => choice.id === id)?.label ?? id;
  if (challenge.id === "C06") return `Orden correcto: ${(answer.expectedSequence as string[]).map((id) => label(id, items)).join(" → ")}.`;
  if (challenge.id === "C07") return `Relaciones correctas: ${prompts?.map((prompt) => `${prompt.label} → ${label((answer.expectedMatches as Record<string, string>)[prompt.id]!)}`).join("; ")}.`;
  return `Respuesta correcta: ${label(answer.correctOptionId as string)}. ${typeof answer.correctExplanation === "string" ? answer.correctExplanation : ""}`.trim();
}

function cloudIncorrectReason(challenge: Challenge, response: ChallengeResponse, answer: Record<string, unknown>) {
  const { items, prompts, options } = challenge.configuration;
  const label = (id: string, choices = options) => choices?.find((option) => option.id === id)?.label ?? id;
  if (challenge.id === "C06") {
    const expected = answer.expectedSequence as string[];
    const index = expected.findIndex((id, position) => id !== response.sequence?.[position]);
    return `En el paso ${index + 1} elegiste ${label(response.sequence![index]!, items)}; para ese lugar corresponde ${label(expected[index]!, items)}.`;
  }
  if (challenge.id === "C07") {
    const expected = answer.expectedMatches as Record<string, string>;
    const prompt = prompts!.find((item) => response.matches?.[item.id] !== expected[item.id])!;
    return `Para «${prompt.label}» elegiste ${label(response.matches![prompt.id]!)}; esa relación no resuelve la necesidad indicada.`;
  }
  if (challenge.id === "C08") return response.stage === 0
    ? `${label(response.optionId!)} no ofrece la escritura condicional en la base de datos que impide guardar dos veces esta inscripción.`
    : `${label(response.optionId!)} no ejecuta la lógica de validación de cada evento; ese procesamiento corresponde a una función.`;
  if (challenge.id === "C09") return ({
    s3: "Amazon S3 almacena objetos; no ejecuta código cuando ocurre un evento.",
    ec2: "Amazon EC2 ofrece servidores virtuales que debes administrar; las pistas describen ejecución sin administrar servidores.",
    cloudfront: "Amazon CloudFront distribuye contenido; no ejecuta esta lógica de aplicación por evento."
  } as Record<string, string>)[response.optionId!] ?? "El servicio elegido no ejecuta código por evento sin administrar servidores.";
  const savedReason = (answer.wrongReasons as Record<string, string> | undefined)?.[response.optionId!];
  if (savedReason) return savedReason;
  return `${label(response.optionId!)} no cumple la función descrita por las pistas de este reto.`;
}

export async function completeChallengeForUid(uid: string, input: CompletionInput) {
  if (!/^C(?:0[1-9]|1[0-9]|2[0-3])$/.test(input?.challengeId ?? "") || !/^[a-zA-Z0-9_-]{1,80}$/.test(input?.operationId ?? "")) {
    throw new HttpsError("invalid-argument", "INVALID_CHALLENGE_REQUEST");
  }
  const { challengeId, operationId } = input;
  const response = input.response ?? {};
  const assignmentRef = refs.challengeAssignment(uid);
  const progressRef = refs.challengeProgress(uid, challengeId);
  const challengeRef = refs.challenge(challengeId);
  const scoreRef = refs.score(uid);
  const operationRef = refs.operation(uid, `challenge_${challengeId}_${operationId}`);
  const answerRef = refs.challengeSecret(challengeId);
  const geekToken = typeof response.geekToken === "string" && response.geekToken.length <= 300 ? response.geekToken : "";
  const geekRef = database.doc(`geekIdTokens/${digest(geekToken)}`);

  return database.runTransaction(async (transaction) => {
    const [assignment, progress, challengeSnap, score, operation] = await Promise.all([
      transaction.get(assignmentRef), transaction.get(progressRef), transaction.get(challengeRef),
      transaction.get(scoreRef), transaction.get(operationRef)
    ]);
    if (operation.exists) return operation.data()?.result;
    if (["C03", "C05", "C10", "C11", "C13", "C14"].includes(challengeId)) throw new HttpsError("failed-precondition", "CHALLENGE_RETIRED");
    const assigned = assignment.data()?.challengeIds?.includes(challengeId) ||
      (isAwsServiceChallengeId(challengeId) && assignment.data()?.bonusChallengeIds?.includes(challengeId));
    if (!assignment.exists || assignment.data()?.eventId !== EVENT_ID || !assigned || !progress.exists || progress.data()?.eventId !== EVENT_ID || !score.exists || score.data()?.eventId !== EVENT_ID) {
      throw new HttpsError("failed-precondition", "CHALLENGE_NOT_ASSIGNED");
    }
    if (!challengeSnap.exists || !challengeSnap.data()?.active || challengeSnap.data()?.eventId !== EVENT_ID) {
      throw new HttpsError("failed-precondition", "CHALLENGE_INACTIVE");
    }
    const challenge = challengeSnap.data() as Challenge;
    const wrongAnswerCost = incorrectAnswerPenalty(challenge);
    const current = progress.data() as ChallengeProgress;
    if (current.status === "completed") return { status: "completed", auraAwarded: current.auraAwarded ?? challenge.auraReward };
    if (current.status === "failed") return { status: "failed", auraAwarded: 0, auraDeducted: current.auraDeducted ?? wrongAnswerCost, solution: current.solution ?? "Consulta la solución con el equipo del evento.", ...(current.incorrectReason ? { incorrectReason: current.incorrectReason } : {}) };
    if (current.status === "locked" || current.status === "processing") throw new HttpsError("failed-precondition", "CHALLENGE_UNAVAILABLE");
    if (challengeId === "C15") throw new HttpsError("failed-precondition", "PHOTO_REVIEW_REQUIRED");

    let evidence: Record<string, unknown> = {};
    let partialPeerIds: string[] | undefined;
    let connectionRef: FirebaseFirestore.DocumentReference | undefined;
    let connectedPeerUid: string | undefined;
    let connectionLabel: string | undefined;
    const fail = (solution: string, incorrectReason: string) => {
      const now = FieldValue.serverTimestamp();
      const result = { status: "failed", auraAwarded: 0, auraDeducted: wrongAnswerCost, solution, incorrectReason };
      transaction.update(progressRef, { status: "failed", auraAwarded: 0, auraDeducted: wrongAnswerCost, solution, incorrectReason, failedAt: now, updatedAt: now });
      transaction.set(scoreRef, {
        auraTotal: (Number(score.data()?.auraTotal) || 0) - wrongAnswerCost,
        auraDeductedTotal: (Number(score.data()?.auraDeductedTotal) || 0) + wrongAnswerCost,
        auraReachedAt: now, updatedAt: now
      }, { merge: true });
      transaction.create(operationRef, { result, createdAt: now });
      return result;
    };
    if (challengeId === "C08") {
      const expectedStage = current.architectureStep ?? 0;
      if (response.stage !== expectedStage) throw new HttpsError("failed-precondition", "CHALLENGE_STAGE_MISMATCH");
      if (!challenge.configuration.options?.some((option) => option.id === response.optionId)) throw new HttpsError("invalid-argument", "INVALID_CHALLENGE_RESPONSE");
      if (response.optionId !== architectureAnswers[expectedStage]) return fail(`Respuesta correcta: ${challenge.configuration.options.find((option) => option.id === architectureAnswers[expectedStage])?.label}.`, cloudIncorrectReason(challenge, response, {}));
      if (expectedStage === 0) {
        const now = FieldValue.serverTimestamp();
        transaction.update(progressRef, { status: "in_progress", architectureStep: 1, auraAwarded: 0, updatedAt: now });
        const result = { status: "in_progress", stage: 1, auraAwarded: 0 };
        transaction.create(operationRef, { result, createdAt: now });
        return result;
      }
      evidence = { architectureSteps: ["dynamo", "lambda"] };
    } else if (cloudIds.has(challengeId)) {
      const answer = await transaction.get(answerRef);
      if (!answer.exists) throw new HttpsError("failed-precondition", "CHALLENGE_NOT_CONFIGURED");
      if (!validCloudChoice(challenge, response, answer.data() ?? {})) throw new HttpsError("invalid-argument", "INVALID_CHALLENGE_RESPONSE");
      if (!validateCloudResponse(challenge, response, answer.data() ?? {})) return fail(cloudSolution(challenge, answer.data() ?? {}), cloudIncorrectReason(challenge, response, answer.data() ?? {}));
      evidence = { response };
    } else if (challengeId === "C12") {
      if (!validateTrack(response.trackId, challenge.configuration.tracks)) throw new HttpsError("invalid-argument", "INVALID_TRACK");
      evidence = { trackId: response.trackId };
    } else if (socialIds.has(challengeId)) {
      if (!geekToken) throw new HttpsError("invalid-argument", "GEEK_TOKEN_REQUIRED");
      const token = await transaction.get(geekRef);
      const peerUid = token.data()?.uid;
      if (!token.exists || token.data()?.eventId !== EVENT_ID || typeof peerUid !== "string" || token.data()?.expiresAtMillis <= Date.now()) {
        throw new HttpsError("failed-precondition", "GEEK_TOKEN_EXPIRED");
      }
      if (peerUid === uid) throw new HttpsError("failed-precondition", "SELF_SCAN");
      const [ownerSnap, peerSnap] = await Promise.all([transaction.get(refs.user(uid)), transaction.get(refs.user(peerUid))]);
      const owner = challengeProfileSchema.safeParse(ownerSnap.data());
      const peer = challengeProfileSchema.safeParse(peerSnap.data());
      if (!owner.success || !peer.success) throw new HttpsError("failed-precondition", "CHALLENGE_PROFILE_REQUIRED");
      connectionLabel = `${owner.data.primaryRole} × ${peer.data.primaryRole}`;
      if (challengeId === "C03") {
        const existingIds = current.scannedUserIds ?? [];
        if (existingIds.includes(peerUid)) return { status: "in_progress", auraAwarded: 0, scanned: existingIds.length };
        if (peer.data.primaryRole === owner.data.primaryRole) return { status: "retry", auraAwarded: 0 };
        const nextIds = [...existingIds, peerUid];
        if (nextIds.length < 2) partialPeerIds = nextIds;
        else {
          const firstPeer = challengeProfileSchema.safeParse((await transaction.get(refs.user(nextIds[0]!))).data());
          if (!firstPeer.success || !validateCloudTrio(owner.data, [firstPeer.data, peer.data])) return { status: "retry", auraAwarded: 0 };
        }
        evidence = { scannedUserIds: nextIds };
      } else {
        if (!validateSocialPair(challengeId, owner.data, peer.data)) return { status: "retry", auraAwarded: 0 };
        evidence = { peerUid };
      }
      connectedPeerUid = peerUid;
      connectionRef = database.doc(`connections/${EVENT_ID}_${uid}_${peerUid}`);
    } else {
      throw new HttpsError("failed-precondition", "VALIDATOR_UNAVAILABLE");
    }

    const now = FieldValue.serverTimestamp();
    if (partialPeerIds) {
      if (connectionRef && connectedPeerUid) transaction.set(connectionRef, { eventId: EVENT_ID, userId: uid, peerUid: connectedPeerUid, challengeIds: FieldValue.arrayUnion(challengeId), updatedAt: now }, { merge: true });
      transaction.update(progressRef, { status: "in_progress", scannedUserIds: partialPeerIds, updatedAt: now });
      const result = { status: "in_progress", auraAwarded: 0, scanned: partialPeerIds.length };
      transaction.create(operationRef, { result, createdAt: now });
      return result;
    }
    transaction.update(progressRef, { status: "completed", completedAt: now, updatedAt: now, auraAwarded: challenge.auraReward, evidence });
    if (connectionRef && connectedPeerUid) transaction.set(connectionRef, { eventId: EVENT_ID, userId: uid, peerUid: connectedPeerUid, challengeIds: FieldValue.arrayUnion(challengeId), updatedAt: now }, { merge: true });
    transaction.set(scoreRef, {
      auraTotal: (Number(score.data()?.auraTotal) || 0) + challenge.auraReward,
      completedChallenges: (Number(score.data()?.completedChallenges) || 0) + 1,
      auraReachedAt: now, updatedAt: now
    }, { merge: true });
    const result = { status: "completed", auraAwarded: challenge.auraReward, ...(connectionLabel ? { connection: connectionLabel } : {}) };
    transaction.create(operationRef, { result, createdAt: now });
    return result;
  });
}

export const completeChallenge = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return completeChallengeForUid(requireUid(request), request.data);
});
