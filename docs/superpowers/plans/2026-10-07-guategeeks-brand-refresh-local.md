# GuateGeeks Brand Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Apply the supplied GeekEyes logo and GuateGeeks palette consistently to the local Aura app.

**Architecture:** Keep the original PNG as a static asset, render it through one reusable React component, update shared design tokens and selected fixed-color surfaces, and embed the same artwork in the app icon. Preserve the official event logo as secondary branding.

**Tech Stack:** React, TypeScript, CSS, Vite PWA, Vitest.

---

### Task 1: Exact brand asset

**Files:** `public/brand/geek-eyes.png`, `src/features/auth/GeekEyesLogo.tsx`, `src/app/AppShell.tsx`, `src/features/auth/LandingPage.tsx`, `src/features/auth/LoginPage.tsx`, `tests/unit/app-shell-skip-link.test.tsx`.

- [x] Assert that the shell, landing and login render the eyes image at `/brand/geek-eyes.png`.
- [x] Run the focused tests to observe the missing image failure.
- [x] Copy the supplied PNG unchanged and render it via a reusable component in those locations. Keep the event image secondary on the landing page.
- [x] Run the focused tests and confirm they pass.

### Task 2: Palette and installed icon

**Files:** `src/design-system/tokens.css`, `src/design-system/global.css`, `src/features/auth/landing.css`, `src/features/challenges/architecture.css`, `public/icon.svg`, `index.html`, `vite.config.ts`.

- [x] Set the shared action, background, border, accent and text tokens from the provided reference while preserving legible status colors and dark mode.
- [x] Update fixed gradients and the 3D room chrome to match the new palette.
- [x] Embed the supplied eyes PNG in the square app icon; update browser favicon, PWA theme, background and description.

### Task 3: Verify and show

**Files:** existing tests and browser only.

- [x] Run focused brand tests, complete test suite, typecheck and build.
- [x] Inspect landing, login and Challenge pages at mobile and desktop widths; check logo visibility and horizontal overflow.
- [x] Leave the working local app open for validation and report its URL.
