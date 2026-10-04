import { describe, expect, it } from "vitest";

describe("Firebase configuration", () => {
  it("uses the supplied aws-day-gt identifiers", async () => {
    const { firebaseConfig } = await import("../../src/firebase/app");
    expect(firebaseConfig.projectId).toBe("aws-day-gt");
    expect(firebaseConfig.appId).toBe("1:704203243247:web:0479108dbe29978bc1651a");
    expect(firebaseConfig.storageBucket).toBe("aws-day-gt.firebasestorage.app");
  });
});
