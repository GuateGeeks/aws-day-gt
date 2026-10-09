import { getStorage } from "firebase-admin/storage";
import { onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import type { PublicVisualizationSnapshot } from "../../../shared/public-visualization";
import type { ChallengeOption } from "../../../shared/challenges/types";
import { adminApp } from "../shared/admin";
import { database, refs } from "../shared/refs";
import {
  buildPublicVisualization,
  type PhotoSigner,
  type VisualizationSourceConnection,
  type VisualizationSourceProgress,
  type VisualizationSourceSubmission,
  type VisualizationSourceUser
} from "./visualization-data";

async function signEvidencePhoto(storagePath: string) {
  const file = getStorage(adminApp).bucket().file(storagePath);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [url] = await file.getSignedUrl({ action: "read", expires: Date.now() + 10 * 60 * 1000, version: "v4" });
  return url;
}

function trackOptions(value: unknown): ChallengeOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option) => {
    if (!option || typeof option !== "object") return [];
    const candidate = option as Record<string, unknown>;
    return typeof candidate.id === "string" && typeof candidate.label === "string"
      ? [{ id: candidate.id, label: candidate.label }]
      : [];
  });
}

export async function getPublicEventVisualizationSnapshot(
  signPhoto: PhotoSigner = signEvidencePhoto
): Promise<PublicVisualizationSnapshot> {
  const [connectionSnapshot, progressSnapshot, submissionSnapshot, trackChallenge] = await Promise.all([
    database.collection("connections").where("eventId", "==", EVENT_ID).limit(601).get(),
    database.collection("challengeProgress").where("eventId", "==", EVENT_ID).limit(1000).get(),
    database.collection("submissions").where("eventId", "==", EVENT_ID).limit(100).get(),
    refs.challenge("C12").get()
  ]);

  const connections = connectionSnapshot.docs.map((document) => document.data() as VisualizationSourceConnection);
  const submissions = submissionSnapshot.docs.map((document) => ({ id: document.id, ...document.data() } as VisualizationSourceSubmission));
  const userIds = new Set<string>();
  for (const connection of connections) {
    if (typeof connection.userId === "string") userIds.add(connection.userId);
    if (typeof connection.peerUid === "string") userIds.add(connection.peerUid);
  }
  for (const submission of submissions) {
    if (submission.status === "approved" && typeof submission.userId === "string") userIds.add(submission.userId);
  }

  const profileRefs = [...userIds].sort().slice(0, 500).map((uid) => refs.user(uid));
  const profileSnapshots = profileRefs.length ? await database.getAll(...profileRefs) : [];
  const users = profileSnapshots
    .filter((document) => document.exists)
    .map((document) => ({ uid: document.id, ...document.data() } as VisualizationSourceUser));

  return buildPublicVisualization({
    eventId: EVENT_ID,
    users,
    connections,
    trackProgress: progressSnapshot.docs.map((document) => document.data() as VisualizationSourceProgress),
    submissions,
    trackOptions: trackOptions(trackChallenge.data()?.configuration?.tracks)
  }, signPhoto);
}

export const getPublicEventVisualization = onCall(
  { region: "us-central1", enforceAppCheck: false, cors: true },
  async () => getPublicEventVisualizationSnapshot()
);
