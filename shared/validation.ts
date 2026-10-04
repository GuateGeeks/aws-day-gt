import { DomainError } from "./errors";
import type { EvidenceValidation } from "./types";

export function normalizeWord(value: string): string {
  return value.normalize("NFC").trim();
}

export function validateEvidence(rule: EvidenceValidation, raw: string): string {
  const value = rule.evidenceType === "word" ? normalizeWord(raw) : raw.normalize("NFC").trim();
  if (/https?:\/\//iu.test(value)) throw new DomainError("URL_NOT_ALLOWED");
  if (value.length < (rule.minLength ?? 0)) throw new DomainError("TEXT_TOO_SHORT");
  if (value.length > (rule.maxLength ?? Number.MAX_SAFE_INTEGER)) throw new DomainError("TEXT_TOO_LONG");
  if (rule.evidenceType === "word" && /\s/u.test(value)) throw new DomainError("INVALID_WORD");
  return value;
}
