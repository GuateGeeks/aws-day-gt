import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getBlob, ref } from "firebase/storage";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrivateEvidenceImage } from "../../src/features/admin/PrivateEvidenceImage";

vi.mock("firebase/storage", () => ({
  getBlob: vi.fn(),
  ref: vi.fn(() => ({ fullPath: "private-reference" }))
}));

vi.mock("../../src/firebase/storage", () => ({ storage: { name: "test-storage" } }));

const getBlobMock = vi.mocked(getBlob);
const refMock = vi.mocked(ref);
const createObjectURL = vi.fn(() => "blob:private-evidence");
const revokeObjectURL = vi.fn();

describe("PrivateEvidenceImage", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    getBlobMock.mockReset();
    refMock.mockClear();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("downloads private evidence and reports when it is ready", async () => {
    let resolveBlob!: (blob: Blob) => void;
    getBlobMock.mockReturnValue(new Promise((resolve) => { resolveBlob = resolve; }));
    const onReadyChange = vi.fn();

    render(<PrivateEvidenceImage storagePath="evidence/event/user/M01/photo.webp" missionId="M01" onReadyChange={onReadyChange} />);

    expect(screen.getByText("Cargando fotografía…")).toBeInTheDocument();
    expect(onReadyChange).toHaveBeenCalledWith(false);
    resolveBlob(new Blob(["photo"], { type: "image/webp" }));

    const image = await screen.findByRole("img", { name: "Evidencia fotográfica del Challenge M01" });
    expect(image).toHaveAttribute("src", "blob:private-evidence");
    expect(refMock).toHaveBeenCalledWith(expect.objectContaining({ name: "test-storage" }), "evidence/event/user/M01/photo.webp");
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    fireEvent.load(image);
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
  });

  it("shows a safe error and retries the download", async () => {
    getBlobMock
      .mockRejectedValueOnce(new Error("evidence/event/secret.webp"))
      .mockResolvedValueOnce(new Blob(["photo"], { type: "image/webp" }));

    render(<PrivateEvidenceImage storagePath="evidence/event/user/M02/photo.webp" missionId="M02" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar esta fotografía.");
    expect(screen.queryByText(/secret\.webp/u)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("img", { name: "Evidencia fotográfica del Challenge M02" })).toBeInTheDocument();
    expect(getBlobMock).toHaveBeenCalledTimes(2);
  });

  it("revokes its temporary object URL when unmounted", async () => {
    getBlobMock.mockResolvedValue(new Blob(["photo"], { type: "image/webp" }));
    const view = render(<PrivateEvidenceImage storagePath="evidence/event/user/M03/photo.webp" missionId="M03" />);
    await screen.findByRole("img");

    view.unmount();

    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:private-evidence"));
  });

  it("does not attempt a download when image metadata is missing", async () => {
    render(<PrivateEvidenceImage missionId="M04" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar esta fotografía.");
    expect(getBlobMock).not.toHaveBeenCalled();
  });

  it("keeps moderation disabled and shows a retry if the downloaded image cannot render", async () => {
    getBlobMock.mockResolvedValue(new Blob(["not an image"], { type: "image/webp" }));
    const onReadyChange = vi.fn();
    render(<PrivateEvidenceImage storagePath="evidence/event/user/C16/photo.webp" missionId="C16" onReadyChange={onReadyChange} />);
    const image = await screen.findByRole("img", { name: "Evidencia fotográfica del Challenge C16" });
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    fireEvent.error(image);
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar esta fotografía.");
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
