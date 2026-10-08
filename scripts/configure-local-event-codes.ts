import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { challenges } from "../shared/challenges/catalog";
import { eventCodeUpdates } from "./data/event-code-updates";

if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080" && process.env.FIRESTORE_EMULATOR_HOST !== "localhost:8080") {
  throw new Error("This command only runs against the local Firestore emulator on port 8080.");
}
const projectId = "demo-aws-day-gt";
const app = getApps()[0] ?? initializeApp({ projectId });
const database = getFirestore(app);
const ids = ["C12", "C13"] as const;
const codeWrites = eventCodeUpdates({
  C13: process.env.EVENT_STAND_CODE ?? ""
});
const documents = await Promise.all([...ids.map((id) => database.doc(`challenges/${id}`).get()), database.doc("experienceStations/cloudforge").get(), database.doc("challenges/C03").get()]);
if (documents.some((snapshot) => !snapshot.exists)) throw new Error("Seed the local challenge catalog before configuring event codes.");
const batch = database.batch();
for (const id of ids) {
  const challenge = challenges.find((item) => item.id === id)!;
  batch.update(database.doc(`challenges/${id}`), {
    title: challenge.title, description: challenge.description, validationType: challenge.validationType,
    configuration: challenge.configuration
  });
}
for (const write of codeWrites) batch.set(database.doc(write.path), write.data, { merge: true });
batch.update(database.doc("experienceStations/cloudforge"), { active: true });
for (const id of ["C03", "C10", "C11", "C14"]) batch.update(database.doc(`challenges/${id}`), { active: false });
await batch.commit();
console.log("El código VR y los siete tracks están listos localmente. El progreso y los créditos de participantes no cambiaron.");
