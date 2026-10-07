# Cloud Trio Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove C03 from the active Aura experience, replace it in existing ten-Challenge packs, and preserve earned Aura.

**Architecture:** Keep C03 as an inactive historical record. The existing assignment callable migrates packs idempotently to another active CONNECT Challenge. The UI reads Aura from the authoritative score. A guarded local-emulator command updates the already seeded C03 document.

**Tech Stack:** TypeScript, Firebase Functions and Firestore, React, Vitest, Firebase emulators, Vite.

---

## File map

- `shared/challenges/catalog.ts`, `shared/challenges/assignment.ts`: inactive catalog record and new-pack selection.
- `functions/src/challenges/ensure-assignment.ts`, `functions/src/challenges/complete.ts`: existing-pack replacement and explicit C03 retirement.
- `src/features/challenges/useChallenges.ts`, `src/features/challenges/ChallengesPage.tsx`: authoritative Aura display.
- `scripts/retire-cloud-trio-emulator.ts`, `package.json`, `docs/operations.md`: guarded local catalog update and instructions.
- `tests/unit/challenge-catalog.test.ts`, `tests/unit/challenges-page.test.tsx`, `tests/integration/challenge-assignment.test.ts`, `tests/integration/challenge-validation.test.ts`: behavior checks.

## Task 1: New packs and server guard

- [ ] Write failing tests for C03 inactive, a new pack without C03, and a completion request rejected for C03. Run focused Vitest tests in an isolated emulator and confirm the expected failures.
- [ ] Set C03 inactive in the catalog and reject C03 explicitly in the completion callable. Keep its historical definition for reads. Run focused tests until green.

## Task 2: Existing ten-Challenge packs

- [ ] Write failing integration tests for an existing C03 pack (available and completed), replacement in the same slot with an active unused CONNECT Challenge, unchanged score/old progress, repeated and concurrent ensure calls, and no candidate failure.
- [ ] Add idempotent replacement to the existing assignment transaction. Read all references before writes, choose the lowest-ID eligible replacement, create progress only when absent, update the assignment signature and leave old records untouched. Keep bonus provisioning working. Run focused integration tests until green.

## Task 3: Aura display and local catalog

- [ ] Write a failing UI test where the visible assigned progress excludes completed C03 but score Aura still includes it.
- [ ] Subscribe to the owner score in the Challenge hook and display `auraTotal` in the overview. Run focused UI tests until green.
- [ ] Add a dry-run-first emulator-only command requiring the event confirmation before setting `challenges/C03.active=false`; make it refuse production hosts. Document the operation. Run its dry run and apply it only to the local demo project.

## Task 4: Final verification

- [ ] Run full unit/integration tests, rules tests, typecheck, web build, Functions build, and `git diff --check`.
- [ ] Verify the local app shows ten main Challenges without Cloud Trio, retains the score Aura, and offers the two selfie bonuses. Keep the local preview available. Commit implementation and update the local report.
