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

The seed writes one event, one protected config document, 23 public Challenge records (including inactive C03), 12 private answer records, and two experience stations. It performs no deletions and no longer writes previous missions or their answer keys. Challenge, secret, and station documents are created only when missing, so repeating the seed preserves administrator edits. Configure the workshop, talk, and GuateGeeks VR codes separately with `npm run configure:event-codes:production`; set `EVENT_WORKSHOP_CODE`, `EVENT_TALK_CODE`, and `EVENT_STAND_CODE` in the operator environment, then pass `--project aws-day-gt --apply --confirm aws-community-day-gt-2026`. Do not store the actual codes in this public repository. Speakers may choose whom to give the workshop and talk codes to; attendance alone does not grant Aura. Clients, moderators, and administrators cannot read answer keys directly; validation runs only inside Cloud Functions. Legal text is provisional and should be replaced before registration opens.

## Aura Challenges

New participants receive ten category-balanced base Challenges at onboarding, six AWS service questions, and two selfie challenges; Experiencia VR GuateGeeks (C13) is always included. Each participant sees a stable personal order mixed across categories. Existing participants receive the extras when they next open the app without resetting Aura. Previous `missions`, `missionAnswerKeys`, `userMissions`, and mission `submissions` remain stored but are no longer assigned, displayed, readable by clients, or accepted by the active photo and moderation APIs. Their `totalPoints` remain unchanged. `scores.auraTotal` and `completedChallenges` drive progress and ranking. A Challenge with existing assignments cannot be deactivated from administration, so assigned packs remain completable. Existing `/app/missions` links redirect to `/app/challenges`.

Cloud Trio (C03) is retired. New packs exclude it; when someone with C03 next opens Challenges, the assignment callable replaces it with an unused active CONNECT Challenge while retaining the old progress and awarded Aura. To mark the already seeded C03 catalog record inactive in the **local emulator only**, preview and then apply this guarded command. It makes no deletions; this command must not be used against production:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run retire:cloud-trio:emulator -- --project demo-aws-day-gt
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run retire:cloud-trio:emulator -- --project demo-aws-day-gt --apply --confirm aws-community-day-gt-2026
```

Admins can activate or deactivate Challenges, edit their descriptions and Aura rewards, manage station names and availability, configure the C08/C09 scenarios, update Track Pulse choices, and change the workshop, talk, and VR codes in the admin console. C13 cannot be deactivated. Shared codes and Cloud answers are stored in private Firestore documents. The C06 sequence and C07 matches remain defined in the private seeded answer records; changing those games requires a reviewed configuration update rather than a repeated seed.

The Geek ID contains only a random token, lasts five minutes, and is verified by a callable against the participant's profile. The camera scanner also offers manual entry of the temporary token. Social Challenges reject self-scans and repeated use of the same connection within a Challenge. Cloud questions and AWS selections validate answers in Cloud Functions. A first wrong answer closes the question, deducts 150 Aura (including when the balance becomes negative), and shows both the reason and the solution. Other challenge types keep their own validation rules.

Experiencia VR GuateGeeks and VR Explorer accept one-use, expiring station tokens. `functions/src/challenges/experience-adapter.ts` defines the trusted completion verifier and issues a token only after proof verification; a test exercises this boundary with a local fake verifier. The VR device or service must supply its completion signal, credentials, and concrete verifier before automated issuance can run at the event. Until then, the staff console offers an audited manual fallback that can bind a token to a participant UID. These are official station codes, not hidden event QR codes.

Community Aura reuses the private evidence upload path, size and image signature checks, and the existing moderation queue. Valid uploads enter manual review; approval grants the Aura reward captured when the photo was submitted once, rejection grants zero, and a rejected participant may retry. Automatic image moderation and event-screen publication require separate provider and display configuration.

### Registered Aura ranking migration

The ranking reads scores with `registeredForRanking: true`, ordered by Aura, completed Challenges, and the time Aura was reached. Onboarding writes this marker for new registrations; the Challenge assignment path refreshes it for returning participants after checking `users/{uid}.onboardingComplete`, `createdAt`, and `consent.acceptedAt`. Participants with 0 Aura remain eligible. Raw score documents remain readable only by their owner or event staff.

For the **local Firestore emulator only**, preview and then apply the ranking backfill. The script refuses to run without a localhost emulator and requires an explicit event confirmation to write. It updates `registeredForRanking` and fills missing Aura sorting fields with zero or null for verified registrations. It preserves existing Aura, historical points, and all documents; it performs no deletions:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run backfill:ranking:emulator -- --project aws-day-gt
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run backfill:ranking:emulator -- --project aws-day-gt --apply --confirm aws-community-day-gt-2026
```

Before a future production release, deploy the new Firestore composite index and wait until it is ready. Then prepare a separate reviewed production migration with a dry run, count registered profiles by the same three markers, update only the matching event score markers in batches, and compare the resulting ranking counts. Do not use the emulator-only script for production. No production score migration is part of this local change.

## Event-day controls

Remote Config defaults are conservative. Firestore `config/aws-community-day-gt-2026` owns registration, leaderboard, upload, maintenance, and event-mode switches. Historical mission and replacement fields may remain in existing documents but have no effect in the current application. Use the Firebase console only with a documented operator and record changes.

## Rollback

Hosting releases can be rolled back from Firebase Hosting release history. Functions should be redeployed from a known Git commit. Close registration/uploads using configuration before a risky rollback; do not delete participant data.

## Known operational boundary

App Check enforcement is currently disabled on callable functions and must be enabled after reCAPTCHA Enterprise is configured and tested. One authenticated production smoke upload and one full CloudForge station walkthrough are required before event launch. The local emulator suite verifies the server-side upload and moderation transitions but does not prove camera permissions, passwordless email delivery, or VR hardware integration.
