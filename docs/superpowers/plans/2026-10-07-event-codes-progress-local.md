# Event Codes and Geek Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Give every registered participant simple shared event codes, seven official tracks, visible assigned-Challenge progress, and a Geek guide.

**Architecture:** Reserve the five fixed Challenges in ten-item packs and migrate existing assignments without changing earned Aura. Validate one shared code per C10, C11 and C13 against private hashes in the existing scoring transaction. Keep C13 staff-token support. Update the existing React pages and local Firestore catalog, then verify with emulators and browser.

**Tech Stack:** React, TypeScript, Firestore, Firebase Functions, Vitest, Firebase emulators.

---

### Task 1: Tracks and guide

**Files:** `shared/challenges/catalog.ts`, `shared/agenda.ts`, `shared/companion.ts`, `src/features/companion/QuetziGuide.tsx`, `src/features/auth/LandingPage.tsx`, `src/features/onboarding/OnboardingPage.tsx`, `tests/unit/challenge-catalog.test.ts`, `tests/unit/quetzi.test.tsx`.

- [x] Add failing assertions for seven official tracks and visible «Geek» strings; run focused tests and confirm the expected failures.
- [x] Update the catalog, static agenda type and visible guide text; run focused tests until green.

### Task 2: Shared codes and Aura

**Files:** `functions/src/challenges/complete.ts`, `functions/src/challenges/admin-config.ts`, `scripts/data/challenge-secrets.ts`, `src/features/challenges/ChallengeDetailPage.tsx`, `src/features/admin/ChallengeOperations.tsx`, `tests/integration/challenge-validation.test.ts`, `tests/unit/challenge-detail-page.test.tsx`.

- [x] Add failing emulator tests for accepted/wrong C10, C11 and C13 codes, one-time Aura, C11 independence, cooldown and C13 staff-token fallback.
- [x] Implement private code hashes, admin rotation, and server-side transactional validation; keep prior completed records intact.
- [x] Replace the session dropdown/question with one code field on C10 and C11, and show the shared code field on C13; keep a token field for C13/C14 staff flow.
- [x] Run focused integration and page tests until green.

### Task 3: Ten-item assignment and progress

**Files:** `shared/challenges/assignment.ts`, `functions/src/challenges/ensure-assignment.ts`, `src/features/challenges/ChallengesPage.tsx`, `src/features/progress/ProgressPage.tsx`, `tests/unit/challenge-assignment.test.ts`, `tests/integration/challenge-assignment.test.ts`, UI tests.

- [x] Add failing tests that new and legacy packs contain C08/C10/C11/C12/C13, stay at ten, preserve earned Aura, and unlock pending C11.
- [x] Implement fixed-Challenge selection and idempotent migration; run focused tests.
- [x] Add next-Challenge guidance and per-Challenge progress to the overview and Progreso pages; test the rendered states.

### Task 4: Local configuration and verification

**Files:** local emulator data only, plus affected tests and docs.

- [x] Configure the approved shared codes as hashes in the local emulator; expand local C12 to seven tracks without resetting participant scores.
- [x] Run the complete emulator test suite, type checks and builds; fix concrete failures.
- [x] Exercise wrong and right codes with synthetic emulator accounts; inspect code forms, seven tracks, assignment and progress in the local browser at mobile and desktop widths. Restore approved local codes after tests.
- [x] Share the local application link and three active local codes. Do not deploy.
