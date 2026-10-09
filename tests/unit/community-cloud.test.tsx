import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunityCloud, type CommunityCloudSceneFactory } from "../../src/features/live/CommunityCloud";

const nodes = [
  { id: "p_0123456789abcdef", alias: "Ada", category: "Development" as const, degree: 1 },
  { id: "p_fedcba9876543210", alias: "Nube", category: "Cloud" as const, degree: 1 }
];
const edges = [{ id: "e_0123456789abcdef", source: nodes[0]!.id, target: nodes[1]!.id }];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CommunityCloud", () => {
  it("starts one scene and disposes it on unmount", () => {
    const dispose = vi.fn();
    const factory = vi.fn(() => ({ dispose })) as CommunityCloudSceneFactory;
    const { unmount, rerender } = render(<CommunityCloud nodes={nodes} edges={edges} sceneFactory={factory} />);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/2 personas y 1 conexión QR/i)).toBeInTheDocument();
    rerender(<CommunityCloud nodes={nodes} edges={edges} sceneFactory={factory} />);
    expect(factory).toHaveBeenCalledTimes(1);
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("passes reduced-motion preference to the renderer", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const factory = vi.fn<CommunityCloudSceneFactory>(() => ({ dispose: vi.fn() }));
    render(<CommunityCloud nodes={nodes} edges={edges} sceneFactory={factory} />);
    expect(factory.mock.calls[0]?.[3]).toMatchObject({ reducedMotion: true });
  });

  it("renders an accessible 2D constellation when WebGL creation fails", () => {
    const factory = vi.fn(() => { throw new Error("WebGL unavailable"); }) as CommunityCloudSceneFactory;
    render(<CommunityCloud nodes={nodes} edges={edges} sceneFactory={factory} />);
    expect(screen.getByRole("img", { name: /representación alternativa/i })).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });
});
