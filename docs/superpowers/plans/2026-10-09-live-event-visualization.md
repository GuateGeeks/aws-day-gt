# Live Event Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an unauthenticated `/live` event screen with a Three.js QR-connection cloud, consent-safe approved photo gallery, track pulse, and live interaction insights.

**Architecture:** A public callable Cloud Function reads private event collections, filters and anonymizes them, signs only consent-eligible approved images, and returns a bounded schema-validated snapshot. The React page polls that endpoint, retains stale data during failures, and feeds focused presentation components; Three.js is isolated behind a renderer adapter with a 2D fallback.

**Tech Stack:** React 19, TypeScript, Firebase Functions/Firestore/Storage, Zod, Three.js, Vitest, Testing Library, Playwright

---

## File map

- Create `shared/public-visualization.ts`: shared public response schema and inferred types.
- Create `functions/src/public/visualization-data.ts`: pure anonymization, graph, gallery eligibility, track, metric, and insight projection.
- Create `functions/src/public/get-visualization.ts`: Firestore/Storage data loader and unauthenticated callable.
- Modify `functions/src/index.ts`: export the callable.
- Create `src/features/live/usePublicVisualization.ts`: validated polling state machine.
- Create `src/features/live/community-cloud.ts`: Three.js renderer lifecycle and deterministic positions.
- Create `src/features/live/CommunityCloud.tsx`: accessible canvas host and 2D fallback.
- Create `src/features/live/LivePanels.tsx`: gallery, track bars, insight, and metric strip.
- Create `src/features/live/LiveEventPage.tsx`: page composition and presentation states.
- Create `src/features/live/live-event.css`: 16:9-first public display styling.
- Modify `src/app/router.tsx`: expose `/live` outside authentication.
- Modify `package.json` and `package-lock.json`: add `three`.
- Create unit tests for contracts, projection, polling, renderer lifecycle, panels, page states, and routing.

### Task 1: Add the public snapshot contract

**Files:**
- Create: `shared/public-visualization.ts`
- Test: `tests/unit/public-visualization-schema.test.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from "vitest";
import { publicVisualizationSchema } from "../../shared/public-visualization";

describe("public visualization contract", () => {
  it("accepts a sanitized event snapshot", () => {
    const parsed = publicVisualizationSchema.parse({
      generatedAt: "2026-10-10T15:00:00.000Z",
      eventId: "aws-community-day-gt-2026",
      nodes: [{ id: "p_abc", alias: "Quetzi", category: "Development", degree: 1 }],
      edges: [], photos: [], tracks: [], insights: [],
      metrics: { participants: 1, connections: 0, approvedPhotos: 0, leadingTrack: null }
    });
    expect(parsed.nodes[0]?.alias).toBe("Quetzi");
    expect(JSON.stringify(parsed)).not.toContain("userId");
  });
});
```

- [ ] **Step 2: Run `npx vitest run tests/unit/public-visualization-schema.test.ts` and verify it fails because the module is missing.**

- [ ] **Step 3: Implement bounded Zod schemas** for `nodes` (max 250), `edges` (max 600), `photos` (max 24), `tracks` (max 6), `insights` (max 4), and the four metrics. Export `PublicVisualizationSnapshot` with `z.infer`.

- [ ] **Step 4: Run the focused test and verify it passes.**

- [ ] **Step 5: Commit with `git commit -m "feat: define public visualization contract"`.**

### Task 2: Build privacy-safe projections

**Files:**
- Create: `functions/src/public/visualization-data.ts`
- Test: `tests/unit/public-visualization-data.test.ts`

- [ ] **Step 1: Write failing tests** that pass raw users, connections, C12 progress, approved/rejected photo submissions, and configured track labels into `buildPublicVisualization`. Assert:

```ts
expect(result.nodes).toEqual(expect.arrayContaining([
  expect.objectContaining({ alias: "Ada", category: "Development", degree: 1 })
]));
expect(result.edges).toHaveLength(1);
expect(result.photos.map((photo) => photo.alias)).toEqual(["Ada"]);
expect(result.tracks[0]).toMatchObject({ id: "ai", label: "AI", count: 1, percentage: 100 });
expect(JSON.stringify(result)).not.toMatch(/uid-a|ada@example|evidence\//);
```

Include explicit cases proving that rejected photos, approved photos without `photoPublication`, disconnected users, malformed edges, and unknown track IDs are excluded.

- [ ] **Step 2: Run `npx vitest run tests/unit/public-visualization-data.test.ts` and verify the missing-export failure.**

- [ ] **Step 3: Implement pure helpers:**

```ts
export function publicNodeId(eventId: string, uid: string) {
  return `p_${createHash("sha256").update(`${eventId}:${uid}`).digest("hex").slice(0, 16)}`;
}

export async function buildPublicVisualization(input: VisualizationSource, signPhoto: PhotoSigner) {
  // Normalize unique undirected edges, collect connected profiles, compute degree,
  // filter approved photos by current consent, aggregate C12 trackId values,
  // sign at most 24 images, derive bounded metrics and safe deterministic insights,
  // and validate the final value with publicVisualizationSchema.
}
```

Sort edges, tracks, photos, and nodes deterministically before applying limits. Do not place raw IDs or paths into the result, including temporary intermediate fields returned to the caller.

- [ ] **Step 4: Run the focused test and verify all privacy and aggregation cases pass.**

- [ ] **Step 5: Commit with `git commit -m "feat: project privacy-safe live event data"`.**

### Task 3: Expose the unauthenticated visualization callable

**Files:**
- Create: `functions/src/public/get-visualization.ts`
- Modify: `functions/src/index.ts`
- Test: `tests/integration/public-visualization.test.ts`

- [ ] **Step 1: Write a failing emulator integration test** that seeds two consenting users, one connection, one completed C12 response, one approved photo submission, and C12 configuration. Call `getPublicEventVisualizationSnapshot` with a deterministic signer and assert the snapshot contains one edge, the configured track label, and only the approved consenting photo.

- [ ] **Step 2: Run `npm run test:integration -- tests/integration/public-visualization.test.ts` with Firestore emulator support and verify the helper is missing.**

- [ ] **Step 3: Implement the loader:**

```ts
export async function getPublicEventVisualizationSnapshot(signPhoto = signEvidencePhoto) {
  const [connections, progress, submissions, trackChallenge] = await Promise.all([
    database.collection("connections").where("eventId", "==", EVENT_ID).limit(601).get(),
    database.collection("challengeProgress").where("eventId", "==", EVENT_ID).limit(1000).get(),
    database.collection("submissions").where("eventId", "==", EVENT_ID).limit(100).get(),
    refs.challenge("C12").get()
  ]);
  // Fetch only profiles referenced by valid graph edges or approved photo candidates,
  // then pass normalized records to buildPublicVisualization.
}

export const getPublicEventVisualization = onCall(
  { region: "us-central1", enforceAppCheck: false, cors: true },
  async () => getPublicEventVisualizationSnapshot()
);
```

`signEvidencePhoto` uses a ten-minute V4 read URL. Missing objects are skipped rather than failing the whole snapshot.

- [ ] **Step 4: Export the callable from `functions/src/index.ts`.**

- [ ] **Step 5: Run the focused integration test and `npm --prefix functions run build`; verify both pass.**

- [ ] **Step 6: Commit with `git commit -m "feat: expose public live visualization snapshot"`.**

### Task 4: Add validated resilient polling

**Files:**
- Create: `src/features/live/usePublicVisualization.ts`
- Test: `tests/unit/live-visualization-polling.test.tsx`

- [ ] **Step 1: Write failing fake-timer hook tests** that mock `httpsCallable` and verify initial loading, success, a 20-second refresh, retention of the previous snapshot after a refresh failure, `stale: true`, and detection of newly added edge IDs.

- [ ] **Step 2: Run `npx vitest run tests/unit/live-visualization-polling.test.tsx` and verify the hook module is missing.**

- [ ] **Step 3: Implement the hook** with one in-flight request, `publicVisualizationSchema.safeParse`, a 20-second interval, cleanup on unmount, and the state:

```ts
type PublicVisualizationState = {
  snapshot: PublicVisualizationSnapshot | null;
  loading: boolean;
  stale: boolean;
  error: string | null;
  newEdgeIds: ReadonlySet<string>;
  retry(): void;
};
```

- [ ] **Step 4: Run the focused hook tests and verify they pass without timer leaks.**

- [ ] **Step 5: Commit with `git commit -m "feat: poll resilient public visualization data"`.**

### Task 5: Build the public panels and route

**Files:**
- Create: `src/features/live/LivePanels.tsx`
- Create: `src/features/live/LiveEventPage.tsx`
- Modify: `src/app/router.tsx`
- Test: `tests/unit/live-event-page.test.tsx`
- Test: `tests/unit/public-live-route.test.tsx`

- [ ] **Step 1: Write failing component tests** asserting that the page renders the event title, four labeled metrics, directly labeled track bars, three photo slots with alias attribution, loading and empty states, and a reconnecting status while stale data stays visible.

- [ ] **Step 2: Write a failing route test** asserting `/live` renders without `ProtectedRoute` and does not redirect to `/login`.

- [ ] **Step 3: Run both tests and verify failures are caused by missing live components and route.**

- [ ] **Step 4: Implement `PhotoGallery`, `TrackPulse`, `EventInsight`, and `LiveMetrics`** as semantic, non-interactive presentation components. Failed images are removed from the current rotation; a zero-photo gallery renders “Las historias del evento aparecerán aquí”.

- [ ] **Step 5: Compose `LiveEventPage`** with branded loading, initial error plus retry, empty, ready, and stale states. Add `<Route path="/live">` equivalent as a top-level public route before the protected branch.

- [ ] **Step 6: Run the focused tests and verify they pass.**

- [ ] **Step 7: Commit with `git commit -m "feat: add public live event screen"`.**

### Task 6: Add the Three.js community cloud

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/features/live/community-cloud.ts`
- Create: `src/features/live/CommunityCloud.tsx`
- Test: `tests/unit/community-cloud.test.tsx`
- Test: `tests/unit/community-cloud-layout.test.ts`

- [ ] **Step 1: Install Three.js with `npm install three`.**

- [ ] **Step 2: Write failing deterministic-layout tests** proving the same public node ID always produces the same position, all coordinates stay within the configured cloud radius, and every edge maps to known node coordinates.

- [ ] **Step 3: Write failing component tests** using an injected renderer factory to verify one animation loop starts, renderer/canvas resources are disposed on unmount, reduced-motion disables orbit updates, and WebGL creation failure renders the accessible 2D constellation.

- [ ] **Step 4: Run the focused tests and verify expected failures.**

- [ ] **Step 5: Implement `community-cloud.ts`** using a Three.js scene, perspective camera, fog, `InstancedMesh` nodes, batched `LineSegments`, deterministic spherical placement, resize observation, slow camera orbit, and explicit geometry/material/renderer disposal.

- [ ] **Step 6: Implement `CommunityCloud.tsx`** with a canvas host, top-degree projected alias labels, category legend, screen-reader graph summary, reduced-motion media query, and SVG 2D fallback.

- [ ] **Step 7: Run the focused tests and verify they pass.**

- [ ] **Step 8: Commit with `git commit -m "feat: render QR connections as a Three.js cloud"`.**

### Task 7: Finish the cinematic 16:9 styling

**Files:**
- Create: `src/features/live/live-event.css`
- Modify: `src/features/live/LiveEventPage.tsx`
- Test: `tests/unit/live-event-accessibility.test.tsx`

- [ ] **Step 1: Write a failing accessibility-focused test** for one `h1`, labeled regions for the network/gallery/tracks/metrics, descriptive image alt text, direct track values, `role="status"` reconnect messaging, and no essential icon without an accessible label.

- [ ] **Step 2: Run the test and verify the missing semantics fail.**

- [ ] **Step 3: Implement the dark display stylesheet** with CSS variables, a 16:9 desktop grid, 1920×1080-readable `clamp()` typography, fixed gallery aspect ratios, high-contrast teal/orange/green data colors, mobile stacking, and `prefers-reduced-motion` overrides. Animate only opacity and transforms.

- [ ] **Step 4: Add the final semantic regions and fallback copy to the page.**

- [ ] **Step 5: Run the accessibility test, all live unit tests, and `npm run typecheck`; verify they pass.**

- [ ] **Step 6: Commit with `git commit -m "style: finish cinematic live event dashboard"`.**

### Task 8: Verify production behavior

**Files:**
- Create: `tests/e2e/live-event-screen.spec.ts`

- [ ] **Step 1: Add a Playwright smoke test** at a 1920×1080 viewport that opens `/live`, verifies the title and primary regions fit without document-level horizontal scrolling, and captures a screenshot artifact.

- [ ] **Step 2: Run the focused browser smoke test against the Vite preview and correct any layout defects.**

- [ ] **Step 3: Run the complete verification suite:**

```bash
npm run typecheck
npm test
npm run build
npm --prefix functions run build
```

Expected: every command exits 0 with no test failures or TypeScript errors.

- [ ] **Step 4: Inspect `git diff --check`, `git status --short`, and the final diff to ensure the two pre-existing untracked root files were not added.**

- [ ] **Step 5: Commit with `git commit -m "test: verify live event visualization"`.**
