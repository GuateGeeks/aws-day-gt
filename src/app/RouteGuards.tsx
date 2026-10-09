import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { clockPreviewSearch } from "../features/companion/useNow";

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth(); const location = useLocation();
  if (loading) return <main className="page"><p role="status">Cargando tu experiencia…</p></main>;
  if (!user) return <Navigate to={`/login${clockPreviewSearch(location.search)}`} state={{ from: location.pathname }} replace />;
  if (!profile?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function StaffRoute() {
  const { profile } = useAuth();
  return profile?.role === "admin" || profile?.role === "moderator" ? <Outlet /> : <Navigate to="/app/challenges" replace />;
}
