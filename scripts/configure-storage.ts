import { createRequire } from "node:module";
import { storageCors } from "./data/storage-cors";

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
const bucketResource = bucket.bucket?.name ?? bucket.name;
const bucketName = bucketResource?.split("/").at(-1);
if (!bucketName) throw new Error("Storage verification did not return a bucket name");
const corsResponse = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucketName)}?fields=name%2Clocation%2Ccors`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ cors: storageCors })
});
if (!corsResponse.ok) throw new Error(`Storage CORS configuration failed: ${corsResponse.status} ${await corsResponse.text()}`);
const configured = await corsResponse.json() as { name?: string; location?: string; cors?: typeof storageCors };
console.log(JSON.stringify({ projectId, location: configured.location ?? bucket.location, bucket: configured.name ?? bucketName, cors: configured.cors }, null, 2));
