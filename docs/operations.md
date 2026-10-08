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

The seed writes one event, one protected config document, 23 public Challenge records, 12 private answer records, and two legacy experience stations. It performs no deletions and no longer writes previous missions or their answer keys. Challenge, secret, and station documents are created only when missing, so repeating the seed preserves administrator edits. The retired VR code has no configuration workflow. Clients, moderators, and administrators cannot read answer keys directly; validation runs only inside Cloud Functions. Legal text is provisional and should be replaced before registration opens.

### Production credit-catalog release

The general seed does not update existing Challenges. For the October 8 credit release, use the guarded catalog script in two phases. It reads the existing public Challenge documents, prints the exact fields that differ, checks their event ID, and applies updates only with matching Firestore update times. It never writes user profiles, scores, progress, or assignments.

```bash
npx tsx scripts/release-credit-catalog.ts --prepare
npx tsx scripts/release-credit-catalog.ts --prepare --apply --confirm aws-community-day-gt-2026
npx firebase deploy --only functions --project aws-day-gt
npx tsx scripts/release-credit-catalog.ts --retire
npx tsx scripts/release-credit-catalog.ts --retire --apply --confirm aws-community-day-gt-2026
npx firebase deploy --only hosting --project aws-day-gt
```

The prepare phase makes Track Pulse and the 350-credit GuateGeeks post mandatory for the new pack. The retire phase disables removed speaker-code and VR Challenges and updates the selfie descriptions. Run each dry run immediately before its matching apply. The two phases limit disruption while Functions and Hosting are updated.

## Credit Challenges

New participants receive nine mixed base Challenges at onboarding, six AWS service questions, and two selfie challenges. C15 invites a post about the GuateGeeks stand and its experience, with a screenshot that shows the GuateGeeks tag; staff approval grants 350 credits. Each participant sees a stable personal order mixed across categories. Existing participants receive the updated pack when they next open the app without resetting credits. Previous `missions`, `missionAnswerKeys`, `userMissions`, and mission `submissions` remain stored but are no longer assigned, displayed, readable by clients, or accepted by the active photo and moderation APIs. Their `totalPoints` remain unchanged. `scores.auraTotal` and `completedChallenges` remain the internal fields for credit progress and ranking. Existing `/app/missions` links redirect to `/app/challenges`.

Cloud Trio (C03), Cross Level (C05), and Experiencia VR GuateGeeks (C13) are retired. On the next app open, the assignment callable replaces those IDs with eligible challenges and retains prior progress and awarded credits. To update the catalog in the **local emulator only**, run:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run sync:challenges:emulator
```

Admins can activate or deactivate eligible Challenges, edit their descriptions and credit rewards, configure the C08/C09 scenarios, and update Track Pulse choices. Retired challenges cannot be reactivated or completed through the active API. Cloud answers are stored in private Firestore documents. The C06 sequence and C07 matches remain defined in the private seeded answer records; changing those games requires a reviewed configuration update rather than a repeated seed.

The Geek ID contains only a random token, lasts five minutes, and is verified by a callable against the participant's profile. The camera scanner also offers manual entry of the temporary token. Social Challenges reject self-scans and repeated use of the same connection within a Challenge. Cloud questions and AWS selections validate answers in Cloud Functions. A first wrong answer closes the question, deducts 10 credits for questions or 20 for architecture (including when the balance becomes negative), and shows both the reason and the solution. Other challenge types keep their own validation rules.

Community publication and selfies reuse the private evidence upload path, size and image signature checks, and the existing moderation queue. Valid uploads enter manual review; approval grants the credit reward captured when the photo was submitted once, rejection grants zero, and a rejected participant may retry. Automatic image moderation and event-screen publication require separate provider and display configuration.

### Registered credit ranking migration

The ranking reads scores with `registeredForRanking: true`, ordered by credits, completed Challenges, and the time the balance was reached. Onboarding writes this marker for new registrations; the Challenge assignment path refreshes it for returning participants after checking `users/{uid}.onboardingComplete`, `createdAt`, and `consent.acceptedAt`. Participants with 0 credits remain eligible. Raw score documents remain readable only by their owner or event staff.

For the **local Firestore emulator only**, preview and then apply the ranking backfill. The script refuses to run without a localhost emulator and requires an explicit event confirmation to write. It updates `registeredForRanking` and fills missing Aura sorting fields with zero or null for verified registrations. It preserves existing Aura, historical points, and all documents; it performs no deletions:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run backfill:ranking:emulator -- --project aws-day-gt
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run backfill:ranking:emulator -- --project aws-day-gt --apply --confirm aws-community-day-gt-2026
```

Before a future production release, deploy the new Firestore composite index and wait until it is ready. Then prepare a separate reviewed production migration with a dry run, count registered profiles by the same three markers, update only the matching event score markers in batches, and compare the resulting ranking counts. Do not use the emulator-only script for production. No production score migration is part of this local change.

## Event-day controls

### Local agenda rehearsal

On 8 October 2026, the app running with `VITE_USE_FIREBASE_EMULATORS=true` uses the current Guatemala time of day against the official 10 October agenda. The landing and Hoy screens label this as a local rehearsal. Production keeps the official date. An explicit preview such as `?ahora=2026-10-10T08:25` takes priority; `?ahora=real` returns to the actual clock for that browser tab.

Hoy shows the current block and the next start time, including parallel talks and workshops. The app shell shows one in-app reminder for each block when it is five minutes away. The reminder needs the app to be open. Participants may opt into browser notifications from Hoy; permission is requested only when they choose the control. There is no background push when the app is closed.

Remote Config defaults are conservative. Firestore `config/aws-community-day-gt-2026` owns registration, leaderboard, upload, maintenance, and event-mode switches. Historical mission and replacement fields may remain in existing documents but have no effect in the current application. Use the Firebase console only with a documented operator and record changes.

## Rollback

Hosting releases can be rolled back from Firebase Hosting release history. Functions should be redeployed from a known Git commit. Close registration/uploads using configuration before a risky rollback; do not delete participant data.

## Known operational boundary

App Check enforcement is currently disabled on callable functions and must be enabled after reCAPTCHA Enterprise is configured and tested. One authenticated production smoke upload is required before event launch. The local emulator suite verifies the server-side upload and moderation transitions but does not prove camera permissions or passwordless email delivery.
