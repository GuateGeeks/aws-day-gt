import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EVENT_ID } from "../../shared/constants";

const mock = vi.hoisted(() => {
  const listeners = new Map<string, (snapshot: unknown) => void>();
  const listenerErrors = new Map<string, () => void>();
  const stopped: string[] = [];
  return { user: { uid: "owner-1" } as { uid: string } | null, listeners, listenerErrors, stopped, ensures: [] as Array<() => void>, failures: [] as Array<() => void> };
});

vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  collection: (_db: unknown, path: string) => ({ path }),
  documentId: () => "__name__",
  where: () => ({}),
  query: (ref: unknown) => ref,
  onSnapshot: (ref: { path: string }, callback: (snapshot: unknown) => void, onError?: () => void) => {
    mock.listeners.set(ref.path, callback);
    if (onError) mock.listenerErrors.set(ref.path, onError);
    return () => { mock.stopped.push(ref.path); mock.listeners.delete(ref.path); mock.listenerErrors.delete(ref.path); };
  }
}));
vi.mock("firebase/functions", () => ({ httpsCallable: () => () => new Promise((resolve, reject) => {
  mock.ensures.push(() => resolve({ data: {} }));
  mock.failures.push(() => reject(new Error("assignment failed")));
}) }));
vi.mock("../../src/firebase/data", () => ({ db: {} }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ user: mock.user }) }));

const { useChallenges } = await import("../../src/features/challenges/useChallenges");

afterEach(() => { mock.user = { uid: "owner-1" }; mock.listeners.clear(); mock.listenerErrors.clear(); mock.stopped.length = 0; mock.ensures.length = 0; mock.failures.length = 0; });

describe("useChallenges subscriptions", () => {
  it("waits for migration before reading the owner's assignment and score", async () => {
    const { result, unmount } = renderHook(() => useChallenges());
    const scorePath = `scores/${EVENT_ID}_owner-1`;
    const assignmentPath = "challengeAssignments/owner-1";
    expect(mock.listeners.has(scorePath)).toBe(false);
    expect(mock.listeners.has(assignmentPath)).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.auraTotal).toBeNull();
    await act(async () => mock.ensures.shift()!());
    expect(mock.listeners.has(scorePath)).toBe(true);
    expect(mock.listeners.has(assignmentPath)).toBe(true);
    act(() => mock.listeners.get(scorePath)!({ exists: () => true, data: () => ({ auraTotal: 200 }) }));
    expect(result.current.auraTotal).toBe(200);
    unmount();
    expect(mock.stopped).toContain(scorePath);
    expect(mock.stopped).toContain(assignmentPath);
  });

  it("clears the previous owner's Aura when the user changes", async () => {
    const { result, rerender, unmount } = renderHook(() => useChallenges());
    await act(async () => mock.ensures.shift()!());
    act(() => mock.listeners.get(`scores/${EVENT_ID}_owner-1`)!({ exists: () => true, data: () => ({ auraTotal: 200 }) }));
    mock.user = { uid: "owner-2" };
    rerender();
    expect(mock.stopped).toContain(`scores/${EVENT_ID}_owner-1`);
    expect(mock.stopped).toContain("challengeAssignments/owner-1");
    expect(result.current.auraTotal).toBeNull();
    await act(async () => mock.ensures.shift()!());
    expect(mock.listeners.has(`scores/${EVENT_ID}_owner-2`)).toBe(true);
    expect(mock.listeners.has("challengeAssignments/owner-2")).toBe(true);
    unmount();
  });

  it("does not start listeners after its owner unmounts", async () => {
    const { unmount } = renderHook(() => useChallenges());
    unmount();
    await act(async () => mock.ensures.shift()!());
    expect(mock.listeners.has(`scores/${EVENT_ID}_owner-1`)).toBe(false);
    expect(mock.listeners.has("challengeAssignments/owner-1")).toBe(false);
  });

  it("ignores an old owner's assignment response after switching users", async () => {
    const { rerender, unmount } = renderHook(() => useChallenges());
    const finishOldAssignment = mock.ensures.shift()!;
    mock.user = { uid: "owner-2" };
    rerender();
    await act(async () => finishOldAssignment());
    expect(mock.listeners.has(`scores/${EVENT_ID}_owner-1`)).toBe(false);
    expect(mock.listeners.has("challengeAssignments/owner-1")).toBe(false);
    await act(async () => mock.ensures.shift()!());
    expect(mock.listeners.has(`scores/${EVENT_ID}_owner-2`)).toBe(true);
    expect(mock.listeners.has("challengeAssignments/owner-2")).toBe(true);
    unmount();
  });

  it("reports a migration failure without reading the legacy assignment or missing score", async () => {
    const { result, unmount } = renderHook(() => useChallenges());
    expect(mock.listeners.has("challengeAssignments/owner-1")).toBe(false);
    expect(result.current.items).toEqual([]);
    await act(async () => mock.failures.shift()!());
    expect(result.current.error).toBe("No pudimos preparar tus Challenges. Recarga la página.");
    expect(result.current.loading).toBe(false);
    expect(result.current.auraTotal).toBeNull();
    expect(mock.listeners.has(`scores/${EVENT_ID}_owner-1`)).toBe(false);
    expect(mock.listeners.has("challengeAssignments/owner-1")).toBe(false);
    expect(result.current.items).toEqual([]);
    unmount();
  });

  it("reports a score listener failure before its first snapshot", async () => {
    const { result, unmount } = renderHook(() => useChallenges());
    await act(async () => mock.ensures.shift()!());
    const scorePath = `scores/${EVENT_ID}_owner-1`;
    act(() => mock.listenerErrors.get(scorePath)!());
    expect(result.current.error).toBe("No pudimos cargar tus créditos.");
    expect(result.current.auraTotal).toBeNull();
    unmount();
  });

  it("waits through cached retired challenges until the nine-Challenge pack arrives", async () => {
    const { result, unmount } = renderHook(() => useChallenges());
    await act(async () => mock.ensures.shift()!());
    const assignmentPath = "challengeAssignments/owner-1";
    const oldIds = Array.from({ length: 10 }, (_, index) => `C${String(index + 1).padStart(2, "0")}`);
    const migratedIds = ["C01", "C02", "C04", "C06", "C07", "C08", "C09", "C12", "C15"];
    const assignmentSnapshot = (challengeIds: string[]) => ({ exists: () => true, data: () => ({ challengeIds, bonusChallengeIds: [] }) });
    const emitRelatedSnapshots = (challengeIds: string[]) => {
      mock.listeners.get("challenges")?.({ docs: challengeIds.map((id) => ({ id, data: () => ({ title: id }) })) });
      mock.listeners.get("challengeProgress")?.({ docs: challengeIds.map((id) => ({ data: () => ({ challengeId: id, eventId: EVENT_ID, status: "available" }) })) });
    };

    act(() => mock.listeners.get(assignmentPath)!(assignmentSnapshot(oldIds)));
    act(() => emitRelatedSnapshots(oldIds));
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(mock.listeners.has("challenges")).toBe(false);
    expect(mock.listeners.has("challengeProgress")).toBe(false);

    act(() => mock.listeners.get(assignmentPath)!(assignmentSnapshot(migratedIds)));
    act(() => emitRelatedSnapshots(migratedIds));
    const personalOrder = result.current.items.map((item) => item.challenge.id);
    expect([...personalOrder].sort()).toEqual([...migratedIds].sort());
    expect(result.current.items.find((item) => item.challenge.id === "C08")?.challenge.title).toBe("Rescata la señal");
    expect(result.current.loading).toBe(false);

    act(() => mock.listeners.get(assignmentPath)!(assignmentSnapshot(oldIds)));
    expect(mock.listeners.has("challenges")).toBe(true);
    expect(mock.listeners.has("challengeProgress")).toBe(true);
    expect(result.current.items.map((item) => item.challenge.id)).toEqual(personalOrder);
    unmount();
  });
});
