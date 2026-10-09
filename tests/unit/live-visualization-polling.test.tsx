import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ call: vi.fn(), callable: vi.fn() }));
vi.mock("firebase/functions", () => ({ httpsCallable: mocks.callable }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));

const { usePublicVisualization } = await import("../../src/features/live/usePublicVisualization");

function snapshot(edges: Array<{ id: string; source: string; target: string }> = []) {
  return {
    generatedAt: "2026-10-10T15:00:00.000Z",
    eventId: "event-2026",
    nodes: [
      { id: "p_0123456789abcdef", alias: "Ada", category: "Development", degree: edges.length },
      { id: "p_fedcba9876543210", alias: "Nube", category: "Cloud", degree: edges.length }
    ],
    edges,
    photos: [], tracks: [], insights: [],
    metrics: { participants: 2, connections: edges.length, approvedPhotos: 0, leadingTrack: null }
  };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("public visualization polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.callable.mockReset().mockReturnValue(mocks.call);
    mocks.call.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("loads immediately and keeps the last snapshot when a refresh fails", async () => {
    mocks.call.mockResolvedValueOnce({ data: snapshot() }).mockRejectedValueOnce(new Error("offline"));
    const { result, unmount } = renderHook(() => usePublicVisualization());

    expect(result.current.loading).toBe(true);
    await act(flush);
    expect(result.current.snapshot?.metrics.participants).toBe(2);
    expect(result.current.stale).toBe(false);

    await act(async () => { vi.advanceTimersByTime(20_000); await flush(); });
    expect(result.current.snapshot?.metrics.participants).toBe(2);
    expect(result.current.stale).toBe(true);
    expect(result.current.error).toMatch(/actualizar/i);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports only edges introduced after the initial snapshot", async () => {
    const edge = { id: "e_0123456789abcdef", source: "p_0123456789abcdef", target: "p_fedcba9876543210" };
    mocks.call.mockResolvedValueOnce({ data: snapshot() }).mockResolvedValueOnce({ data: snapshot([edge]) });
    const { result } = renderHook(() => usePublicVisualization());
    await act(flush);
    expect(result.current.newEdgeIds.size).toBe(0);

    await act(async () => { result.current.retry(); await flush(); });
    expect(result.current.newEdgeIds).toEqual(new Set([edge.id]));
    expect(mocks.callable).toHaveBeenCalledWith({}, "getPublicEventVisualization");
  });
});
