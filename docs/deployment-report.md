# Firebase deployment report

Date: 2026-10-04 (America/Guatemala)

## Released

- Hosting: https://aws-day-gt.web.app
- Firestore database: `(default)`, region `nam5`, Standard edition
- Firestore rules: deployed and emulator-verified
- Firestore indexes: deployed
- Remote Config: deployed with conservative pre-event defaults
- Production seed: 52 upserts (1 event, 1 config, 50 missions), 0 deletes
- HTTP smoke checks: `/`, `/app/missions`, and `/manifest.webmanifest` returned 200

## Verification

- TypeScript application and Functions builds pass.
- 20 unit/domain/integration tests pass.
- 8 Firebase rules tests pass in the Firestore/Storage emulators.
- PWA production build generated the manifest and service worker.

## Console prerequisites blocking the complete participant journey

1. Upgrade `aws-day-gt` to the Blaze plan. Cloud Functions deployment is blocked because Artifact Registry and Cloud Build cannot be enabled on the current plan.
2. Initialize Firebase Storage and choose its permanent bucket location. Storage rules and photo uploads cannot be deployed until this is done.
3. Enable Email link sign-in in Firebase Authentication and confirm `aws-day-gt.web.app` is an authorized domain.
4. After Functions deploy, sign in as `guategeeks3d@gmail.com`, then sign out/in once to refresh the initial admin custom claim.
5. Configure reCAPTCHA Enterprise App Check, observe valid traffic, and enable callable enforcement before public launch.

Until items 1–3 are complete, the landing PWA is live but registration and mission submission are not operational.
