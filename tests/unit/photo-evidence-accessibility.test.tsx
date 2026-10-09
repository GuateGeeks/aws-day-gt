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
    const gallery = screen.getByLabelText("Elegir de la galería") as HTMLInputElement;
    const camera = screen.getByLabelText("Tomar selfie con la cámara") as HTMLInputElement;
    expect(gallery).not.toHaveAttribute("capture");
    expect(camera).toHaveAttribute("capture", "user");
    fireEvent.change(gallery, { target: { files: [new File(["first"], "first.jpg", { type: "image/jpeg" })] } });
    expect(screen.getByRole("img", { name: "Vista previa de la foto seleccionada" })).toHaveAttribute("src", "blob:first.jpg");
    fireEvent.change(camera, { target: { files: [new File(["second"], "second.jpg", { type: "image/jpeg" })] } });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first.jpg");
    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second.jpg");
  });

  it("keeps camera and gallery actions keyboard focusable", () => {
    render(<PhotoEvidence challengeId="C17" />);
    const camera = screen.getByLabelText("Tomar selfie con la cámara");
    camera.focus();
    expect(document.activeElement).toBe(camera);
    expect(camera.closest(".photo-picker__action")?.matches(":focus-within")).toBe(true);
    expect(screen.getByLabelText("Elegir de la galería")).toBeInTheDocument();
  });

  it("uses gallery only for publication screenshots", () => {
    render(<PhotoEvidence challengeId="C15" />);
    expect(screen.getByText("Selecciona la captura de tu publicación")).toBeInTheDocument();
    expect(screen.getByLabelText("Seleccionar captura para revisión")).not.toHaveAttribute("capture");
    expect(screen.queryByLabelText("Tomar selfie con la cámara")).not.toBeInTheDocument();
  });
});
