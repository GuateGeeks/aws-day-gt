import { quetziStage } from "../../../shared/companion";
import { BIRD_ROWS, BRANCH, EGG_ROWS, QUETZI_PALETTE, SPRITE_HEIGHT, SPRITE_WIDTH, rowsToPixels, tailPixels, type Pixel } from "./quetzi-pixels";
import "./quetzi.css";

export type QuetziMood = "idle" | "happy" | "celebrate";

type Props = {
  completed: number;
  mood?: QuetziMood;
  crop?: "full" | "head";
  /** Empty string marks the sprite as decorative. */
  label?: string;
  className?: string;
};

const SPARKLES = [[1, 1], [16, 3], [18, 12], [2, 20], [17, 26]] as const;

function Run({ pixel }: { pixel: Pixel }) {
  return <rect x={pixel.x} y={pixel.y} width={pixel.width} height={1} fill={pixel.color} />;
}

function Layer({ pixels, className }: { pixels: Pixel[]; className?: string }) {
  return <g className={className}>{pixels.map((pixel) => <Run key={`${pixel.x}-${pixel.y}-${pixel.color}`} pixel={pixel} />)}</g>;
}

export function QuetziSprite({ completed, mood = "idle", crop = "full", label, className = "" }: Props) {
  const stage = quetziStage(completed);
  const isEgg = stage.level === 0;
  const rows = isEgg ? EGG_ROWS : BIRD_ROWS;
  const pixels = rowsToPixels(rows, 2).filter((pixel) => stage.level >= 2 || pixel.part !== "crest");
  const viewBox = crop === "head" ? "3 0 13 13" : `0 0 ${SPRITE_WIDTH} ${SPRITE_HEIGHT}`;
  const classes = ["quetzi", `quetzi--${mood}`, `quetzi--level-${stage.level}`, isEgg && "quetzi--egg", className].filter(Boolean).join(" ");
  const a11y = label === "" ? { "aria-hidden": true } : { role: "img", "aria-label": label ?? `Geek, etapa ${stage.name}` };
  return <svg className={classes} viewBox={viewBox} shapeRendering="crispEdges" {...a11y}>
    <g className="quetzi__body">
      {!isEgg && <Layer className="quetzi__tail" pixels={tailPixels(Math.min(completed, 10))} />}
      {crop === "full" && <Run pixel={BRANCH} />}
      <Layer pixels={pixels.filter((pixel) => pixel.part === "body" || pixel.part === "crest")} />
      <Layer className="quetzi__wing" pixels={pixels.filter((pixel) => pixel.part === "wing")} />
      <Layer className="quetzi__eye" pixels={pixels.filter((pixel) => pixel.part === "eye")} />
    </g>
    {stage.level === 4 && crop === "full" && <g className="quetzi__sparkles">{SPARKLES.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y}h1v1h-1zM${x - 1} ${y + 1}h1v1h-1zM${x + 1} ${y + 1}h1v1h-1zM${x} ${y + 2}h1v1h-1z`} fill={QUETZI_PALETTE.Y} />)}</g>}
  </svg>;
}
