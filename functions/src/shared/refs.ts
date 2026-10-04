import { getFirestore } from "firebase-admin/firestore";
import { EVENT_ID } from "../../../shared/constants";
import { adminApp } from "./admin";

export const database = getFirestore(adminApp);
export const refs = {
  event: () => database.doc(`events/${EVENT_ID}`),
  config: () => database.doc(`config/${EVENT_ID}`),
  user: (uid: string) => database.doc(`users/${uid}`),
  mission: (missionId: string) => database.doc(`missions/${missionId}`),
  userMission: (uid: string, missionId: string) => database.doc(`userMissions/${EVENT_ID}_${uid}_${missionId}`),
  submission: (uid: string, missionId: string) => database.doc(`submissions/${EVENT_ID}_${uid}_${missionId}`),
  score: (uid: string) => database.doc(`scores/${EVENT_ID}_${uid}`),
  operation: (uid: string, operationId: string) => database.doc(`idempotency/${uid}_${operationId}`)
};
