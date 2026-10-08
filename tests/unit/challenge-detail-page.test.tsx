import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { challenges } from "../../shared/challenges/catalog";

const mock = vi.hoisted(() => ({ items: [] as unknown[] }));
vi.mock("../../src/features/challenges/useChallenges", () => ({ useChallenges: () => ({ items: mock.items, loading: false, error: "" }) }));
const { ChallengeDetailPage } = await import("../../src/features/challenges/ChallengeDetailPage");
afterEach(cleanup);

function item(id: string, status: "available" | "completed" | "locked" | "failed") {
  const challenge = challenges.find((value) => value.id === id)!;
  return { challenge, progress: { status, auraAwarded: status === "completed" ? challenge.auraReward : 0 } };
}

describe("Challenge completion", () => {
  it("shows C08 as a simple selection without the generic validation control", async () => {
    mock.items = [item("C08", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C08"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("button", { name: "DynamoDB" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Validar Challenge" })).not.toBeInTheDocument();
  });

  it("shows one Spanish credit confirmation and routes to the next available challenge", () => {
    mock.items = [item("C07", "completed"), item("C12", "locked"), item("C16", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C07"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "¡Ganaste 100 créditos!" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Selfie con speaker →" })).toHaveAttribute("href", "/app/challenges/C16");
    expect(screen.queryByText(/completed|CHALLENGE COMPLETE/u)).not.toBeInTheDocument();
  });

  it("shows the permanent credit penalty, solution, and next challenge", () => {
    mock.items = [{ ...item("C07", "failed"), progress: { status: "failed", auraAwarded: 0, auraDeducted: 10, solution: "Archivos → Amazon S3" } }, item("C12", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C07"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /Perdiste 10 créditos/u })).toBeInTheDocument();
    expect(screen.getByText(/Archivos → Amazon S3/u)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Track Pulse →" })).toHaveAttribute("href", "/app/challenges/C12");
    expect(screen.queryByRole("button", { name: "Validar Challenge" })).not.toBeInTheDocument();
  });

  it("keeps one simple code field for the VR experience", () => {
    mock.items = [item("C13", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C13"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("textbox", { name: "Código de la experiencia VR" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar código" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Sesión" })).not.toBeInTheDocument();
  });

  it("shows a simple 3D AWS selection before confirmation", async () => {
    mock.items = [item("C18", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C18"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("button", { name: "Amazon SQS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar respuesta" })).toBeDisabled();
    expect(screen.getByText(/Si fallas, se descuentan 10 créditos/u)).toBeInTheDocument();
  });

  it("explains the wrong choice after a failed AWS bonus", () => {
    mock.items = [{ ...item("C19", "failed"), progress: { status: "failed", auraAwarded: 0, auraDeducted: 10, incorrectReason: "SQS no publica a todos", solution: "Respuesta correcta: Amazon SNS." } }];
    render(<MemoryRouter initialEntries={["/app/challenges/C19"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByText(/Por qué no era correcta/u)).toBeInTheDocument();
    expect(screen.getByText(/SQS no publica a todos/u)).toBeInTheDocument();
    expect(screen.getByText(/Respuesta correcta: Amazon SNS/u)).toBeInTheDocument();
  });

  it("explains the 350-credit publication and asks for a screenshot", () => {
    mock.items = [item("C15", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C15"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByText(/la etiqueta a GuateGeeks/u)).toBeInTheDocument();
    expect(screen.getAllByText(/Facebook, Instagram o LinkedIn/u).length).toBeGreaterThan(0);
    expect(screen.getByText("Selecciona la captura de tu publicación")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar imagen para revisión" })).toBeDisabled();
  });
});
