import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionDate } from "../../shared/agenda";
import { QuetziGuide } from "../../src/features/companion/QuetziGuide";
import { QuetziSprite } from "../../src/features/companion/QuetziSprite";
import { readClockOffset } from "../../src/features/companion/useNow";
import { rowsToPixels, tailPixels } from "../../src/features/companion/quetzi-pixels";

const clock = vi.hoisted(() => ({ now: new Date("2026-10-08T09:00:00-06:00") }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { alias: "ana", interests: ["IA & Agentes"] } }) }));
vi.mock("../../src/features/missions/useMissions", () => ({
  useMissions: () => ({ loading: false, items: [
    { id: "a1", missionId: "M17", status: "available", points: 10, mission: { id: "M17", title: "Agentes con Bedrock", slot: "09:50", room: "Tacaná", evidenceType: "comment" } },
    { id: "a2", missionId: "M01", status: "approved", points: 15, mission: { id: "M01", title: "Llegué al Community Day", evidenceType: "photo" } }
  ] })
}));
vi.mock("../../src/features/companion/useNow", async (original) => ({ ...await original<object>(), useNow: () => clock.now }));

const { CompanionPage } = await import("../../src/features/companion/CompanionPage");

afterEach(cleanup);

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
  it("speaks politely and reacts to taps", () => {
    const onTap = vi.fn();
    render(<QuetziGuide completed={3} line="Hola" onTap={onTap} />);
    fireEvent.click(screen.getByRole("button", { name: /Toca a Quetzi/ }));
    expect(onTap).toHaveBeenCalledOnce();
    expect(screen.getByText("Hola").closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
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

describe("CompanionPage", () => {
  function renderPage() { return render(<MemoryRouter><CompanionPage /></MemoryRouter>); }

  it("counts down before the event", () => {
    clock.now = new Date("2026-10-08T09:00:00-06:00");
    renderPage();
    expect(screen.getByText(/Faltan 1 día|Faltan 2 días/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Cuenta regresiva/ })).toBeInTheDocument();
  });

  it("shows only the session tied to the user's mission and defers the rest to the official agenda", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    const challenge = screen.getByRole("link", { name: /Agentes con Bedrock/ });
    expect(challenge).toHaveAttribute("href", "/app/missions/M17");
    expect(challenge).toHaveTextContent(/Ahora/);
    expect(challenge).toHaveTextContent(/Strands Agents/);
    expect(screen.queryByText(/The Event Happened Twice/)).not.toBeInTheDocument();
    const official = screen.getAllByRole("link", { name: /agenda oficial/i });
    expect(official[0]).toHaveAttribute("href", "https://awscommunitygt.com/agenda/");
    expect(screen.getByText(/Siguiente bloque: 10:45/)).toBeInTheDocument();
  });

  it("sends people to the official agenda before the event", () => {
    clock.now = new Date("2026-10-08T09:00:00-06:00");
    renderPage();
    expect(screen.getByRole("link", { name: /agenda oficial/i })).toHaveAttribute("target", "_blank");
  });

  it("shows feather progress", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    expect(screen.getByText("1 de 11 plumas")).toBeInTheDocument();
  });
});
