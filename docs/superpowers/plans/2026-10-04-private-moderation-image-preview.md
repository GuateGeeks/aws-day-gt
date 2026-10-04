# Private Moderation Image Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render pending evidence photographs securely in the moderation console and surface queue/image loading failures.

**Architecture:** A focused React component downloads private evidence with Firebase Storage `getBlob`, renders an object URL, and revokes it during retries and cleanup. A moderation card owns the image-ready state so review controls remain disabled until evidence is visible, while `AdminPage` owns explicit Firestore loading and error states.

**Tech Stack:** React 19, TypeScript, Firebase Web SDK, Vitest, Testing Library, Firebase Hosting

---

## File structure

- Create `src/features/admin/PrivateEvidenceImage.tsx`: authenticated Storage download and object-URL lifecycle.
- Create `src/features/admin/ModerationCard.tsx`: one evidence card and review gating.
- Modify `src/features/admin/AdminPage.tsx`: queue subscription state and card composition.
- Modify `src/design-system/global.css`: responsive preview and loading-state styles.
- Create `tests/unit/private-evidence-image.test.tsx`: image loading, failure, retry, and cleanup behavior.
- Create `tests/unit/admin-page.test.tsx`: queue error and empty-state distinction.

### Task 1: Private evidence loader

**Files:**
- Create: `tests/unit/private-evidence-image.test.tsx`
- Create: `src/features/admin/PrivateEvidenceImage.tsx`

- [ ] **Step 1: Write failing component tests**

Mock `firebase/storage` and `src/firebase/storage`, then assert that the component calls `ref(storage, storagePath)` and `getBlob`, displays a loading status, renders the resulting object URL, reports readiness, shows a private error without exposing the path, retries on demand, and revokes object URLs on retry/unmount.

- [ ] **Step 2: Verify the tests fail for the missing component**

Run: `npx vitest run tests/unit/private-evidence-image.test.tsx`

Expected: FAIL because `PrivateEvidenceImage` does not exist.

- [ ] **Step 3: Implement the minimal loader**

Create a component with this public contract:

```tsx
type PrivateEvidenceImageProps = {
  storagePath?: string;
  missionId: string;
  onReadyChange?: (ready: boolean) => void;
};

export function PrivateEvidenceImage(props: PrivateEvidenceImageProps) {
  // Download with getBlob(ref(storage, storagePath)), create/revoke an object URL,
  // ignore stale asynchronous completions, and expose loading/error/retry states.
}
```

Use the Spanish UI strings `Cargando fotografía…`, `No pudimos cargar esta fotografía.` and `Reintentar`. Render alternative text as `Evidencia fotográfica de la misión ${missionId}`.

- [ ] **Step 4: Verify the loader tests pass**

Run: `npx vitest run tests/unit/private-evidence-image.test.tsx`

Expected: all private evidence tests PASS.

- [ ] **Step 5: Commit the loader**

```bash
git add tests/unit/private-evidence-image.test.tsx src/features/admin/PrivateEvidenceImage.tsx
git commit -m "feat: load private moderation evidence"
```

### Task 2: Moderation queue integration

**Files:**
- Create: `src/features/admin/ModerationCard.tsx`
- Create: `tests/unit/admin-page.test.tsx`
- Modify: `src/features/admin/AdminPage.tsx`
- Modify: `src/design-system/global.css`

- [ ] **Step 1: Write failing moderation tests**

Mock the Firestore subscription and authenticated profile. Assert that a successful empty snapshot shows `Bandeja al día`, while the subscription error callback shows `No pudimos cargar la bandeja de moderación.` and does not claim the queue is empty. Assert that a pending submission renders a moderation card and that review controls are disabled until its `PrivateEvidenceImage` reports ready.

- [ ] **Step 2: Verify the moderation tests fail**

Run: `npx vitest run tests/unit/admin-page.test.tsx`

Expected: FAIL because the existing page has no loading/error state and no image-ready review gate.

- [ ] **Step 3: Implement the card and queue states**

Move one submission's presentation to `ModerationCard`. Keep local `imageReady` and `reviewing` state, pass readiness updates from `PrivateEvidenceImage`, disable Approve/Reject until the image is ready or during a review request, and display a neutral review failure if the callable rejects.

Update `AdminPage` to use the `onSnapshot` success and error callbacks with three explicit states: initial loading, query failure, and successful empty/non-empty result. Preserve the existing pending query and review callable payload.

Add responsive CSS classes `.moderation-photo`, `.moderation-photo__loading`, and `.moderation-photo__image` so evidence keeps its aspect ratio and fits the card without cropping critical content.

- [ ] **Step 4: Verify focused tests pass**

Run: `npx vitest run tests/unit/private-evidence-image.test.tsx tests/unit/admin-page.test.tsx`

Expected: all focused tests PASS.

- [ ] **Step 5: Commit queue integration**

```bash
git add src/features/admin/ModerationCard.tsx src/features/admin/AdminPage.tsx src/design-system/global.css tests/unit/admin-page.test.tsx
git commit -m "fix: show evidence in moderation queue"
```

### Task 3: Full verification and deployment

**Files:**
- Modify: `docs/deployment-report.md`

- [ ] **Step 1: Run the complete verification suite**

Run: `npm run lint && npm run typecheck && npm test && npm --prefix functions run build && npm run build`

Expected: all checks PASS and Vite produces the production bundle.

- [ ] **Step 2: Run Firebase rules tests**

Run: `npx firebase emulators:exec --only firestore,storage "npm run test:rules" --project aws-day-gt-rules-test`

Expected: Firestore and Storage rule tests PASS.

- [ ] **Step 3: Deploy Hosting only**

Run: `npx firebase deploy --only hosting --project aws-day-gt`

Expected: deployment succeeds at `https://aws-day-gt.web.app`.

- [ ] **Step 4: Smoke-test deployed routes**

Run: `node scripts/smoke-production.mjs https://aws-day-gt.web.app`

Expected: `/`, `/app/missions`, and `/manifest.webmanifest` return HTTP 200.

- [ ] **Step 5: Record and commit deployment evidence**

Update `docs/deployment-report.md` with the image-preview behavior, verification counts, deployment timestamp, and smoke result.

```bash
git add docs/deployment-report.md
git commit -m "docs: record moderation preview deployment"
```
