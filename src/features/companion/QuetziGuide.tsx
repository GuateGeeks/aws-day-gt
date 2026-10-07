import { useEffect, useState } from "react";
import { QuetziSprite, type QuetziMood } from "./QuetziSprite";

type Props = { completed: number; line: string; onTap?: () => void; mood?: QuetziMood };

/** Interactive Quetzi with a speech bubble. Tapping makes Quetzi flap and say something new. */
export function QuetziGuide({ completed, line, onTap, mood }: Props) {
  const [reacting, setReacting] = useState(false);
  useEffect(() => {
    if (!reacting) return;
    const timer = window.setTimeout(() => setReacting(false), 900);
    return () => window.clearTimeout(timer);
  }, [reacting]);
  function tap() { setReacting(true); onTap?.(); }
  return <div className="quetzi-guide">
    <button type="button" className="quetzi-guide__bird" onClick={tap} aria-label="Toca a Geek para escuchar otro consejo">
      <QuetziSprite completed={completed} mood={reacting ? "happy" : mood ?? "idle"} label="Geek" />
    </button>
    <p className="speech-bubble" aria-live="polite">
      <span className="speech-bubble__name">Geek</span>
      {line}
      <span className="speech-bubble__hint">Tócame para otro consejo</span>
    </p>
  </div>;
}
