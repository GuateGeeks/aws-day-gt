import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listeners: new Map<string, (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void>(),
  reviewImage: vi.fn(async () => ({ data: { status: "approved" } })),
  reviewDeletion: vi.fn(async () => ({ data: { status: "completed" } }))
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, path: string) => ({ path })),
  limit: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  query: vi.fn((ref: { path: string }) => ref),
  onSnapshot: vi.fn((ref: { path: string }, success: (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void) => {
    mocks.listeners.set(ref.path, success);
    return vi.fn();
  })
}));
vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn((_functions, name: string) => name === "reviewDataDeletion" ? mocks.reviewDeletion : mocks.reviewImage) }));
vi.mock("../../src/firebase/data", () => ({ db: {} }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { role: "admin", email: "guategeeks3d@gmail.com" } }) }));
vi.mock("../../src/features/admin/ChallengeOperations", () => ({ ChallengeOperations: () => <p>Controles de configuración</p> }));
vi.mock("../../src/features/admin/ModerationCard", () => ({ ModerationCard: () => <p>Evidencia pendiente</p> }));

const { AdminPage } = await import("../../src/features/admin/AdminPage");

afterEach(() => { cleanup(); mocks.listeners.clear(); mocks.reviewDeletion.mockClear(); });

describe("responsive owner administration center", () => {
  it("organizes image, privacy, and configuration work in separate tabs", () => {
    render(<AdminPage />);
    expect(screen.getByRole("tab", { name: /imágenes/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /privacidad/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /configuración/i })).toBeInTheDocument();
  });

  it("requires final confirmation before approving a deletion", async () => {
    render(<AdminPage />);
    act(() => mocks.listeners.get("submissions")?.({ docs: [] }));
    act(() => mocks.listeners.get("deletionRequests")?.({ docs: [{ id: "user-1", data: () => ({ uid: "user-1", alias: "cloud-user", emailMasked: "cl••••@example.com", status: "requested" }) }] }));
    fireEvent.click(screen.getByRole("tab", { name: /privacidad/i }));
    fireEvent.click(screen.getByRole("button", { name: /revisar y eliminar/i }));
    expect(screen.getByRole("dialog", { name: /eliminar datos de cloud-user/i })).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: /confirmar eliminación definitiva/i });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /comprendo que esta acción es irreversible/i }));
    fireEvent.click(confirm);
    await waitFor(() => expect(mocks.reviewDeletion).toHaveBeenCalledWith({ uid: "user-1", decision: "approved" }));
  });
});
