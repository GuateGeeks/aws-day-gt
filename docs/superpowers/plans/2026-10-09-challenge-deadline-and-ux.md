# Challenge Deadline and UX Implementation Plan

**Goal:** Make challenge progress easier to scan, remove the repeated event name from Hoy, and close every response/photo submission at 4:00 p.m. Guatemala time on 10 October 2026.

**Architecture:** Store the fixed event cutoff in shared code for consistent client messaging and server enforcement. Show the deadline on Hoy, the challenge list, and challenge details; replace submission controls with a closed notice after cutoff. Enforce the same cutoff in callable functions and Storage Rules, using server time as the authority.

**Tech Stack:** React, TypeScript, Firebase Functions v2, Firebase Storage Rules, Vitest, Firebase Rules Unit Testing.

---

### Task 1: Shared deadline and tests

**Files:**
- Create: `shared/submission-window.ts`
- Create: `tests/unit/submission-window.test.ts`

- [ ] Test that submissions are accepted just before 16:00 Guatemala time and rejected at exactly 16:00.
- [ ] Implement the shared cutoff as `2026-10-10T16:00:00-06:00` and export open/closed helpers plus Spanish user-facing messages.
- [ ] Run `npx vitest run tests/unit/submission-window.test.ts`.

### Task 2: Challenge UI and accessibility

**Files:**
- Modify: `src/features/challenges/ChallengesPage.tsx`
- Modify: `src/features/challenges/ChallengeDetailPage.tsx`
- Modify: `src/features/submissions/TextEvidence.tsx`
- Modify: `src/features/submissions/PhotoEvidence.tsx`
- Modify: `src/features/companion/CompanionPage.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/design-system/global.css`
- Modify: `src/features/companion/companion.css`
- Create: `src/features/submissions/SubmissionWindowNotice.tsx`
- Test: relevant challenge and companion unit tests

- [ ] Show the submission deadline on Hoy and above the challenge list; repeat it beside each response form.
- [ ] After cutoff, keep challenge descriptions and progress visible but replace answer/photo controls with a clear closed notice.
- [ ] Give completed cards a pale teal surface, stronger teal edge, check icon, and explicit “Completado” label; keep unfinished cards white and clearly actionable.
- [ ] Refine the four-item bottom navigation with a rounded active tab, consistent touch targets, and visible keyboard focus.
- [ ] Remove the “AWS Community Day Guatemala 2026” eyebrow from Hoy, preserving the event brand in the shared header.
- [ ] Add tests for completed card styling/status, deadline notice, closed controls, and removed Hoy eyebrow.

### Task 3: Enforce cutoff on the server and uploads

**Files:**
- Modify: `functions/src/challenges/complete.ts`
- Modify: `functions/src/submissions/submit-text.ts`
- Modify: `functions/src/submissions/register-photo.ts`
- Modify: `firebase/storage.rules`
- Test: `tests/integration/functions.test.ts`
- Test: `tests/rules/storage.test.ts`

- [ ] Reject new callable submissions with `failed-precondition/SUBMISSIONS_CLOSED` at or after the shared cutoff; allow idempotent retries of already-recorded operations.
- [ ] Deny Storage evidence uploads at or after 2026-10-10 22:00 UTC, which is 4:00 p.m. in Guatemala.
- [ ] Verify the client renders the closed notice when Firebase returns `SUBMISSIONS_CLOSED` despite a stale device clock.
- [ ] Run focused function and Storage Rules tests with their emulators.

### Task 4: Verify release

- [ ] Run `npm run typecheck`.
- [ ] Run focused unit, integration, and Storage Rules tests.
- [ ] Run `npm run build` and inspect the production bundle.
- [ ] Check the mobile layout and keyboard focus in the local preview.
