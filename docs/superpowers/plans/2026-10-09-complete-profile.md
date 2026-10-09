# Complete Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make “Mi perfil” show the participant's saved account, Challenges and privacy information, and allow completion of missing Challenge fields.

**Architecture:** Keep profile data sourced from `useAuth().profile`; add a small presentational summary component that formats optional values safely. Reuse the existing `ChallengeProfileFields` and `setChallengeProfile` callable only when Challenge fields are absent. Alias and consent remain read-only.

**Tech Stack:** React, TypeScript, Firebase callable functions, Vitest and Testing Library.

---

### Task 1: Cover complete profile and missing fields

**Files:**
- Create: `tests/unit/profile-page.test.tsx`
- Modify: `src/features/profile/ProfilePage.tsx`
- Create: `src/features/profile/ProfileSummary.tsx`
- Create: `src/features/profile/profile-summary.css`

- [x] **Step 1: Write tests first**
  - Render `ProfilePage` with mocked participant data containing alias, role, Challenge fields, AWS interests and consent.
  - Assert each section and value is visible, the email is masked, and completed Challenge fields render as a summary.
  - Render a legacy profile without Challenge fields and assert the existing labeled form appears with default values.
  - Assert missing optional consent data produces a readable fallback rather than `undefined`.
  - Mock `httpsCallable` and verify saving a completed Challenge draft calls `setChallengeProfile` with the entered fields and shows success.

- [x] **Step 2: Run the focused test and confirm it fails**

Run: `npm test -- tests/unit/profile-page.test.tsx`

Expected: FAIL because the current profile omits consent details and the completed Challenge summary.

- [x] **Step 3: Implement profile sections**
  - Extract a compact `ProfileSummary` section component for labeled read-only values.
  - Format consent acceptance timestamps with Guatemala locale and timezone, safely supporting Firestore `Timestamp`, `Date`, serialized string, or absent values.
  - Initialize `ChallengeProfileFields` from `profile` and show it only when any required Challenge field is missing.
  - Keep all current account actions, community links, and callable save behavior.

- [x] **Step 4: Run focused tests**

Run: `npm test -- tests/unit/profile-page.test.tsx`

Expected: PASS for summary display, incomplete legacy profiles, and callable save.

- [x] **Step 5: Verify full suite and production build**

Run: `npm test && npm run build`

Expected: all available tests pass and Vite produces the production bundle.

- [x] **Step 6: Inspect final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only profile UI, tests and this plan are changed.
