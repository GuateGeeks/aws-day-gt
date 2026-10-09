import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/features/live/usePublicVisualization", () => ({
  usePublicVisualization: () => ({
    snapshot: {
      generatedAt: "2026-10-10T15:00:00.000Z", eventId: "event-2026",
      nodes: [{ id: "p_0123456789abcdef", alias: "Ada", category: "Development", degree: 0 }],
      edges: [],
      photos: [{ id: "ph_0123456789abcdef", alias: "Ada", url: "https://images.example/ada.webp" }],
      tracks: [{ id: "ai", label: "AI & Agents", count: 4, percentage: 80 }],
      insights: ["AI & Agents lidera las preferencias de tracks."],
      metrics: { participants: 1, connections: 0, approvedPhotos: 1, leadingTrack: { id: "ai", label: "AI & Agents" } }
    },
    loading: false, stale: true, error: "No pudimos actualizar los datos. Reconectando…", newEdgeIds: new Set(), retry: vi.fn()
  })
}));
vi.mock("../../src/features/live/CommunityCloud", () => ({ CommunityCloud: () => <p>Resumen accesible de la nube</p> }));
const { LiveEventPage } = await import("../../src/features/live/LiveEventPage");

afterEach(cleanup);

describe("live event screen accessibility", () => {
  it("uses a clear heading hierarchy, labelled data regions, and polite live status", () => {
    render(<LiveEventPage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("region", { name: /red de conexiones/i })).toBeInTheDocument();
    const gallery = screen.getByRole("region", { name: /galería en vivo/i });
    expect(within(gallery).getByRole("img", { name: /foto compartida por Ada/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /tracks elegidos/i })).toHaveTextContent("4 · 80%");
    expect(screen.getByRole("region", { name: /pulso del evento/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
