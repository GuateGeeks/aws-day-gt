# Local Live Agenda and AWS Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Show an automatically advancing October 10 agenda on the October 8 local site, and official AWS service icons in interactive questions.

**Architecture:** `useNow.ts` keeps the local-only clock mapping separate from agenda data. A service-icon map owns the paths copied from the official AWS toolkit; question components consume it without changing challenge validation.

**Tech Stack:** React, TypeScript, Vite, Three.js, Vitest, AWS SVG assets.

---

### Task 1: Local event clock

**Files:** Modify `src/features/companion/useNow.ts`; test `tests/unit/quetzi.test.tsx`.

- [x] Add a failing test for a local hostname at 10:25 Guatemala time on October 8 yielding October 10 10:25, plus a production hostname yielding October 8. Assert `?ahora=real` still cancels simulation.
- [x] Run `npx vitest run tests/unit/quetzi.test.tsx` and confirm the new assertion fails because local host eligibility currently depends on Firebase emulators.
- [x] Add a small `rehearsalEnabledForHost(hostname)` predicate for `localhost`, `127.0.0.1`, and `::1`; use it to initialize `rehearsalEnabled` and `isLocalRehearsalActive`. Preserve the existing session storage switches.
- [x] Re-run the focused test and confirm the current agenda and next block progress at the simulated time.

### Task 2: Official icon assets and accessible options

**Files:** Create `public/aws-services/*.svg`, `src/features/challenges/awsServiceIcons.tsx`, and `src/features/challenges/aws-service-options.css`; modify `src/features/challenges/ServiceDecisionScene.tsx`, `src/features/challenges/ArchitectureChallenge.tsx`, `src/features/challenges/ArchitectureScene.tsx`, and `src/features/challenges/ChallengeDetailPage.tsx`; test `tests/unit/service-decision-scene.test.tsx`, `tests/unit/architecture-challenge.test.tsx`, and `tests/unit/challenge-detail-page.test.tsx`.

- [x] Add failing assertions that answer buttons contain an image with the official icon path and retain their accessible service names.
- [x] Run `npx vitest run tests/unit/service-decision-scene.test.tsx` and confirm the new assertions fail.
- [x] Extract 64px SVG service icons from the official AWS architecture package into `public/aws-services`, with only the required services: API Gateway, Bedrock, CloudFront, CloudWatch, DynamoDB, EBS, EC2, EventBridge, IAM, Lambda, RDS, Route 53, S3, SNS, SQS and Step Functions.
- [x] Export a typed ID-to-path map, with `dynamo` and `dynamodb` pointing to the same DynamoDB file. Render icons alongside names in service-selection, architecture, sequence, matching, and clue answers. Matching uses accessible pressed buttons because native select options cannot contain images.
- [x] Load the same icons as textures on visible sprites above the existing 3D objects. Let both each original mesh and its icon select the service; dispose of textures and materials when unmounting.
- [x] Re-run the focused component tests, `npm run typecheck`, and `npm run build`. Inspect local pages at desktop and mobile widths; leave production untouched.
