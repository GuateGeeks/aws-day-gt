import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionDate } from "../../shared/agenda";
import { LandingPage } from "../../src/features/auth/LandingPage";
import { QuetziGuide } from "../../src/features/companion/QuetziGuide";
import { QuetziSprite } from "../../src/features/companion/QuetziSprite";
import { readClockOffset } from "../../src/features/companion/useNow";
import { rowsToPixels, tailPixels } from "../../src/features/companion/quetzi-pixels";

const clock = vi.hoisted(() => ({ now: new Date("2026-10-08T09:00:00-06:00") }));
const missionState = vi.hoisted(() => ({ loading: false, items: [
  { id: "a1", missionId: "M17", status: "available", points: 10, mission: { id: "M17", title: "Agentes con Bedrock", slot: "09:50", room: "Tacaná", evidenceType: "comment" } },
  { id: "a2", missionId: "M01", status: "approved", points: 15, mission: { id: "M01", title: "Llegué al Community Day", evidenceType: "photo" } }
] }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { alias: "ana", interests: ["IA & Agentes"] } }) }));
vi.mock("../../src/features/missions/useMissions", () => ({ useMissions: () => missionState }));
vi.mock("../../src/features/companion/useNow", async (original) => ({ ...await original<object>(), useNow: () => clock.now }));

const { CompanionPage } = await import("../../src/features/companion/CompanionPage");

afterEach(() => {
  cleanup();
  missionState.loading = false;
});

describe("Quetzi sprite", () => {
  it("starts as an egg and evolves with completed missions", () => {
    const { rerender } = render(<QuetziSprite completed={0} />);
    expect(screen.getByRole("img")).toHaveAccessibleName("Quetzi, etapa Huevo");
    rerender(<QuetziSprite completed={11} />);
    expect(screen.getByRole("img")).toHaveAccessibleName("Quetzi, etapa Quetzal resplandeciente");
  });

  it("grows its tail one feather per mission", () => {
    expect(tailPixels(11).length).toBeGreaterThan(tailPixels(1).length);
    expect(tailPixels(99)).toEqual(tailPixels(11));
  });

  it("merges pixel runs", () => {
    expect(rowsToPixels([".GG.L"])).toEqual([
      { x: 1, y: 0, width: 2, color: "#1f9d55", part: "body" },
      { x: 4, y: 0, width: 1, color: "#8ee05a", part: "wing" }
    ]);
  });
});

describe("Quetzi guide", () => {
  it("expands contextual detail without navigating and then exposes the mission action", () => {
    render(<MemoryRouter><QuetziGuide completed={3} summary="Tienes una misión ahora" detail="La sesión ocurre en Tacaná." mission={{ id: "M17", title: "Agentes con Bedrock" }} /></MemoryRouter>);
    const toggle = screen.getByRole("button", { name: /ampliar información/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/La sesión ocurre/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Comenzar misión/i })).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("La sesión ocurre en Tacaná.").closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("link", { name: /Comenzar misión: Agentes con Bedrock/i })).toHaveAttribute("href", "/app/missions/M17");
  });

  it("can expand context without presenting an unrelated action", () => {
    render(<MemoryRouter><QuetziGuide completed={3} summary="Hay actividades en curso" detail="No tienes una misión relacionada con este momento." /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /ampliar información/i }));
    expect(screen.getByText(/No tienes una misión relacionada/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Comenzar misión/i })).not.toBeInTheDocument();
  });
});

describe("simulated clock", () => {
  it("stores an offset from ?ahora and clears it with real", () => {
    const storage = new Map<string, string>();
    const fake = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } };
    const real = new Date("2026-10-04T12:00:00-06:00").getTime();
    const offset = readClockOffset("?ahora=2026-10-10T10:00", fake, real);
    expect(real + offset).toBe(sessionDate("10:00").getTime());
    expect(readClockOffset("", fake, real)).toBe(offset);
    expect(readClockOffset("?ahora=real", fake, real)).toBe(0);
    expect(readClockOffset("?ahora=nope", fake, real)).toBe(0);
  });
});

describe("LandingPage companion promise", () => {
  it("describes current context instead of future-block alerts", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByText(/te muestra qué está pasando ahora/i)).toBeInTheDocument();
    expect(screen.queryByText(/te avisa cuándo empieza el siguiente bloque/i)).not.toBeInTheDocument();
  });
});

describe("CompanionPage", () => {
  function renderPage() { return render(<MemoryRouter><CompanionPage /></MemoryRouter>); }

  it("keeps the pre-event countdown and official agenda", () => {
    clock.now = new Date("2026-10-08T09:00:00-06:00");
    renderPage();
    expect(screen.getByRole("heading", { name: "En este momento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Cuenta regresiva/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /agenda oficial/i })).toHaveAttribute("target", "_blank");
  });

  it("reveals only the current related mission through Quetzi", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    expect(screen.queryByText(/Siguiente bloque/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pregúntale a los datos/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ampliar información/i }));
    expect(screen.getByText(/Strands Agents/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Comenzar misión: Agentes con Bedrock/i })).toHaveAttribute("href", "/app/missions/M17");
  });

  it("does not claim there is no mission while assignments load", () => {
    clock.now = sessionDate("10:00");
    missionState.loading = true;
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ampliar información/i }));
    expect(screen.getByText(/buscando si tienes una misión/i)).toBeInTheDocument();
    expect(screen.queryByText(/no tienes una misión/i)).not.toBeInTheDocument();
  });

  it("shows compact feather progress", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    expect(screen.getByText("1 de 11 plumas")).toBeInTheDocument();
  });
});
