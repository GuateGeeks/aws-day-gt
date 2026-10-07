import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoEvidence } from "../../src/features/submissions/PhotoEvidence";

vi.mock("../../src/firebase/auth", () => ({ auth: { currentUser: null } }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));
vi.mock("../../src/firebase/storage", () => ({ storage: {} }));

const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
const revokeObjectURL = vi.fn();

describe("PhotoEvidence preview and keyboard access", () => {
  beforeEach(() => { vi.stubGlobal("URL", { createObjectURL, revokeObjectURL }); createObjectURL.mockClear(); revokeObjectURL.mockClear(); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("releases old photo previews on reselection and the current preview on unmount", () => {
    const view = render(<PhotoEvidence challengeId="C16" />);
    const input = screen.getByLabelText("Seleccionar fotografía para revisión") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["first"], "first.jpg", { type: "image/jpeg" })] } });
    expect(screen.getByRole("img", { name: "Vista previa de la foto seleccionada" })).toHaveAttribute("src", "blob:first.jpg");
    fireEvent.change(input, { target: { files: [new File(["second"], "second.jpg", { type: "image/jpeg" })] } });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first.jpg");
    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second.jpg");
  });

  it("keeps the photo picker keyboard focusable with focus on its visible label", () => {
    render(<PhotoEvidence challengeId="C17" />);
    const input = screen.getByLabelText("Seleccionar fotografía para revisión");
    input.focus();
    expect(document.activeElement).toBe(input);
    expect(input.closest(".photo-picker")).toMatchObject({ className: "photo-picker" });
    expect(input.closest(".photo-picker")?.matches(":focus-within")).toBe(true);
  });
});
