# AWS Community Day Guatemala 2026 Experience

Mobile-first React/Firebase PWA for the event's personalized 11-mission challenge.

## Local development

Requires Node 22 and Java 21 for Firebase emulators.

```bash
npm install
npm --prefix functions install
npx firebase emulators:start
npm run dev
```

Set `VITE_USE_FIREBASE_EMULATORS=true` in `.env.local` for local Firebase services. The supplied Firebase project configuration is in `src/firebase/app.ts`; environment variables can override it.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

Rules tests must run inside the Firestore and Storage emulators.

## Production

See [docs/operations.md](docs/operations.md). Data seeding is dry-run by default and never deletes documents.
