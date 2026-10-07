import { Award, Bird, CalendarDays, CircleUserRound, ListChecks, Trophy } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { OFFICIAL_AGENDA_URL } from "../../shared/agenda";
import { FeatherCelebration } from "../features/companion/FeatherCelebration";
import { GeekEyesLogo } from "../features/auth/GeekEyesLogo";

const tabs = [
  { to: "/app/hoy", label: "Hoy", icon: Bird },
  { to: "/app/challenges", label: "Challenges", icon: ListChecks },
  { to: "/app/progress", label: "Progreso", icon: Award },
  { to: "/app/leaderboard", label: "Ranking", icon: Trophy }
];

export function AppShell() {
  return <>
    <a className="skip-link" href="#content">Saltar al contenido</a>
    <main className="page">
      <header className="app-header">
        <NavLink className="brand-mark" to="/app/hoy"><span className="brand-eyes"><GeekEyesLogo /></span><span>GuateGeeks <small className="brand-sub">Aura · AWS Day GT</small></span></NavLink>
        <a className="header-agenda" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer" aria-label="Agenda oficial (abre awscommunitygt.com)"><CalendarDays aria-hidden size={18} /><span className="header-agenda__text">Agenda oficial</span></a>
        <NavLink className="header-profile" to="/app/profile" aria-label="Perfil"><CircleUserRound aria-hidden size={26} /></NavLink>
      </header>
      <footer className="bottom-nav"><nav aria-label="Navegación principal">{tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}>{({ isActive }) => <><Icon aria-hidden size={22} strokeWidth={2.2} /><span>{label}</span>{isActive && <span className="sr-only">, página actual</span>}</>}</NavLink>)}</nav></footer>
      <div id="content" tabIndex={-1}><Outlet /></div>
    </main>
    <FeatherCelebration />
  </>;
}
