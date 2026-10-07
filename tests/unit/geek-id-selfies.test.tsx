import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { challenges } from "../../shared/challenges/catalog";

const mock = vi.hoisted(() => ({ items: [] as unknown[], loading: false }));
vi.mock("../../src/features/challenges/useChallenges", () => ({ useChallenges: () => ({ items: mock.items, loading: mock.loading, error: "" }) }));
vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn(() => vi.fn().mockRejectedValue(new Error("offline"))) }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));
const { GeekIdPage } = await import("../../src/features/challenges/GeekIdPage");
afterEach(cleanup);

describe("Geek ID selfie shortcuts", () => {
  it("does not offer upload for a paused or missing selfie challenge", () => {
    const speaker = challenges.find((item) => item.id === "C16")!;
    mock.items = [{ challenge: { ...speaker, active: false }, progress: { status: "available" } }];
    render(<MemoryRouter><GeekIdPage /></MemoryRouter>);
    expect(screen.queryByRole("link", { name: /Selfie con un speaker/u })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Selfie en un stand/u })).not.toBeInTheDocument();
    expect(screen.getAllByText("No disponible temporalmente")).toHaveLength(2);
  });
});
