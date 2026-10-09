import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { challenges } from "../../shared/challenges/catalog";

const mock = vi.hoisted(() => ({ items: [] as unknown[], auraTotal: -20, auraDeductedTotal: 20 }));
vi.mock("../../src/features/challenges/useChallenges", () => ({ useChallenges: () => ({ ...mock, loading: false, error: "" }) }));
const { ProgressPage } = await import("../../src/features/progress/ProgressPage");
afterEach(cleanup);

describe("Credit ledger", () => {
  it("shows net, earned, lost, and still available credits", () => {
    mock.items = [
      { challenge: challenges.find((item) => item.id === "C06")!, progress: { status: "failed", auraDeducted: 20 } },
      { challenge: challenges.find((item) => item.id === "C07")!, progress: { status: "available" } }
    ];
    render(<MemoryRouter><ProgressPage /></MemoryRouter>);
    expect(screen.getAllByRole("img", { name: "AWS Community Day Guatemala" })).toHaveLength(1);
    expect(screen.getByRole("img", { name: "AWS Community Day Guatemala" })).toHaveClass("event-mark--section");
    expect(screen.getByText("Tu saldo de créditos")).toBeInTheDocument();
    expect(screen.getAllByText("−20 créditos")).toHaveLength(3);
    expect(screen.getByText("Ganados")).toBeInTheDocument();
    expect(screen.getAllByText("Descontados").length).toBeGreaterThan(0);
    expect(screen.getByText("Por conseguir")).toBeInTheDocument();
    expect(screen.getAllByText("+100 créditos")).toHaveLength(2);
    expect(screen.getByText("Respuesta incorrecta · cerrado")).toBeInTheDocument();
  });
});
