// Pixel-art Quetzi, inspired by the AWS Community Day Guatemala quetzal.
// One character per pixel; "." is transparent. Wing ("L") and eye ("K"/"W") pixels are animated separately.

export const QUETZI_PALETTE: Record<string, string> = {
  c: "#6fd14f",
  G: "#1f9d55",
  D: "#0f6a3c",
  L: "#8ee05a",
  R: "#d7263d",
  r: "#9e1b2e",
  Y: "#f6c21a",
  K: "#10131a",
  W: "#ffffff",
  O: "#e58a2c",
  b: "#7a4a2a",
  T: "#1fb5a8",
  B: "#1d6fb8",
  N: "#17233c",
  E: "#f4ecd6",
  s: "#1f9d55",
  n: "#a0703c"
};

export const SPRITE_WIDTH = 20;
export const SPRITE_HEIGHT = 42;
export const BRANCH_ROW = 15;

export const BIRD_ROWS = [
  "......cc........",
  ".....cGGc.......",
  "....GGGGGG......",
  "...GGWKGGGG.....",
  "..YYGKKGGGGD....",
  ".YYYGGGGGGGDD...",
  "...RGGGGLLGGDD..",
  "...RRGGLLLLGGDD.",
  "...RRRGLLLLLGGD.",
  "...RRRRGLLLLLGD.",
  "....RRRrGLLLLGD.",
  ".....RRRrGLLLGD.",
  "......RRrGGGGD..",
  ".......rrGGDD...",
  "........O..O...."
];

export const EGG_ROWS = [
  "................",
  "................",
  "................",
  "................",
  "......EEEE......",
  ".....EEEEEE.....",
  "....EEsEEEEE....",
  "....EEEEEsEE....",
  "...EEEEEEEEEE...",
  "...EsEEEEEEsE...",
  "...EEEEsEEEEE...",
  "...EEEEEEEEEE...",
  "....EEEEEEEE....",
  "..nnnEEEEEEnnn..",
  ".nnnnnnnnnnnnnn."
];

export type Pixel = { x: number; y: number; width: number; color: string; part: "body" | "wing" | "eye" | "crest" };

function partFor(char: string): Pixel["part"] {
  if (char === "L") return "wing";
  if (char === "K" || char === "W") return "eye";
  if (char === "c") return "crest";
  return "body";
}

/** Converts rows into horizontal runs so the SVG stays small. */
export function rowsToPixels(rows: readonly string[], offsetX = 0, offsetY = 0): Pixel[] {
  return rows.flatMap((row, y) => {
    const runs: Pixel[] = [];
    let x = 0;
    while (x < row.length) {
      const char = row.charAt(x);
      let end = x + 1;
      while (end < row.length && row.charAt(end) === char) end += 1;
      const color = QUETZI_PALETTE[char];
      if (color) runs.push({ x: x + offsetX, y: y + offsetY, width: end - x, color, part: partFor(char) });
      x = end;
    }
    return runs;
  });
}

const TAIL_COLORS = ["D", "D", "G", "G", "T", "T", "T", "B", "B", "B", "B", "N"];

/** Two long streamers plus a short covert feather. Length grows with completed missions. */
export function tailPixels(feathers: number): Pixel[] {
  const length = 2 + Math.min(11, Math.max(0, feathers)) * 2;
  const start = BRANCH_ROW + 1;
  const feather = (column: number, size: number) => Array.from({ length: size }, (_, index) => {
    const colorKey = TAIL_COLORS[Math.min(TAIL_COLORS.length - 1, Math.floor(index / size * TAIL_COLORS.length))] ?? "N";
    return { x: column + Math.floor(index / 5), y: start + index - 3, width: 1, color: QUETZI_PALETTE[colorKey] ?? "#17233c", part: "body" as const };
  });
  return [...feather(10, Math.min(length, 4)), ...feather(11, length), ...feather(12, length)];
}

export const BRANCH: Pixel = { x: 0, y: BRANCH_ROW, width: SPRITE_WIDTH, color: "#7a4a2a", part: "body" };
