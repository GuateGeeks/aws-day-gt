export const UPDATE_CHECK_INTERVAL_MS = 15 * 60_000;

type Updatable = Pick<ServiceWorkerRegistration, "update" | "installing">;
type Env = {
  setInterval: (handler: () => void, ms: number) => number;
  clearInterval: (id: number) => void;
  document: Pick<Document, "addEventListener" | "removeEventListener" | "visibilityState">;
  isOnline: () => boolean;
};

/**
 * Polls for a new service worker periodically and whenever the app returns to the foreground,
 * so attendees with the app open all day still get fixes. Returns a cleanup function.
 */
export function scheduleUpdateChecks(registration: Updatable, env: Env, intervalMs = UPDATE_CHECK_INTERVAL_MS): () => void {
  const check = () => {
    if (registration.installing || !env.isOnline()) return;
    registration.update().catch(() => { /* offline or server hiccup: next tick retries */ });
  };
  const onVisible = () => { if (env.document.visibilityState === "visible") check(); };
  const timer = env.setInterval(check, intervalMs);
  env.document.addEventListener("visibilitychange", onVisible);
  return () => {
    env.clearInterval(timer);
    env.document.removeEventListener("visibilitychange", onVisible);
  };
}
