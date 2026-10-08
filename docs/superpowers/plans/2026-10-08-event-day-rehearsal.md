# Event-Day Rehearsal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the 8 October local rehearsal as a live AWS Community Day, remind participants before each block, and add quiet GuateGeeks discovery links.

**Architecture:** Keep the official 10 October agenda immutable and map only the local 8 October clock to it. A pure reminder selector chooses the next distinct start time; one app-shell component deduplicates and displays its alert. Existing landing, profile, and companion components host the brand changes.

**Tech Stack:** React 19, TypeScript, Vite, Firebase emulators, Vitest, Playwright/Chrome for visual checks.

---

### Task 1: Local event clock

**Files:** `shared/companion.ts`, `src/features/companion/useNow.ts`, `tests/unit/companion.test.ts`, `tests/unit/quetzi.test.tsx`.

- [ ] Add a failing test that maps `2026-10-08T08:15:00-06:00` to `2026-10-10T08:15:00-06:00` only in local rehearsal mode and keeps explicit preview time unchanged.
- [ ] Run `npx vitest run tests/unit/companion.test.ts tests/unit/quetzi.test.tsx` and confirm the new test fails because the mapping is missing.
- [ ] Add `localRehearsalNow(realNow: Date): Date` using the event's fixed UTC-6 offset and call it from `useNow` only when `useFirebaseEmulators` is true and no `?ahora`/stored manual preview is active.
- [ ] Rerun the focused tests and confirm pass.

### Task 2: Current and next activity

**Files:** `src/features/companion/CompanionCards.tsx`, `src/features/companion/CompanionPage.tsx`, `src/features/companion/companion.css`, `tests/unit/quetzi.test.tsx`.

- [ ] Add failing rendering tests for the current 08:15 Registro, the next 08:30 block, and the absence of a countdown card.
- [ ] Run `npx vitest run tests/unit/quetzi.test.tsx` and confirm the new assertions fail.
- [ ] Render current and next groups from `sessionsAt(now)` and `nextSessions(now)` with time, room, and speaker; show all parallel sessions. Remove `CountdownCard` from **Hoy** and mark local rehearsal clearly.
- [ ] Rerun the focused tests and confirm pass.

### Task 3: Five-minute reminder

**Files:** `shared/companion.ts`, `src/features/companion/AgendaReminderCenter.tsx`, `src/app/AppShell.tsx`, `src/features/companion/companion.css`, `tests/unit/companion.test.ts`, `tests/unit/agenda-reminder.test.tsx`.

- [ ] Add failing pure tests for 08:24 (no notice), 08:25 (08:30 notice), and one notice per distinct start time; add a UI test for the in-app alert and browser opt-in control.
- [ ] Run `npx vitest run tests/unit/companion.test.ts tests/unit/agenda-reminder.test.tsx` and confirm failure for the missing behavior.
- [ ] Implement `nextBlockReminder(now)` based on `nextSessions(now)`. In the app shell, store delivered keys in `sessionStorage`, show a dismissible banner, and offer an explicit control that requests browser Notification permission. Trigger `new Notification` only when permission is already granted and the app is open.
- [ ] Rerun focused tests and confirm pass.

### Task 4: Brand, Socrates, social links, contact

**Files:** `src/features/companion/CompanionCards.tsx`, `src/features/auth/LandingPage.tsx`, `src/features/profile/ProfilePage.tsx`, `src/features/companion/CompanionPage.tsx`, `src/features/auth/landing.css`, `src/design-system/global.css`, `tests/unit/quetzi.test.tsx`, `tests/unit/brand-discovery.test.tsx`.

- [ ] Add failing UI tests that the agenda card has AWS art without the GuateGeeks full logo, the entry page has the GuateGeeks full logo, Perfil links to Socrates and all three verified social destinations, and contact uses `mailto:info@guategeeks.com`.
- [ ] Run `npx vitest run tests/unit/quetzi.test.tsx tests/unit/brand-discovery.test.tsx` and confirm the missing links/placement fail.
- [ ] Remove the in-app agenda logo badge, keep the GuateGeeks splash logo, add compact profile sections, add a small link from Hoy, and correct the retired VR promotion and total challenge count on the landing page.
- [ ] Rerun focused tests and confirm pass.

### Task 5: Local verification

**Files:** `docs/operations.md` if operational behavior needs clarification.

- [ ] Run `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 npm run test -- --reporter=dot` and confirm zero failures.
- [ ] Run `npm run typecheck`, `npm run build`, and `npm --prefix functions run build`; inspect each exit code.
- [ ] Verify `http://127.0.0.1:4175/app/hoy` in desktop and mobile Chrome, including 08:25 reminder and the 08:30 transition in a local preview.
- [ ] Run `git diff --check`, inspect status, commit the local implementation, and leave the server running for review.
