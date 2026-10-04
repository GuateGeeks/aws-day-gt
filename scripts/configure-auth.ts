import { createRequire } from "node:module";

const projectId = process.argv[process.argv.findIndex((value) => value === "--project") + 1] || "aws-day-gt";
const require = createRequire(import.meta.url);
const { configstore } = require("firebase-tools/lib/configstore") as { configstore: { get(key: string): unknown } };
const tokenStore = configstore.get("tokens") as { refresh_token?: string } | undefined;
if (!tokenStore?.refresh_token) throw new Error("Firebase CLI is not signed in");
const { getAccessToken } = require("firebase-tools/lib/auth") as { getAccessToken(refreshToken: string, scopes: string[]): Promise<{ access_token: string }> };
const { access_token: accessToken } = await getAccessToken(tokenStore.refresh_token, ["https://www.googleapis.com/auth/cloud-platform"]);
const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

const initialize = await fetch(`https://identitytoolkit.googleapis.com/v2/projects/${projectId}/identityPlatform:initializeAuth`, { method: "POST", headers, body: "{}" });
if (!initialize.ok && initialize.status !== 409) throw new Error(`Auth initialization failed: ${initialize.status} ${await initialize.text()}`);

const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
const existingResponse = await fetch(configUrl, { headers });
if (!existingResponse.ok) throw new Error(`Auth config read failed: ${existingResponse.status} ${await existingResponse.text()}`);
const existing = await existingResponse.json() as { authorizedDomains?: string[] };
const authorizedDomains = [...new Set([...(existing.authorizedDomains ?? []), `${projectId}.firebaseapp.com`, `${projectId}.web.app`])];
const update = await fetch(`${configUrl}?updateMask=signIn.email,authorizedDomains`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: false } }, authorizedDomains })
});
if (!update.ok) throw new Error(`Email-link configuration failed: ${update.status} ${await update.text()}`);
const configured = await update.json() as { signIn?: { email?: { enabled?: boolean; passwordRequired?: boolean } }; authorizedDomains?: string[] };
console.log(JSON.stringify({ projectId, emailEnabled: configured.signIn?.email?.enabled, passwordRequired: configured.signIn?.email?.passwordRequired, authorizedDomains: configured.authorizedDomains }, null, 2));
