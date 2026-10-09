# Performance, moderation, and privacy administration

## Objective

Improve perceived and measured loading time for Challenges, Progress, and Ranking, and expand `/admin` into a responsive operations center available only to the event owner account `guategeeks3d@gmail.com`.

## Access control

- `/admin` is available only when the signed-in Firebase user email is `guategeeks3d@gmail.com` and the user has the `admin` custom claim.
- Image moderation callables accept only the `admin` role. The `moderator` role no longer grants access to submissions, evidence images, scores, assignments, or the console route.
- Firestore and Storage rules mirror the callable restrictions.
- All sensitive mutations create audit records.

## Administrative experience

The existing `/admin` route becomes one operations center with a responsive header, summary counts, and three sections:

1. **Images** lists pending evidence, loads private images only when needed, and supports approve or reject. Rejection requires a short reason.
2. **Privacy** lists pending deletion requests with masked email, alias, request date, and status. Rejection requires a reason. Approval opens a final confirmation describing the irreversible scope.
3. **Configuration** contains the challenge, credit, Cloud question, and track controls already present.

On mobile, sections use full-width tabs and cards with large touch targets. On desktop, the same content uses a wider grid without changing action order or terminology.

## Deletion lifecycle

Requests move through `requested`, `processing`, `rejected`, `failed`, and `completed` states.

Approval invokes one admin-only callable. It deletes:

- Firebase Authentication account.
- User profile and alias reservation.
- Challenge assignment and challenge progress.
- Score and leaderboard presence.
- Challenge and legacy mission submissions.
- Evidence files under the user's Storage prefix.
- Legacy mission assignments.
- Connections involving the user.
- Geek ID tokens and idempotency records owned by the user.
- The deletion request after successful completion.

The function is idempotent so an interrupted deletion can be retried. Authentication is deleted last. A completed audit entry stores an irreversible digest instead of UID, email, alias, or image information. A failed attempt leaves the request available for retry with a safe error status and no sensitive error details exposed to the client.

Rejection retains the user data and records the reason, deciding administrator, and date on the deletion request.

## Performance design

### Shared participant data

A provider mounted inside the authenticated application owns assignment, challenge catalog, progress, and score subscriptions. Challenges, Challenge detail, Progress, home, and celebration consumers reuse this state instead of creating independent listeners.

The assignment callable runs only when no assignment document is available. Existing data renders from cache immediately while subscriptions refresh it in the background. Firestore uses persistent IndexedDB caching with multi-tab coordination when supported and falls back safely when unavailable.

### Ranking

The callable returns a bounded public leaderboard plus the current participant's rank. The client caches the successful response for a short period and displays it immediately on repeat visits while refreshing in the background. The server avoids reading every participant profile by using ranking fields already copied into score documents. Registration eligibility remains enforced when score documents are written.

### Code loading

Application routes are loaded lazily. Public authentication, participant pages, ranking, profile, and the administration console produce separate chunks. The current route remains responsive while the next commonly used route is prefetched after authentication.

### Loading experience

Pages keep their complete layout during refresh and use lightweight skeleton states only for missing first-load data. Navigation remains usable. Errors preserve cached content and offer an explicit retry instead of replacing the whole screen.

## Data and indexes

- Deletion requests include request state, request timestamp, decision timestamp, masked display metadata, and non-sensitive failure state.
- Queries for user-owned collections use indexed `userId` fields where available.
- Any new compound query receives a declared Firestore index before deployment.

## Verification

- Unit tests cover shared data reuse, cached ranking behavior, route access, responsive admin sections, moderation authorization, deletion confirmation, rejection, retry, and UI error states.
- Emulator integration tests verify complete deletion across Firestore, Storage, and Authentication and confirm that audit data contains no personal identifiers.
- Rules tests prove participants and moderators cannot access admin data or evidence belonging to others.
- Production build analysis confirms route splitting and excludes local preview login.
- Responsive browser checks cover narrow mobile, wide mobile viewport, tablet, and desktop.

## Deployment

Deploy functions, Firestore indexes and rules, Storage rules, and Hosting to project `aws-day-gt`. Verify the live email-only login, protected `/admin`, participant navigation, cached repeat navigation, and callable health after release.
