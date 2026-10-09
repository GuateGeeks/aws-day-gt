// @vitest-environment node
import { describe, expect, it } from "vitest";
import { publicPhotoId, resolvePublicPhotoStoragePath } from "../../functions/src/public/visualization-data";

const eventId = "event-2026";
const approved = { id: "submission-a", userId: "uid-a", status: "approved", moderationStatus: "approved", image: { storagePath: "evidence/event-2026/uid-a/C15/photo.webp" } };

describe("public visualization image authorization", () => {
  it("resolves only an approved image owned by a currently consenting user", () => {
    const id = publicPhotoId(eventId, approved.id);
    expect(resolvePublicPhotoStoragePath(eventId, id, [approved], [{ uid: "uid-a", alias: "Ada", consent: { photoPublication: true } }]))
      .toBe(approved.image.storagePath);
  });

  it("rejects revoked consent, rejected moderation, forged IDs, and mismatched paths", () => {
    const id = publicPhotoId(eventId, approved.id);
    expect(resolvePublicPhotoStoragePath(eventId, id, [approved], [{ uid: "uid-a", alias: "Ada", consent: { photoPublication: false } }])).toBeNull();
    expect(resolvePublicPhotoStoragePath(eventId, id, [{ ...approved, moderationStatus: "rejected" }], [{ uid: "uid-a", alias: "Ada", consent: { photoPublication: true } }])).toBeNull();
    expect(resolvePublicPhotoStoragePath(eventId, "ph_aaaaaaaaaaaaaaaa", [approved], [{ uid: "uid-a", alias: "Ada", consent: { photoPublication: true } }])).toBeNull();
    expect(resolvePublicPhotoStoragePath(eventId, id, [{ ...approved, image: { storagePath: "evidence/event-2026/uid-b/C15/photo.webp" } }], [{ uid: "uid-a", alias: "Ada", consent: { photoPublication: true } }])).toBeNull();
  });
});
