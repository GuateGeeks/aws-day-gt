import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Firestore browser cache", () => {
  it("uses persistent multi-tab cache with a memory fallback", () => {
    const source = readFileSync("src/firebase/data.ts", "utf8");
    expect(source).toContain("persistentLocalCache");
    expect(source).toContain("persistentMultipleTabManager");
    expect(source).toContain("memoryLocalCache");
  });
});
