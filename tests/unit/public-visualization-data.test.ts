// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { buildPublicVisualization, publicNodeId } from "../../functions/src/public/visualization-data";

const source = {
  eventId: "event-2026",
  generatedAt: "2026-10-10T15:00:00.000Z",
  users: [
    { uid: "uid-a", alias: "Ada", email: "ada@example.com", primaryRole: "Development", consent: { photoPublication: true } },
    { uid: "uid-b", alias: "Nube", email: "nube@example.com", primaryRole: "Cloud", consent: { photoPublication: false } },
    { uid: "uid-c", alias: "Solo", email: "solo@example.com", primaryRole: "Data", consent: { photoPublication: true } }
  ],
  connections: [
    { userId: "uid-a", peerUid: "uid-b" },
    { userId: "uid-b", peerUid: "uid-a" },
    { userId: "uid-a", peerUid: "uid-missing" },
    { userId: "uid-a", peerUid: "uid-a" }
  ],
  trackProgress: [
    { userId: "uid-a", challengeId: "C12", status: "completed", evidence: { trackId: "ai" } },
    { userId: "uid-b", challengeId: "C12", status: "available", evidence: { trackId: "data" } },
    { userId: "uid-c", challengeId: "C12", status: "completed", evidence: { trackId: "unknown" } }
  ],
  submissions: [
    { id: "approved-a", userId: "uid-a", status: "approved", moderationStatus: "approved", image: { storagePath: "evidence/event-2026/uid-a/C15/photo.webp", width: 1200, height: 900 } },
    { id: "no-consent", userId: "uid-b", status: "approved", moderationStatus: "approved", image: { storagePath: "evidence/event-2026/uid-b/C16/photo.webp" } },
    { id: "rejected", userId: "uid-c", status: "rejected", moderationStatus: "rejected", image: { storagePath: "evidence/event-2026/uid-c/C17/photo.webp" } }
  ],
  trackOptions: [{ id: "ai", label: "AI" }, { id: "data", label: "Data" }]
};

describe("public visualization projection", () => {
  it("anonymizes QR connections and filters photos by approval and current consent", async () => {
    const signPhoto = vi.fn(async () => "https://images.example/approved-a.webp?signature=short-lived");
    const result = await buildPublicVisualization(source, signPhoto);

    expect(result.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ alias: "Ada", category: "Development", degree: 1 }),
      expect.objectContaining({ alias: "Nube", category: "Cloud", degree: 1 })
    ]));
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.photos.map((photo) => photo.alias)).toEqual(["Ada"]);
    expect(result.tracks).toEqual([{ id: "ai", label: "AI", count: 1, percentage: 100 }]);
    expect(result.metrics).toMatchObject({ participants: 2, connections: 1, approvedPhotos: 1, leadingTrack: { id: "ai", label: "AI" } });
    expect(signPhoto).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toMatch(/uid-a|ada@example|evidence\//);
  });

  it("skips an approved image when URL signing fails without losing the graph", async () => {
    const result = await buildPublicVisualization(source, async () => null);
    expect(result.photos).toEqual([]);
    expect(result.nodes).toHaveLength(2);
    expect(result.metrics.approvedPhotos).toBe(0);
  });

  it("creates deterministic event-scoped opaque IDs", () => {
    expect(publicNodeId("event-2026", "uid-a")).toMatch(/^p_[a-f0-9]{16}$/);
    expect(publicNodeId("event-2026", "uid-a")).toBe(publicNodeId("event-2026", "uid-a"));
    expect(publicNodeId("event-2027", "uid-a")).not.toBe(publicNodeId("event-2026", "uid-a"));
  });
});
