import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sessionDate } from "../../shared/agenda";
import { AgendaPage } from "../../src/features/agenda/AgendaPage";
import { resetMyRouteCache } from "../../src/features/agenda/useMyRoute";

vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { alias: "ana", interests: ["Seguridad"] } }) }));
vi.mock("../../src/features/missions/useMissions", () => ({
  useMissions: () => ({ loading: false, items: [{ id: "a1", missionId: "M22", status: "available", points: 10, mission: { id: "M22", title: "Antes de producción", slot: "10:45", room: "Fuego", evidenceType: "comment" } }] })
}));
vi.mock("../../src/features/companion/useNow", () => ({ useNow: () => sessionDate("10:50") }));

function renderPage() {
  return render(<MemoryRouter><AgendaPage /></MemoryRouter>);
}

describe("AgendaPage", () => {
  beforeEach(() => { localStorage.clear(); resetMyRouteCache(); });
  afterEach(cleanup);

  it("groups the official agenda by time slot and marks the live slot", () => {
    renderPage();
    const slot = screen.getByRole("region", { name: /10:45/ });
    expect(within(slot).getByText("En curso")).toBeInTheDocument();
    expect(within(slot).getByText(/Seguridad comprobable/)).toBeInTheDocument();
  });

  it("recommends sessions by interest and links assigned missions", () => {
    renderPage();
    const card = screen.getByRole("article", { name: /Seguridad comprobable/ });
    expect(within(card).getByText("Quetzi recomienda")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /misión/i })).toHaveAttribute("href", "/app/missions/M22");
  });

  it("builds a personal route and warns about parallel sessions", () => {
    renderPage();
    const star = screen.getByRole("button", { name: /Agregar a mi ruta: Seguridad comprobable/ });
    fireEvent.click(star);
    expect(star).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Mi ruta \(1\)/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Agregar a mi ruta: Tu primer pipeline de eventos/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(/mismo tiempo/);
    fireEvent.click(screen.getByRole("button", { name: /Mi ruta \(2\)/ }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("filters by track", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Seguridad" }));
    const titles = screen.getAllByRole("article").map((article) => article.getAttribute("aria-label"));
    expect(titles).toEqual(expect.arrayContaining([expect.stringMatching(/Seguridad comprobable/), expect.stringMatching(/Prompt Injection/)]));
    expect(titles).toHaveLength(2);
  });
});
