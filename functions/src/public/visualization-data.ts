import { createHash } from "node:crypto";
import { primaryRoles, type ChallengeProfile } from "../../../shared/challenges/profile";
import { publicVisualizationSchema, type PublicVisualizationSnapshot } from "../../../shared/public-visualization";

type PrimaryRole = ChallengeProfile["primaryRole"];

export interface VisualizationSourceUser {
  uid: string;
  alias?: unknown;
  primaryRole?: unknown;
  consent?: { photoPublication?: unknown };
  [key: string]: unknown;
}

export interface VisualizationSourceConnection { userId?: unknown; peerUid?: unknown }
export interface VisualizationSourceProgress {
  userId?: unknown;
  challengeId?: unknown;
  status?: unknown;
  evidence?: { trackId?: unknown };
}
export interface VisualizationSourceSubmission {
  id: string;
  userId?: unknown;
  status?: unknown;
  moderationStatus?: unknown;
  image?: { storagePath?: unknown; width?: unknown; height?: unknown };
}
export interface VisualizationTrackOption { id: string; label: string }

export interface VisualizationSource {
  eventId: string;
  generatedAt?: string;
  users: ReadonlyArray<VisualizationSourceUser>;
  connections: ReadonlyArray<VisualizationSourceConnection>;
  trackProgress: ReadonlyArray<VisualizationSourceProgress>;
  submissions: ReadonlyArray<VisualizationSourceSubmission>;
  trackOptions: ReadonlyArray<VisualizationTrackOption>;
}

export type PhotoSigner = (storagePath: string) => Promise<string | null>;

function digest(prefix: string, value: string) {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

export function publicNodeId(eventId: string, uid: string) {
  return digest("p", `${eventId}:${uid}`);
}

function cleanAlias(value: unknown) {
  if (typeof value !== "string") return null;
  const alias = value.normalize("NFC").trim().slice(0, 24);
  return alias || null;
}

function cleanRole(value: unknown): PrimaryRole {
  return typeof value === "string" && (primaryRoles as readonly string[]).includes(value)
    ? value as PrimaryRole
    : "Other";
}

function positiveDimension(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0 && Number(value) <= 10_000 ? Number(value) : undefined;
}

export async function buildPublicVisualization(
  input: VisualizationSource,
  signPhoto: PhotoSigner
): Promise<PublicVisualizationSnapshot> {
  const users = new Map(input.users.map((user) => [user.uid, user]));
  const uniquePairs = new Map<string, [string, string]>();

  for (const connection of input.connections) {
    if (typeof connection.userId !== "string" || typeof connection.peerUid !== "string") continue;
    if (connection.userId === connection.peerUid || !users.has(connection.userId) || !users.has(connection.peerUid)) continue;
    if (!cleanAlias(users.get(connection.userId)?.alias) || !cleanAlias(users.get(connection.peerUid)?.alias)) continue;
    const pair = [connection.userId, connection.peerUid].sort() as [string, string];
    uniquePairs.set(pair.join("\0"), pair);
  }

  const degreeByUid = new Map<string, number>();
  for (const [source, target] of uniquePairs.values()) {
    degreeByUid.set(source, (degreeByUid.get(source) ?? 0) + 1);
    degreeByUid.set(target, (degreeByUid.get(target) ?? 0) + 1);
  }

  const includedUids = [...degreeByUid]
    .sort(([uidA, degreeA], [uidB, degreeB]) => degreeB - degreeA || publicNodeId(input.eventId, uidA).localeCompare(publicNodeId(input.eventId, uidB)))
    .slice(0, 250)
    .map(([uid]) => uid);
  const included = new Set(includedUids);

  const nodes = includedUids.map((uid) => {
    const user = users.get(uid)!;
    return {
      id: publicNodeId(input.eventId, uid),
      alias: cleanAlias(user.alias)!,
      category: cleanRole(user.primaryRole),
      degree: degreeByUid.get(uid) ?? 0
    };
  });

  const edges = [...uniquePairs.values()]
    .filter(([source, target]) => included.has(source) && included.has(target))
    .map(([source, target]) => {
      const publicSource = publicNodeId(input.eventId, source);
      const publicTarget = publicNodeId(input.eventId, target);
      return {
        id: digest("e", `${input.eventId}:${publicSource}:${publicTarget}`),
        source: publicSource,
        target: publicTarget
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 600);

  const options = new Map(input.trackOptions.filter((option) => option.id && option.label).map((option) => [option.id, option.label.trim().slice(0, 100)]));
  const trackCounts = new Map<string, number>();
  for (const progress of input.trackProgress) {
    const trackId = progress.evidence?.trackId;
    if (progress.challengeId !== "C12" || progress.status !== "completed" || typeof trackId !== "string" || !options.has(trackId)) continue;
    trackCounts.set(trackId, (trackCounts.get(trackId) ?? 0) + 1);
  }
  const totalTrackSelections = [...trackCounts.values()].reduce((total, count) => total + count, 0);
  const tracks = [...trackCounts]
    .map(([id, count]) => ({ id, label: options.get(id)!, count, percentage: totalTrackSelections ? Math.round((count / totalTrackSelections) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);

  const eligiblePhotos = input.submissions
    .filter((submission) => {
      if (submission.status !== "approved" || submission.moderationStatus !== "approved") return false;
      if (typeof submission.userId !== "string" || typeof submission.image?.storagePath !== "string") return false;
      const user = users.get(submission.userId);
      return user?.consent?.photoPublication === true && cleanAlias(user.alias) !== null;
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 24);

  const photos = (await Promise.all(eligiblePhotos.map(async (submission) => {
    const storagePath = submission.image!.storagePath as string;
    let url: string | null = null;
    try { url = await signPhoto(storagePath); } catch { return null; }
    if (!url || typeof submission.userId !== "string") return null;
    const user = users.get(submission.userId)!;
    return {
      id: digest("ph", `${input.eventId}:${submission.id}`),
      alias: cleanAlias(user.alias)!,
      url,
      ...(positiveDimension(submission.image?.width) ? { width: positiveDimension(submission.image?.width) } : {}),
      ...(positiveDimension(submission.image?.height) ? { height: positiveDimension(submission.image?.height) } : {})
    };
  }))).filter((photo): photo is NonNullable<typeof photo> => photo !== null);

  const leadingTrack = tracks[0] ? { id: tracks[0].id, label: tracks[0].label } : null;
  const insights = [
    edges.length ? `La comunidad ya creó ${edges.length} ${edges.length === 1 ? "conexión" : "conexiones"} por QR.` : "La nube de conexiones está empezando a formarse.",
    nodes.length ? `${nodes.length} ${nodes.length === 1 ? "persona conectada" : "personas conectadas"} están haciendo comunidad.` : "Cada lectura de QR encenderá un nuevo punto en la nube.",
    ...(leadingTrack ? [`${leadingTrack.label} lidera las preferencias de tracks.`] : [])
  ].slice(0, 4);

  return publicVisualizationSchema.parse({
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    eventId: input.eventId,
    nodes,
    edges,
    photos,
    tracks,
    insights,
    metrics: {
      participants: nodes.length,
      connections: edges.length,
      approvedPhotos: photos.length,
      leadingTrack
    }
  });
}
