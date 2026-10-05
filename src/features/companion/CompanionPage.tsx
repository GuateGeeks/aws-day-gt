import { PartyPopper } from "lucide-react";
import { useState } from "react";
import { getEventPhase, nextSessions, pickChallenge, quetziLine, sessionsAt } from "../../../shared/companion";
import { Card } from "../../design-system/components";
import { useMyRoute } from "../agenda/useMyRoute";
import { useAuth } from "../auth/AuthProvider";
import { useMissions } from "../missions/useMissions";
import { ChallengeCard, CountdownCard, FeatherCard, NowNextCard, RoomGuide } from "./CompanionCards";
import { QuetziGuide } from "./QuetziGuide";
import { useNow } from "./useNow";
import "./companion.css";

export function CompanionPage() {
  const { profile } = useAuth(); const { items } = useMissions(); const now = useNow(); const route = useMyRoute();
  const [taps, setTaps] = useState(0);
  const phase = getEventPhase(now);
  const active = items.filter((item) => item.status !== "replaced");
  const completed = active.filter((item) => item.status === "approved").length;
  const line = quetziLine({ phase, alias: profile?.alias, now, tap: taps });
  const current = sessionsAt(now); const next = nextSessions(now);

  return <section className="stack companion">
    <p className="eyebrow">AWS Community Day Guatemala 2026</p>
    <QuetziGuide completed={completed} line={line} onTap={() => setTaps((count) => count + 1)} />
    {phase === "pre" && <CountdownCard now={now} routeCount={route.ids.length} />}
    {phase === "live" && (current.length > 0 || next.length > 0) && <NowNextCard now={now} current={current} next={next} isStarred={route.has} />}
    {phase === "post" && <Card className="stack companion-card"><h2><PartyPopper aria-hidden size={20} /> ¡Gracias por venir!</h2><p className="muted">Gracias por ser parte de la comunidad AWS de Guatemala. Nos vemos en el próximo Community Day.</p></Card>}
    {phase !== "post" && <ChallengeCard item={pickChallenge(active, now)} />}
    <FeatherCard completed={completed} />
    <RoomGuide />
  </section>;
}
