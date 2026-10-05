import { useCallback, useSyncExternalStore } from "react";
import { AGENDA } from "../../../shared/agenda";

const ROUTE_KEY = "quetzi.route.v1";
const EMPTY: readonly string[] = [];
const KNOWN_IDS = new Set(AGENDA.map((session) => session.id));
const listeners = new Set<() => void>();
let cache: readonly string[] | null = null;

function read(): readonly string[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ROUTE_KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string" && KNOWN_IDS.has(id)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: readonly string[]) {
  cache = next;
  try { localStorage.setItem(ROUTE_KEY, JSON.stringify(next)); } catch { /* storage full or blocked: keep in memory */ }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Personal agenda picks, stored only on this device. */
export function useMyRoute() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const current = read();
    write(current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
  }, []);
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}

export function resetMyRouteCache() { cache = null; }
