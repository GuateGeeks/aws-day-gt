import { connectStorageEmulator, getStorage } from "firebase/storage";
import { firebaseApp, useFirebaseEmulators } from "./app";

export const storage = getStorage(firebaseApp);
if (useFirebaseEmulators) connectStorageEmulator(storage, "127.0.0.1", 9199);
