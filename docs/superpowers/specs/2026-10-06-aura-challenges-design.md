# Aura Challenges for AWS Community Day Guatemala 2026

## Scope and compatibility

The existing React/Firebase application remains the host. This phase adds exactly fifteen Aura Challenges and assigns ten per participant. It keeps every `M01`–`M50` mission, `userMissions` assignment, `submission`, and historical `scores.totalPoints` value intact. Challenges become the main participant section; historical missions remain accessible separately. The ranking and main progress view use only Aura earned from Challenges. No deployment is part of this phase.

New registrations receive a Challenge pack. Accounts with old missions receive a Challenge pack on first visit through an idempotent callable. Their old assignments remain available in the historical section. The old mission replacement and scoring functions continue to operate on `Mxx` IDs only.

## Data

- `users/{uid}` retains its current fields and adds `primaryRole`, `experienceLevel`, `firstAwsCommunityDay`, and optional `awsInterest`. A callable writes these fields once per participant; admin correction is allowed. The existing `interests` field remains for historical data.
- `challenges/{C01..C15}` contains `eventId`, `title`, `description`, `category`, `auraReward`, `validationType`, `active`, `required`, `configuration`, `version`, and timestamps. Public configuration contains only prompts, choices, and presentation details.
- `challengeSecrets/{challengeId}` contains answer keys, session codes, or hashes that must not reach client Firestore reads.
- `challengeAssignments/{uid}` stores event ID, ten ordered challenge IDs, version, signature, and server timestamp. Assignment is created once and never regenerated on reload.
- `challengeProgress/{eventId}_{uid}_{challengeId}` stores state, participant scan references when applicable, completion time, and awarded Aura. States are `locked`, `available`, `in_progress`, `processing`, `completed`, or `rejected`.
- `connections/{eventId}_{challengeId}_{uid}_{otherUid}` records a social scan once for that challenge and participant pair.
- `geekIdTokens/{sha256(token)}` maps a short-lived opaque random token to a participant; only Cloud Functions can read or write it. QR content is the token alone, with no email, alias, or UID.
- `experienceTokens/{sha256(token)}` records the official station, challenge, issue time, expiry, and consumption. No unverified frontend event can create a valid completion.
- `scores/{eventId}_{uid}` gains `auraTotal`, `completedChallenges`, and `auraReachedAt`; historical `totalPoints` remains unchanged. Ranking orders by `auraTotal`, then completion count and first reached time.
- `submissions` and the current private Storage path are reused for Community Aura. New photo submissions carry a Challenge discriminator and moderation state. A missing moderation provider results in `manual_review`, never simulated approval.
- Existing `events/{eventId}/schedule` supplies public session details. Unlock codes and correct answers live in `challengeSecrets`; official experience stations are configured under the event, with private token records kept separately.

The seed is additive and idempotent. It writes the fifteen `Cxx` documents without deleting `Mxx` data. New rules deny all client writes to Challenge, score, token, and connection collections. Profile writes use a callable so participants cannot repeatedly change comparison fields to farm social completions.

## Bank and assignment

| ID | Challenge | Category | Aura | Validation |
| --- | --- | --- | ---: | --- |
| C01 | Different Stack | CONNECT | 150 | Another role by Geek ID |
| C02 | First Timer | CONNECT | 150 | Other profile has `firstAwsCommunityDay=true` |
| C03 | Cloud Trio | CONNECT | 200 | Two distinct scans, three distinct roles |
| C04 | Same Cloud Interest | CONNECT | 100 | Intersecting `awsInterest` |
| C05 | Cross Level | CONNECT | 125 | Different `experienceLevel` |
| C06 | Build Serverless | CLOUD | 150 | API Gateway → Lambda → DynamoDB |
| C07 | Cloud Match | CLOUD | 100 | Four configurable service pairs |
| C08 | Architecture Fix | CLOUD | 150 | Configurable erroneous component or edge |
| C09 | Who Am I? | CLOUD | 100 | Configurable clues and correct service |
| C10 | Session Unlock | SESSION | 100 | Active session and server-only code |
| C11 | Session Challenge | SESSION | 150 | C10 complete for session, then server-only answer |
| C12 | Track Pulse | SESSION | 50 | One choice from configured tracks |
| C13 | Enter The Cloud | EXPERIENCE | 250 | Official CloudForge completion token or admin fallback |
| C14 | VR Explorer | EXPERIENCE | 150 | Official active station token |
| C15 | Community Aura | COMMUNITY | 100 | One valid approved photo |

C13 is mandatory. The other nine are selected from one of five `(CONNECT, CLOUD, SESSION, extra EXPERIENCE, COMMUNITY)` patterns: `(3,3,2,0,1)`, `(3,2,2,1,1)`, `(2,3,2,1,1)`, `(3,3,1,1,1)`, and `(3,3,2,1,0)`. Each yields ten total with C13 and the requested category ranges. A user-seeded ranking selects within each category and candidate signatures are checked to reduce duplicate packs. The selected pack is persisted transactionally. Inactive optional Challenges are excluded before selection; if fewer than ten compatible Challenges remain, the function fails clearly rather than silently changing an existing pack. Disabling an already assigned Challenge blocks new completion but does not rewrite the pack.

## Validation and scoring

Authenticated callable functions are the sole write path. `completeChallenge` accepts a Challenge ID, typed attempt payload, and operation ID. It checks assignment, active status, profile requirements, any private answer or code, and current progress. A Firestore transaction creates a completion record and increments Aura once; retrying an operation or a completed Challenge returns the stored result without adding Aura. Incorrect game answers can be retried without penalty. Cloud Trio records the first distinct valid scan as `in_progress` and awards only after the second scan forms three roles.

Geek ID tokens use cryptographic randomness, a short expiry, and a server-side hash lookup. The server rejects self scans, invalid or expired tokens, repeated participants, and duplicate challenge awards. Real-world profile claims cannot be independently verified, so comparison fields are locked after initial completion and staff may correct errors.

Cloud game interfaces send sequences, matches, or selected option IDs to the server. The server holds correct solutions in `challengeSecrets`, including configurable scenario and question keys. Session codes are never bundled in JavaScript or public Firestore documents. C11 requires a completed C10 tied to the same configured session. C12 stores the chosen track for event metrics.

For experience completion, an adapter accepts a token generated by an authorized official station and consumes it once. Until a real CloudForge issuer is connected, participants cannot self-award C13. An audited admin callable can mark completion. C14 uses the same verifier with its own station configuration. The Unity project is not modified in this phase.

Community Aura reuses the existing upload control and private Storage location. The server checks path, owner, size, declared image type, and file signature before recording an upload. States advance from `uploading` in the UI to `processing` and then `approved`, `rejected`, or `manual_review`. A moderation adapter may later call Amazon Rekognition; without configured credentials it returns `manual_review`. Staff review uses the existing console, and only approval awards Aura. Existing photo submissions remain readable.

## UI and administration

The existing design tokens, cards, routing, AuthProvider, and Quetzi components are reused. The main navigation labels the new Challenges section and shows `completed / 10`; a separate route exposes historical missions. The progress and ranking screens show Aura from Challenges; the historical screen can display its own old points without mixing them into Aura. Success feedback is short and specific to social, Cloud, and VR challenges. The cloud interactions use existing card patterns with accessible click or keyboard alternatives to drag and drop.

The admin page gains limited editors for active status, Aura value, public question or scenario content, private session code and answer, official station settings, and a `manual_review` photo queue. It does not become a general CMS. Server callables validate edits, restrict them to admins, and write audit logs.

## Verification and rollout

Domain tests cover the seventeen minimum cases in the request, including pack balance and persistence, social comparison and self-scan, Cloud answers, session codes, token reuse, photo state transitions, and direct score-write denial. Integration tests exercise idempotent Firestore transactions with Firebase emulators. Typecheck, unit and integration tests, rules tests, and production build are required before claiming completion. Rules tests need Java 21, which is absent from the current host. Real CloudForge token issuance, venue network, production moderation credentials, and physical QR camera checks remain real-world configuration and validation gates.
