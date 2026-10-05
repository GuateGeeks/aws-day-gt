import { Award, Bird, CalendarDays, CircleUserRound, ListChecks, Trophy } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { FeatherCelebration } from "../features/companion/FeatherCelebration";
import { QuetziSprite } from "../features/companion/QuetziSprite";

const tabs = [
  { to: "/app/hoy", label: "Hoy", icon: Bird },
  { to: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/app/missions", label: "Misiones", icon: ListChecks },
  { to: "/app/progress", label: "Progreso", icon: Award },
  { to: "/app/leaderboard", label: "Ranking", icon: Trophy }
];

export function AppShell() {
  return <>
    <a className="skip-link" href="#main">Saltar al contenido</a>
    <main className="page" id="main" tabIndex={-1}>
      <header className="app-header">
        <NavLink className="brand-mark" to="/app/hoy"><span className="brand-cloud"><QuetziSprite completed={11} crop="head" label="" /></span><span>AWS Day GT <small className="brand-sub">con Quetzi</small></span></NavLink>
        <NavLink className="header-profile" to="/app/profile" aria-label="Perfil"><CircleUserRound aria-hidden size={26} /></NavLink>
      </header>
      <Outlet />
    </main>
    <FeatherCelebration />
    <footer className="bottom-nav"><nav aria-label="Navegación principal">{tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}>{({ isActive }) => <><Icon aria-hidden size={22} strokeWidth={2.2} /><span>{label}</span>{isActive && <span className="sr-only">, página actual</span>}</>}</NavLink>)}</nav></footer>
  </>;
}
