// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadBytes } from "firebase/storage";
import { EVENT_ID } from "../../shared/constants";

let environment: RulesTestEnvironment;
const projectId = "aws-day-gt-selfie-rules-test";
const bucket = `gs://${projectId}.firebasestorage.app`;

describe.skipIf(!process.env.FIREBASE_STORAGE_EMULATOR_HOST)("private selfie photo access", () => {
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId,
      storage: { rules: readFileSync("firebase/storage.rules", "utf8"), host: "127.0.0.1", port: 9199 }
    });
  });
  afterAll(async () => { await environment?.cleanup(); });

  it.each(["C16", "C17"])("lets the owner upload %s and only owner or staff view it", async (challengeId) => {
    const path = `evidence/${EVENT_ID}/selfie-owner/${challengeId}/${crypto.randomUUID()}.png`;
    const ownerStorage = environment.authenticatedContext("selfie-owner", { role: "participant" }).storage(bucket);
    const otherStorage = environment.authenticatedContext("selfie-other", { role: "participant" }).storage(bucket);
    const staffStorage = environment.authenticatedContext("selfie-staff", { role: "moderator" }).storage(bucket);
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/v5kAAAAASUVORK5CYII=", "base64");
    await assertSucceeds(uploadBytes(ref(ownerStorage, path), png, { contentType: "image/png" }));
    expect((await assertSucceeds(getBytes(ref(ownerStorage, path)))).byteLength).toBe(png.byteLength);
    await assertSucceeds(getBytes(ref(staffStorage, path)));
    await assertFails(getBytes(ref(otherStorage, path)));
    await assertFails(uploadBytes(ref(otherStorage, path), png, { contentType: "image/png" }));
  });
});
