import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "../../shared/types";

const mocks = vi.hoisted(() => ({
  profile: null as UserProfile | null,
  user: { email: "joaquin@example.com" },
  saveChallengeProfile: vi.fn(async () => ({ data: { saved: true } })),
  deleteRequest: vi.fn(async () => ({ data: { requested: true } }))
}));

vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn((_functions, name: string) => name === "setChallengeProfile" ? mocks.saveChallengeProfile : mocks.deleteRequest) }));
vi.mock("../../src/firebase/functions", () => ({ functions: {} }));
vi.mock("../../src/firebase/auth", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(async () => undefined) }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ user: mocks.user, profile: mocks.profile }) }));

const { ProfilePage } = await import("../../src/features/profile/ProfilePage");

afterEach(() => {
  cleanup();
  mocks.profile = null;
  mocks.saveChallengeProfile.mockClear();
  mocks.deleteRequest.mockClear();
});

function renderPage() { render(<MemoryRouter><ProfilePage /></MemoryRouter>); }

describe("ProfilePage", () => {
  it("shows saved account, Challenge interests, and read-only consent details", () => {
    mocks.profile = {
      uid: "user-1", email: "joaquin@example.com", alias: "JoaquinGT", aliasNormalized: "joaquingt", role: "participant", interests: [],
      primaryRole: "Cloud", experienceLevel: "Mid", firstAwsCommunityDay: false, awsInterest: ["Serverless", "Architecture"],
      consent: { termsVersion: "2026-10-04", acceptedAt: "2026-10-04T14:30:00.000Z", photoPublication: true, marketing: false },
      onboardingComplete: true, replacementsUsed: 0, createdAt: "2026-10-04T14:30:00.000Z", lastLoginAt: "2026-10-04T14:30:00.000Z"
    };

    renderPage();

    expect(screen.getByRole("heading", { name: "JoaquinGT" })).toBeInTheDocument();
    expect(screen.getByText("jo•••@example.com")).toBeInTheDocument();
    expect(screen.getByText("Tu perfil para Challenges")).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(screen.getByText("No, ya había asistido")).toBeInTheDocument();
    expect(screen.getByText("Serverless, Architecture")).toBeInTheDocument();
    expect(screen.getByText("Privacidad y consentimiento")).toBeInTheDocument();
    expect(screen.getByText("4 de octubre de 2026")).toBeInTheDocument();
    expect(screen.getByText("Permitido")).toBeInTheDocument();
    expect(screen.getByText("No desea recibir novedades")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tu área principal")).not.toBeInTheDocument();
  });

  it("lets a participant with an incomplete legacy profile finish Challenges fields", async () => {
    mocks.profile = {
      uid: "user-2", email: "joaquin@example.com", alias: "JoaquinGT", aliasNormalized: "joaquingt", role: "participant", interests: [],
      consent: undefined as unknown as UserProfile["consent"],
      onboardingComplete: true, replacementsUsed: 0, createdAt: "2026-10-04T14:30:00.000Z", lastLoginAt: "2026-10-04T14:30:00.000Z"
    };

    renderPage();
    expect(screen.getByLabelText("Tu área principal")).toHaveValue("");
    expect(screen.getAllByText("No configurado").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Tu área principal"), { target: { value: "Data" } });
    fireEvent.change(screen.getByLabelText("Tu nivel de experiencia"), { target: { value: "Junior" } });
    fireEvent.change(screen.getByLabelText("¿Es tu primer AWS Community Day?"), { target: { value: "true" } });
    fireEvent.click(screen.getByLabelText("AI / Bedrock"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar perfil" }));

    expect(mocks.saveChallengeProfile).toHaveBeenCalledWith({
      primaryRole: "Data", experienceLevel: "Junior", firstAwsCommunityDay: true, awsInterest: ["AI / Bedrock"]
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Perfil de Challenges guardado.");
  });

  it("shows the administration console only to the authorized owner account", () => {
    mocks.profile = {
      uid: "owner", email: "guategeeks3d@gmail.com", alias: "GuateGeeks", aliasNormalized: "guategeeks", role: "admin", interests: [],
      primaryRole: "Cloud", experienceLevel: "Senior", firstAwsCommunityDay: false, awsInterest: ["Architecture"],
      consent: { termsVersion: "2026-10-04", acceptedAt: "2026-10-04T14:30:00.000Z", photoPublication: true, marketing: false },
      onboardingComplete: true, replacementsUsed: 0, createdAt: "2026-10-04T14:30:00.000Z", lastLoginAt: "2026-10-04T14:30:00.000Z"
    };
    renderPage();
    expect(screen.getByRole("button", { name: "Abrir consola del evento" })).toBeInTheDocument();

    cleanup();
    mocks.profile = { ...mocks.profile, uid: "moderator", email: "moderator@example.com", role: "moderator" };
    renderPage();
    expect(screen.queryByRole("button", { name: "Abrir consola del evento" })).not.toBeInTheDocument();
  });
});
