import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QuetziSprite, type QuetziMood } from "./QuetziSprite";

type Props = {
  completed: number;
  summary: string;
  detail: string;
  mission?: { id: string; title: string };
  loading?: boolean;
  mood?: QuetziMood;
};

/** Interactive Quetzi that expands the current event context without navigating unexpectedly. */
export function QuetziGuide({ completed, summary, detail, mission, loading = false, mood }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [reacting, setReacting] = useState(false);
  useEffect(() => {
    if (!reacting) return;
    const timer = window.setTimeout(() => setReacting(false), 900);
    return () => window.clearTimeout(timer);
  }, [reacting]);

  function toggle() {
    setExpanded((value) => !value);
    setReacting(true);
  }

  return <div className={`quetzi-guide ${expanded ? "quetzi-guide--expanded" : ""}`}>
    <button type="button" className="quetzi-guide__bird" onClick={toggle} aria-expanded={expanded} aria-controls="quetzi-current-detail" aria-label={`${expanded ? "Contraer" : "Ampliar"} información de Quetzi`}>
      <QuetziSprite completed={completed} mood={reacting ? "happy" : mood ?? "idle"} />
    </button>
    <div className="speech-bubble" aria-live="polite" aria-busy={loading || undefined}>
      <span className="speech-bubble__name">Quetzi</span>
      <strong>{summary}</strong>
      {expanded && <div id="quetzi-current-detail" className="speech-bubble__detail">
        <p>{detail}</p>
        {mission && <Link className="ds-button speech-bubble__action" to={`/app/missions/${mission.id}`} aria-label={`Comenzar misión: ${mission.title}`}>Comenzar misión</Link>}
      </div>}
      <span className="speech-bubble__hint">{expanded ? "Tócame para resumir" : "Tócame para saber más"}</span>
    </div>
  </div>;
}
