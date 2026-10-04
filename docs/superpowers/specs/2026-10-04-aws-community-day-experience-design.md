# AWS Community Day Guatemala 2026 Experience App — Design

**Date:** 2026-10-04  
**Status:** Approved for implementation planning  
**Source requirements:** `contrext.md`  
**Reference implementation:** `GuateGeeks/socrates.app`

## Product outcome

Deliver and deploy a production-oriented, mobile-first PWA for AWS Community Day Guatemala 2026. Participants authenticate by passwordless email link, complete onboarding, receive 11 compatible missions drawn from the supplied 50-mission catalog, submit evidence, earn up to 100 server-authoritative points, and see their progress and leaderboard position. Staff moderate photographs and administrators operate the event through a protected console.

The first release is a complete event MVP. It includes the participant journey, secure scoring, photo moderation, leaderboard, essential administration, offline resilience, Firebase rules and indexes, seed tooling, tests, and Firebase Hosting deployment. A public photo gallery, marketing workflows, automated retention deletion, and advanced fraud/anomaly detection are excluded from the first release. Their data boundaries remain compatible with later addition.

## Product decisions

- Deploy to the existing Firebase project `aws-day-gt` using the supplied Firebase web configuration.
- Bootstrap `guategeeks3d@gmail.com` as the initial administrator when that Firebase Auth account is created.
- Use Email Link authentication only in the initial release.
- Ship provisional terms, privacy, retention, and consent copy. An administrator can replace this copy from event settings.
- Keep photo-publication and marketing consent disabled by default.
- Do not ship a public photo gallery.
- Permit two mission replacements per participant.
- Treat October 10, 2026 in `America/Guatemala` as the configured event date; session and venue data remain editable rather than compiled into the UI.
- Use the production vertical-slice approach: every released path has its UI, backend authority, rules, tests, and operational controls.

## Repository architecture

Use a compact two-runtime repository inspired by Socrates’ low-dependency, focused-file structure:

```text
src/
  app/                  routing, providers, and guarded layouts
  design-system/        tokens, reusable controls, icons, and motion
  domain/               types, schemas, and pure business rules
  features/
    auth/
    onboarding/
    missions/
    progress/
    leaderboard/
    profile/
    admin/
  firebase/             typed Firebase client initialization and adapters
  offline/              IndexedDB drafts and upload queue
functions/src/
  auth/                 initial administrator promotion
  missions/             assignment and replacement
  submissions/          text and photo submission registration
  moderation/           approval and rejection
  scoring/              transactional score updates and leaderboard data
  admin/                mission, schedule, settings, staff, and audit operations
  shared/               validation, authorization, IDs, and error mapping
firebase/               Firestore rules, Storage rules, and indexes
scripts/                safe seed and administrative utilities
tests/                  unit, emulator integration, rules, and browser tests
```

React may read data allowed by Security Rules and upload a compressed photo to its own event/user/mission path. Every authoritative mutation goes through a callable Cloud Function. The frontend never computes or writes points, roles, moderation state, mission assignments, or audit entries.

The implementation uses React, TypeScript, Vite, React Router, TanStack Query, Zod, React Hook Form, Firebase Authentication, Firestore, Storage, Functions, Analytics, Remote Config, App Check, Vitest, Playwright, and the Firebase Emulator Suite. Dependencies are added only where they replace meaningful custom infrastructure.

## Visual and interaction design

Adapt the Socrates design language rather than copying its educational branding:

- centralized CSS tokens for color, typography, spacing, radii, elevation, motion, and safe areas;
- deep navy, cloud blue, AWS-inspired orange, and warm neutral surfaces;
- compact rounded cards, tactile buttons, visible focus, and at least 48-pixel touch targets;
- mobile-first layouts with a bottom navigation bar and fixed thumb-reachable primary actions;
- progress shown before competitive ranking;
- system-aware light and dark themes;
- motion that communicates entry, success, and queued work, with reduced-motion fallbacks;
- Lucide icons with text labels instead of emoji-only controls;
- WCAG 2.2 AA contrast, keyboard paths, labels, live status messages, and error association.

The participant navigation contains Missions, Progress, Leaderboard, and Profile. Administrative routes are lazy-loaded and only visible to staff roles.

## Participant journey

### Authentication

The landing page explains the experience and links to provisional privacy information. A participant supplies an email address and receives a Firebase Email Link. The completion route verifies the link, restores the email when possible, handles expired/invalid links, and creates the profile exactly once.

### Onboarding

Onboarding has four short steps:

1. Choose a unique, public alias.
2. Select optional track interests.
3. Accept versioned terms and choose independent photo-publication and marketing consent values.
4. Confirm choices and request mission assignment.

Completion invokes a server operation that atomically saves the profile state and assigns missions. A returning participant resumes at the first incomplete step.

### Missions

The home screen displays score out of 100, completion progress, the next actionable mission, current rank, badges, and a route to the full list. The mission list filters available, pending, approved, rejected, replaced, cancelled, and expired states. A detail screen shows context, instructions, evidence rules, points, availability, and the appropriate evidence control.

Word submissions accept one normalized token between 2 and 30 characters, with the `M47` short-service-token exception encoded in mission validation data. Comment submissions enforce mission-specific length limits and autosave drafts locally. Photo submissions use camera capture where supported, show a preview and consent confirmation when required, and allow retaking before queueing.

Rejections use a neutral explanation and allow resubmission when the moderator marks it eligible. Replacement is unavailable after submission and is capped at two successful replacements.

### Progress, leaderboard, and profile

Progress shows approved points, pending points, mission-type completion, and earned badges. The leaderboard returns a bounded top list plus the current participant’s contextual position. Public rows contain only alias, points, approved mission count, badge summary, and rank.

Profile shows masked email, alias, interests, versioned consent choices, progress, sign-out, and a data-deletion request. Consent changes affect future publication eligibility but do not alter awarded mission points.

## Administrative journey

The role-protected admin application provides:

- an operational dashboard with participant, submission, pending-photo, completion, and error totals;
- a photograph moderation queue with mission context, alias, timestamp, approve/reject, reason codes, optional note, and resubmission eligibility;
- mission creation, editing, duplication, activation, schedule association, and safe point-change warnings;
- schedule and room editing without a frontend rebuild;
- participant and leaderboard inspection without exposing emails outside staff views;
- event state, feature switches, replacement count, provisional legal copy, and staff role management;
- an audit log for privileged changes.

Changing points on a mission with submissions requires an explicit recalculation operation. Role changes and score recalculation always create audit records.

## Data model

Use event-scoped documents and stable IDs. The primary collections are:

- `events/{eventId}` and `events/{eventId}/schedule/{sessionId}`;
- `users/{uid}`;
- `missions/{missionId}`;
- `userMissions/{eventId}_{uid}_{missionId}`;
- `submissions/{eventId}_{uid}_{missionId}`;
- `scores/{eventId}_{uid}`;
- `config/{eventId}`;
- `notifications/{notificationId}`;
- `auditLogs/{auditId}`;
- `idempotency/{uid}_{operationKey}` for server mutation deduplication.

Mission records contain the supplied title, description, evidence type, points, category, validation requirements, optional session reference, availability window, active state, and timestamps. Schedule records remain independently editable. User mission records snapshot points and track assignment/replacement state. Submission records separate moderation approval from publication eligibility.

Client timestamps are informational only. All authoritative dates use server timestamps.

## Mission assignment

The assignment domain function is pure and independently tested. Given active missions, schedule records, interests, and a stable per-user seed, it returns exactly:

- 2 photo missions worth 15 points each;
- 5 comment missions worth 10 points each;
- 4 word missions worth 5 points each.

The pack totals 100 points, includes at least one general/community mission, one session mission, and one closing mission, and never includes two attendance-dependent missions in the same schedule slot. Interests rank candidates but do not override compatibility. If preferred tracks cannot fill the pack, general compatible missions fill it; schedule conflicts are never relaxed.

Assignment writes all user mission documents and the initial score in one transaction. Repeated onboarding calls return the existing assignment.

Replacement selects an active, unassigned mission with the same evidence type and points, excludes conflicting slots, marks the old assignment replaced, creates the new assignment, increments the participant replacement count, and adds an audit entry in one transaction.

## Submissions and scoring

Text submissions call a callable Function with a stable idempotency key. The Function verifies authentication, event state, App Check when enforcement is enabled, assigned mission state, mission activity/window, evidence type, and normalized content. It creates the submission, marks the mission approved, and increments the score atomically. A duplicate operation returns the original result and never awards points twice.

Photos follow this sequence:

1. Validate MIME and dimensions in the client.
2. Decode and re-encode through canvas, correct orientation through browser decoding, resize the long edge to at most 1920 pixels, and target WebP/JPEG output between approximately 500 KB and 1.5 MB.
3. Store the processed blob and metadata in IndexedDB with a stable operation ID.
4. Upload to `evidence/{eventId}/{uid}/{missionId}/{operationId}.webp` when online.
5. Call `registerPhotoSubmission` to validate ownership, path, object metadata, mission state, and idempotency.
6. Mark the mission submitted and the submission pending without changing awarded score.
7. Remove the local queue item only after server confirmation.

Moderator approval transactionally marks the submission approved, marks the user mission approved, and awards its snapshotted points. Rejection records a reason and note and moves the mission to rejected. Resubmission replaces the pending evidence reference without creating a second scorable mission.

Leaderboard ordering is total points descending, approved mission count descending, then `finalScoreReachedAt` ascending. The query is bounded, and a server operation returns the current participant’s contextual rank.

## Security and privacy

Firebase custom claims hold `moderator` and `admin` roles. An Auth creation trigger compares normalized email with the configured initial-admin allowlist and sets the admin claim for `guategeeks3d@gmail.com`. Later role changes require an admin callable Function.

Firestore rules allow participants to read their own profile, assignments, and submissions, read active event/mission content, and read the public leaderboard projection. Client profile writes are limited to explicitly editable fields. Assignments, scores, roles, moderation, configuration, and audit writes are server-only.

Storage rules restrict uploads to the authenticated participant’s own assigned event/user/mission path, allowed image MIME types, and configured size limits. Reads are owner or staff only. Public URL generation is not used.

App Check is initialized in the frontend and checked by callable Functions. If the Firebase project lacks a configured web provider, deployment proceeds with enforcement disabled and the exact console prerequisite is documented; enforcement is enabled immediately after a valid provider/site key exists.

Analytics never receives emails, evidence text, photographs, legal names, or consent content. The public leaderboard never contains email, UID, company, phone, or raw consent data.

## Offline and failure behavior

Static app assets and the application shell are cached by the service worker. Firestore persistent local cache is enabled where the browser supports it. Text drafts and photo queue records use IndexedDB.

The UI distinguishes local draft, queued, uploading, server-pending, approved, rejected, and retry-needed states. It never increases authoritative points optimistically. Connectivity restoration triggers bounded retry with exponential backoff while retaining the same operation key.

Typed domain error codes map to concise Spanish messages for invalid or expired links, rate limits, offline state, closed event windows, invalid evidence, duplicate submissions, disabled missions, exhausted replacements, and permission failures. Unexpected errors preserve a correlation ID for staff troubleshooting.

Cancelled or disabled assigned missions remain visible with an explanation until server replacement succeeds. A failed replacement never discards the old assignment.

## Configuration and seed strategy

The supplied Firebase configuration is moved into the typed frontend Firebase initialization and made environment-overridable without hiding the non-secret Firebase identifiers. Analytics initializes only in supported browser environments.

Seed data includes:

- event `aws-community-day-gt-2026` in `America/Guatemala`;
- the supplied schedule and venue references;
- all 50 missions from `contrext.md` with stable `M01`–`M50` IDs;
- two allowed replacements;
- safe initial flags: registration available only when explicitly opened, missions/uploads/photo missions off until event validation, leaderboard off until tested, maintenance mode off;
- provisional Spanish terms, privacy, retention, and consent text clearly marked for administrator review;
- the initial administrator email allowlist.

The seed command defaults to dry-run, prints create/update/unchanged differences, refuses destructive deletion, and requires an explicit production flag and typed confirmation before applying changes.

Remote Config exposes client-facing runtime flags. Authoritative event state is mirrored in the protected Firestore event/config documents so Functions never trust a stale client flag.

## Testing and verification

### Unit tests

Vitest covers schemas, word normalization, comment limits, mission pack composition, deterministic selection, interest preference, required categories, schedule conflicts, replacement compatibility, badge calculation, error mapping, and configuration parsing.

### Firebase Emulator Suite

Rules tests prove that participants cannot change scores, roles, assignments, moderation, or event settings; cannot access another participant’s private evidence; and cannot upload outside their own path. Integration tests cover onboarding and assignment, idempotent text scoring, pending photo registration, moderation scoring, rejection/resubmission, replacement, cancellation, role enforcement, and recalculation.

### Browser tests

Playwright covers responsive landing/login states, onboarding, mission filters and detail, word/comment validation, queued photo behavior with simulated offline state, leaderboard privacy, moderator flow, admin route protection, keyboard navigation, contrast checks, dark mode, reduced motion, and phone/tablet/desktop viewports.

### Release verification

Before deployment run linting, type checking, unit tests, emulator integration/rules tests, the production build, browser smoke tests, and the mission seed dry-run. After deployment verify Hosting routes, Email Link return URL, unauthenticated protection, authenticated participant loading, admin promotion, one non-photo submission, one photo moderation cycle, leaderboard update, and PWA manifest/service worker availability.

## Deployment

Firebase CLI targets project `aws-day-gt`. Deployment includes Hosting, Functions, Firestore rules and indexes, Storage rules, and Remote Config templates. Seed application occurs only after infrastructure deployment and dry-run review. Feature flags remain conservatively closed until the smoke test passes, after which registration and intended event features are opened explicitly.

Deployment documentation records manual console prerequisites that the CLI cannot safely infer, including Email Link authorized domains, the email template, billing requirements for Functions, and a web App Check provider/site key if one is absent.

## Acceptance criteria

- A participant can complete Email Link sign-in and resumable onboarding.
- Onboarding assigns exactly 11 compatible missions in a 2/5/4 distribution totaling 100 points.
- Word/comment validation is mission-driven, and accepted text submissions score once.
- Photos are re-encoded, compressed, durably queued, privately uploaded, and score only after moderation.
- Participants can use no more than two compatible replacements.
- Scores cannot be changed by client writes or duplicate requests.
- The leaderboard contains no private identity or consent fields.
- Admin and moderator capabilities are claim-protected and audited.
- Event content, schedule, flags, and provisional legal copy are administrable without rebuilding React.
- Core content remains usable during intermittent connectivity, and queued evidence resumes safely.
- The PWA meets the specified responsive, keyboard, reduced-motion, focus, touch-target, and contrast requirements.
- The full stack is deployed to Firebase project `aws-day-gt` and passes post-deploy smoke checks.

