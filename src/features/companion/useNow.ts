import { useEffect, useState } from "react";
import { EVENT_UTC_OFFSET } from "../../../shared/agenda";

const OFFSET_KEY = "quetzi.simulated-offset";
const LOCAL_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const TICK_MS = 20_000;

/**
 * `?ahora=2026-10-10T10:00` (Guatemala time) lets organizers preview the day.
 * `?ahora=real` clears the simulation. The offset survives navigation within the tab.
 */
export function readClockOffset(search: string, storage: Pick<Storage, "getItem" | "setItem" | "removeItem">, realNow = Date.now()): number {
  const param = new URLSearchParams(search).get("ahora");
  try {
    if (param === "real") { storage.removeItem(OFFSET_KEY); return 0; }
    if (param && LOCAL_TIME.test(param)) {
      const target = new Date(`${param}:00${EVENT_UTC_OFFSET}`).getTime();
      const offset = target - realNow;
      storage.setItem(OFFSET_KEY, String(offset));
      return offset;
    }
    const stored = Number(storage.getItem(OFFSET_KEY));
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    return 0;
  }
}

export function useNow(): Date {
  const [offset] = useState(() => readClockOffset(window.location.search, window.sessionStorage));
  const [now, setNow] = useState(() => new Date(Date.now() + offset));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date(Date.now() + offset)), TICK_MS);
    return () => window.clearInterval(timer);
  }, [offset]);
  return now;
}
