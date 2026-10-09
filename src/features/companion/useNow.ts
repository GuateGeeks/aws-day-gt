import { useEffect, useState } from "react";
import { EVENT_UTC_OFFSET } from "../../../shared/agenda";

const OFFSET_KEY = "quetzi.simulated-offset";
const REAL_KEY = "quetzi.use-real-clock";
const MANUAL_KEY = "quetzi.use-manual-clock";
const LOCAL_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const TICK_MS = 20_000;

export function rehearsalEnabledForHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]"
    || hostname === "aws-day-gt.web.app" || hostname === "aws-day-gt.firebaseapp.com";
}

/** Keeps event-day preview parameters across the login link flow. */
export function clockPreviewSearch(search: string): string {
  const param = new URLSearchParams(search).get("ahora");
  return param === "real" || param === "ensayo" || (param !== null && LOCAL_TIME.test(param))
    ? `?ahora=${encodeURIComponent(param)}` : "";
}

/**
 * `?ahora=2026-10-10T10:00` (Guatemala time) lets organizers preview the day.
 * `?ahora=real` shows the real date; `?ahora=ensayo` restores the October 8 rehearsal.
 * The offset survives navigation within the tab.
 */
export function readClockOffset(search: string, storage: Pick<Storage, "getItem" | "setItem" | "removeItem">, realNow = Date.now()): number {
  const param = new URLSearchParams(search).get("ahora");
  try {
    if (param === "real") { storage.removeItem(OFFSET_KEY); storage.removeItem(MANUAL_KEY); storage.setItem(REAL_KEY, "true"); return 0; }
    if (param === "ensayo") { storage.removeItem(OFFSET_KEY); storage.removeItem(MANUAL_KEY); storage.removeItem(REAL_KEY); return 0; }
    if (param && LOCAL_TIME.test(param)) {
      const target = new Date(`${param}:00${EVENT_UTC_OFFSET}`).getTime();
      const offset = target - realNow;
      storage.setItem(OFFSET_KEY, String(offset));
      storage.setItem(MANUAL_KEY, "true");
      storage.removeItem(REAL_KEY);
      return offset;
    }
    const stored = Number(storage.getItem(OFFSET_KEY));
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    return 0;
  }
}

/** The October 8 rehearsal mirrors Guatemala time onto the official October 10 schedule. */
export function isLocalRehearsal(realNow: Date, enabled: boolean, offset = 0): boolean {
  const guatemalaDay = new Date(realNow.getTime() - 6 * 60 * 60_000).toISOString().slice(0, 10);
  return enabled && offset === 0 && guatemalaDay === "2026-10-08";
}

export function effectiveEventNow(realNow: Date, enabled: boolean, offset = 0): Date {
  return new Date(realNow.getTime() + offset + (isLocalRehearsal(realNow, enabled, offset) ? 2 * 24 * 60 * 60_000 : 0));
}

export function isLocalRehearsalActive(): boolean {
  if (!rehearsalEnabledForHost(window.location.hostname)) return false;
  try {
    if (window.sessionStorage.getItem(REAL_KEY) === "true" || window.sessionStorage.getItem(MANUAL_KEY) === "true") return false;
    const savedOffset = Number(window.sessionStorage.getItem(OFFSET_KEY));
    return isLocalRehearsal(new Date(), true, Number.isFinite(savedOffset) ? savedOffset : 0);
  } catch { return isLocalRehearsal(new Date(), true); }
}

export function useNow(): Date {
  const [offset] = useState(() => readClockOffset(window.location.search, window.sessionStorage));
  const [rehearsalEnabled] = useState(() => {
    if (!rehearsalEnabledForHost(window.location.hostname)) return false;
    try { return window.sessionStorage.getItem(REAL_KEY) !== "true" && window.sessionStorage.getItem(MANUAL_KEY) !== "true"; }
    catch { return true; }
  });
  const [now, setNow] = useState(() => effectiveEventNow(new Date(), rehearsalEnabled, offset));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(effectiveEventNow(new Date(), rehearsalEnabled, offset)), TICK_MS);
    return () => window.clearInterval(timer);
  }, [offset, rehearsalEnabled]);
  return now;
}
