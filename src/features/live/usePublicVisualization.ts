import { httpsCallable } from "firebase/functions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { publicVisualizationSchema, type PublicVisualizationSnapshot } from "../../../shared/public-visualization";
import { functions } from "../../firebase/functions";

export interface PublicVisualizationState {
  snapshot: PublicVisualizationSnapshot | null;
  loading: boolean;
  stale: boolean;
  error: string | null;
  newEdgeIds: ReadonlySet<string>;
  retry(): void;
}

const REFRESH_INTERVAL_MS = 20_000;

export function usePublicVisualization(): PublicVisualizationState {
  const request = useMemo(() => httpsCallable<unknown, unknown>(functions, "getPublicEventVisualization"), []);
  const [snapshot, setSnapshot] = useState<PublicVisualizationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEdgeIds, setNewEdgeIds] = useState<ReadonlySet<string>>(new Set());
  const snapshotRef = useRef<PublicVisualizationSnapshot | null>(null);
  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!snapshotRef.current && mountedRef.current) setLoading(true);
    try {
      const response = await request({});
      const parsed = publicVisualizationSchema.parse(response.data);
      if (!mountedRef.current) return;
      const previousEdges = new Set(snapshotRef.current?.edges.map((edge) => edge.id) ?? []);
      setNewEdgeIds(hasLoadedRef.current
        ? new Set(parsed.edges.filter((edge) => !previousEdges.has(edge.id)).map((edge) => edge.id))
        : new Set());
      hasLoadedRef.current = true;
      snapshotRef.current = parsed;
      setSnapshot(parsed);
      setStale(false);
      setError(null);
    } catch {
      if (!mountedRef.current) return;
      setStale(snapshotRef.current !== null);
      setError(snapshotRef.current
        ? "No pudimos actualizar los datos. Reconectando…"
        : "No pudimos cargar la experiencia en vivo.");
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    const interval = globalThis.setInterval(() => { void load(); }, REFRESH_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      globalThis.clearInterval(interval);
    };
  }, [load]);

  const retry = useCallback(() => { void load(); }, [load]);
  return { snapshot, loading, stale, error, newEdgeIds, retry };
}
