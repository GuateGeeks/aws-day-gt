import { connectAuthEmulator, getAuth } from "firebase/auth";
import { firebaseApp, useFirebaseEmulators } from "./app";

export const auth = getAuth(firebaseApp);
if (useFirebaseEmulators && !auth.emulatorConfig) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
