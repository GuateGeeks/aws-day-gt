import { getApp, getApps, initializeApp } from "firebase/app";
import { resolveFirebaseRuntime } from "./environment";

const runtime = resolveFirebaseRuntime(import.meta.env.PROD, import.meta.env as Record<string, string | boolean | undefined>);

export const firebaseConfig = runtime.firebaseConfig;

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const useFirebaseEmulators = runtime.useEmulators;
