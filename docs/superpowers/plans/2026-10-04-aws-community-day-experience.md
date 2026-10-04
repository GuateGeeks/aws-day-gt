# AWS Community Day Guatemala 2026 Experience App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, seed, and deploy the production vertical-slice PWA described in the approved design to Firebase project `aws-day-gt`.

**Architecture:** A React/Vite PWA performs permitted reads and uploads while callable Cloud Functions own assignment, submissions, moderation, roles, settings, and scores. Pure shared domain modules define mission validation and assignment behavior; Firestore/Storage rules enforce the same trust boundary. The UI follows Socrates’ compact token-based, tactile, mobile-first structure.

**Tech Stack:** React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Firebase Web/Admin SDKs, Cloud Functions, Vitest, Firebase Rules Unit Testing, Playwright, vite-plugin-pwa, Lucide.

---

## File map

- Root configuration: `package.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `.env.example`.
- Firebase configuration: `.firebaserc`, `firebase.json`, `firebase/firestore.rules`, `firebase/storage.rules`, `firebase/firestore.indexes.json`, `remoteconfig.template.json`.
- Shared domain: `src/domain/*` and `functions/src/domain/*` expose identical validated contracts through a root `shared/` package.
- Frontend application: `src/app/*`, `src/design-system/*`, and feature folders under `src/features/*`.
- Privileged backend: focused modules under `functions/src/*` exported by `functions/src/index.ts`.
- Seed and operations: `scripts/seed-data.ts`, `scripts/set-admin.ts`, `scripts/smoke-production.mjs`.
- Tests: `tests/unit/*`, `tests/rules/*`, `tests/integration/*`, and `tests/e2e/*`.

### Task 1: Scaffold the two-runtime project and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `.gitignore`, `.env.example`
- Create: `functions/package.json`, `functions/tsconfig.json`
- Test: `tests/unit/scaffold.test.ts`

- [ ] **Step 1: Write the failing scaffold test**

```ts
import { describe, expect, it } from "vitest";

describe("project scaffold", () => {
  it("loads the shared event identifier", async () => {
    const { EVENT_ID } = await import("../../shared/constants");
    expect(EVENT_ID).toBe("aws-community-day-gt-2026");
  });
});
```

- [ ] **Step 2: Install dependencies and verify RED**

Run: `npm install && npm test -- tests/unit/scaffold.test.ts`

Expected: failure because `shared/constants.ts` does not exist.

- [ ] **Step 3: Add configuration and minimal constant**

```ts
// shared/constants.ts
export const EVENT_ID = "aws-community-day-gt-2026";
export const EVENT_TIMEZONE = "America/Guatemala";
export const INITIAL_ADMIN_EMAIL = "guategeeks3d@gmail.com";
```

Configure scripts for `dev`, `build`, `typecheck`, `lint`, `test`, `test:rules`, `test:integration`, `test:e2e`, `emulators`, `seed`, and `deploy`. Set the Functions runtime to Node 22.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/unit/scaffold.test.ts && npm run typecheck`

Expected: one passing test and clean type checking.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig*.json vite.config.ts vitest.config.ts playwright.config.ts index.html .gitignore .env.example functions shared tests/unit/scaffold.test.ts
git commit -m "build: scaffold event experience app"
```

### Task 2: Define and validate domain contracts

**Files:**
- Create: `shared/types.ts`, `shared/schemas.ts`, `shared/errors.ts`, `shared/validation.ts`
- Test: `tests/unit/validation.test.ts`, `tests/unit/schemas.test.ts`

- [ ] **Step 1: Write failing validation tests**

```ts
import { describe, expect, it } from "vitest";
import { normalizeWord, validateEvidence } from "../../shared/validation";

describe("evidence validation", () => {
  it("accepts one Unicode word and trims it", () => {
    expect(normalizeWord("  Nube  ")).toBe("Nube");
  });

  it("rejects phrases for word missions", () => {
    expect(() => validateEvidence({ evidenceType: "word", minLength: 2, maxLength: 30 }, "dos palabras"))
      .toThrow("INVALID_WORD");
  });

  it("enforces configured comment limits", () => {
    expect(() => validateEvidence({ evidenceType: "comment", minLength: 20, maxLength: 400 }, "muy corto"))
      .toThrow("TEXT_TOO_SHORT");
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/unit/validation.test.ts tests/unit/schemas.test.ts`

Expected: missing module failures.

- [ ] **Step 3: Implement exact contracts**

Define `Event`, `UserProfile`, `Mission`, `ScheduleSession`, `UserMission`, `Submission`, `Score`, `EventConfig`, role/status unions, consent, validation, moderation, and callable request/response types. Add Zod schemas for every client boundary and typed `DomainError` codes.

```ts
export function normalizeWord(value: string): string {
  return value.normalize("NFC").trim();
}

export function validateEvidence(rule: EvidenceValidation, raw: string): string {
  const value = rule.evidenceType === "word" ? normalizeWord(raw) : raw.trim();
  if (value.length < (rule.minLength ?? 0)) throw new DomainError("TEXT_TOO_SHORT");
  if (value.length > (rule.maxLength ?? Number.MAX_SAFE_INTEGER)) throw new DomainError("TEXT_TOO_LONG");
  if (rule.evidenceType === "word" && /\s/u.test(value)) throw new DomainError("INVALID_WORD");
  return value;
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/unit/validation.test.ts tests/unit/schemas.test.ts`

Expected: all domain tests pass.

- [ ] **Step 5: Commit**

```bash
git add shared tests/unit
git commit -m "feat: define event domain contracts"
```

### Task 3: Encode the 50-mission catalog and assignment engine

**Files:**
- Create: `shared/assignment.ts`, `scripts/data/missions.ts`, `scripts/data/schedule.ts`, `scripts/data/event.ts`
- Test: `tests/unit/assignment.test.ts`, `tests/unit/catalog.test.ts`

- [ ] **Step 1: Write failing composition and conflict tests**

```ts
it("assigns 2 photos, 5 comments, and 4 words for 100 points", () => {
  const pack = selectMissionPack({ missions, interests: ["IA & Agentes"], seed: "uid-1" });
  expect(pack.filter((m) => m.evidenceType === "photo")).toHaveLength(2);
  expect(pack.filter((m) => m.evidenceType === "comment")).toHaveLength(5);
  expect(pack.filter((m) => m.evidenceType === "word")).toHaveLength(4);
  expect(pack.reduce((sum, mission) => sum + mission.points, 0)).toBe(100);
});

it("never assigns two attendance missions in the same slot", () => {
  const pack = selectMissionPack({ missions, interests: [], seed: "uid-2" });
  const slots = pack.flatMap((mission) => mission.requiresAttendance && mission.slot ? [mission.slot] : []);
  expect(new Set(slots).size).toBe(slots.length);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/assignment.test.ts tests/unit/catalog.test.ts`

Expected: missing catalog/selector failures.

- [ ] **Step 3: Implement the stable seeded selector and full catalog**

Transcribe M01–M50 from `contrext.md`, including exact titles, instructions, validation, categories, points, session metadata, attendance flags, and closing/general tags. Use a deterministic string hash and ranked candidate pools; never relax slot conflicts.

- [ ] **Step 4: Verify GREEN and catalog invariants**

Run: `npm test -- tests/unit/assignment.test.ts tests/unit/catalog.test.ts`

Expected: 50 unique IDs, point/type invariants, required fallback coverage, and deterministic packs pass.

- [ ] **Step 5: Commit**

```bash
git add shared/assignment.ts scripts/data tests/unit
git commit -m "feat: add mission catalog and assignment engine"
```

### Task 4: Configure Firebase clients and infrastructure

**Files:**
- Create: `src/firebase/app.ts`, `src/firebase/auth.ts`, `src/firebase/data.ts`, `src/firebase/functions.ts`, `src/firebase/storage.ts`, `src/firebase/analytics.ts`, `src/firebase/app-check.ts`
- Create: `.firebaserc`, `firebase.json`, `firebase/firestore.indexes.json`, `remoteconfig.template.json`
- Modify: `firebase.ts` to re-export the typed initializer without duplicate app creation
- Test: `tests/unit/firebase-config.test.ts`

- [ ] **Step 1: Write the failing configuration test**

```ts
it("uses the supplied aws-day-gt Firebase identifiers", async () => {
  const { firebaseConfig } = await import("../../src/firebase/app");
  expect(firebaseConfig.projectId).toBe("aws-day-gt");
  expect(firebaseConfig.appId).toBe("1:704203243247:web:0479108dbe29978bc1651a");
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/firebase-config.test.ts`

Expected: missing module failure.

- [ ] **Step 3: Implement modular initialization**

Use the exact supplied values as safe defaults with `VITE_FIREBASE_*` overrides, guard Analytics/App Check behind browser and configuration checks, connect all products to emulators when `VITE_USE_FIREBASE_EMULATORS=true`, and enable Firestore persistent local cache.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/unit/firebase-config.test.ts && npm run typecheck`

Expected: test and type checking pass without initializing browser-only APIs in Node.

- [ ] **Step 5: Commit**

```bash
git add src/firebase firebase.ts .firebaserc firebase.json firebase remoteconfig.template.json tests/unit/firebase-config.test.ts
git commit -m "feat: configure Firebase services"
```

### Task 5: Implement privileged Functions with transactional scoring

**Files:**
- Create: `functions/src/shared/auth.ts`, `functions/src/shared/callable.ts`, `functions/src/shared/refs.ts`
- Create: `functions/src/auth/promote-initial-admin.ts`
- Create: `functions/src/missions/complete-onboarding.ts`, `functions/src/missions/replace-mission.ts`
- Create: `functions/src/submissions/submit-text.ts`, `functions/src/submissions/register-photo.ts`
- Create: `functions/src/moderation/review-submission.ts`
- Create: `functions/src/scoring/leaderboard.ts`, `functions/src/scoring/recalculate.ts`
- Create: `functions/src/admin/settings.ts`, `functions/src/admin/roles.ts`, `functions/src/admin/missions.ts`
- Create: `functions/src/index.ts`
- Test: `tests/integration/functions.test.ts`

- [ ] **Step 1: Write failing emulator integration tests**

Cover idempotent onboarding, 11 mission assignment, text scoring once, photo pending without points, moderator approval awarding once, rejection/resubmission, compatible replacement cap, admin-only mutation, and initial-admin promotion.

```ts
expect(first.scoreDelta).toBe(5);
expect(second.scoreDelta).toBe(0);
expect(await readScore(uid)).toMatchObject({ totalPoints: 5, completedMissions: 1 });
```

- [ ] **Step 2: Run and verify RED**

Run: `npm run test:integration`

Expected: callable exports are absent.

- [ ] **Step 3: Implement minimal secure Functions**

Every callable parses input with Zod, requires Auth, checks role and optional App Check, validates authoritative Firestore state, uses server timestamps and transactions, writes an idempotency result, maps `DomainError` to `HttpsError`, and returns only public response fields. Export Auth trigger and callable functions from one index.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:integration`

Expected: all Functions integration cases pass against emulators.

- [ ] **Step 5: Commit**

```bash
git add functions tests/integration
git commit -m "feat: add secure mission and scoring functions"
```

### Task 6: Lock down Firestore and Storage

**Files:**
- Create: `firebase/firestore.rules`, `firebase/storage.rules`
- Modify: `firebase/firestore.indexes.json`
- Test: `tests/rules/firestore.test.ts`, `tests/rules/storage.test.ts`

- [ ] **Step 1: Write failing deny/allow rules tests**

```ts
await assertFails(participantDb.doc(`scores/${EVENT_ID}_${uid}`).set({ totalPoints: 100 }));
await assertFails(participantDb.doc(`users/${otherUid}`).get());
await assertSucceeds(participantDb.doc(`users/${uid}`).get());
await assertFails(uploadBytes(ref(storage, `evidence/${EVENT_ID}/${otherUid}/M01/x.webp`), image));
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:rules`

Expected: permissive/missing rules do not satisfy the assertions.

- [ ] **Step 3: Implement least-privilege rules and indexes**

Allow public event landing reads, authenticated active mission/schedule reads, owner-private records, staff review reads, tightly limited owner profile updates, and server-only authoritative writes. Restrict Storage to owner path, image content type, and configured maximum size.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:rules`

Expected: the complete allow/deny matrix passes.

- [ ] **Step 5: Commit**

```bash
git add firebase tests/rules
git commit -m "security: enforce Firebase access boundaries"
```

### Task 7: Build the Socrates-inspired design system and application shell

**Files:**
- Create: `src/design-system/tokens.css`, `src/design-system/global.css`, `src/design-system/components.tsx`, `src/design-system/icons.tsx`, `src/design-system/motion.ts`
- Create: `src/app/router.tsx`, `src/app/providers.tsx`, `src/app/AppShell.tsx`, `src/app/RouteGuards.tsx`, `src/main.tsx`
- Test: `tests/unit/design-system.test.tsx`, `tests/e2e/shell.spec.ts`

- [ ] **Step 1: Write failing component/accessibility tests**

```tsx
render(<Button>Participar</Button>);
expect(screen.getByRole("button", { name: "Participar" })).toHaveClass("ds-button");
expect(screen.getByRole("button")).toHaveStyle({ minHeight: "48px" });
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/design-system.test.tsx`

Expected: missing components.

- [ ] **Step 3: Implement tokens, components, themes, and routes**

Create Button, Card, Chip, Input, Textarea, Checkbox, ProgressBar, Ring, StatusNotice, EmptyState, Skeleton, Dialog, and bottom navigation. Use navy/cloud/orange tokens, warm surfaces, safe-area padding, focus-visible outlines, dark mode, and reduced-motion media queries.

- [ ] **Step 4: Verify GREEN and responsive shell**

Run: `npm test -- tests/unit/design-system.test.tsx && npm run test:e2e -- tests/e2e/shell.spec.ts`

Expected: semantic component tests pass and no horizontal overflow at phone/tablet/desktop widths.

- [ ] **Step 5: Commit**

```bash
git add src/design-system src/app src/main.tsx tests/unit/design-system.test.tsx tests/e2e/shell.spec.ts
git commit -m "feat: add mobile event design system"
```

### Task 8: Implement authentication and onboarding

**Files:**
- Create: `src/features/auth/AuthProvider.tsx`, `src/features/auth/LandingPage.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/auth/AuthCompletePage.tsx`
- Create: `src/features/onboarding/OnboardingPage.tsx`, `src/features/onboarding/onboarding-schema.ts`
- Test: `tests/unit/onboarding.test.tsx`, `tests/e2e/auth-onboarding.spec.ts`

- [ ] **Step 1: Write failing journey tests**

Test invalid email, sent state, expired link recovery, unique alias feedback, optional interests, required versioned terms, independent consent toggles, resume behavior, and completion calling `completeOnboarding` once.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/onboarding.test.tsx`

Expected: feature modules absent.

- [ ] **Step 3: Implement the passwordless and four-step flows**

Use `sendSignInLinkToEmail`, `isSignInWithEmailLink`, and `signInWithEmailLink`; store only the pending email locally. Mask email after authentication. Use React Hook Form with Zod and Spanish accessible errors. Route authenticated incomplete profiles to onboarding and completed profiles to missions.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/unit/onboarding.test.tsx && npm run test:e2e -- tests/e2e/auth-onboarding.spec.ts`

Expected: unit and emulator-backed browser journey passes.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth src/features/onboarding tests
git commit -m "feat: add passwordless onboarding journey"
```

### Task 9: Implement missions, evidence, and durable offline queue

**Files:**
- Create: `src/features/missions/MissionsPage.tsx`, `src/features/missions/MissionDetailPage.tsx`, `src/features/missions/MissionCard.tsx`, `src/features/missions/useMissions.ts`
- Create: `src/features/submissions/WordEvidence.tsx`, `src/features/submissions/CommentEvidence.tsx`, `src/features/submissions/PhotoEvidence.tsx`
- Create: `src/offline/db.ts`, `src/offline/photo-processing.ts`, `src/offline/upload-queue.ts`
- Test: `tests/unit/photo-processing.test.ts`, `tests/unit/evidence.test.tsx`, `tests/e2e/missions.spec.ts`

- [ ] **Step 1: Write failing evidence and queue tests**

Verify word/comment limits, local comment drafts, image long-edge resize, output MIME, queue persistence, same operation ID on retry, status presentation, replacement limit, and no optimistic score change.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/photo-processing.test.ts tests/unit/evidence.test.tsx`

Expected: evidence and offline modules absent.

- [ ] **Step 3: Implement participant mission workflows**

Subscribe only to the current user’s assigned missions, fetch mission records in bounded batches, render all states, call text Functions with `crypto.randomUUID()` idempotency keys, re-encode images through canvas, persist blobs in IndexedDB, upload on connectivity, and call photo registration before removing queue entries.

- [ ] **Step 4: Verify GREEN including offline browser path**

Run: `npm test -- tests/unit/photo-processing.test.ts tests/unit/evidence.test.tsx && npm run test:e2e -- tests/e2e/missions.spec.ts`

Expected: evidence behavior, queue recovery, retry idempotency, and responsive mission UI pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/missions src/features/submissions src/offline tests
git commit -m "feat: add resilient mission evidence flows"
```

### Task 10: Add progress, leaderboard, badges, and profile

**Files:**
- Create: `shared/badges.ts`
- Create: `src/features/progress/ProgressPage.tsx`, `src/features/progress/ScoreHero.tsx`
- Create: `src/features/leaderboard/LeaderboardPage.tsx`
- Create: `src/features/profile/ProfilePage.tsx`
- Test: `tests/unit/badges.test.ts`, `tests/e2e/progress-profile.spec.ts`

- [ ] **Step 1: Write failing badge and privacy tests**

Verify badge thresholds, rank tie ordering, masked email, no private leaderboard fields, consent updates, deletion request, and sign-out.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/badges.test.ts`

Expected: badge module absent.

- [ ] **Step 3: Implement read-focused participant views**

Render authoritative score and pending counts, mission-type summaries, earned/locked badges, top 50 plus contextual rank, masked profile details, allowed consent changes, and deletion request confirmation.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/unit/badges.test.ts && npm run test:e2e -- tests/e2e/progress-profile.spec.ts`

Expected: badge logic and privacy-focused browser flows pass.

- [ ] **Step 5: Commit**

```bash
git add shared/badges.ts src/features/progress src/features/leaderboard src/features/profile tests
git commit -m "feat: add participant progress and profile views"
```

### Task 11: Build the moderator and administrator console

**Files:**
- Create: `src/features/admin/AdminLayout.tsx`, `DashboardPage.tsx`, `ModerationPage.tsx`, `MissionsAdminPage.tsx`, `ScheduleAdminPage.tsx`, `UsersAdminPage.tsx`, `SettingsAdminPage.tsx`, `AuditPage.tsx`
- Test: `tests/e2e/admin.spec.ts`

- [ ] **Step 1: Write failing role and operation tests**

Test participant denial, moderator queue access without settings access, admin dashboard, photo approval/rejection, mission edits, schedule edits, staff role changes, legal copy and flag updates, recalculation confirmation, and audit entries.

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/admin.spec.ts`

Expected: admin routes absent.

- [ ] **Step 3: Implement lazy-loaded operational screens**

Use paginated queries and callable mutations. Require explicit confirmation for role, points, recalculation, and event-state changes. Never expose raw Storage paths as public URLs; resolve staff-only previews through authenticated SDK access.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:e2e -- tests/e2e/admin.spec.ts`

Expected: role boundaries and administrative workflows pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin tests/e2e/admin.spec.ts
git commit -m "feat: add event operations console"
```

### Task 12: Add PWA, telemetry, seeding, and operational documentation

**Files:**
- Create: `public/icon.svg`, generated PNG icons, `src/pwa/register.ts`, `src/app/OfflineBanner.tsx`
- Create: `src/analytics/events.ts`
- Create: `scripts/seed-data.ts`, `scripts/set-admin.ts`, `scripts/smoke-production.mjs`
- Create: `README.md`, `docs/operations.md`
- Test: `tests/unit/analytics.test.ts`, `tests/unit/seed.test.ts`, `tests/e2e/pwa.spec.ts`

- [ ] **Step 1: Write failing privacy and seed-safety tests**

Verify Analytics rejects forbidden parameter names, seed defaults to dry-run, production apply requires typed confirmation, no deletes are generated, all 50 missions are present, and manifest/service-worker metadata exists.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/analytics.test.ts tests/unit/seed.test.ts`

Expected: analytics and seed modules absent.

- [ ] **Step 3: Implement PWA and operational tooling**

Configure `vite-plugin-pwa` for app-shell caching and update prompts, emit maskable icons, add online/offline announcements, allowlist Analytics event parameters, implement Firestore seed diff/apply, and document local emulator use, Auth email-link setup, App Check prerequisite, billing, seeding, staff bootstrap, deployment, rollback, and event-day switches.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/unit/analytics.test.ts tests/unit/seed.test.ts && npm run build && npm run test:e2e -- tests/e2e/pwa.spec.ts`

Expected: tests and production PWA build pass with valid manifest and service worker.

- [ ] **Step 5: Commit**

```bash
git add public src/pwa src/analytics src/app/OfflineBanner.tsx scripts README.md docs/operations.md tests
git commit -m "feat: prepare PWA for event operations"
```

### Task 13: Full verification, Firebase deployment, seed, and smoke test

**Files:**
- Modify only files required by failures found during verification
- Record: `docs/deployment-report.md`

- [ ] **Step 1: Run the complete local quality gate**

Run: `npm run lint && npm run typecheck && npm test && npm run test:rules && npm run test:integration && npm run build && npm run test:e2e`

Expected: every command exits zero with no unexpected warnings.

- [ ] **Step 2: Validate Firebase authentication and project access**

Run: `firebase --version && firebase projects:list && firebase use aws-day-gt`

Expected: CLI is authenticated and selects `aws-day-gt`. If the packaged CLI cannot write its runtime cache, set a workspace-owned Firebase config/cache directory before retrying.

- [ ] **Step 3: Validate Firebase configuration and dry-run production data**

Run: `firebase emulators:exec --only firestore,storage "npm run test:rules" --project aws-day-gt`

Run: `npm run seed -- --project aws-day-gt`

Expected: valid rules/index configuration and a non-mutating create/update/unchanged diff for the event, schedule, missions, and configuration.

- [ ] **Step 4: Deploy infrastructure and application**

Run: `npm run build && firebase deploy --only functions,firestore:indexes,firestore:rules,storage,remoteconfig,hosting --project aws-day-gt`

Expected: Functions and Hosting deploy successfully and Firebase prints the live Hosting URL.

- [ ] **Step 5: Apply seed after explicit diff review**

Run: `npm run seed -- --project aws-day-gt --apply --confirm aws-community-day-gt-2026`

Expected: event, schedule, 50 missions, protected configuration, provisional legal copy, and initial-admin allowlist are created/updated without deletion.

- [ ] **Step 6: Run post-deployment smoke checks**

Run: `node scripts/smoke-production.mjs <hosting-url>`

Expected: landing, SPA rewrites, manifest, service worker, unauthenticated route protection, and public event configuration checks pass. Complete the documented manual Email Link and admin-role checks using `guategeeks3d@gmail.com`.

- [ ] **Step 7: Record evidence and commit**

Document command results, deployed URL, Function region, seed counts, enabled flags, App Check status, and remaining console prerequisites in `docs/deployment-report.md`.

```bash
git add docs/deployment-report.md
git commit -m "docs: record Firebase production deployment"
```
