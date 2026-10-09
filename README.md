# AWS Community Day Guatemala 2026 Experience

Mobile-first React/Firebase PWA for AWS Community Day Guatemala. Each participant receives ten base Aura Challenges, six extra AWS service questions, and two selfie challenges. The application no longer offers the previous missions. Existing historical documents remain stored and are not deleted by the seed.

## Local development

Requires Node 22 and Java 21 for Firebase emulators.

```bash
npm install
npm --prefix functions install
npx firebase emulators:start
npm run dev
```

Set `VITE_USE_FIREBASE_EMULATORS=true`, `VITE_FIREBASE_PROJECT_ID=demo-aws-day-gt`, and `VITE_FIREBASE_STORAGE_BUCKET=demo-aws-day-gt.appspot.com` in `.env.local` for local Firebase services. The supplied Firebase project configuration is in `src/firebase/app.ts`; environment variables can override it. Seed the local Firestore emulator with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed -- --project demo-aws-day-gt --apply --confirm aws-community-day-gt-2026` after it starts.

The login page always uses Firebase Email Link Authentication. In local emulator mode, enter an email and copy the generated sign-in link from the terminal running `firebase emulators:start`; open it in the same browser. Production sends the link to the user's email. If a sign-in link is opened on another device, the app asks the user to confirm the email address before completing authentication.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
npm --prefix functions run build
```

`npm test` skips emulator integration tests unless the emulators are running. Run `npm run test:integration` and `npm run test:rules` inside the Firestore and Storage emulators for complete local verification.

## Production

See [docs/operations.md](docs/operations.md). Data seeding is dry-run by default and never deletes documents.
