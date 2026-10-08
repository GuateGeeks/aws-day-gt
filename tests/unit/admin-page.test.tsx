import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminPage } from "../../src/features/admin/AdminPage";

const mocks = vi.hoisted(() => ({
  snapshotSuccess: undefined as undefined | ((snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void),
  snapshotError: undefined as undefined | (() => void),
  where: vi.fn(() => "pending"),
  review: vi.fn(async () => ({ data: { status: "approved" } }))
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "submissions"),
  limit: vi.fn(() => "limit"),
  orderBy: vi.fn(() => "order"),
  query: vi.fn(() => "pending-query"),
  where: mocks.where,
  onSnapshot: vi.fn((_query, success, error) => {
    mocks.snapshotSuccess = success;
    mocks.snapshotError = error;
    return vi.fn();
  })
}));

vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn(() => mocks.review) }));
vi.mock("../../src/firebase/data", () => ({ db: {} }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { role: "admin" } }) }));
vi.mock("../../src/features/admin/PrivateEvidenceImage", () => ({
  PrivateEvidenceImage: ({ onReadyChange }: { onReadyChange?: (ready: boolean) => void }) => (
    <button type="button" onClick={() => onReadyChange?.(true)}>Simular imagen lista</button>
  )
}));

const pendingSubmission = {
  operationId: "operation-1",
  eventId: "aws-community-day-gt-2026",
  userId: "participant-1234",
  missionId: "C15",
  kind: "challenge",
  evidenceType: "photo",
  image: { storagePath: "evidence/event/participant-1234/C15/photo.webp" },
  status: "pending",
  provisionalPoints: 15,
  finalPoints: 0,
  publicationEligible: false,
  submittedAt: "2026-10-04T10:00:00.000Z",
  updatedAt: "2026-10-04T10:00:00.000Z"
};

describe("AdminPage moderation queue", () => {
  afterEach(() => {
    cleanup();
    mocks.snapshotSuccess = undefined;
    mocks.snapshotError = undefined;
    mocks.review.mockClear();
    mocks.where.mockClear();
  });

  it("distinguishes loading, an empty queue, and a subscription error", () => {
    render(<AdminPage />);
    expect(screen.getByText("Cargando bandeja de moderación…")).toBeInTheDocument();

    act(() => mocks.snapshotSuccess?.({ docs: [] }));
    expect(screen.getByText("Bandeja al día")).toBeInTheDocument();

    act(() => mocks.snapshotError?.());
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar la bandeja de moderación.");
    expect(screen.queryByText("Bandeja al día")).not.toBeInTheDocument();
  });

  it("keeps review controls disabled until the private photograph is ready", () => {
    render(<AdminPage />);
    expect(mocks.where).toHaveBeenCalledWith("kind", "==", "challenge");
    act(() => mocks.snapshotSuccess?.({ docs: [{ id: "submission-1", data: () => pendingSubmission }] }));
    expect(screen.getByText(/confirma que la captura muestre el stand de GuateGeeks y la experiencia/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Aprobar/u })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Rechazar/u })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Simular imagen lista" }));
    expect(screen.getByRole("button", { name: /Aprobar/u })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Rechazar/u })).toBeEnabled();
  });
});
