import { createRequire } from "node:module";
import { EVENT_ID } from "../shared/constants";
import { eventCodeCommitWrites } from "./data/event-code-updates";

const args = process.argv.slice(2);
const valueAfter = (flag: string) => args[args.indexOf(flag) + 1];
const projectId = valueAfter("--project");
if (projectId !== "aws-day-gt" || process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("This command only targets the aws-day-gt production project.");
}
const codes = {
  C13: process.env.EVENT_STAND_CODE ?? ""
};
const writes = eventCodeCommitWrites(projectId, codes);
const apply = args.includes("--apply");
process.stdout.write(`${apply ? "APPLY" : "DRY RUN"}: ${writes.length} private event-code documents in ${projectId}; no participant data or public catalog writes.\n`);
if (!apply) process.exit(0);
if (valueAfter("--confirm") !== EVENT_ID) throw new Error(`Apply requires --confirm ${EVENT_ID}`);

const require = createRequire(import.meta.url);
const { configstore } = require("firebase-tools/lib/configstore") as { configstore: { get(key: string): unknown } };
const tokenStore = configstore.get("tokens") as { refresh_token?: string } | undefined;
if (!tokenStore?.refresh_token) throw new Error("Firebase CLI is not signed in");
const { getAccessToken } = require("firebase-tools/lib/auth") as { getAccessToken(refreshToken: string, scopes: string[]): Promise<{ access_token: string }> };
const { access_token } = await getAccessToken(tokenStore.refresh_token, ["https://www.googleapis.com/auth/cloud-platform"]);
const documentBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
for (const id of ["C13"]) {
  const result = await fetch(`${documentBase}/challenges/${id}`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!result.ok) throw new Error(`Public challenge ${id} is unavailable: HTTP ${result.status}`);
}
const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
  method: "POST",
  headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ writes })
});
if (!response.ok) throw new Error(`Event-code configuration failed: HTTP ${response.status}`);
process.stdout.write("Private event codes configured and active.\n");
