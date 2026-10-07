# Selfies, Verified Ranking, and Visual Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide two reviewed selfie Challenges to every registered person, show only registered people in the Aura ranking, and make Challenge screens visually coherent.

**Architecture:** C16/C17 are bonus Challenges outside the ten selected IDs and have their own progress documents. A repeatable assignment operation provisions them for existing and new accounts. The existing photo moderation path is extended with a narrow photo-ID allowlist. Ranking rows come from a callable function that checks completed profiles. The UI uses focused components and responsive CSS around the existing design tokens.

**Tech Stack:** React 19, TypeScript, Firebase Functions/Firestore/Storage, Vitest, Firebase emulators, Vite.

---

## File map

- `shared/challenges/photo.ts`: the three photo Challenge IDs and the two bonus IDs.
- `shared/challenges/catalog.ts`, `shared/challenges/types.ts`, `shared/challenges/assignment.ts`: catalog data, assignment shape, and exclusion of bonus IDs from the pack selector.
- `functions/src/challenges/ensure-assignment.ts`, `functions/src/missions/complete-onboarding.ts`: idempotent provisioning of bonus progress for existing and new registrants.
- `functions/src/submissions/register-photo.ts`, `functions/src/moderation/review-submission.ts`, `firebase/storage.rules`, `scripts/seed-data.ts`: upload, moderation, access, and local catalog seed.
- `functions/src/scoring/leaderboard.ts`, `functions/src/missions/complete-onboarding.ts`, `functions/src/challenges/ensure-assignment.ts`, `scripts/backfill-ranking.ts`, `firebase/firestore.indexes.json`, `src/features/leaderboard/LeaderboardPage.tsx`, `firebase/firestore.rules`: materialized registration, registered-only ranking and restricted score reads.
- `src/features/challenges/useChallenges.ts`, `ChallengesPage.tsx`, `ChallengeDetailPage.tsx`, `GeekIdPage.tsx`, `src/features/submissions/PhotoEvidence.tsx`, `src/features/progress/ProgressPage.tsx`, `src/features/admin/ModerationCard.tsx`, `src/app/AppShell.tsx`, `src/design-system/global.css`, `src/features/companion/QuetziSprite.tsx`: participant and moderation interface.

### Task 1: Bonus photo Challenges

- [ ] Write failing unit tests asserting C16/C17 exist and `selectChallengePack` still returns ten excluding those IDs; run `npx vitest run tests/unit/challenge-catalog.test.ts tests/unit/assignment.test.ts` and confirm failure.
- [ ] Add C16/C17 catalog records with `community_photo`, explicit speaker/stand instructions and distinct Aura rewards; add `bonusChallengeIds?: string[]` to assignment, and `PHOTO_CHALLENGE_IDS` plus `BONUS_PHOTO_CHALLENGE_IDS` in `shared/challenges/photo.ts`. In the selector, filter bonus IDs before sorting.
- [ ] Write failing integration tests for repeated `ensureAssignmentForUid(uid)` on an existing ten-item pack and `completeOnboardingForUid` on a new account. Assert the ten IDs do not change, bonus IDs are C16/C17, and each bonus progress document appears once. Run `npx vitest run tests/integration/challenge-assignment.test.ts tests/integration/challenge-onboarding.test.ts` against isolated emulators.
- [ ] Implement a transaction-safe `ensureBonusChallengesForUid(uid)` that checks a completed user profile, reads the assignment and progress documents, and sets `bonusChallengeIds` plus missing progress. Call it for existing assignments; provision bonus progress during new onboarding.
- [ ] Write failing photo integration and Storage-rule tests: C16 and C17 upload/submission succeed for registered users with bonus progress; an unregistered user, nonphoto ID, invalid content, duplicate award, and unauthorized read fail. Run `npx vitest run tests/integration/challenge-photo.test.ts tests/rules/storage.test.ts`.
- [ ] Extend only the photo-ID allowlist in Storage and Functions. In `registerPhotoForUid`, check C15 in the regular IDs and C16/C17 in `bonusChallengeIds`, plus onboarding. In `reviewSubmissionForStaff`, accept the allowlist and use `provisionalPoints` for the one-time award. Seed C16/C17 locally with `npm run seed -- --apply --confirm aws-day-gt-2026` against the emulator and confirm the catalog. Re-run the focused tests.
- [ ] Commit the backend photo unit with `git commit -m 'feat: add reviewed speaker and stand selfies'`.

### Task 2: Verified ranking

- [ ] Write failing tests in `tests/integration/leaderboard-registered.test.ts` with two completed profiles (one 0 Aura) and two orphan scores. Assert only the registered profiles appear in Aura order; run the test in an isolated emulator.
- [ ] Mark `registeredForRanking` in the score only after verified onboarding (`onboardingComplete`, `createdAt`, `consent.acceptedAt`); backfill legitimate old profiles in the local emulator without deleting records. Make `getLeaderboardSnapshot` query only eligible scores once, order by `auraTotal` descending, `completedChallenges` descending, then `auraReachedAt` ascending, cap at 50, and return the current user's rank if present. Add the composite index. Keep `auraTotal` as the only point source.
- [ ] Replace the Firestore score subscription in `LeaderboardPage` with the callable result and add a retry/refresh control; include a loading and empty state. Tighten `/scores/{scoreId}` reads to the owner or staff because the public list now comes from the callable.
- [ ] Re-run `tests/integration/leaderboard-registered.test.ts`, `tests/unit/leaderboard-aura.test.tsx`, and `tests/rules/firestore.test.ts`; commit with `git commit -m 'fix: show only registered users in Aura ranking'`.

### Task 3: Challenge and Geek ID presentation

- [ ] Write focused UI tests for separate assigned and selfie sections, Geek ID selfie links with QR visible, Spanish completion state with one Aura notice, and next available Challenge link. Run the tests and confirm failure.
- [ ] Extend `useChallenges` to subscribe to the union of assigned and bonus IDs and return two groups. The page displays the ten assigned cards plus a two-card selfie section. `GeekIdPage` shows the two photo links below its QR.
- [ ] Refactor `ChallengeDetailPage` into clear status/action sections. Treat C15/C16/C17 as photo flows; when completed, show one confirmation and a deterministic link to the next available assigned Challenge, then a bonus Challenge. If none is available, link to the Challenge list.
- [ ] Give `PhotoEvidence` an accessible image preview and a `capture="user"` selfie input for C16/C17 while retaining the current size/signature processing. Translate upload/review states.
- [ ] Show separate main-pack and selfie completion counts on Progress so approving a bonus never produces `12 de 10`. Label C15/C16/C17 distinctly in the moderation queue so reviewers know which selfie to inspect.
- [ ] Add scoped Challenge/leaderboard CSS: `--content` supports a wider desktop layout, Challenge cards use two columns above 800px and one below, detail content remains readable, desktop navigation occupies a safe nonoverlapping position, mobile content has bottom clearance. Omit the animated tail for `crop="head"` and clip the brand SVG.
- [ ] Run the focused UI tests, `npm run typecheck`, `npm run build`, and `npm --prefix functions run build`. Inspect `http://127.0.0.1:4175` at desktop and mobile widths for overflow, nav overlap, and completion/approval states. Commit with `git commit -m 'feat: improve Aura Challenge navigation and layout'`.

### Task 4: Final verification

- [ ] Run `npm test`, `npm run test:rules`, `npm run typecheck`, `npm run build`, `npm --prefix functions run build`, and `git diff --check`; report any unrelated baseline failures precisely.
- [ ] Verify the local preview works, and update the local output report with the exact URL, tested behaviors, and remaining production setup. Keep deployment and real data untouched.
