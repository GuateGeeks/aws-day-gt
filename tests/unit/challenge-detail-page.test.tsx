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

  it("shows one Spanish Aura confirmation and routes to the next available challenge", () => {
    mock.items = [item("C07", "completed"), item("C11", "locked"), item("C16", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C07"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "¡Ganaste 100 Aura!" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Selfie con speaker →" })).toHaveAttribute("href", "/app/challenges/C16");
    expect(screen.queryByText(/completed|CHALLENGE COMPLETE/u)).not.toBeInTheDocument();
  });

  it("shows the permanent Aura penalty, solution, and next challenge", () => {
    mock.items = [{ ...item("C07", "failed"), progress: { status: "failed", auraAwarded: 0, auraDeducted: 150, solution: "Archivos → Amazon S3" } }, item("C11", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C07"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /Perdiste 150 Aura/u })).toBeInTheDocument();
    expect(screen.getByText(/Archivos → Amazon S3/u)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Código del speaker · charla →" })).toHaveAttribute("href", "/app/challenges/C11");
    expect(screen.queryByRole("button", { name: "Validar Challenge" })).not.toBeInTheDocument();
  });

  it.each([["C10", "Código que te dio el speaker del taller"], ["C11", "Código que te dio el speaker de la charla"], ["C13", "Código de la experiencia VR"]])("uses one simple code field for %s", (id, label) => {
    mock.items = [item(id, "available")];
    render(<MemoryRouter initialEntries={[`/app/challenges/${id}`]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("textbox", { name: label })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar código" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Sesión" })).not.toBeInTheDocument();
  });

  it("shows a simple 3D AWS selection before confirmation", async () => {
    mock.items = [item("C18", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C18"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("button", { name: "Amazon SQS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar respuesta" })).toBeDisabled();
    expect(screen.getByText(/Si fallas, se descuentan 150 Aura/u)).toBeInTheDocument();
  });

  it("explains the wrong choice after a failed AWS bonus", () => {
    mock.items = [{ ...item("C19", "failed"), progress: { status: "failed", auraAwarded: 0, auraDeducted: 150, incorrectReason: "SQS no publica a todos", solution: "Respuesta correcta: Amazon SNS." } }];
    render(<MemoryRouter initialEntries={["/app/challenges/C19"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByText(/Por qué no era correcta/u)).toBeInTheDocument();
    expect(screen.getByText(/SQS no publica a todos/u)).toBeInTheDocument();
    expect(screen.getByText(/Respuesta correcta: Amazon SNS/u)).toBeInTheDocument();
  });
});
