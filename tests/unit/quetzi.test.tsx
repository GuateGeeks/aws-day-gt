import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionDate } from "../../shared/agenda";
import { quetziLine } from "../../shared/companion";
import { QuetziGuide } from "../../src/features/companion/QuetziGuide";
import { AgendaSpotlightCard } from "../../src/features/companion/CompanionCards";
import { QuetziSprite } from "../../src/features/companion/QuetziSprite";
import { clockPreviewSearch, effectiveEventNow, readClockOffset, rehearsalEnabledForHost } from "../../src/features/companion/useNow";

const clock = vi.hoisted(() => ({ now: new Date("2026-10-08T09:00:00-06:00") }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { alias: "ana", interests: ["IA & Agentes"] } }) }));
vi.mock("../../src/features/missions/useMissions", () => ({
  useMissions: () => ({ loading: false, items: [
    { id: "a1", missionId: "M17", status: "available", points: 10, mission: { id: "M17", title: "Agentes con Bedrock", slot: "09:50", room: "Tacaná", evidenceType: "comment" } },
    { id: "a2", missionId: "M01", status: "approved", points: 15, mission: { id: "M01", title: "Llegué al Community Day", evidenceType: "photo" } }
  ] })
}));
vi.mock("../../src/features/challenges/useChallenges", () => ({ useChallenges: () => ({ items: [{ challenge: { id: "C15", title: "Comparte la experiencia GuateGeeks", auraReward: 350 }, progress: { status: "available" } }] }) }));
vi.mock("../../src/features/companion/useNow", async (original) => ({ ...await original<object>(), useNow: () => clock.now }));

const { CompanionPage } = await import("../../src/features/companion/CompanionPage");

afterEach(cleanup);

describe("Quetzi sprite", () => {
  it("shows an abstract assistant that gains energy with completed missions", () => {
    const { rerender } = render(<QuetziSprite completed={0} />);
    expect(screen.getByRole("img")).toHaveAccessibleName("Geek, etapa Primer pulso");
    rerender(<QuetziSprite completed={10} />);
    expect(screen.getByRole("img")).toHaveAccessibleName("Geek, etapa Núcleo radiante");
  });

  it("uses the transparent GuateGeeks eyes as the event guide", () => {
    const { container } = render(<QuetziSprite completed={3} />);
    expect(container.querySelector("img.quetzi")).toHaveAttribute("src", "/brand/geek-eyes.png");
    expect(container.querySelector("svg, .quetzi__core, .quetzi__wing")).toBeNull();
  });

});

describe("Quetzi guide", () => {
  it("speaks politely and reacts to taps", () => {
    const onTap = vi.fn();
    render(<QuetziGuide completed={3} line="Hola" onTap={onTap} />);
    fireEvent.click(screen.getByRole("button", { name: /Toca a Geek/ }));
    expect(onTap).toHaveBeenCalledOnce();
    expect(screen.getByText("Hola").closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Geek")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Toca a Geek/ })).toBeInTheDocument();
  });

  it("introduces the guide as Geek before the event", () => {
    expect(quetziLine({ phase: "pre", alias: "Ana", now: new Date("2026-10-08T09:00:00-06:00") })).toContain("Soy Geek");
  });
});

describe("welcome after sign in", () => {
  it("leads with the event logo and a direct challenge button", () => {
    render(<MemoryRouter><CompanionPage /></MemoryRouter>);
    expect(screen.getAllByRole("img", { name: "AWS Community Day Guatemala" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Vamos al challenge/i })).toHaveAttribute("href", "/app/challenges");
  });
});

describe("simulated clock", () => {
  it("enables the October 8 rehearsal on local and production event hosts", () => {
    expect(rehearsalEnabledForHost("127.0.0.1")).toBe(true);
    expect(rehearsalEnabledForHost("localhost")).toBe(true);
    expect(rehearsalEnabledForHost("aws-day-gt.web.app")).toBe(true);
    expect(rehearsalEnabledForHost("aws-day-gt.firebaseapp.com")).toBe(true);
    expect(rehearsalEnabledForHost("example.com")).toBe(false);
  });
  it("runs the October 8 rehearsal at the matching event time and ends it automatically", () => {
    const real = new Date("2026-10-08T10:25:00-06:00");
    expect(effectiveEventNow(real, true, 0).toISOString()).toBe("2026-10-10T16:25:00.000Z");
    expect(effectiveEventNow(real, false, 0)).toEqual(real);
    expect(effectiveEventNow(new Date("2026-10-09T10:25:00-06:00"), true, 0)).toEqual(new Date("2026-10-09T10:25:00-06:00"));
    expect(effectiveEventNow(real, true, 60_000)).toEqual(new Date(real.getTime() + 60_000));
  });
  it("stores an offset from ?ahora and clears it with real", () => {
    const storage = new Map<string, string>();
    const fake = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } };
    const real = new Date("2026-10-04T12:00:00-06:00").getTime();
    const offset = readClockOffset("?ahora=2026-10-10T10:00", fake, real);
    expect(real + offset).toBe(sessionDate("10:00").getTime());
    expect(storage.get("quetzi.use-manual-clock")).toBe("true");
    expect(readClockOffset("", fake, real)).toBe(offset);
    expect(readClockOffset("?ahora=real", fake, real)).toBe(0);
    expect(storage.has("quetzi.use-manual-clock")).toBe(false);
    expect(readClockOffset("?ahora=ensayo", fake, real)).toBe(0);
    expect(storage.has("quetzi.use-real-clock")).toBe(false);
    expect(readClockOffset("?ahora=nope", fake, real)).toBe(0);
  });

  it("preserves only valid visual clock previews through sign-in", () => {
    expect(clockPreviewSearch("?ahora=2026-10-10T10%3A00&other=ignored")).toBe("?ahora=2026-10-10T10%3A00");
    expect(clockPreviewSearch("?ahora=real")).toBe("?ahora=real");
    expect(clockPreviewSearch("?ahora=malformed")).toBe("");
  });
});

describe("CompanionPage", () => {
  function renderPage() { return render(<MemoryRouter><CompanionPage /></MemoryRouter>); }

  it("shows a clearly labelled registration preview before the event", () => {
    clock.now = new Date("2026-10-07T18:00:00-06:00");
    renderPage();
    expect(screen.getByText("Vista previa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Registro" })).toBeInTheDocument();
    expect(screen.getByText(/07:30/)).toBeInTheDocument();
  });

  it("switches the same agenda area to real concurrent sessions during the event", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    expect(screen.getByText("En vivo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The Event Happened Twice" })).toBeInTheDocument();
    expect(screen.queryByText("Vista previa")).not.toBeInTheDocument();
    expect(screen.getByText("A continuación")).toBeInTheDocument();
    expect(screen.getAllByText(/10:45/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(5);
    expect(screen.queryByText("Creado por GuateGeeks")).not.toBeInTheDocument();
  });

  it("does not show a countdown", () => {
    clock.now = new Date("2026-10-08T09:00:00-06:00");
    renderPage();
    expect(screen.getByText(/Soy Geek/)).toBeInTheDocument();
    expect(screen.queryByText(/Faltan \d/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Cuenta regresiva/ })).not.toBeInTheDocument();
  });

  it("shows the next credit challenge and the active talks without historical missions", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    expect(screen.getByRole("link", { name: /Comparte la experiencia GuateGeeks/ })).toHaveAttribute("href", "/app/challenges/C15");
    expect(screen.getByRole("link", { name: /Empezar desafío/ })).toHaveAttribute("href", "/app/challenges/C15");
    expect(screen.queryByRole("link", { name: /Agentes con Bedrock/ })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The Event Happened Twice" })).toBeInTheDocument();
    const official = screen.getAllByRole("link", { name: /agenda oficial/i });
    expect(official[0]).toHaveAttribute("href", "https://awscommunitygt.com/agenda/");
    expect(screen.getByText("En vivo")).toBeInTheDocument();
  });

  it("sends people to the official agenda before the event", () => {
    clock.now = new Date("2026-10-08T09:00:00-06:00");
    renderPage();
    expect(screen.getAllByRole("link", { name: /agenda oficial/i })[0]).toHaveAttribute("target", "_blank");
  });

  it("offers the main Aura Challenges from the home screen", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    expect(screen.getByRole("link", { name: "Ver todos mis retos" })).toHaveAttribute("href", "/app/challenges");
    expect(screen.queryByText("Misiones anteriores")).not.toBeInTheDocument();
  });
});

describe("local agenda rehearsal", () => {
  it("shows current and upcoming activities as horizontal links to the official agenda", () => {
    render(<AgendaSpotlightCard now={sessionDate("10:00")} rehearsal />);
    const current = screen.getByRole("list", { name: "Actividades en vivo" });
    const upcoming = screen.getByRole("list", { name: "A continuación" });
    expect(current.querySelectorAll("li").length).toBeGreaterThan(1);
    expect(upcoming.querySelectorAll("li").length).toBeGreaterThan(1);
    for (const item of [...current.querySelectorAll("li"), ...upcoming.querySelectorAll("li")]) {
      expect(item.querySelector("a")).toHaveAttribute("href", "https://awscommunitygt.com/agenda/");
      expect(item.querySelector("a")).toHaveAttribute("target", "_blank");
    }
  });

  it("shows current registration and the following block under the rehearsal date", () => {
    render(<AgendaSpotlightCard now={sessionDate("08:15")} rehearsal />);
    expect(screen.getByText("Sábado 10 de octubre · simulación de hoy · hora de Guatemala")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Registro" })).toBeInTheDocument();
    expect(screen.getByText("A continuación")).toBeInTheDocument();
    expect(screen.getByText(/08:30 · en 15 min/)).toBeInTheDocument();
  });

  it("keeps a single upcoming activity as one clickable carousel card", () => {
    const { container } = render(<AgendaSpotlightCard now={sessionDate("08:38")} rehearsal />);
    const next = container.querySelector(".agenda-carousel--next");
    expect(next?.querySelectorAll("li")).toHaveLength(1);
    expect(next?.querySelector("li a")).toHaveAttribute("href", "https://awscommunitygt.com/agenda/");
  });

  it("shows every parallel session in the next block during the short schedule gap", () => {
    const { container } = render(<AgendaSpotlightCard now={sessionDate("11:36")} rehearsal />);
    expect(container.querySelectorAll(".agenda-carousel:not(.agenda-carousel--next) li")).toHaveLength(1);
    expect(container.querySelectorAll(".agenda-carousel--next li")).toHaveLength(7);
    expect(screen.getByText(/7 actividades empiezan a las 11:40/)).toBeInTheDocument();
  });

  it("automatically advances through parallel sessions and still allows manual navigation", () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });
    try {
      render(<AgendaSpotlightCard now={sessionDate("11:41")} rehearsal />);
      const current = screen.getByRole("list", { name: "Actividades en vivo" });
      const section = current.closest("section");
      expect(section).toHaveTextContent("1 de 8");
      act(() => vi.advanceTimersByTime(6000));
      expect(section).toHaveTextContent("2 de 8");
      expect(scrollTo).toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Ver más actividades: Actividades en vivo" }));
      expect(section).toHaveTextContent("3 de 8");
    } finally {
      vi.useRealTimers();
      if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
      else Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
    }
  });
});
