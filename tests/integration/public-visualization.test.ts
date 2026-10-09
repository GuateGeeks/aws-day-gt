// @vitest-environment node
import { describe, expect, it } from "vitest";
import { EVENT_ID } from "../../shared/constants";
import { getPublicEventVisualizationSnapshot } from "../../functions/src/public/get-visualization";
import { database, refs } from "../../functions/src/shared/refs";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("public event visualization", () => {
  it("returns only anonymized connections and approved consented photos", async () => {
    await Promise.all([
      refs.user("public-a").set({ uid: "public-a", alias: "Ada", email: "ada@example.com", primaryRole: "Development", consent: { photoPublication: true } }),
      refs.user("public-b").set({ uid: "public-b", alias: "Nube", email: "nube@example.com", primaryRole: "Cloud", consent: { photoPublication: false } }),
      database.doc(`connections/${EVENT_ID}_public-a_public-b`).set({ eventId: EVENT_ID, userId: "public-a", peerUid: "public-b" }),
      database.doc(`${refs.challengeProgress("public-a", "C12").path}`).set({ eventId: EVENT_ID, userId: "public-a", challengeId: "C12", status: "completed", evidence: { trackId: "ai" } }),
      refs.submission("public-a", "C15").set({ eventId: EVENT_ID, userId: "public-a", missionId: "C15", status: "approved", moderationStatus: "approved", image: { storagePath: `evidence/${EVENT_ID}/public-a/C15/photo.webp` } }),
      refs.submission("public-b", "C16").set({ eventId: EVENT_ID, userId: "public-b", missionId: "C16", status: "approved", moderationStatus: "approved", image: { storagePath: `evidence/${EVENT_ID}/public-b/C16/photo.webp` } }),
      refs.challenge("C12").set({ eventId: EVENT_ID, configuration: { tracks: [{ id: "ai", label: "AI & Agents" }] } })
    ]);

    const snapshot = await getPublicEventVisualizationSnapshot(async (path) => `https://images.example/${encodeURIComponent(path)}`);

    expect(snapshot.edges).toHaveLength(1);
    expect(snapshot.photos).toHaveLength(1);
    expect(snapshot.photos[0]?.alias).toBe("Ada");
    expect(snapshot.tracks[0]).toMatchObject({ id: "ai", label: "AI & Agents", count: 1 });
    expect(JSON.stringify(snapshot)).not.toMatch(/public-a|public-b|ada@example|evidence\//);
  });
});
