import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArchitectureChallenge } from "../../src/features/challenges/ArchitectureChallenge";

afterEach(cleanup);

describe("Rescata la señal", () => {
  it("uses one selection per screen and advances after the first correct answer", async () => {
    const submit = vi.fn(async (stage: number, optionId: string) =>
      stage === 0 && optionId === "dynamo"
        ? { status: "in_progress", stage: 1, auraAwarded: 0 }
        : { status: "completed", auraAwarded: 150 }
    );
    const user = userEvent.setup();
    render(<ArchitectureChallenge savedStage={0} submit={submit} />);
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DynamoDB" }).querySelector("img")).toHaveAttribute("src", "/aws-services/dynamodb.svg");
    expect(screen.getByText(/La misma inscripción apareció dos veces/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar respuesta" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "DynamoDB" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirmar respuesta" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Confirmar respuesta" }));
    expect(submit).toHaveBeenCalledWith(0, "dynamo");
    expect(await screen.findByText(/Respuesta correcta/u)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText(/Un evento defectuoso detiene/u)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lambda" }));
    expect(submit).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Confirmar respuesta" }));
    expect(submit).toHaveBeenCalledWith(1, "lambda");
    expect(await screen.findByText(/Reto completado/u)).toBeInTheDocument();
  });

  it("shows the solution and closes the stage after a wrong service", async () => {
    const submit = vi.fn(async () => ({ status: "failed", auraAwarded: 0, solution: "Amazon DynamoDB" }));
    const user = userEvent.setup();
    render(<ArchitectureChallenge savedStage={0} submit={submit} />);
    await user.click(screen.getByRole("button", { name: "SQS" }));
    expect(submit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirmar respuesta" }));
    expect(await screen.findByText(/Perdiste 10 créditos/u)).toBeInTheDocument();
    expect(screen.getByText(/Amazon DynamoDB/u)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar respuesta" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DynamoDB" })).toBeDisabled();
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
