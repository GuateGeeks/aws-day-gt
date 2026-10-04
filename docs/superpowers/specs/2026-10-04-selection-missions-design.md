# Selection-based missions design

## Goal

Replace free-text evidence for all `word` and `comment` missions with predefined single- or multiple-choice answers. Support both opinion prompts and server-validated quiz questions without exposing answer keys to participants.

## Source boundaries

Question content must come from the supplied product specification and the published AWS Community Day Guatemala 2026 agenda. Verifiable questions may use only facts present in those sources: session title, speaker, room, track, schedule, and technologies explicitly named in a title.

`Casa de Kiro` is not an inferred location. It appears in the supplied specification as an agenda space and photo mission, and the published agenda identifies it as a space in Biblioteca with activities led by Bárbara Gaspar.

The system must not invent technical claims about session content beyond the published title. If a fact cannot be verified from the available agenda, that mission must use opinion mode.

## Mission classification

All 35 non-photo missions become selection-based.

### Validated quiz missions

Missions `M16`–`M26`, `M28`–`M31`, and `M33`–`M44` use quiz mode. Their prompts and options are derived from published agenda facts. Most require one answer. Multiple answers are required where the published title explicitly lists several technologies, including:

- `M17`: Strands Agents and Amazon Bedrock AgentCore;
- `M20`: Amazon Bedrock, Amazon Quick, and Kiro, preserving the agenda's published wording;
- `M21`: Lambda, SNS, SQS, and Step Functions;
- `M39`: prompt injection, tool poisoning, and MCP rug pulls.

Multiple-answer quizzes require an exact set match. Partial answers, extra answers, duplicate IDs, or unknown IDs are incorrect.

### Opinion missions

Missions `M27`, `M32`, and `M45`–`M50` use opinion mode. Each presents a curated set of relevant choices. Any selection that satisfies its configured minimum and maximum is accepted; there is no hidden correct answer.

## Public and private data

Public mission documents receive a `selection` configuration containing:

- mode: `single` or `multiple`;
- validation kind: `opinion` or `quiz`;
- four to six options with opaque IDs and Spanish labels;
- minimum and maximum selection counts.

Correct option IDs must never be stored in public mission documents, frontend bundles, callable responses, or analytics. Quiz answer keys live in a server-only `missionAnswerKeys/{missionId}` collection. Firestore rules deny all client reads and writes to this collection.

The seed process writes both public mission configurations and private answer-key documents. It removes stale answer keys for missions that are no longer quizzes.

## Submission flow

The existing callable keeps its public function name for deployment compatibility but accepts `selectionIds: string[]` instead of free text.

For every request, the server verifies authentication, assignment state, mission activity, option membership, duplicates, selection count, and idempotency. For opinion missions, a valid configured selection is immediately approved and scored.

For quiz missions, the server reads the private answer key and compares normalized sets:

1. A correct first or second attempt creates the approved submission and awards the existing mission points exactly once.
2. A first incorrect attempt increments `attemptsUsed`, leaves the assignment available, and returns `INCORRECT_SELECTION` with one remaining attempt.
3. A second incorrect attempt increments `attemptsUsed`, changes the assignment to `failed`, awards no points, and returns `ATTEMPTS_EXHAUSTED` with zero remaining attempts.
4. Every correct and incorrect request writes an idempotency result. Retrying the same operation ID never consumes another attempt or awards points twice.

The final approved submission stores both selected opaque IDs and a snapshot of their Spanish labels. Existing submissions containing the legacy `text` field remain readable.

## Replacement behavior

The replacement callable accepts an assignment in `failed` state only when it is a quiz with two recorded failed attempts. Replacing it consumes one of the participant's existing two replacements and follows the current compatibility rules for evidence type, points, scheduling, and non-repetition.

A failed quiz cannot be submitted again. If no replacements remain, the mission stays failed without points. Opinion missions and photo missions retain their existing behavior.

## Participant experience

Single-choice missions render a radio group. Multiple-choice missions render checkboxes with visible selection guidance such as “Selecciona 2 opciones” or “Selecciona hasta 3 opciones.” The submit button stays disabled until the configured minimum and maximum are satisfied.

After the first incorrect quiz attempt, the interface states that the selection is incorrect and that one attempt remains, without identifying the correct answer. After the second error, it explains that the mission can be replaced if the participant still has a replacement. Correct and opinion submissions keep the existing completion confirmation.

No free-text draft is stored for these missions. Accessibility requirements include fieldsets, legends, native radio/checkbox inputs, keyboard operation, visible focus, and an announced result status.

## Administration and privacy

This release defines options and answer keys in seed data based on currently available agenda facts. It does not add an answer-key editor to the admin console. Future administration can extend the same private collection through privileged Functions.

Selected answers are evidence data and must not be sent to analytics or public leaderboard documents.

## Error handling

The callable returns stable domain codes for malformed selections, unavailable missions, incorrect answers, and exhausted attempts. Unexpected failures retain the existing generic participant message and do not consume an attempt unless the transaction commits.

If a public quiz mission lacks its private answer key, the server fails closed with a configuration error, awards no points, and consumes no attempt.

## Migration and deployment

The catalog seed updates all 35 public mission documents and creates private answer keys for the quiz subset. Existing user assignments continue referencing their mission IDs and require no reassignment. Legacy completed submissions and scores remain unchanged.

Deployment order is:

1. Firestore rules protecting answer keys;
2. Cloud Functions accepting and validating selections;
3. mission and answer-key seed;
4. Hosting with selection controls.

This order prevents the new client from reaching an old callable and prevents private answer keys from being readable during migration.

## Testing

Unit tests cover configuration schemas, unique option IDs, selection limits, exact-set comparison, duplicate rejection, and the complete 35-mission classification. Function tests cover opinion scoring, correct quiz scoring on either attempt, first failure, exhaustion, idempotent retries, missing keys, and replacement of failed quizzes.

Component tests cover single and multiple controls, disabled submission limits, remaining-attempt feedback, exhausted replacement messaging, keyboard-accessible labels, and absence of free-text inputs. Rules tests prove participants and staff cannot read answer keys. Full type checking, builds, emulator tests, seed dry-run, production deployment, and route smoke tests complete the release verification.
