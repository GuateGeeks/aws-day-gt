import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ alias: "Jose" }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { alias: auth.alias } }) }));
vi.mock("../../src/features/companion/FeatherCelebration", () => ({ FeatherCelebration: () => null }));
const { AppShell } = await import("../../src/app/AppShell");
afterEach(cleanup);

describe("AppShell skip link", () => {
  it("lands after the header and navigation at a focusable content container", () => {
    render(<MemoryRouter initialEntries={["/app/challenges"]}><Routes><Route path="/app" element={<AppShell />}><Route path="challenges" element={<h1>Contenido de retos</h1>} /></Route></Routes></MemoryRouter>);
    const skip = screen.getByRole("link", { name: "Saltar al contenido" });
    expect(skip).toHaveAttribute("href", "#content");
    const destination = document.getElementById("content");
    expect(destination).toHaveAttribute("tabindex", "-1");
    expect(within(destination!).getByRole("heading", { name: "Contenido de retos" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(destination!.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(destination!.contains(nav)).toBe(false);
  });

  it("uses the full GuateGeeks logo as the application mark", () => {
    render(<MemoryRouter initialEntries={["/app/challenges"]}><Routes><Route path="/app" element={<AppShell />}><Route path="challenges" element={<h1>Challenges</h1>} /></Route></Routes></MemoryRouter>);
    const brand = screen.getByRole("link", { name: /AWS Community Day Guatemala, creado por GuateGeeks/u });
    expect(brand.querySelector("img")).toHaveAttribute("src", "/brand/guategeeks.png");
  });

  it("shows the participant initial in a clearly named profile shortcut", () => {
    render(<MemoryRouter initialEntries={["/app/challenges"]}><Routes><Route path="/app" element={<AppShell />}><Route path="challenges" element={<h1>Challenges</h1>} /></Route></Routes></MemoryRouter>);
    const profile = screen.getByRole("link", { name: "Mi perfil" });
    expect(profile).toHaveAttribute("href", "/app/profile");
    expect(profile.querySelector(".header-profile__avatar")).toHaveTextContent("J");
  });
});
