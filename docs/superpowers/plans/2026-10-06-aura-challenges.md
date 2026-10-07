# Aura Challenges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fifteen validated Aura Challenges, persistent balanced packs of ten, and a Challenge-first participant experience without deleting the legacy missions.

**Architecture:** A new Challenge domain shares Firebase Auth, `users`, `scores`, `submissions`, Storage, and the existing design system. Cloud Functions own assignment, validation, moderation transitions, and Aura awards. Public Challenge definitions and private answer or token documents are separated by Firestore rules.

**Tech Stack:** React 19, TypeScript, Vite, Firebase Auth/Firestore/Functions/Storage, Vitest, Firebase rules unit tests, Playwright.

---

## File map

- `shared/challenges/types.ts`: Challenge discriminated union and public configuration types.
- `shared/challenges/catalog.ts`: exactly fifteen initial definitions.
- `shared/challenges/assignment.ts`: balanced seeded pack selector.
- `shared/challenges/validators.ts`: pure social, Cloud, session, and experience validation helpers.
- `functions/src/challenges/`: callable handlers and transaction helpers for assignment, profile, QR, completion, moderation, admin editing, and official tokens.
- `scripts/data/challenge-secrets.ts`, `scripts/seed-data.ts`: additive public and private seed.
- `src/features/challenges/`: Challenges list, detail, Geek ID, camera, games, session, experience, and photo views.
- Existing profile, onboarding, admin, progress, ranking, router, shell, `scores`, `submissions`, and security rules receive small compatibility changes.

## Task 1: Model, catalog, and seed

**Files:** Create `shared/challenges/types.ts`, `shared/challenges/catalog.ts`, `scripts/data/challenge-secrets.ts`; modify `scripts/seed-data.ts`, `firebase/firestore.rules`; test `tests/unit/challenge-catalog.test.ts`, `tests/rules/firestore.test.ts`.

- [ ] Write a failing catalog test: `expect(challenges).toHaveLength(15); expect(challenges.find(c => c.id === 'C13')).toMatchObject({required:true,auraReward:250}); expect(new Set(challenges.map(c => c.id)).size).toBe(15)`.
- [ ] Run `npx vitest run tests/unit/challenge-catalog.test.ts`; expect missing catalog import or assertion failure.
- [ ] Define `ChallengeCategory`, `ChallengeValidationType`, and `Challenge` with the exact fields in the approved spec. Populate `C01`–`C15` and server-only answer data. Extend the seed with upserts; never delete or overwrite `Mxx` documents.
- [ ] Run the focused test; expect 15 records and no missing fields. Add Firestore rule denial checks for public reads of `challengeSecrets` and all client writes to Challenge state.
- [ ] Commit catalog, seed, and rule changes.

## Task 2: Balanced assignment and profile

**Files:** Create `shared/challenges/assignment.ts`, `functions/src/challenges/ensure-assignment.ts`, `functions/src/challenges/set-profile.ts`; modify `shared/types.ts`, `shared/schemas.ts`, `functions/src/missions/complete-onboarding.ts`, `src/features/onboarding/OnboardingPage.tsx`, `src/features/profile/ProfilePage.tsx`; test `tests/unit/challenge-assignment.test.ts`, `tests/integration/challenge-assignment.test.ts`.

- [ ] Write failing tests for all five category patterns, ten unique IDs, C13 in every pack, varied signatures for distinct seeds, and a persisted pack returned unchanged by a second call.
- [ ] Run `npx vitest run tests/unit/challenge-assignment.test.ts tests/integration/challenge-assignment.test.ts`; expect missing selector and callable behavior.
- [ ] Implement `selectChallengePack(challenges, seed, recentSignatures)` and transactional `ensureChallengeAssignment(uid)`. Add the four profile fields and one-time validated profile callable. New onboarding calls Challenge assignment; old accounts acquire it on first Challenges visit. Keep prior `userMissions` documents untouched.
- [ ] Run focused tests and TypeScript checks. Add emulator integration assertions for concurrent assignment requests creating one pack.
- [ ] Commit assignment and profile changes.

## Task 3: Aura transaction and idempotency

**Files:** Create `functions/src/challenges/complete.ts`, `functions/src/challenges/award.ts`; modify `functions/src/shared/refs.ts`, `shared/types.ts`, `firebase/firestore.indexes.json`; test `tests/integration/challenge-award.test.ts`, `tests/rules/firestore.test.ts`.

- [ ] Write a failing test that completes one assigned Challenge twice with different operation IDs and expects one `auraTotal` increment. Add a direct client score-write denial test.
- [ ] Run focused tests; expect failure from absent completion handler.
- [ ] Implement an authenticated, event-scoped Firestore transaction that reads assignment, active Challenge, current progress, score, and idempotency record before writing completion and Aura. Store server timestamps and leave `totalPoints` unchanged.
- [ ] Run focused tests and TypeScript checks. Verify repeated same or different operation IDs return the existing completion without increment.
- [ ] Commit the scoring foundation.

## Task 4: Geek ID and five social Challenges

**Files:** Create `functions/src/challenges/geek-id.ts`, `shared/challenges/social.ts`, `src/features/challenges/GeekId.tsx`, `src/features/challenges/SocialChallenge.tsx`; modify `functions/src/challenges/complete.ts`; test `tests/unit/challenge-social.test.ts`, `tests/integration/challenge-social.test.ts`.

- [ ] Write failing tests for self-scan denial, matching and different roles, first timer, shared interest retry, different experience level, and Cloud Trio needing two distinct other participants with three roles.
- [ ] Run focused tests; expect missing validators.
- [ ] Generate opaque random expiring QR tokens in a callable; hash token keys in Firestore. Validate scans server-side, record unique connections, and store partial Cloud Trio state without awarding until complete. Render the QR and scanner with a camera fallback for unsupported browsers.
- [ ] Run focused tests and TypeScript checks. Confirm raw QR data contains no UID, email, alias, or role.
- [ ] Commit social Challenges.

## Task 5: Four interactive Cloud Challenges

**Files:** Create `shared/challenges/cloud.ts`, `src/features/challenges/CloudGames.tsx`; modify `functions/src/challenges/complete.ts`; test `tests/unit/challenge-cloud.test.ts`, `tests/integration/challenge-cloud.test.ts`.

- [ ] Write failing tests for correct serverless sequence, wrong sequence retry without score loss, all four matching pairs, architecture error choice, and configurable Who Am I answer.
- [ ] Run focused tests; expect missing Cloud validators.
- [ ] Implement server-side validation using private answer keys. Build accessible card interactions for ordering, pairing, and choosing; include keyboard controls alongside drag interaction.
- [ ] Run focused tests and TypeScript checks. Confirm answer keys are absent from client-visible Challenge documents.
- [ ] Commit Cloud Challenges.

## Task 6: Three Session Challenges and admin configuration

**Files:** Create `shared/challenges/session.ts`, `functions/src/challenges/admin-config.ts`, `src/features/challenges/SessionChallenges.tsx`, `src/features/admin/ChallengeConfig.tsx`; modify `functions/src/challenges/complete.ts`, `src/features/admin/AdminPage.tsx`; test `tests/unit/challenge-session.test.ts`, `tests/integration/challenge-session.test.ts`.

- [ ] Write failing tests: incorrect unlock code yields zero Aura; correct code awards once; Session Challenge requires matching unlocked session and correct answer; Track Pulse accepts one configured track once.
- [ ] Run focused tests; expect missing session validator and admin editor.
- [ ] Store codes and answers in private documents; add admin-only callables for limited config edits and audit records. Render code, question, and track interactions from configuration.
- [ ] Run focused tests and TypeScript checks. Inspect production bundle for unlock codes.
- [ ] Commit Session Challenges.

## Task 7: CloudForge and official station tokens

**Files:** Create `functions/src/challenges/experience.ts`, `src/features/challenges/ExperienceChallenge.tsx`; modify `functions/src/challenges/complete.ts`, `src/features/admin/ChallengeConfig.tsx`; test `tests/integration/challenge-experience.test.ts`.

- [ ] Write failing tests for expired token, wrong station, repeated token consumption, one-time Aura reward, and audited admin fallback.
- [ ] Run focused tests; expect missing verifier.
- [ ] Add an adapter that consumes only server-issued hashed official tokens. Keep CloudForge issuer disconnected until credentials and its completion signal are available. Expose admin-only fallback and station configuration; never accept a client-only success flag.
- [ ] Run focused tests and TypeScript checks.
- [ ] Commit experience validation.

## Task 8: Community Aura through existing photo flow

**Files:** Create `functions/src/challenges/photo-moderation.ts`, `src/features/challenges/CommunityPhoto.tsx`; modify `functions/src/submissions/register-photo.ts`, `functions/src/moderation/review-submission.ts`, `src/features/admin/AdminPage.tsx`, `firebase/storage.rules`; test `tests/integration/challenge-photo.test.ts`, `tests/rules/storage.test.ts`.

- [ ] Write failing tests for unsupported signature or size rejection, one valid upload, default `manual_review`, approval awarding once, and rejection awarding zero.
- [ ] Run focused tests; expect missing Challenge discriminator and moderation state.
- [ ] Reuse private Storage path and upload control, inspect image header bytes server-side, and add a moderation interface. Without a configured provider, route to staff queue. Branch review transaction by submission kind so legacy scoring remains unchanged.
- [ ] Run focused tests, rules tests where Java is available, and TypeScript checks.
- [ ] Commit photo Challenge.

## Task 9: Challenge-first UI and legacy section

**Files:** Create `src/features/challenges/ChallengesPage.tsx`, `src/features/challenges/ChallengeDetailPage.tsx`, `src/features/challenges/useChallenges.ts`; modify `src/app/router.tsx`, `src/app/AppShell.tsx`, `src/features/missions/MissionsPage.tsx`, `src/features/progress/ProgressPage.tsx`, `src/features/leaderboard/LeaderboardPage.tsx`, `src/features/companion/CompanionCards.tsx`; test `tests/unit/challenges-page.test.tsx`, `tests/unit/leaderboard-aura.test.tsx`.

- [ ] Write failing UI tests showing ten Challenge cards, C13 present, Challenge-only Aura total and ranking, and a separate historical mission route.
- [ ] Run focused tests; expect missing pages and assertions.
- [ ] Reuse current cards, tokens, and navigation. Replace main point labels with Aura; put legacy missions behind a distinct link and retain their old score as historical context. Keep existing Quetzi and badges intact.
- [ ] Run focused tests and TypeScript checks.
- [ ] Commit UI integration.

## Task 10: Full verification and local handoff

**Files:** Update `README.md`, `docs/operations.md`, relevant rule tests, and deployment notes only as verified.

- [ ] Run `npm run typecheck`, `npm test`, `npm run build`, and `npm --prefix functions run build`; expect zero failures.
- [ ] Run `npm run test:rules` inside Firebase emulators with Java 21. If Java is unavailable, report rules tests as unexecuted and retain static rule review; do not call them passing.
- [ ] Exercise local browser flows for onboarding, assignment persistence, Challenge games, ranking, and moderation with emulators. Record exactly which flows ran.
- [ ] Check `git diff --check` and `git status --short`; review for secrets, legacy data deletion, hidden QR mechanics, and out-of-scope features.
- [ ] Produce a final report with `IMPLEMENTED`, `TESTED`, `PENDING REAL-WORLD CONFIGURATION`, and `KNOWN LIMITATIONS`.
