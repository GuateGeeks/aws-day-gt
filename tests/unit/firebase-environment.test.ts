import { describe, expect, it } from "vitest";
import { resolveFirebaseRuntime } from "../../src/firebase/environment";

describe("Firebase environment selection", () => {
  it("uses the real Firebase project and never connects production to local emulators", () => {
    const runtime = resolveFirebaseRuntime(true, {
      VITE_USE_FIREBASE_EMULATORS: "true",
      VITE_FIREBASE_PROJECT_ID: "demo-aws-day-gt",
      VITE_FIREBASE_STORAGE_BUCKET: "demo-aws-day-gt.appspot.com"
    });

    expect(runtime.useEmulators).toBe(false);
    expect(runtime.firebaseConfig.projectId).toBe("aws-day-gt");
    expect(runtime.firebaseConfig.storageBucket).toBe("aws-day-gt.firebasestorage.app");
  });

  it("keeps emulator support available for local development", () => {
    const runtime = resolveFirebaseRuntime(false, {
      VITE_USE_FIREBASE_EMULATORS: "true",
      VITE_FIREBASE_PROJECT_ID: "demo-aws-day-gt"
    });

    expect(runtime.useEmulators).toBe(true);
    expect(runtime.firebaseConfig.projectId).toBe("demo-aws-day-gt");
  });
});
