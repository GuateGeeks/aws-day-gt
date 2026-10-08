import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ fetch: vi.fn(), callable: vi.fn() }));
vi.mock("firebase/functions", () => ({ httpsCallable: mock.callable }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));
vi.mock("../../src/firebase/data", () => ({ db: {} }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ user: { uid: "registered-zero" } }) }));
const { LeaderboardPage } = await import("../../src/features/leaderboard/LeaderboardPage");

describe("Aura ranking", () => {
  beforeEach(() => {
    mock.fetch.mockReset();
    mock.callable.mockReset().mockReturnValue(mock.fetch);
  });

  it("shows only verified callable rows and highlights a registered participant with zero Aura", async () => {
    mock.fetch.mockResolvedValue({ data: { rows: [
      { rank: 1, userId: "registered", alias: "Nueva", auraTotal: 200, completedChallenges: 1 },
      { rank: 2, userId: "registered-zero", alias: "Histórico", auraTotal: 0, completedChallenges: 0 }
    ], personalRank: 2 } });
    render(<LeaderboardPage />);
    expect(screen.getByText(/cargando ranking/i)).toBeInTheDocument();
    expect(await screen.findByText("Nueva")).toBeInTheDocument();
    expect(screen.getByText("Histórico (tú)")).toBeInTheDocument();
    expect(screen.getByText("200 créditos")).toBeInTheDocument();
    expect(screen.getByText("0 créditos")).toBeInTheDocument();
    expect(mock.callable).toHaveBeenCalledWith({}, "getLeaderboardSnapshot");
  });

  it("offers retry when the ranking request fails", async () => {
    mock.fetch.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: { rows: [], personalRank: null } });
    render(<LeaderboardPage />);
    expect(await screen.findByText(/no pudimos cargar el ranking/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /intentar de nuevo/i }));
    expect(await screen.findByText(/el ranking empieza pronto/i)).toBeInTheDocument();
    expect(mock.fetch).toHaveBeenCalledTimes(2);
  });
});
