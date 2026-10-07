import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { challenges } from "../../shared/challenges/catalog";

const mock = vi.hoisted(() => ({ items: [] as unknown[], auraTotal: 0 as number | null, auraDeductedTotal: 0, error: "" }));
vi.mock("../../src/features/challenges/useChallenges", () => ({ useChallenges: () => ({ items: mock.items, auraTotal: mock.auraTotal, auraDeductedTotal: mock.auraDeductedTotal, loading: false, error: mock.error }) }));
const { ChallengesPage } = await import("../../src/features/challenges/ChallengesPage");
afterEach(() => { cleanup(); mock.auraTotal = 0; mock.auraDeductedTotal = 0; mock.error = ""; });

describe("Aura Challenges page", () => {
  it("shows ten assigned cards including the GuateGeeks VR experience", () => {
    mock.items = [...challenges.slice(0, 9), challenges.find((item) => item.id === "C13")!].map((challenge) => ({ challenge, progress: { status: "available", auraAwarded: 0 } }));
    render(<MemoryRouter><ChallengesPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Aura Challenges" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(10);
    expect(screen.getByRole("heading", { name: "Experiencia VR GuateGeeks" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Misiones anteriores" })).not.toBeInTheDocument();
    expect(screen.getByText("0 de 10 retos completados · Saldo: 0 Aura")).toBeInTheDocument();
    expect(screen.getByText(/Por conseguir/u)).toBeInTheDocument();
  });

  it("shows selfies in the same route as the ten main challenges", () => {
    mock.items = [...challenges.slice(0, 9), challenges.find((item) => item.id === "C13")!, challenges.find((item) => item.id === "C16")!, challenges.find((item) => item.id === "C17")!].map((challenge) => ({ challenge, progress: { status: "available", auraAwarded: 0 } }));
    render(<MemoryRouter><ChallengesPage /></MemoryRouter>);
    expect(screen.getByText("0 de 12 retos completados · Saldo: 0 Aura")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Todos tus retos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Selfie con speaker/u })).toHaveAttribute("href", "/app/challenges/C16");
    expect(screen.getByRole("link", { name: /Selfie en un stand/u })).toHaveAttribute("href", "/app/challenges/C17");
  });

  it("shows a clear next step and the saved C08 step", () => {
    mock.items = [{ challenge: challenges.find((item) => item.id === "C08")!, progress: { status: "in_progress", architectureStep: 1, auraAwarded: 0 } }];
    render(<MemoryRouter><ChallengesPage /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /CONTINÚA TU RECORRIDO.*Rescata la señal/u })).toHaveAttribute("href", "/app/challenges/C08");
    expect(screen.getByText("Paso 1 de 2 completado")).toBeInTheDocument();
  });

  it("shows saved Aura after a completed retired challenge leaves the visible pack", () => {
    mock.items = challenges.filter((item) => item.id !== "C03" && item.id !== "C16" && item.id !== "C17").slice(0, 10).map((challenge) => ({ challenge, progress: { status: "available", auraAwarded: 0 } }));
    mock.auraTotal = 200;
    render(<MemoryRouter><ChallengesPage /></MemoryRouter>);
    expect(screen.queryByRole("heading", { name: "Cloud Trio" })).not.toBeInTheDocument();
    expect(screen.getByText("0 de 10 retos completados · Saldo: 200 Aura")).toBeInTheDocument();
  });

  it("shows a negative balance and deducted Aura on a failed AWS challenge", () => {
    mock.items = [{ challenge: challenges.find((item) => item.id === "C06")!, progress: { status: "failed", auraAwarded: 0, auraDeducted: 150 } }];
    mock.auraTotal = -150;
    mock.auraDeductedTotal = 150;
    render(<MemoryRouter><ChallengesPage /></MemoryRouter>);
    expect(screen.getByText("0 de 1 reto completado · Saldo: -150 Aura")).toBeInTheDocument();
    expect(screen.getByText(/Descontada/u)).toBeInTheDocument();
    expect(screen.getByText("Fallado · solución disponible")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /CONTINÚA TU RECORRIDO/u })).not.toBeInTheDocument();
  });

  it("does not show zero Aura before the score arrives", () => {
    mock.items = [];
    mock.auraTotal = null;
    render(<MemoryRouter><ChallengesPage /></MemoryRouter>);
    expect(screen.getByText("0 de 10 retos completados · Saldo: Cargando Aura…")).toBeInTheDocument();
  });

  it.each([
    "No pudimos preparar tus Challenges. Recarga la página.",
    "No pudimos cargar tu Aura."
  ])("stops showing Aura as loading when the operation fails: %s", (error) => {
    mock.items = [];
    mock.auraTotal = null;
    mock.error = error;
    render(<MemoryRouter><ChallengesPage /></MemoryRouter>);
    expect(screen.getByText("0 de 10 retos completados · Saldo: Aura no disponible")).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
  });
});
