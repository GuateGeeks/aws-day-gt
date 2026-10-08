import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { AWS_SERVICE_CHALLENGE_IDS } from "../shared/challenges/bonus";
import { challenges } from "../shared/challenges/catalog";
import { experienceStations } from "../shared/challenges/stations";
import { challengeSecrets } from "./data/challenge-secrets";

if (!["127.0.0.1:8080", "localhost:8080"].includes(process.env.FIRESTORE_EMULATOR_HOST ?? "")) {
  throw new Error("Esta sincronización solo puede ejecutarse contra Firestore local.");
}
const projectId = "demo-aws-day-gt";
const db = getFirestore(getApps()[0] ?? initializeApp({ projectId }));
const bonus = challenges.filter((challenge) => AWS_SERVICE_CHALLENGE_IDS.some((id) => id === challenge.id));
const references = [
  ...bonus.map((challenge) => db.doc(`challenges/${challenge.id}`)),
  ...bonus.map((challenge) => db.doc(`challengeSecrets/${challenge.id}`))
];
const existing = await db.getAll(...references);
const present = new Set(existing.filter((snapshot) => snapshot.exists).map((snapshot) => snapshot.ref.path));
const batch = db.batch();
for (const challenge of bonus) {
  if (!present.has(`challenges/${challenge.id}`)) batch.create(db.doc(`challenges/${challenge.id}`), challenge);
  const secret = challengeSecrets.find((entry) => entry.challengeId === challenge.id);
  if (!secret) throw new Error(`Falta la respuesta privada de ${challenge.id}`);
  if (!present.has(`challengeSecrets/${challenge.id}`)) batch.create(db.doc(`challengeSecrets/${challenge.id}`), secret);
}
for (const challenge of challenges) {
  batch.set(db.doc(`challenges/${challenge.id}`), {
    title: challenge.title, description: challenge.description, category: challenge.category,
    auraReward: challenge.auraReward, validationType: challenge.validationType,
    active: challenge.active, required: challenge.required, configuration: challenge.configuration
  }, { merge: true });
}
const station = experienceStations.find((entry) => entry.id === "cloudforge");
if (station) batch.set(db.doc("experienceStations/cloudforge"), { name: station.name, active: station.active }, { merge: true });
batch.set(db.doc("experienceStations/vr-explorer"), { active: false }, { merge: true });
await batch.commit();
process.stdout.write(`Catálogo local actualizado: ${bonus.length} preguntas AWS, publicación del stand con 350 créditos y retos VR/Cross Level retirados.\n`);
