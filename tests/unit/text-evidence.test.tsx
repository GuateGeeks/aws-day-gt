import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { missions } from "../../scripts/data/missions";
import { TextEvidence } from "../../src/features/submissions/TextEvidence";

const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn(() => mocks.submit) }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));

describe("TextEvidence selections", () => {
  afterEach(() => { cleanup(); mocks.submit.mockReset(); });

  it("renders single choices without free-text controls and submits option IDs", async () => {
    mocks.submit.mockResolvedValue({ data: { status: "approved", attemptsRemaining: 2 } });
    render(<TextEvidence mission={missions.find((mission) => mission.id === "M16")!} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Enviar evidencia" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Ángel Castillo" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar evidencia" }));
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({ missionId: "M16", selectionIds: ["o1"] })));
  });

  it("enforces multiple-choice limits", () => {
    render(<TextEvidence mission={missions.find((mission) => mission.id === "M21")!} />);
    const submit = screen.getByRole("button", { name: "Enviar evidencia" });
    expect(screen.getAllByRole("checkbox")).toHaveLength(6);
    for (const label of ["Lambda", "SNS", "SQS"]) fireEvent.click(screen.getByRole("checkbox", { name: label }));
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Step Functions" }));
    expect(submit).toBeEnabled();
  });

  it("reports remaining attempts and exhaustion without revealing the answer", async () => {
    mocks.submit.mockResolvedValueOnce({ data: { status: "incorrect", attemptsRemaining: 1 } }).mockResolvedValueOnce({ data: { status: "failed", attemptsRemaining: 0 } });
    render(<TextEvidence mission={missions.find((mission) => mission.id === "M16")!} />);
    fireEvent.click(screen.getByRole("radio", { name: "Carlos Zambrano" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar evidencia" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Te queda 1 intento");
    fireEvent.click(screen.getByRole("button", { name: "Enviar evidencia" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Agotaste los dos intentos");
    expect(screen.getByRole("button", { name: "Enviar evidencia" })).toBeDisabled();
  });
});
