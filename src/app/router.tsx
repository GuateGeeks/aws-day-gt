import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { ProtectedRoute, StaffRoute } from "./RouteGuards";
import { AdminPage } from "../features/admin/AdminPage";
import { AuthCompletePage } from "../features/auth/AuthCompletePage";
import { LandingPage } from "../features/auth/LandingPage";
import { LoginPage } from "../features/auth/LoginPage";
import { LeaderboardPage } from "../features/leaderboard/LeaderboardPage";
import { MissionDetailPage } from "../features/missions/MissionDetailPage";
import { MissionsPage } from "../features/missions/MissionsPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { ProgressPage } from "../features/progress/ProgressPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/auth/complete", element: <AuthCompletePage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { element: <ProtectedRoute />, children: [
    { path: "/app", element: <AppShell />, children: [
      { index: true, element: <Navigate to="missions" replace /> },
      { path: "missions", element: <MissionsPage /> },
      { path: "missions/:missionId", element: <MissionDetailPage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
      { path: "profile", element: <ProfilePage /> }
    ] },
    { element: <StaffRoute />, children: [{ path: "/admin", element: <AdminPage /> }] }
  ] },
  { path: "*", element: <Navigate to="/" replace /> }
]);
