import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "node:module";
import { EVENT_ID } from "../shared/constants";
import { event, eventConfig } from "./data/event";
import { missions } from "./data/missions";
import { missionAnswerKeys } from "./data/mission-selections";

const args = new Set(process.argv.slice(2));
const projectArg = process.argv.findIndex((value) => value === "--project");
const projectId = projectArg >= 0 ? process.argv[projectArg + 1] : "aws-day-gt";
const apply = args.has("--apply");
const cliAuth = args.has("--cli-auth");
const confirmation = process.argv[process.argv.findIndex((value) => value === "--confirm") + 1];

const writes = [
  { path: `events/${EVENT_ID}`, data: event },
  { path: `config/${EVENT_ID}`, data: eventConfig },
  ...missions.map((mission) => ({ path: `missions/${mission.id}`, data: mission })),
  ...Object.values(missionAnswerKeys).map((answerKey) => ({ path: `missionAnswerKeys/${answerKey.missionId}`, data: answerKey }))
];

console.log(`${apply ? "APPLY" : "DRY RUN"}: ${writes.length} upserts, 0 deletes in ${projectId}`);
console.log(`event: 1, config: 1, missions: ${missions.length}, answer keys: ${Object.keys(missionAnswerKeys).length}`);
if (!apply) process.exit(0);
if (confirmation !== EVENT_ID) throw new Error(`Apply requires --confirm ${EVENT_ID}`);

type FirestoreValue = { stringValue?: string; booleanValue?: boolean; integerValue?: string; doubleValue?: number; nullValue?: null; arrayValue?: { values: FirestoreValue[] }; mapValue?: { fields: Record<string, FirestoreValue> } };
function firestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, firestoreValue(item)])) } };
}

if (cliAuth) {
  const require = createRequire(import.meta.url);
  const { configstore } = require("firebase-tools/lib/configstore") as { configstore: { get(key: string): unknown } };
  const tokenStore = configstore.get("tokens") as { refresh_token?: string } | undefined;
  if (!tokenStore?.refresh_token) throw new Error("Firebase CLI is not signed in");
  const { getAccessToken } = require("firebase-tools/lib/auth") as { getAccessToken(refreshToken: string, scopes: string[]): Promise<{ access_token: string }> };
  const { access_token: accessToken } = await getAccessToken(tokenStore.refresh_token, ["https://www.googleapis.com/auth/cloud-platform"]);
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ writes: writes.map((write) => ({ update: { name: `projects/${projectId}/databases/(default)/documents/${write.path}`, fields: (firestoreValue(write.data).mapValue?.fields ?? {}) } })) })
  });
  if (!response.ok) throw new Error(`Firestore seed failed: ${response.status} ${await response.text()}`);
  console.log(`Seed applied safely to ${projectId} using the authenticated Firebase CLI session.`);
  process.exit(0);
}

const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
const database = getFirestore(app);
const batch = database.batch();
for (const write of writes) batch.set(database.doc(write.path), write.data, { merge: true });
await batch.commit();
console.log(`Seed applied safely to ${projectId}.`);
