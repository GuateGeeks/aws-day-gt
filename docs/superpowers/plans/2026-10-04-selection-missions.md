# Selection-Based Missions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-text mission evidence with secure single/multiple selections, including private quiz answers, two attempts, and replacement after exhaustion.

**Architecture:** Public mission documents expose only selectable options and limits. A shared pure evaluator validates option sets and quiz outcomes; the callable reads correct answers from a server-only collection and applies attempts/scoring transactionally. React renders native radio/checkbox controls and Firestore rules deny every client access to answer keys.

**Tech Stack:** React 19, TypeScript, Firebase Functions v2, Firestore, Firebase Hosting, Zod, Vitest, Testing Library

---

## File structure

- Modify `shared/types.ts`, `shared/schemas.ts`, and `shared/errors.ts` for selection configuration, failed assignments, submissions, and error codes.
- Create `shared/selection.ts` for deterministic validation and exact answer-set evaluation.
- Create `scripts/data/mission-selections.ts` for all 35 public configurations and 27 private answer keys.
- Modify `scripts/data/missions.ts` to attach configurations and replace free-text prompts.
- Modify `functions/src/submissions/submit-text.ts`, `functions/src/missions/replace-mission.ts`, and `functions/src/shared/refs.ts` for authoritative attempts and failed replacement.
- Modify `src/features/submissions/TextEvidence.tsx` and `src/features/missions/MissionDetailPage.tsx` for radio/checkbox UI and exhausted-state replacement.
- Modify `scripts/seed-data.ts` and `firebase/firestore.rules` to write and protect private keys.
- Expand unit, integration, component, and rules tests.

### Task 1: Selection domain and complete catalog

**Files:**
- Create: `shared/selection.ts`
- Create: `scripts/data/mission-selections.ts`
- Modify: `shared/types.ts`
- Modify: `shared/schemas.ts`
- Modify: `shared/errors.ts`
- Modify: `scripts/data/missions.ts`
- Modify: `tests/unit/catalog.test.ts`
- Create: `tests/unit/selection.test.ts`

- [ ] **Step 1: Write failing domain and catalog tests**

Test that all 35 non-photo missions have 4–6 unique opaque options, valid min/max limits, and the expected `quiz`/`opinion` classification. Assert the exact quiz IDs, the four named multi-answer agenda questions, absence of answer IDs from serialized missions, duplicate/unknown/count rejection, exact-set quiz matching, first failure, exhaustion, and opinion acceptance.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npx vitest run tests/unit/catalog.test.ts tests/unit/selection.test.ts`

Expected: FAIL because selection types, catalog, and evaluator do not exist.

- [ ] **Step 3: Add the domain contracts**

Add these contracts and corresponding Zod schemas:

```ts
export type SelectionMode = "single" | "multiple";
export type SelectionValidationKind = "opinion" | "quiz";
export interface SelectionOption { id: string; label: string }
export interface MissionSelection {
  mode: SelectionMode;
  validationKind: SelectionValidationKind;
  options: SelectionOption[];
  minSelections: number;
  maxSelections: number;
}
export interface MissionAnswerKey { missionId: string; correctOptionIds: string[] }
```

Extend `Mission` with optional `selection`, `UserMission` with `attemptsUsed?: number`, `MissionStatus` with `failed`, and `Submission` with optional `selection: { ids: string[]; labels: string[] }` while keeping legacy `text` optional.

- [ ] **Step 4: Implement validation and evaluation**

Export `validateSelection(configuration, selectionIds)` and `evaluateSelection(configuration, selectionIds, correctOptionIds, attemptsUsed)`. Normalize selections as a unique sorted set, reject malformed requests before attempt calculation, accept opinion selections, compare quiz sets exactly, and return one of:

```ts
type SelectionOutcome =
  | { status: "approved"; selectionIds: string[]; attemptsUsed: number; attemptsRemaining: number }
  | { status: "incorrect"; selectionIds: string[]; attemptsUsed: number; attemptsRemaining: 1 }
  | { status: "failed"; selectionIds: string[]; attemptsUsed: 2; attemptsRemaining: 0 };
```

- [ ] **Step 5: Define all 35 mission selections**

Use opaque IDs `o1`–`o6`. Configure quiz missions `M16`–`M26`, `M28`–`M31`, and `M33`–`M44`; configure opinion missions `M27`, `M32`, and `M45`–`M50`. Use multiple exact answers for M17, M20, M21, M26, M30, M35, M39, M41, M42, and M44 where published titles enumerate multiple facts. Question labels and correct options must use only the agenda facts described in the approved design.

- [ ] **Step 6: Verify GREEN and commit**

Run: `npx vitest run tests/unit/catalog.test.ts tests/unit/selection.test.ts`

Expected: all selection and catalog tests PASS.

```bash
git add shared scripts/data tests/unit
git commit -m "feat: define selection mission catalog"
```

### Task 2: Authoritative submission attempts and scoring

**Files:**
- Modify: `functions/src/shared/refs.ts`
- Modify: `functions/src/submissions/submit-text.ts`
- Modify: `tests/integration/functions.test.ts`

- [ ] **Step 1: Add failing transition tests**

Cover opinion approval, quiz approval on attempt one and two, first incorrect result, second incorrect exhaustion, malformed selections that do not consume attempts, exact set matching, missing answer-key failure, and idempotent result shapes.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run tests/integration/functions.test.ts`

Expected: FAIL because selection transitions and result contracts are not implemented.

- [ ] **Step 3: Implement the callable transaction**

Accept `{ missionId, operationId, selectionIds }`. Read the idempotency document first, then assignment, mission, score, and `missionAnswerKeys/{missionId}` for quizzes. Validate before incrementing attempts. On approval, create the submission with `{ ids, labels }`, approve the assignment, and score once. On first error, update only `attemptsUsed: 1`; on second error, update `attemptsUsed: 2, status: "failed", completedAt`; write every result to idempotency.

Return stable results with `status`, `attemptsUsed`, `attemptsRemaining`, and `scoreDelta`. Throw `failed-precondition/MISSING_ANSWER_KEY` without writes when a quiz key is missing.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npx vitest run tests/integration/functions.test.ts`

Expected: all authoritative transition tests PASS.

```bash
git add functions/src tests/integration/functions.test.ts
git commit -m "feat: validate mission selections server-side"
```

### Task 3: Failed mission replacement

**Files:**
- Modify: `functions/src/missions/replace-mission.ts`
- Modify: `src/features/missions/MissionDetailPage.tsx`
- Modify: `tests/integration/functions.test.ts`

- [ ] **Step 1: Write failing replacement eligibility tests**

Extract and test a predicate that allows `available`, allows `failed` only with `attemptsUsed === 2`, and rejects approved, submitted, rejected, replaced, cancelled, expired, and malformed failed assignments.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run tests/integration/functions.test.ts`

Expected: FAIL because exhausted quiz assignments are not replaceable.

- [ ] **Step 3: Implement replacement eligibility and UI state**

Use the tested predicate in the callable. Preserve the two-replacement cap and all compatibility filters. In mission detail, lock `failed` evidence, show a neutral no-points message, and display the existing replacement action for both `available` and `failed` assignments.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npx vitest run tests/integration/functions.test.ts`

Expected: replacement eligibility tests PASS.

```bash
git add functions/src/missions/replace-mission.ts src/features/missions/MissionDetailPage.tsx tests/integration/functions.test.ts
git commit -m "feat: replace exhausted quiz missions"
```

### Task 4: Accessible selection evidence UI

**Files:**
- Modify: `src/features/submissions/TextEvidence.tsx`
- Modify: `src/design-system/global.css`
- Create: `tests/unit/text-evidence.test.tsx`

- [ ] **Step 1: Write failing component tests**

Mock the callable and verify native radios for single mode, checkboxes for multiple mode, min/max button gating, selection IDs in the request, first-error remaining-attempt feedback, exhausted feedback, and complete absence of textbox/textarea controls.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run tests/unit/text-evidence.test.tsx`

Expected: FAIL against the current free-text component.

- [ ] **Step 3: Implement native selection controls**

Render a `fieldset` and `legend`; use one shared selected-ID state. Radio changes replace the set. Checkbox changes add/remove an ID and enforce maximum selection count. Submit `{ missionId, operationId, selectionIds }`, interpret approved/incorrect/failed results, and use the approved Spanish messages from the design. Do not persist drafts.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npx vitest run tests/unit/text-evidence.test.tsx`

Expected: all selection UI tests PASS.

```bash
git add src/features/submissions/TextEvidence.tsx src/design-system/global.css tests/unit/text-evidence.test.tsx
git commit -m "feat: replace text evidence with selections"
```

### Task 5: Private answer-key rules and seed

**Files:**
- Modify: `firebase/firestore.rules`
- Modify: `scripts/seed-data.ts`
- Modify: `tests/rules/firestore.test.ts`
- Modify: `tests/unit/catalog.test.ts`

- [ ] **Step 1: Write failing rules and seed-contract tests**

Assert that participant, moderator, and admin clients cannot read or write `missionAnswerKeys/M17`. Assert that exactly 27 private answer-key documents are generated and every key references valid public option IDs.

- [ ] **Step 2: Verify RED**

Run the catalog test and the Firebase rules emulator command. Expect failures because key documents are not seeded and no explicit protected match exists.

- [ ] **Step 3: Implement protected key refs and seed writes**

Add `match /missionAnswerKeys/{missionId} { allow read, write: if false; }`. Add answer-key writes to `scripts/seed-data.ts`, include their count in dry-run output, and keep the apply confirmation requirement. Do not delete legacy submissions or scores.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npx vitest run tests/unit/catalog.test.ts`

Run: `npx firebase emulators:exec --only firestore,storage "npm run test:rules" --project aws-day-gt-rules-test`

Expected: catalog/key and all rules tests PASS.

```bash
git add firebase/firestore.rules scripts/seed-data.ts tests/rules/firestore.test.ts tests/unit/catalog.test.ts
git commit -m "security: protect mission answer keys"
```

### Task 6: Verification and ordered production rollout

**Files:**
- Modify: `docs/deployment-report.md`
- Modify: `docs/operations.md`

- [ ] **Step 1: Run full verification**

Run: `npm run lint && npm run typecheck && npm test && npm --prefix functions run build && npm run build`

Expected: all checks and builds PASS.

- [ ] **Step 2: Run seed dry-run**

Run: `npm run seed -- --project aws-day-gt`

Expected: 1 event, 1 config, 50 missions, and 27 answer-key upserts with zero deletes.

- [ ] **Step 3: Deploy rules and Functions**

Run: `npx firebase deploy --only firestore:rules,functions:submitTextMission,functions:replaceMission --project aws-day-gt`

Expected: rules release and both callable updates succeed.

- [ ] **Step 4: Apply the production seed**

Run: `npm run seed -- --project aws-day-gt --apply --cli-auth --confirm aws-community-day-gt-2026`

Expected: all public missions and private keys are upserted with zero deletes.

- [ ] **Step 5: Deploy Hosting**

Run: `npx firebase deploy --only hosting --project aws-day-gt`

Expected: the new selection interface is released at `https://aws-day-gt.web.app`.

- [ ] **Step 6: Smoke-test and document**

Run: `node scripts/smoke-production.mjs https://aws-day-gt.web.app`

Expected: `/`, `/app/missions`, and `/manifest.webmanifest` return 200. Record test counts, deployment order, seed counts, Functions status, and smoke results in the deployment and operations documents.

- [ ] **Step 7: Commit deployment evidence**

```bash
git add docs/deployment-report.md docs/operations.md
git commit -m "docs: record selection mission rollout"
```
