import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { clockPreviewSearch } from "../features/companion/useNow";

export function canOpenAdminConsole(profile: { role?: string; email?: string } | null | undefined): boolean {
  return profile?.role === "admin" && profile.email?.trim().toLowerCase() === "guategeeks3d@gmail.com";
}

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth(); const location = useLocation();
  if (loading) return <main className="page"><p role="status">Cargando tu experiencia…</p></main>;
  if (!user) return <Navigate to={`/login${clockPreviewSearch(location.search)}`} state={{ from: location.pathname }} replace />;
  if (!profile?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function StaffRoute() {
  const { profile } = useAuth();
  return canOpenAdminConsole(profile) ? <Outlet /> : <Navigate to="/app/challenges" replace />;
}
