import { Navigate, createBrowserRouter } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AppShell } from "./AppShell";
import { ProtectedRoute, StaffRoute } from "./RouteGuards";
import { AuthCompletePage } from "../features/auth/AuthCompletePage";
import { LandingPage } from "../features/auth/LandingPage";
import { LoginPage } from "../features/auth/LoginPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";

const AdminPage = lazy(() => import("../features/admin/AdminPage").then((module) => ({ default: module.AdminPage })));
const CompanionPage = lazy(() => import("../features/companion/CompanionPage").then((module) => ({ default: module.CompanionPage })));
const LeaderboardPage = lazy(() => import("../features/leaderboard/LeaderboardPage").then((module) => ({ default: module.LeaderboardPage })));
const ProfilePage = lazy(() => import("../features/profile/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const ProgressPage = lazy(() => import("../features/progress/ProgressPage").then((module) => ({ default: module.ProgressPage })));
const ChallengesPage = lazy(() => import("../features/challenges/ChallengesPage").then((module) => ({ default: module.ChallengesPage })));
const ChallengeDetailPage = lazy(() => import("../features/challenges/ChallengeDetailPage").then((module) => ({ default: module.ChallengeDetailPage })));
const GeekIdPage = lazy(() => import("../features/challenges/GeekIdPage").then((module) => ({ default: module.GeekIdPage })));

function Deferred({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p role="status">Preparando esta sección…</p>}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/prototipo-sala-aura.html", element: <Navigate to="/app/challenges/C08" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/auth/complete", element: <AuthCompletePage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { element: <ProtectedRoute />, children: [
    { path: "/app", element: <AppShell />, children: [
      { index: true, element: <Navigate to="hoy" replace /> },
      { path: "hoy", element: <Deferred><CompanionPage /></Deferred> },
      { path: "agenda", element: <Navigate to="/app/hoy" replace /> },
      { path: "challenges", element: <Deferred><ChallengesPage /></Deferred> },
      { path: "challenges/:challengeId", element: <Deferred><ChallengeDetailPage /></Deferred> },
      { path: "geek-id", element: <Deferred><GeekIdPage /></Deferred> },
      { path: "missions", element: <Navigate to="/app/challenges" replace /> },
      { path: "missions/:missionId", element: <Navigate to="/app/challenges" replace /> },
      { path: "progress", element: <Deferred><ProgressPage /></Deferred> },
      { path: "leaderboard", element: <Deferred><LeaderboardPage /></Deferred> },
      { path: "profile", element: <Deferred><ProfilePage /></Deferred> }
    ] },
    { element: <StaffRoute />, children: [{ path: "/admin", element: <Deferred><AdminPage /></Deferred> }] }
  ] },
  { path: "*", element: <Navigate to="/" replace /> }
]);
