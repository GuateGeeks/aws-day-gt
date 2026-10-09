import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { ProtectedRoute, StaffRoute } from "./RouteGuards";
import { AdminPage } from "../features/admin/AdminPage";
import { AuthCompletePage } from "../features/auth/AuthCompletePage";
import { CompanionPage } from "../features/companion/CompanionPage";
import { LandingPage } from "../features/auth/LandingPage";
import { LoginPage } from "../features/auth/LoginPage";
import { LeaderboardPage } from "../features/leaderboard/LeaderboardPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { ProgressPage } from "../features/progress/ProgressPage";
import { ChallengesPage } from "../features/challenges/ChallengesPage";
import { ChallengeDetailPage } from "../features/challenges/ChallengeDetailPage";
import { GeekIdPage } from "../features/challenges/GeekIdPage";
import { LiveEventPage } from "../features/live/LiveEventPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/prototipo-sala-aura.html", element: <Navigate to="/app/challenges/C08" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/auth/complete", element: <AuthCompletePage /> },
  { path: "/live", element: <LiveEventPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { element: <ProtectedRoute />, children: [
    { path: "/app", element: <AppShell />, children: [
      { index: true, element: <Navigate to="hoy" replace /> },
      { path: "hoy", element: <CompanionPage /> },
      { path: "agenda", element: <Navigate to="/app/hoy" replace /> },
      { path: "challenges", element: <ChallengesPage /> },
      { path: "challenges/:challengeId", element: <ChallengeDetailPage /> },
      { path: "geek-id", element: <GeekIdPage /> },
      { path: "missions", element: <Navigate to="/app/challenges" replace /> },
      { path: "missions/:missionId", element: <Navigate to="/app/challenges" replace /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
      { path: "profile", element: <ProfilePage /> }
    ] },
    { element: <StaffRoute />, children: [{ path: "/admin", element: <AdminPage /> }] }
  ] },
  { path: "*", element: <Navigate to="/" replace /> }
]);
