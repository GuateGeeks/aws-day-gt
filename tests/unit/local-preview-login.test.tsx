import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  localAuth: true,
  signInAnonymously: vi.fn(async () => ({ user: { uid: "localuser12345678" } })),
  signOut: vi.fn(async () => undefined),
  completeOnboarding: vi.fn(async (_data: unknown) => ({ data: { assigned: true } }))
}));

vi.mock("firebase/auth", () => ({ sendSignInLinkToEmail: vi.fn(), signInAnonymously: mocks.signInAnonymously, signOut: mocks.signOut }));
vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn((_functions, name: string) => name === "completeOnboarding" ? mocks.completeOnboarding : vi.fn()) }));
vi.mock("../../src/firebase/auth", () => ({ auth: {} }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));
vi.mock("../../src/firebase/app", () => ({ get useFirebaseEmulators() { return mocks.localAuth; } }));
vi.mock("../../src/features/auth/GeekEyesLogo", () => ({ GeekBrandPanel: () => null }));

const { LoginPage } = await import("../../src/features/auth/LoginPage");

function CurrentPath() { return <output>{useLocation().pathname}</output>; }
function renderPage() { render(<MemoryRouter initialEntries={["/login"]}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/app/hoy" element={<CurrentPath />} /></Routes></MemoryRouter>); }

beforeEach(() => {
  mocks.localAuth = true;
  mocks.signInAnonymously.mockClear();
  mocks.signOut.mockClear();
  mocks.completeOnboarding.mockClear();
});
afterEach(cleanup);

describe("local preview access", () => {
  it("creates an emulator-only participant and opens the experience without email login", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Entrar como participante de prueba" }));

    await waitFor(() => expect(screen.getByText("/app/hoy")).toBeInTheDocument());
    expect(mocks.signInAnonymously).toHaveBeenCalledOnce();
    expect(mocks.completeOnboarding).toHaveBeenCalledWith(expect.objectContaining({
      alias: expect.stringMatching(/^demo-[a-z0-9]+$/),
      interests: [],
      challengeProfile: expect.objectContaining({ primaryRole: "Cloud", experienceLevel: "Mid" }),
      consent: expect.objectContaining({ accepted: true })
    }));
  });

  it("does not show the local preview access when Firebase emulators are disabled", () => {
    mocks.localAuth = false;
    renderPage();
    expect(screen.queryByRole("button", { name: "Entrar como participante de prueba" })).not.toBeInTheDocument();
  });
});
