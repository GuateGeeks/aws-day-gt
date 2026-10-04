import { Award, CircleUserRound, Cloud, ListChecks, Trophy } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/app/missions", label: "Misiones", icon: ListChecks },
  { to: "/app/progress", label: "Progreso", icon: Award },
  { to: "/app/leaderboard", label: "Ranking", icon: Trophy },
  { to: "/app/profile", label: "Perfil", icon: CircleUserRound }
];

export function AppShell() {
  return <>
    <a className="skip-link" href="#main">Saltar al contenido</a>
    <main className="page" id="main" tabIndex={-1}>
      <header className="app-header">
        <NavLink className="brand-mark" to="/app/missions"><span className="brand-cloud"><Cloud aria-hidden size={24} /></span><span>AWS Day GT</span></NavLink>
      </header>
      <Outlet />
    </main>
    <footer className="bottom-nav"><nav aria-label="Navegación principal">{tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}>{({ isActive }) => <><Icon aria-hidden size={22} strokeWidth={2.2} /><span>{label}</span>{isActive && <span className="sr-only">, página actual</span>}</>}</NavLink>)}</nav></footer>
  </>;
}
