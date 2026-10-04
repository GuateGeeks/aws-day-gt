# Private moderation image preview design

## Goal

Show each pending photographic submission in the staff moderation console while preserving the existing private-evidence security model.

## Scope

This change covers only moderation image visibility and related error states. Text-submission relevance validation remains a separate follow-up.

## Architecture

The browser will read the pending submission documents from Firestore as it does today. A focused preview component will receive the submission's `image.storagePath`, download the object with the authenticated Firebase Storage SDK, and create a temporary browser object URL for rendering. The component will revoke that URL when the path changes or the component unmounts.

No public download URL, persistent access token, signed URL, or new Cloud Function will be introduced. Existing Storage rules continue to authorize only the evidence owner and users whose Firebase Auth token contains the `moderator` or `admin` role.

## User experience

Each moderation card will contain:

- the submitted photograph with descriptive alternative text;
- a loading placeholder while the private object is downloaded;
- a clear error message and retry action if the download fails;
- the existing mission, participant, points, approve, and reject controls.

The moderation queue itself will expose Firestore subscription failures instead of presenting them as an empty queue. A genuinely empty successful query will retain the existing “Bandeja al día” state.

## Components and data flow

1. `AdminPage` subscribes to pending submissions and keeps separate loading and query-error state.
2. For every pending photo submission with a storage path, `PrivateEvidenceImage` requests the blob through Firebase Storage using the current authenticated session.
3. The component converts the blob to a local object URL and renders it.
4. Changing submissions, retrying, or unmounting cancels stale state updates and revokes any object URL created by that component.
5. Missing storage paths and authorization/network failures render actionable errors without preventing other queue items from loading.

## Error handling and security

The UI will not reveal raw Firebase error details or storage paths. It will distinguish the queue read failure from an empty result and isolate image failures to their individual cards. Approval and rejection controls will stay disabled until that card's photograph has loaded successfully, preventing a moderator from deciding without inspecting the evidence.

## Testing

Component tests will cover successful authenticated image rendering, loading, failed download with retry, object URL cleanup, missing image metadata, and a failed Firestore subscription. Existing unit, integration, rules, type-check, and production-build verification will run before deployment. After deployment, Hosting routes will receive a production smoke check.
