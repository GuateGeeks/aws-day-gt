import { getApps, initializeApp } from "firebase-admin/app";

export const adminApp = getApps()[0] ?? initializeApp();
