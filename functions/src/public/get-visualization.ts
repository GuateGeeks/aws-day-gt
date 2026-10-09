import { getStorage } from "firebase-admin/storage";
import { onCall, onRequest } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import type { PublicVisualizationSnapshot } from "../../../shared/public-visualization";
import type { ChallengeOption } from "../../../shared/challenges/types";
import { adminApp } from "../shared/admin";
import { database, refs } from "../shared/refs";
import {
  buildPublicVisualization,
  publicPhotoId,
  resolvePublicPhotoStoragePath,
  type PhotoSigner,
  type VisualizationSourceConnection,
  type VisualizationSourceProgress,
  type VisualizationSourceSubmission,
  type VisualizationSourceUser
} from "./visualization-data";

const publicPhotoUrl: PhotoSigner = async (_storagePath, id) => `/live-media/${id}`;

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
  signPhoto: PhotoSigner = publicPhotoUrl
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

export const getPublicEventImage = onRequest(
  { region: "us-central1", cors: false },
  async (request, response) => {
    if (request.method !== "GET") {
      response.status(405).set("Allow", "GET").send("Method not allowed");
      return;
    }
    const photoId = request.path.split("/").filter(Boolean).at(-1) ?? "";
    if (!/^ph_[a-f0-9]{16}$/.test(photoId)) {
      response.status(404).send("Not found");
      return;
    }

    const submissionSnapshot = await database.collection("submissions").where("eventId", "==", EVENT_ID).limit(100).get();
    const submissions = submissionSnapshot.docs.map((document) => ({ id: document.id, ...document.data() } as VisualizationSourceSubmission));
    const candidate = submissions.find((submission) => publicPhotoId(EVENT_ID, submission.id) === photoId);
    if (!candidate || typeof candidate.userId !== "string") {
      response.status(404).send("Not found");
      return;
    }
    const userSnapshot = await refs.user(candidate.userId).get();
    const users = userSnapshot.exists ? [{ uid: userSnapshot.id, ...userSnapshot.data() } as VisualizationSourceUser] : [];
    const storagePath = resolvePublicPhotoStoragePath(EVENT_ID, photoId, submissions, users);
    if (!storagePath) {
      response.status(404).send("Not found");
      return;
    }

    try {
      const file = getStorage(adminApp).bucket().file(storagePath);
      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType ?? "";
      const size = Number(metadata.size ?? 0);
      if (!contentType.startsWith("image/") || size < 1 || size > 1_572_864) {
        response.status(404).send("Not found");
        return;
      }
      const [bytes] = await file.download();
      response.status(200).set({
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=20",
        "X-Content-Type-Options": "nosniff"
      }).send(bytes);
    } catch {
      response.status(404).send("Not found");
    }
  }
);
