import { quetziStage } from "../../../shared/companion";
import "./quetzi.css";

export type QuetziMood = "idle" | "happy" | "celebrate";

type Props = {
  completed: number;
  mood?: QuetziMood;
  crop?: "full" | "head";
  label?: string;
  className?: string;
};

/** The GuateGeeks eyes are Geek's complete, transparent icon. */
export function QuetziSprite({ completed, mood = "idle", label, className = "" }: Props) {
  const stage = quetziStage(completed);
  const classes = ["quetzi", `quetzi--${mood}`, `quetzi--level-${stage.level}`, className].filter(Boolean).join(" ");
  return <img className={classes} src="/brand/geek-eyes.png" alt={label === "" ? "" : label ?? `Geek, etapa ${stage.name}`} aria-hidden={label === "" ? true : undefined} />;
}
