// @vitest-environment node
import { describe, expect, it } from "vitest";
import { adminApp } from "../../functions/src/shared/admin";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("integration emulator namespace", () => {
  it("uses a fresh project and matching Storage bucket instead of the demo project", () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const config = JSON.parse(process.env.FIREBASE_CONFIG ?? "{}") as { projectId?: string; storageBucket?: string };
    expect(projectId).toMatch(/^aws-day-gt-test-[a-f0-9]{12}$/);
    expect(config.projectId).toBe(projectId);
    expect(config.storageBucket).toBe(`${projectId}.firebasestorage.app`);
    expect(adminApp.options.projectId).toBe(projectId);
    expect(adminApp.options.storageBucket).toBe(config.storageBucket);
  });
});
