import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getBlob } from "firebase/storage";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Submission } from "../../shared/types";
import { ModerationCard } from "../../src/features/admin/ModerationCard";

vi.mock("firebase/storage", () => ({ getBlob: vi.fn(), ref: vi.fn(() => ({ fullPath: "private-image" })) }));
vi.mock("../../src/firebase/storage", () => ({ storage: { name: "test-storage" } }));

const submission = {
  missionId: "C16",
  userId: "participant-123",
  provisionalPoints: 100,
  image: { storagePath: "evidence/event/participant-123/C16/photo.webp" }
} as Submission;

describe("Moderation image confirmation", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:private-image"), revokeObjectURL: vi.fn() });
    vi.mocked(getBlob).mockResolvedValue(new Blob(["image"], { type: "image/webp" }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("keeps review controls disabled until the image renders, then disables them on render error", async () => {
    const onReview = vi.fn(async () => {});
    render(<ModerationCard submission={submission} onReview={onReview} />);
    const approve = screen.getByRole("button", { name: "Aprobar" });
    const reject = screen.getByRole("button", { name: "Rechazar" });
    expect(approve).toBeDisabled();
    expect(reject).toBeDisabled();

    const image = await screen.findByRole("img", { name: "Evidencia fotográfica del Challenge C16" });
    expect(approve).toBeDisabled();
    expect(reject).toBeDisabled();
    fireEvent.load(image);
    expect(approve).toBeEnabled();
    expect(reject).toBeEnabled();
    fireEvent.error(image);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar esta fotografía.");
    expect(approve).toBeDisabled();
    expect(reject).toBeDisabled();
    expect(onReview).not.toHaveBeenCalled();
  });

  it("collects a clear reason before rejecting an image", async () => {
    const onReview = vi.fn(async () => {});
    render(<ModerationCard submission={submission} onReview={onReview} />);
    fireEvent.load(await screen.findByRole("img", { name: "Evidencia fotográfica del Challenge C16" }));
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));

    const confirm = screen.getByRole("button", { name: "Confirmar rechazo" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/no se distingue el stand/i), { target: { value: "La imagen está borrosa." } });
    fireEvent.click(confirm);

    await waitFor(() => expect(onReview).toHaveBeenCalledWith(submission, "rejected", "La imagen está borrosa."));
  });
});
