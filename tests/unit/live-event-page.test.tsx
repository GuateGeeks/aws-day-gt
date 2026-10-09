import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicVisualizationSnapshot } from "../../shared/public-visualization";

const mocks = vi.hoisted(() => ({ state: {} as Record<string, unknown> }));
vi.mock("../../src/features/live/usePublicVisualization", () => ({ usePublicVisualization: () => mocks.state }));
vi.mock("../../src/features/live/CommunityCloud", () => ({
  CommunityCloud: () => <div data-testid="community-cloud">3D cloud</div>
}));
const { LiveEventPage } = await import("../../src/features/live/LiveEventPage");

const readySnapshot: PublicVisualizationSnapshot = {
  generatedAt: "2026-10-10T15:00:00.000Z",
  eventId: "event-2026",
  nodes: [
    { id: "p_0123456789abcdef", alias: "Ada", category: "Development", degree: 1 },
    { id: "p_fedcba9876543210", alias: "Nube", category: "Cloud", degree: 1 }
  ],
  edges: [{ id: "e_0123456789abcdef", source: "p_0123456789abcdef", target: "p_fedcba9876543210" }],
  photos: [
    { id: "ph_0000000000000001", alias: "Ada", url: "https://images.example/one.webp" },
    { id: "ph_0000000000000002", alias: "Nube", url: "https://images.example/two.webp" },
    { id: "ph_0000000000000003", alias: "Quetzi", url: "https://images.example/three.webp" }
  ],
  tracks: [{ id: "ai", label: "AI & Agents", count: 8, percentage: 62 }],
  insights: ["La comunidad ya creó una conexión por QR."],
  metrics: { participants: 2, connections: 1, approvedPhotos: 3, leadingTrack: { id: "ai", label: "AI & Agents" } }
};

function state(overrides: Record<string, unknown> = {}) {
  return { snapshot: readySnapshot, loading: false, stale: false, error: null, newEdgeIds: new Set(), retry: vi.fn(), ...overrides };
}

describe("live event page", () => {
  beforeEach(() => { mocks.state = state(); });
  afterEach(cleanup);

  it("renders the community cloud, gallery, tracks, insight, and live metrics", () => {
    render(<LiveEventPage />);
    expect(screen.getByRole("heading", { level: 1, name: /comunidad en vivo/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /red de conexiones/i })).toBeInTheDocument();
    const gallery = screen.getByRole("region", { name: /galería/i });
    expect(gallery).toBeInTheDocument();
    expect(within(gallery).getAllByRole("img")).toHaveLength(3);
    expect(screen.getAllByText("AI & Agents")).toHaveLength(2);
    expect(screen.getByText("8 · 62%")).toBeInTheDocument();
    expect(screen.getByText("Personas conectadas")).toBeInTheDocument();
    expect(screen.getByText("Fotos aprobadas")).toBeInTheDocument();
  });

  it("retains content and announces reconnecting while data is stale", () => {
    mocks.state = state({ stale: true, error: "No pudimos actualizar los datos. Reconectando…" });
    render(<LiveEventPage />);
    expect(screen.getByTestId("community-cloud")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/reconectando/i);
  });

  it("shows intentional loading and initial error states", () => {
    mocks.state = state({ snapshot: null, loading: true });
    const { rerender } = render(<LiveEventPage />);
    expect(screen.getByRole("status")).toHaveTextContent(/cargando la experiencia/i);

    mocks.state = state({ snapshot: null, loading: false, error: "No pudimos cargar la experiencia en vivo." });
    rerender(<LiveEventPage />);
    expect(screen.getByText(/no pudimos cargar/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /intentar de nuevo/i })).toBeInTheDocument();
  });
});
