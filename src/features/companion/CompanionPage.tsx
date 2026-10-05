import { PartyPopper } from "lucide-react";
import { getCurrentMoment } from "../../../shared/companion";
import { Card } from "../../design-system/components";
import { useAuth } from "../auth/AuthProvider";
import { useMissions } from "../missions/useMissions";
import { CountdownCard, FeatherCard, OfficialAgendaLink } from "./CompanionCards";
import { QuetziGuide } from "./QuetziGuide";
import { useNow } from "./useNow";
import "./companion.css";

export function CompanionPage() {
  const { profile } = useAuth();
  const { items, loading } = useMissions();
  const now = useNow();
  const active = items.filter((item) => item.status !== "replaced");
  const completed = active.filter((item) => item.status === "approved").length;
  const moment = getCurrentMoment({ now, items: active, loading, alias: profile?.alias });

  return <section className="stack companion">
    <header className="companion__heading">
      <p className="eyebrow">AWS Community Day Guatemala 2026</p>
      <h1>En este momento</h1>
    </header>
    <QuetziGuide completed={completed} summary={moment.summary} detail={moment.detail} loading={moment.loading} mission={moment.mission ? { id: moment.mission.missionId, title: moment.mission.mission.title } : undefined} />
    {moment.phase === "pre" && <CountdownCard now={now} />}
    {moment.phase === "live" && <Card className="companion-now" aria-label="Estado actual"><span className="companion-now__pulse" aria-hidden />En curso ahora</Card>}
    {moment.phase === "post" && <Card className="stack companion-card"><h2><PartyPopper aria-hidden size={20} /> ¡Gracias por venir!</h2><p className="muted">Gracias por ser parte de la comunidad AWS de Guatemala.</p><OfficialAgendaLink>Repasa la agenda oficial</OfficialAgendaLink></Card>}
    <FeatherCard completed={completed} />
  </section>;
}
