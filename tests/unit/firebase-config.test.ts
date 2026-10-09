import { describe, expect, it } from "vitest";
import { resolveFirebaseRuntime } from "../../src/firebase/environment";

describe("Firebase configuration", () => {
  it("uses the supplied aws-day-gt identifiers in production", () => {
    const { firebaseConfig } = resolveFirebaseRuntime(true, import.meta.env);
    expect(firebaseConfig.projectId).toBe("aws-day-gt");
    expect(firebaseConfig.appId).toBe("1:704203243247:web:0479108dbe29978bc1651a");
    expect(firebaseConfig.storageBucket).toBe("aws-day-gt.firebasestorage.app");
  });
});
