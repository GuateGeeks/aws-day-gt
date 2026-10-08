import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/features/companion/useNow", () => ({ isLocalRehearsalActive: () => true }));
const { LandingPage } = await import("../../src/features/auth/LandingPage");
afterEach(cleanup);

describe("local landing rehearsal", () => {
  it("labels the simulated event day without a countdown", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByText(/Sábado 10 de octubre · simulación local/)).toBeInTheDocument();
    expect(screen.getByText(/la agenda avanza contigo hoy/i)).toBeInTheDocument();
    expect(screen.queryByText(/Faltan \d/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "GuateGeeks" })).toHaveLength(2);
  });
});
