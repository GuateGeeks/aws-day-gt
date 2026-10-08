# Event Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the local AWS Community Day UI and make the next agenda block use available space.

**Architecture:** Keep schedule and challenge data unchanged. Update presentation components and shared visual tokens; use the existing full GuateGeeks asset and a small vector guide. Adapt the agenda grid to its item count.

**Tech Stack:** React, TypeScript, CSS, Vitest, Playwright, Vite.

---

### Task 1: Agenda layout

**Files:** `src/features/companion/CompanionCards.tsx`, `src/features/companion/companion.css`, `tests/unit/quetzi.test.tsx`

- [x] Add a test that a single next session receives a full-width layout marker.
- [x] Run the focused test and confirm it fails because the marker is absent.
- [x] Add the marker and responsive CSS grid that fills the row with one session.
- [x] Run the focused test and inspect the card in desktop and mobile widths.

### Task 2: Branding and iconography

**Files:** `src/app/AppShell.tsx`, `src/features/auth/LandingPage.tsx`, `src/features/auth/GeekEyesLogo.tsx`, `src/features/companion/QuetziSprite.tsx`, `src/features/companion/quetzi.css`, `src/design-system/global.css`, `src/design-system/tokens.css`, `src/features/auth/landing.css`, `tests/unit/quetzi.test.tsx`

- [x] Add a test that the guide renders smooth SVG paths without pixel rendering.
- [x] Run the focused test and confirm it fails on the old sprite.
- [x] Replace the pixel sprite with a scalable vector and condense the guide layout.
- [x] Replace small eyes marks with the full GuateGeeks logo; refine event colors and spacing.
- [x] Run focused tests, all tests, typecheck and build.

### Task 3: Visual check and handoff

**Files:** Local browser only.

- [x] Inspect `/app/hoy` at desktop and mobile widths for clipping and whitespace.
- [x] Inspect landing, header and one challenge card for visual consistency.
- [x] Share the running local URL after verification.
