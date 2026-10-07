# C08 Sala Aura Local Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every registered participant the simple two-screen C08 challenge and award its existing 150 Aura once after both correct selections.

**Architecture:** Keep the two prompts and three selectable services in a focused React component with a small Three.js scene. Send each selection to the existing `completeChallenge` callable. The server stores the first correct step in `challengeProgress` and awards Aura transactionally only after the second. Make C08 required in new ten-Challenge packs and insert it into existing packs without changing accumulated scores.

**Tech Stack:** React, TypeScript, Three.js, Firebase Functions and Firestore, Vitest, Firebase emulators.

---

### Task 1: Assignment

**Files:** `shared/challenges/assignment.ts`, `functions/src/challenges/ensure-assignment.ts`, `tests/unit/challenge-assignment.test.ts`, `tests/integration/challenge-assignment.test.ts`.

- [x] Add a failing unit assertion that every generated pack contains C08 and C13 while staying at ten items.
- [x] Run `npx vitest run tests/unit/challenge-assignment.test.ts`; expect C08 assertion to fail.
- [x] Reserve C08 in `selectChallengePack`; select one fewer optional Cloud item.
- [x] Add an emulator test for an existing ten-item pack without C08: after `ensureAssignmentForUid`, C08 replaces an uncompleted Cloud item, the score is unchanged, and the operation is idempotent.
- [x] Run the assignment unit and emulator tests until green.

### Task 2: Server scoring

**Files:** `functions/src/challenges/complete.ts`, `shared/challenges/types.ts`, `tests/integration/challenge-validation.test.ts`.

- [x] Add a failing emulator test: stage 1 cannot be submitted first; stage 0 correct returns `in_progress` without Aura; stage 1 correct returns `completed` with 150 Aura; repeated submissions do not add Aura.
- [x] Run the focused test and confirm the expected failure.
- [x] Extend `ChallengeResponse` with `stage?: number` and progress with `architectureStep?: number`. In the C08 branch, accept only the ordered answers `dynamo` and `lambda`; store step 1 after the first and use the existing transaction for final credit.
- [x] Run the focused test until green.

### Task 3: Simple application experience

**Files:** `src/features/challenges/ArchitectureChallenge.tsx`, `src/features/challenges/architecture.css`, `src/features/challenges/ChallengeDetailPage.tsx`, `shared/challenges/catalog.ts`, `package.json`, `package-lock.json`.

- [x] Install `three@0.180.0` and matching types from npm.
- [x] Build a scene with three large selectable services. Keep the camera fixed; show the Esfera Aura only after selection. Use semantic button controls as the accessible 2D fallback.
- [x] Submit each selection through `completeChallenge`. Show a short hint after a wrong answer. After the first correct answer, enable `Siguiente`; after the second, show the existing completion and next-Challenge link.
- [x] Render this component only for C08. Remove the generic `Validar Challenge` control for it. Keep all other Challenge flows unchanged.
- [x] Run type checks and inspect the page at desktop and mobile widths.

### Task 4: Local verification

**Files:** local emulator data and the files above.

- [x] Run `npm test`, `npm run typecheck`, and `npm run build`; fix concrete failures.
- [x] Verify a registered emulator user receives C08, fails and retries, completes both screens, and sees 150 Aura in progress and ranking.
- [x] Share the local application URL for user review. Do not deploy.
