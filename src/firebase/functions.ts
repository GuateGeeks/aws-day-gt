import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { firebaseApp, useFirebaseEmulators } from "./app";

export const functions = getFunctions(firebaseApp, "us-central1");
if (useFirebaseEmulators) connectFunctionsEmulator(functions, "127.0.0.1", 5001);
