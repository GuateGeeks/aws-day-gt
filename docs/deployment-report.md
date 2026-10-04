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
- Artifact Registry: automatic deletion of Functions images older than one day
- HTTP smoke checks: `/`, `/app/missions`, and `/manifest.webmanifest` returned 200
- Callable security smoke check: unauthenticated onboarding request returned HTTP 401 `UNAUTHENTICATED`

## Verification

- TypeScript application and Functions builds pass.
- 20 unit/domain/integration tests pass.
- 8 Firebase rules tests pass in the Firestore/Storage emulators.
- PWA production build generated the manifest and service worker.

## Remaining pre-launch operations

1. Sign in as `guategeeks3d@gmail.com`, then sign out/in once to refresh the initial admin custom claim.
2. Configure reCAPTCHA Enterprise App Check, observe valid traffic, and enable callable enforcement before public launch.
3. Replace the provisional legal copy before opening public registration.

The production Firebase services required for registration, missions, scoring, moderation, and photo evidence are deployed. The remaining items are launch-hardening and content operations.
