import { createRequire } from "node:module";
import { challenges } from "../shared/challenges/catalog";
import { EVENT_ID } from "../shared/constants";

const projectId = "aws-day-gt";
const phase = process.argv.includes("--prepare") ? "prepare" : process.argv.includes("--retire") ? "retire" : null;
const apply = process.argv.includes("--apply");
const confirmationIndex = process.argv.indexOf("--confirm");
if (!phase || (process.argv.includes("--prepare") && process.argv.includes("--retire"))) throw new Error("Choose exactly one phase: --prepare or --retire");
if (apply && process.argv[confirmationIndex + 1] !== EVENT_ID) throw new Error(`Apply requires --confirm ${EVENT_ID}`);
if (process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Production catalog release refuses Firestore emulator settings");

const source = new Map(challenges.map((challenge) => [challenge.id, challenge]));
const desired = phase === "prepare" ? {
  C12: { required: true },
  C15: { title: source.get("C15")!.title, description: source.get("C15")!.description, auraReward: 350, required: true, active: true }
} : {
  C03: { active: false },
  C05: { active: false, description: source.get("C05")!.description },
  C10: { active: false, description: source.get("C10")!.description },
  C11: { active: false, description: source.get("C11")!.description },
  C13: { active: false, description: source.get("C13")!.description },
  C14: { active: false, description: source.get("C14")!.description },
  C16: { description: source.get("C16")!.description },
  C17: { description: source.get("C17")!.description }
};

type FieldValue = { stringValue?: string; booleanValue?: boolean; integerValue?: string; timestampValue?: string };
type Document = { name: string; fields: Record<string, FieldValue>; updateTime: string };
const encode = (value: string | number | boolean): FieldValue => typeof value === "string" ? { stringValue: value } : typeof value === "boolean" ? { booleanValue: value } : { integerValue: String(value) };
const decode = (value: FieldValue | undefined) => value?.stringValue ?? value?.booleanValue ?? (value?.integerValue === undefined ? undefined : Number(value.integerValue));

const require = createRequire(import.meta.url);
const { configstore } = require("firebase-tools/lib/configstore") as { configstore: { get(key: string): unknown } };
const tokenStore = configstore.get("tokens") as { refresh_token?: string } | undefined;
if (!tokenStore?.refresh_token) throw new Error("Firebase CLI is not signed in");
const { getAccessToken } = require("firebase-tools/lib/auth") as { getAccessToken(refreshToken: string, scopes: string[]): Promise<{ access_token: string }> };
const { access_token: accessToken } = await getAccessToken(tokenStore.refresh_token, ["https://www.googleapis.com/auth/cloud-platform"]);
const headers = { Authorization: `Bearer ${accessToken}` };
const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const changes: { id: string; document: Document; fields: Record<string, FieldValue>; changed: string[] }[] = [];
for (const [id, patch] of Object.entries(desired)) {
  const response = await fetch(`${base}/challenges/${id}`, { headers });
  if (!response.ok) throw new Error(`Catalog preflight failed for ${id}: HTTP ${response.status}`);
  const document = await response.json() as Document;
  if (decode(document.fields.eventId) !== EVENT_ID || !document.updateTime) throw new Error(`Unexpected catalog document for ${id}`);
  const changed = Object.entries(patch).filter(([key, value]) => decode(document.fields[key]) !== value).map(([key]) => key);
  if (changed.length) changes.push({ id, document, changed, fields: Object.fromEntries(changed.map((key) => [key, encode(patch[key as keyof typeof patch] as string | number | boolean)])) });
  console.log(`${id}: ${changed.length ? changed.join(", ") : "already current"}`);
}
console.log(`${apply ? "APPLY" : "DRY RUN"} ${phase}: ${changes.length} existing catalog documents to update; 0 deletes; no user, score, or progress writes.`);
if (!apply || changes.length === 0) process.exit(0);
const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
  method: "POST", headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ writes: changes.map(({ document, fields, changed }) => ({
    update: { name: document.name, fields },
    updateMask: { fieldPaths: changed },
    updateTransforms: [{ fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" }],
    currentDocument: { updateTime: document.updateTime }
  })) })
});
if (!response.ok) throw new Error(`Catalog release failed: HTTP ${response.status} ${await response.text()}`);
console.log(`Applied ${changes.length} catalog updates to ${projectId}.`);
