import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { EVENT_ID } from "../shared/constants";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost) throw new Error("This command runs only with FIRESTORE_EMULATOR_HOST set.");
const emulatorUrl = new URL(`http://${emulatorHost}`);
if (!["127.0.0.1", "localhost", "[::1]"].includes(emulatorUrl.hostname) || !emulatorUrl.port) {
  throw new Error("The Firestore emulator must be on localhost with an explicit port.");
}

const args = process.argv.slice(2);
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const projectId = valueAfter("--project");
if (!projectId || !/^[a-z][a-z0-9-]{4,40}$/.test(projectId)) throw new Error("Pass a valid --project ID for the local emulator.");
const apply = args.includes("--apply");
if (apply && valueAfter("--confirm") !== EVENT_ID) throw new Error(`Apply requires --confirm ${EVENT_ID}`);

const database = getFirestore(initializeApp({ projectId }, "retire-cloud-trio"));
const ref = database.doc("challenges/C03");
const challenge = await ref.get();
if (!challenge.exists || challenge.data()?.eventId !== EVENT_ID || challenge.data()?.id !== "C03") {
  throw new Error("Cloud Trio is missing or belongs to another event; no changes made.");
}

if (!challenge.data()?.active) {
  console.log(`${apply ? "APPLIED" : "DRY RUN"}: Cloud Trio already inactive in ${projectId}; 0 updates, 0 deletes.`);
} else if (!apply) {
  console.log(`DRY RUN: Cloud Trio active in ${projectId}; 1 update needed, 0 deletes.`);
} else {
  await ref.update({ active: false, updatedAt: FieldValue.serverTimestamp() });
  console.log(`APPLIED: Cloud Trio inactive in ${projectId}; 1 update, 0 deletes. Existing packages migrate on next app visit.`);
}
