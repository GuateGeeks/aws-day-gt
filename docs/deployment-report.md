# Firebase deployment report

Date: 2026-10-04 (America/Guatemala)

## Released

- Hosting: https://aws-day-gt.web.app
- Firestore database: `(default)`, region `nam5`, Standard edition
- Firestore rules: deployed and emulator-verified
- Firestore indexes: deployed
- Remote Config: deployed with conservative pre-event defaults
- Production seed: 52 upserts (1 event, 1 config, 50 missions), 0 deletes
- Firebase Authentication: initialized; passwordless email-link provider enabled; Hosting domains authorized
- Cloud Functions: 10 active functions in `us-central1` on Node.js 22
- Cloud Storage: default bucket `aws-day-gt.firebasestorage.app` in `US-CENTRAL1`; restrictive evidence rules deployed
- Cloud Storage CORS: authenticated GET downloads allowed only from Firebase Hosting domains and local development
- Artifact Registry: automatic deletion of Functions images older than one day
- Moderation console: private photographic evidence preview, per-image retry, explicit queue errors, and review gating deployed
- HTTP smoke checks: `/`, `/app/missions`, and `/manifest.webmanifest` returned 200
- Callable security smoke check: unauthenticated onboarding request returned HTTP 401 `UNAUTHENTICATED`

## Verification

- TypeScript application and Functions builds pass.
- 27 unit/component/domain/integration tests pass.
- 8 Firebase rules tests pass in the Firestore/Storage emulators.
- PWA production build generated the manifest and service worker.

## Remaining pre-launch operations

1. Configure reCAPTCHA Enterprise App Check, observe valid traffic, and enable callable enforcement before public launch.
2. Replace the provisional legal copy before opening public registration.

The production Firebase services required for registration, missions, scoring, moderation, and photo evidence are deployed. The remaining items are launch-hardening and content operations.
