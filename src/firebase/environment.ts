import type { FirebaseOptions } from "firebase/app";

type FirebaseEnvironment = Record<string, string | boolean | undefined>;

const productionFirebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBhXobhH2KnlqDIvMZD3T2xl2V777gCxZQ",
  authDomain: "aws-day-gt.firebaseapp.com",
  projectId: "aws-day-gt",
  storageBucket: "aws-day-gt.firebasestorage.app",
  messagingSenderId: "704203243247",
  appId: "1:704203243247:web:0479108dbe29978bc1651a",
  measurementId: "G-D9KZGHCRCB"
};

export function resolveFirebaseRuntime(isProduction: boolean, environment: FirebaseEnvironment) {
  const configEnvironment = isProduction ? {} : environment;
  const getValue = (name: string, fallback: string) => {
    const value = configEnvironment[name];
    return typeof value === "string" && value ? value : fallback;
  };

  return {
    firebaseConfig: {
      apiKey: getValue("VITE_FIREBASE_API_KEY", productionFirebaseConfig.apiKey!),
      authDomain: getValue("VITE_FIREBASE_AUTH_DOMAIN", productionFirebaseConfig.authDomain!),
      projectId: getValue("VITE_FIREBASE_PROJECT_ID", productionFirebaseConfig.projectId!),
      storageBucket: getValue("VITE_FIREBASE_STORAGE_BUCKET", productionFirebaseConfig.storageBucket!),
      messagingSenderId: getValue("VITE_FIREBASE_MESSAGING_SENDER_ID", productionFirebaseConfig.messagingSenderId!),
      appId: getValue("VITE_FIREBASE_APP_ID", productionFirebaseConfig.appId!),
      measurementId: getValue("VITE_FIREBASE_MEASUREMENT_ID", productionFirebaseConfig.measurementId!)
    } satisfies FirebaseOptions,
    useEmulators: !isProduction && environment.VITE_USE_FIREBASE_EMULATORS === "true"
  };
}
