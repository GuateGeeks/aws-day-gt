import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { firebaseApp } from "./app";

let analyticsPromise: Promise<Analytics | null> | undefined;

export function getBrowserAnalytics(): Promise<Analytics | null> {
  analyticsPromise ??= typeof window === "undefined"
    ? Promise.resolve(null)
    : isSupported().then((supported) => supported ? getAnalytics(firebaseApp) : null);
  return analyticsPromise;
}
