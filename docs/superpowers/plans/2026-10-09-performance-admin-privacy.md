# Performance and Admin Privacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make participant navigation load quickly and turn `/admin` into an owner-only responsive center for image moderation, configuration, and irreversible data deletion.

**Architecture:** A session-level React provider owns challenge subscriptions so participant screens reuse one data stream. Ranking uses React Query and a server-side short cache, routes load lazily, and Firestore uses persistent browser cache. The admin surface uses owner-only authorization and a retryable callable that deletes all user data before removing the Auth account.

**Tech Stack:** React 19, React Router 7, TanStack Query, Firebase Auth/Firestore/Functions/Storage, TypeScript, Vitest, Firebase Emulator Suite.

---

### Task 1: Owner-only authorization

**Files:**
- Modify: `functions/src/shared/auth.ts`
- Modify: `src/app/RouteGuards.tsx`
- Modify: `firebase/firestore.rules`
- Modify: `firebase/storage.rules`
- Test: `tests/unit/admin-page.test.tsx`
- Test: `tests/rules/firestore.test.ts`
- Test: `tests/rules/storage.test.ts`

- [ ] Write failing tests proving moderators cannot open admin data or evidence and only the owner email with `admin` role passes the route and backend helper.
- [ ] Run the focused unit and rules tests and confirm they fail on current moderator access.
- [ ] Add `requireOwnerAdmin()` validating both the admin claim and normalized `INITIAL_ADMIN_EMAIL`; change `StaffRoute` to the same profile email and role requirements; replace rule helpers with an owner-admin condition for private admin reads.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Shared challenge data and persistent cache

**Files:**
- Create: `src/features/challenges/ChallengeDataProvider.tsx`
- Modify: `src/features/challenges/useChallenges.ts`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/firebase/data.ts`
- Test: `tests/unit/use-challenges.test.tsx`

- [ ] Write a failing test that renders two consumers and proves only one assignment callable and one listener set are created.
- [ ] Run the focused test and confirm the duplicate subscriptions.
- [ ] Move existing challenge state and subscriptions into `ChallengeDataProvider`; expose the existing return shape through context; mount it once around the authenticated shell.
- [ ] Initialize Firestore with persistent local cache and multi-tab management, falling back to memory cache when persistence cannot start.
- [ ] Run challenge, progress, home, and provider tests.

### Task 3: Cached ranking without profile fan-out

**Files:**
- Modify: `functions/src/scoring/leaderboard.ts`
- Modify: `src/features/leaderboard/LeaderboardPage.tsx`
- Test: `tests/integration/leaderboard-registered.test.ts`
- Test: `tests/unit/leaderboard-aura.test.tsx`

- [ ] Write failing tests showing leaderboard rows are built from trusted score documents without a profile read per participant and repeat client visits reuse cached data.
- [ ] Run focused tests and confirm current behavior fails the new expectations.
- [ ] Remove profile fan-out from the callable, keep server-written `registeredForRanking` and alias as eligibility fields, and add a short in-process row cache keyed by event.
- [ ] Replace manual loading state with `useQuery`, using cached data during background refresh and a retry action on failure.
- [ ] Run leaderboard unit and emulator integration tests.

### Task 4: Route-level code splitting

**Files:**
- Modify: `src/app/router.tsx`
- Test: `tests/unit/scaffold.test.ts`

- [ ] Write a failing source/build assertion that the admin and ranking pages are lazy imports.
- [ ] Run the test and confirm eager imports fail it.
- [ ] Convert feature routes to `React.lazy` with a shared accessible fallback and retain eager loading only for the landing and login entry path.
- [ ] Build and confirm the output contains separate admin, ranking, participant, and profile chunks.

### Task 5: Deletion request model and complete deletion callable

**Files:**
- Create: `functions/src/admin/data-deletion.ts`
- Modify: `functions/src/admin/operations.ts`
- Modify: `functions/src/index.ts`
- Modify: `shared/types.ts`
- Modify: `firebase/firestore.indexes.json`
- Test: `tests/integration/data-deletion.test.ts`

- [ ] Write emulator tests that create Auth, Firestore, Storage, token, connection, score, progress, submission, alias, and idempotency data for a user.
- [ ] Assert rejection retains data with a reason and approval removes every owned record and file while leaving a non-identifying audit digest.
- [ ] Run the emulator test and confirm the review callable is missing.
- [ ] Extend request creation with alias and masked email; implement `reviewDataDeletion` with `requested → processing → completed/rejected/failed`, paged queries, BulkWriter, Storage prefix deletion, an irreversible SHA-256 audit digest, and Auth deletion last.
- [ ] Export the callable and add any required indexes.
- [ ] Run the emulator integration test until it passes, including an idempotent retry case.

### Task 6: Responsive admin operations center

**Files:**
- Create: `src/features/admin/AdminTabs.tsx`
- Create: `src/features/admin/DeletionQueue.tsx`
- Create: `src/features/admin/admin.css`
- Modify: `src/features/admin/AdminPage.tsx`
- Modify: `src/features/admin/ModerationCard.tsx`
- Test: `tests/unit/admin-page.test.tsx`

- [ ] Write failing UI tests for the three sections, summary counts, mobile-safe actions, required rejection reason, approval confirmation, retry state, and empty/error states.
- [ ] Run the focused test and confirm the new controls are absent.
- [ ] Split the page into Images, Privacy, and Configuration sections; subscribe to pending deletion requests; lazy-load evidence images only for visible moderation cards; add explicit dialogs for rejection and deletion confirmation.
- [ ] Add responsive styles following the existing teal, navy, white, and restrained orange design tokens with 48px minimum targets.
- [ ] Run admin and accessibility-focused tests.

### Task 7: Full verification and production deployment

**Files:**
- Verify all modified files.

- [ ] Run `npm test` and confirm all unit and integration tests pass or emulator-only tests are explicitly skipped without emulator configuration.
- [ ] Run `npm run typecheck`, `npm run build`, and `git diff --check`.
- [ ] Inspect build chunks and confirm the local preview login strings are absent from production assets.
- [ ] Test responsive layouts at 390px, 768px, 980px touch, and 1280px desktop; verify participant navigation retains its bottom bar.
- [ ] Deploy Functions, Firestore indexes/rules, Storage rules, and Hosting to `aws-day-gt`.
- [ ] Verify live `/login`, protected `/admin`, callable availability, and production asset contents.
- [ ] Commit and push all requested source changes to `git@github.com:GuateGeeks/aws-day-gt.git`.
