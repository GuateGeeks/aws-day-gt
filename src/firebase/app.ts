import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";

const env = import.meta.env;

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBhXobhH2KnlqDIvMZD3T2xl2V777gCxZQ",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "aws-day-gt.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "aws-day-gt",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "aws-day-gt.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "704203243247",
  appId: env.VITE_FIREBASE_APP_ID || "1:704203243247:web:0479108dbe29978bc1651a",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-D9KZGHCRCB"
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const useFirebaseEmulators = env.VITE_USE_FIREBASE_EMULATORS === "true";
