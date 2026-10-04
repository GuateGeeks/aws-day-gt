import { describe, expect, it } from "vitest";
import { normalizeWord, validateEvidence } from "../../shared/validation";

describe("evidence validation", () => {
  it("accepts and trims one Unicode word", () => {
    expect(normalizeWord("  Nube  ")).toBe("Nube");
    expect(normalizeWord("  ilusión  ")).toBe("ilusión");
  });

  it("rejects phrases for word missions", () => {
    expect(() =>
      validateEvidence({ evidenceType: "word", minLength: 2, maxLength: 30 }, "dos palabras"),
    ).toThrowError("INVALID_WORD");
  });

  it("enforces comment length limits", () => {
    expect(() =>
      validateEvidence({ evidenceType: "comment", minLength: 20, maxLength: 400 }, "muy corto"),
    ).toThrowError("TEXT_TOO_SHORT");
    expect(validateEvidence({ evidenceType: "comment", minLength: 5, maxLength: 20 }, "  Una idea útil.  "))
      .toBe("Una idea útil.");
  });

  it("rejects URLs in one-word evidence", () => {
    expect(() =>
      validateEvidence({ evidenceType: "word", minLength: 2, maxLength: 30 }, "https://aws.amazon.com"),
    ).toThrowError("URL_NOT_ALLOWED");
  });
});
