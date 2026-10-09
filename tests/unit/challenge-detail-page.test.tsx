import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  it("shows official service icons in matching and sequence questions", () => {
    mock.items = [item("C07", "available")];
    const view = render(<MemoryRouter initialEntries={["/app/challenges/C07"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    const s3 = screen.getAllByRole("button", { name: "Amazon S3" })[0]!;
    expect(s3.querySelector("img")).toHaveAttribute("src", "/aws-services/s3.svg");
    fireEvent.click(s3);
    expect(s3).toHaveAttribute("aria-pressed", "true");
    view.unmount();
    mock.items = [item("C06", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C06"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Amazon API Gateway" }).querySelector("img")).toHaveAttribute("src", "/aws-services/api-gateway.svg");
  });
  it("shows C08 as a simple selection without the generic validation control", async () => {
    mock.items = [item("C08", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C08"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("button", { name: "DynamoDB" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar respuesta" })).toBeDisabled();
    expect(screen.queryByText(/Tienes una oportunidad.*10 créditos/u)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Validar Challenge" })).not.toBeInTheDocument();
  });

  it.each([
    ["C01", "Different Stack", "otra área tecnológica"],
    ["C02", "First Timer", "primer Community Day"],
    ["C04", "Same Cloud Interest", "interés tecnológico"],
    ["C06", "Build Serverless", "solicitud de registro"],
    ["C07", "Cloud Match", "cuatro necesidades"],
    ["C08", "Rescata la señal", "dos fallas"],
    ["C09", "Who Am I?", "tres pistas"],
    ["C12", "Track Pulse", "track que más te aportó"],
    ["C15", "Comparte la experiencia GuateGeeks", "captura de tu publicación"],
    ["C16", "Selfie con speaker", "speaker del evento"],
    ["C17", "Selfie en un stand", "stand del evento"],
    ["C18", "Inscripciones sin perder el ritmo", "conservar cada inscripción"],
    ["C19", "Un aviso, muchos destinos", "varios destinatarios"],
    ["C20", "Cada evento a su lugar", "destino adecuado"],
    ["C21", "Tres pasos, un flujo", "tres pasos"],
    ["C22", "Alerta antes del caos", "umbral de errores"],
    ["C23", "Permiso justo", "solo pueda guardar fotos"]
  ])("explains the specific task for %s in the white card", (id, title, objective) => {
    mock.items = [item(id, "available")];
    render(<MemoryRouter initialEntries={[`/app/challenges/${id}`]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    const task = screen.getByRole("region", { name: `Tu reto: ${title}` });
    expect(task).toHaveTextContent(objective);
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

  it("does not expose the retired VR code even through a saved link", () => {
    mock.items = [item("C13", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C13"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByText("Este desafío ya no forma parte del recorrido.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Código de la experiencia VR" })).not.toBeInTheDocument();
  });

  it("shows a clear AWS question and flat choices before confirmation", async () => {
    mock.items = [item("C18", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C18"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("button", { name: "Amazon SQS" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "¿Qué servicio AWS resuelve este reto?" })).toBeInTheDocument();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar respuesta" })).toBeDisabled();
    expect(screen.queryByText(/Si no resuelves correctamente el reto, pierdes 10 créditos/u)).not.toBeInTheDocument();
  });

  it("presents Who Am I clues as a numbered list with choices", () => {
    mock.items = [item("C09", "available")];
    render(<MemoryRouter initialEntries={["/app/challenges/C09"]}><Routes><Route path="/app/challenges/:challengeId" element={<ChallengeDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Pistas" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Pistas del servicio AWS" })).toHaveTextContent("Puedo ejecutar código cuando ocurre un evento.");
    expect(screen.getByRole("group", { name: "Elige un servicio AWS" })).toBeInTheDocument();
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
    expect(screen.getByText(/Visita el stand y conoce la experiencia de GuateGeeks/u)).toBeInTheDocument();
    expect(screen.getAllByText(/Etiqueta a GuateGeeks/u).length).toBeGreaterThan(0);
    expect(screen.getByText(/Sube una captura donde se vean tu publicación y la etiqueta/u)).toBeInTheDocument();
    expect(screen.getAllByText(/Facebook, Instagram o LinkedIn/u).length).toBeGreaterThan(0);
    expect(screen.getByText("Selecciona la captura de tu publicación")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar imagen para revisión" })).toBeDisabled();
  });
});
