import { describe, expect, it } from "vitest";
import { storageCors } from "../../scripts/data/storage-cors";

describe("Storage CORS", () => {
  it("allows authenticated evidence downloads only from application origins", () => {
    expect(storageCors).toEqual([{
      origin: ["https://aws-day-gt.web.app", "https://aws-day-gt.firebaseapp.com", "http://localhost:5173"],
      method: ["GET"],
      responseHeader: ["Content-Type"],
      maxAgeSeconds: 3600
    }]);
    expect(storageCors[0]!.origin).not.toContain("*");
  });
});
