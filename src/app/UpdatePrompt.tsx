import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useState } from "react";
import { scheduleUpdateChecks } from "./sw-updates";
import { UpdateBanner } from "./UpdateBanner";

/** Shows a banner when a new service worker is waiting; updating activates it and reloads. */
export function UpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW: (_url, registered) => setRegistration(registered),
    onRegisterError: (error) => console.error("Service worker registration failed", error)
  });
  useEffect(() => registration ? scheduleUpdateChecks(registration, {
    setInterval: (handler, ms) => window.setInterval(handler, ms),
    clearInterval: (id) => window.clearInterval(id),
    document,
    isOnline: () => navigator.onLine
  }) : undefined, [registration]);
  if (!needRefresh) return null;
  return <UpdateBanner onUpdate={() => updateServiceWorker(true)} onDismiss={() => setNeedRefresh(false)} />;
}
