import { connectFirestoreEmulator, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { firebaseApp, useFirebaseEmulators } from "./app";

let database;
try {
  database = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch {
  database = getFirestore(firebaseApp);
}

export const db = database;
if (useFirebaseEmulators) connectFirestoreEmulator(db, "127.0.0.1", 8080);
