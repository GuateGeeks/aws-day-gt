import { Award, Bot, CalendarDays, ListChecks, Trophy, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { OFFICIAL_AGENDA_URL } from "../../shared/agenda";
import { FeatherCelebration } from "../features/companion/FeatherCelebration";
import { AgendaReminderCenter } from "../features/companion/AgendaReminderCenter";
import { useNow } from "../features/companion/useNow";
import { GuateGeeksLogo } from "../features/auth/GeekEyesLogo";
import { useAuth } from "../features/auth/AuthProvider";
import { ChallengeDataProvider } from "../features/challenges/useChallenges";

const tabs = [
  { to: "/app/hoy", label: "Hoy", icon: Bot },
  { to: "/app/challenges", label: "Challenges", icon: ListChecks },
  { to: "/app/progress", label: "Progreso", icon: Award },
  { to: "/app/leaderboard", label: "Ranking", icon: Trophy }
];

export function AppShell() {
  const now = useNow();
  const { profile } = useAuth();
  const initial = profile?.alias?.trim().slice(0, 1).toLocaleUpperCase("es-GT");
  return <ChallengeDataProvider>
    <a className="skip-link" href="#content">Saltar al contenido</a>
    <main className="page">
      <header className="app-header">
        <NavLink className="brand-mark" to="/app/hoy" aria-label="AWS Community Day Guatemala, creado por GuateGeeks"><GuateGeeksLogo className="brand-logo" /><span className="brand-copy"><span className="brand-title__full">AWS Community Day</span><span className="brand-title__short">AWS Day</span><small className="brand-sub">Guatemala · por GuateGeeks</small></span></NavLink>
        <a className="header-agenda" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer" aria-label="Agenda oficial (abre awscommunitygt.com)"><CalendarDays aria-hidden size={18} /><span className="header-agenda__text">Agenda oficial</span></a>
        <NavLink className="header-profile" to="/app/profile" aria-label="Mi perfil"><span className="header-profile__avatar">{initial || <UserRound aria-hidden size={20} />}</span><span className="header-profile__text">Mi perfil</span></NavLink>
      </header>
      <footer className="bottom-nav"><nav aria-label="Navegación principal">{tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}>{({ isActive }) => <><Icon aria-hidden size={22} strokeWidth={2.2} /><span>{label}</span>{isActive && <span className="sr-only">, página actual</span>}</>}</NavLink>)}</nav></footer>
      <div id="content" tabIndex={-1}><Outlet /></div>
    </main>
    <FeatherCelebration />
    <AgendaReminderCenter now={now} />
  </ChallengeDataProvider>;
}
