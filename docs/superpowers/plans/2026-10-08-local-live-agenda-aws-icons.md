# Local Live Agenda and AWS Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show an automatically advancing October 10 agenda on the October 8 local site, and official AWS service icons in interactive questions.

**Architecture:** `useNow.ts` keeps the local-only clock mapping separate from agenda data. A service-icon map owns the paths copied from the official AWS toolkit; question components consume it without changing challenge validation.

**Tech Stack:** React, TypeScript, Vite, Three.js, Vitest, AWS SVG assets.

---

### Task 1: Local event clock

**Files:** Modify `src/features/companion/useNow.ts`; test `tests/unit/quetzi.test.tsx`.

- [ ] Add a failing test for a local hostname at 10:25 Guatemala time on October 8 yielding October 10 10:25, plus a production hostname yielding October 8. Assert `?ahora=real` still cancels simulation.
- [ ] Run `npx vitest run tests/unit/quetzi.test.tsx` and confirm the new assertion fails because local host eligibility currently depends on Firebase emulators.
- [ ] Add a small `isLocalPreviewHost(hostname)` predicate for `localhost`, `127.0.0.1`, and `::1`; use it to initialize `rehearsalEnabled` and `isLocalRehearsalActive`. Preserve the existing session storage switches.
- [ ] Re-run the focused test and confirm the current agenda and next block progress at the simulated time.

### Task 2: Official icon assets and accessible options

**Files:** Create `public/aws-services/*.svg` and `src/features/challenges/awsServiceIcons.ts`; modify `src/features/challenges/ServiceDecisionScene.tsx`, `src/features/challenges/ArchitectureChallenge.tsx`, and `src/features/challenges/ArchitectureScene.tsx`; test `tests/unit/service-decision-scene.test.tsx` and the existing architecture tests.

- [ ] Add failing assertions that answer buttons contain an image with the official icon path and retain their accessible service names.
- [ ] Run `npx vitest run tests/unit/service-decision-scene.test.tsx` and confirm the new assertions fail.
- [ ] Extract 64px SVG service icons from the official AWS architecture package into `public/aws-services`, with only the required services: API Gateway, Bedrock, CloudFront, CloudWatch, DynamoDB, EBS, EC2, EventBridge, IAM, Lambda, RDS, Route 53, S3, SNS, SQS and Step Functions.
- [ ] Export a typed ID-to-path map, with `dynamo` and `dynamodb` pointing to the same DynamoDB file. Render icons alongside names in both sets of HTML options.
- [ ] Load the same icons as textures on visible planes above the existing 3D objects. Keep raycasting tied to the original selectable meshes and dispose of created textures/materials when unmounting.
- [ ] Re-run the focused component tests, `npm run typecheck`, and `npm run build`. Inspect local pages at desktop and mobile widths; leave production untouched.
