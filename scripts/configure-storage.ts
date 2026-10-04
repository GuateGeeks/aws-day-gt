import { createRequire } from "node:module";

const projectId = process.argv[process.argv.findIndex((value) => value === "--project") + 1] || "aws-day-gt";
const location = process.argv[process.argv.findIndex((value) => value === "--location") + 1] || "US-CENTRAL1";
const require = createRequire(import.meta.url);
const { configstore } = require("firebase-tools/lib/configstore") as { configstore: { get(key: string): unknown } };
const tokenStore = configstore.get("tokens") as { refresh_token?: string } | undefined;
if (!tokenStore?.refresh_token) throw new Error("Firebase CLI is not signed in");
const { getAccessToken } = require("firebase-tools/lib/auth") as { getAccessToken(refreshToken: string, scopes: string[]): Promise<{ access_token: string }> };
const { access_token: accessToken } = await getAccessToken(tokenStore.refresh_token, ["https://www.googleapis.com/auth/cloud-platform"]);
const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
const endpoint = `https://firebasestorage.googleapis.com/v1alpha/projects/${projectId}/defaultBucket`;
const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ location }) });
if (!response.ok && response.status !== 409) throw new Error(`Storage initialization failed: ${response.status} ${await response.text()}`);
const read = await fetch(endpoint, { headers });
if (!read.ok) throw new Error(`Storage verification failed: ${read.status} ${await read.text()}`);
const bucket = await read.json() as { name?: string; location?: string; bucket?: { name?: string } };
console.log(JSON.stringify({ projectId, location: bucket.location, bucket: bucket.bucket?.name ?? bucket.name }, null, 2));
