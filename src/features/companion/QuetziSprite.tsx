import { quetziStage } from "../../../shared/companion";
import "./quetzi.css";

export type QuetziMood = "idle" | "happy" | "celebrate";

type Props = {
  completed: number;
  mood?: QuetziMood;
  crop?: "full" | "head";
  /** Empty string marks the illustration as decorative. */
  label?: string;
  className?: string;
};

/** Smooth event-colored guide mark used wherever Geek appears. */
export function QuetziSprite({ completed, mood = "idle", crop = "full", label, className = "" }: Props) {
  const stage = quetziStage(completed);
  const isEgg = stage.level === 0;
  const classes = ["quetzi", `quetzi--${mood}`, `quetzi--level-${stage.level}`, isEgg && "quetzi--egg", className].filter(Boolean).join(" ");
  const a11y = label === "" ? { "aria-hidden": true } : { role: "img", "aria-label": label ?? `Geek, etapa ${stage.name}` };

  return <svg className={classes} viewBox={crop === "head" ? "18 10 62 62" : "0 0 96 96"} {...a11y}>
    <circle cx="48" cy="48" r="45" fill="#e9f5f3" />
    <circle cx="48" cy="48" r="44" fill="none" stroke="#b7ded8" strokeWidth="2" />
    {isEgg ? <g className="quetzi__body">
      <path d="M48 19C33 19 25 42 25 58c0 15 10 25 23 25s23-10 23-25C71 42 63 19 48 19Z" fill="#fff" stroke="#087b87" strokeWidth="3" />
      <path d="M32 64c7 5 25 6 33 0" fill="none" stroke="#70b946" strokeWidth="4" strokeLinecap="round" />
      <circle cx="39" cy="43" r="3" fill="#f69a21" />
    </g> : <g className="quetzi__body">
      {stage.level >= 2 && <g className="quetzi__tail" fill="none" strokeLinecap="round">
        <path d="M42 63C36 76 29 84 20 89" stroke="#087b87" strokeWidth="8" />
        <path d="M51 65C53 78 49 86 42 92" stroke="#70b946" strokeWidth="7" />
      </g>}
      <path d="M31 54c0-16 11-27 26-27 15 0 25 11 25 25 0 15-12 26-27 26-13 0-24-9-24-24Z" fill="#087b87" />
      <path className="quetzi__wing" d="M50 49c-5 8-4 18 5 25 14-1 22-10 25-21-10-7-20-8-30-4Z" fill="#70b946" />
      <path d="M31 50c-8-3-14-3-20 0l17 9c3-3 4-6 3-9Z" fill="#f69a21" />
      <path d="M31 40c1-12 11-20 22-20 10 0 18 7 19 17-10 8-26 12-41 3Z" fill="#159e91" />
      <circle cx="43" cy="39" r="5" fill="#fff" />
      <circle cx="44" cy="39" r="2.5" fill="#142c41" />
      <path d="M42 73c8 3 17 4 23 0" fill="none" stroke="#114b5d" strokeWidth="3" strokeLinecap="round" />
    </g>}
    {stage.level === 4 && crop === "full" && <g className="quetzi__sparkles" fill="#f69a21">
      <path d="M78 19l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" />
      <path d="M16 20l1.5 3.5L21 25l-3.5 1.5L16 30l-1.5-3.5L11 25l3.5-1.5L16 20Z" />
    </g>}
  </svg>;
}
