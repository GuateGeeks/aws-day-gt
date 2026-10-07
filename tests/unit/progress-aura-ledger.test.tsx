import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { challenges } from "../../shared/challenges/catalog";

const mock = vi.hoisted(() => ({ items: [] as unknown[], auraTotal: -150, auraDeductedTotal: 150 }));
vi.mock("../../src/features/challenges/useChallenges", () => ({ useChallenges: () => ({ ...mock, loading: false, error: "" }) }));
const { ProgressPage } = await import("../../src/features/progress/ProgressPage");
afterEach(cleanup);

describe("Aura ledger", () => {
  it("shows net, earned, lost, and still available Aura", () => {
    mock.items = [
      { challenge: challenges.find((item) => item.id === "C06")!, progress: { status: "failed", auraDeducted: 150 } },
      { challenge: challenges.find((item) => item.id === "C07")!, progress: { status: "available" } }
    ];
    render(<MemoryRouter><ProgressPage /></MemoryRouter>);
    expect(screen.getByText("Tu saldo de Aura")).toBeInTheDocument();
    expect(screen.getByText("-150")).toBeInTheDocument();
    expect(screen.getByText("Ganada")).toBeInTheDocument();
    expect(screen.getByText("Descontada")).toBeInTheDocument();
    expect(screen.getByText("Por conseguir")).toBeInTheDocument();
    expect(screen.getAllByText("−150")).toHaveLength(2);
    expect(screen.getAllByText("+100")).toHaveLength(2);
    expect(screen.getByText("Respuesta incorrecta · cerrado")).toBeInTheDocument();
  });
});
