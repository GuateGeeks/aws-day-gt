# Event operations

## Firebase console prerequisites

1. Email link sign-in and Hosting authorized domains are configured by `npm run configure:auth`.
2. The project uses Blaze for Cloud Functions and the default Storage bucket.
3. The default Storage bucket is provisioned in immutable location `US-CENTRAL1`, matching the Functions region.
4. Register reCAPTCHA Enterprise for App Check, set `VITE_FIREBASE_APPCHECK_SITE_KEY`, validate traffic, then change callable functions to enforce App Check.

The first Authentication account created with `guategeeks3d@gmail.com` receives the admin custom claim. Sign out and back in after promotion to refresh the ID token.

## Seed and deploy

```bash
npm run seed -- --project aws-day-gt
npm run deploy
npx tsx scripts/seed-data.ts --project aws-day-gt --apply --confirm aws-community-day-gt-2026 --cli-auth
```

The seed writes one event, one protected config document, and 50 missions. It performs no deletions. Legal text is provisional and should be replaced by an administrator before registration opens.

## Event-day controls

Remote Config defaults are conservative. Firestore `config/aws-community-day-gt-2026` owns registration, mission, leaderboard, upload, photo, maintenance, replacement, and event-mode switches. Use the Firebase console only with a documented operator and record changes.

## Rollback

Hosting releases can be rolled back from Firebase Hosting release history. Functions should be redeployed from a known Git commit. Close registration/uploads using configuration before a risky rollback; do not delete participant data.

## Known operational boundary

Storage emulator uploads have a known SDK/emulator transport incompatibility in this environment. Storage rules have static contract tests and must receive one authenticated production smoke upload before event launch.
