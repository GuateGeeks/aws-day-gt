import { initializeApp } from "firebase-admin/app";
import { FieldPath, getFirestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { EVENT_ID } from "../shared/constants";
import { hasCompletedRegistration } from "../functions/src/shared/registration";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost) throw new Error("This backfill runs only with FIRESTORE_EMULATOR_HOST set.");
const emulatorUrl = new URL(`http://${emulatorHost}`);
if (!["127.0.0.1", "localhost", "[::1]"].includes(emulatorUrl.hostname) || !emulatorUrl.port) {
  throw new Error("The Firestore emulator must be on localhost with an explicit port.");
}

const args = process.argv.slice(2);
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const projectId = valueAfter("--project") ?? "aws-day-gt";
const apply = args.includes("--apply");
if (!/^[a-z][a-z0-9-]{4,40}$/.test(projectId)) throw new Error("Invalid emulator project ID.");
if (apply && valueAfter("--confirm") !== EVENT_ID) throw new Error(`Apply requires --confirm ${EVENT_ID}`);

const database = getFirestore(initializeApp({ projectId }, "ranking-backfill"));
let cursor: QueryDocumentSnapshot | undefined;
let scanned = 0;
let eligible = 0;
let changes = 0;

while (true) {
  let query = database.collection("scores").where("eventId", "==", EVENT_ID)
    .orderBy(FieldPath.documentId()).limit(250);
  if (cursor) query = query.startAfter(cursor);
  const snapshot = await query.get();
  if (snapshot.empty) break;
  cursor = snapshot.docs.at(-1);
  scanned += snapshot.size;
  const profiles = await database.getAll(...snapshot.docs.map((score) => {
    const uid = score.data().userId;
    return database.doc(`users/${typeof uid === "string" && uid.length && !uid.includes("/") ? uid : "_invalid_"}`);
  }));
  const batch = database.batch();
  let pageChanges = 0;
  snapshot.docs.forEach((score, index) => {
    const data = score.data();
    const uid = data.userId;
    const registered = typeof uid === "string" && score.id === `${EVENT_ID}_${uid}`
      && hasCompletedRegistration(profiles[index]?.data());
    if (registered) eligible += 1;
    const patch: Record<string, unknown> = {};
    if (data.registeredForRanking !== registered) patch.registeredForRanking = registered;
    if (registered) {
      if (typeof data.auraTotal !== "number" || !Number.isFinite(data.auraTotal)) patch.auraTotal = 0;
      if (typeof data.completedChallenges !== "number" || !Number.isFinite(data.completedChallenges)) patch.completedChallenges = 0;
      if (data.auraReachedAt === undefined) patch.auraReachedAt = null;
    }
    if (!Object.keys(patch).length) return;
    changes += 1;
    pageChanges += 1;
    if (apply) batch.update(score.ref, patch);
  });
  if (apply && pageChanges) await batch.commit();
  if (snapshot.size < 250) break;
}

console.log(`${apply ? "APPLIED" : "DRY RUN"}: project ${projectId}, scores scanned ${scanned}, verified registrations ${eligible}, score updates ${changes}, deletes 0.`);
