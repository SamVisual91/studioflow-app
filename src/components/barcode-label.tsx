const code39Patterns: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  $: "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

function normalizeCode39(value: string) {
  const upper = value.toUpperCase().trim();
  return upper
    .split("")
    .filter((char) => code39Patterns[char])
    .join("");
}

function buildCode39Bars(input: string) {
  const value = `*${normalizeCode39(input)}*`;
  const narrow = 2;
  const wide = 5;
  const barHeight = 56;
  const gap = 2;
  const quietZone = 10;
  let x = quietZone;
  const rects: Array<{ x: number; width: number }> = [];

  for (const char of value) {
    const pattern = code39Patterns[char];
    if (!pattern) {
      continue;
    }

    pattern.split("").forEach((segment, index) => {
      const width = segment === "w" ? wide : narrow;
      const isBar = index % 2 === 0;

      if (isBar) {
        rects.push({ x, width });
      }

      x += width;
      if (index < pattern.length - 1) {
        x += gap;
      }
    });

    x += narrow * 2;
  }

  return { rects, width: x + quietZone, height: barHeight };
}

export function BarcodeLabel({
  value,
  compact = false,
  small = false,
}: {
  value: string;
  compact?: boolean;
  small?: boolean;
}) {
  const safeValue = normalizeCode39(value || "");

  if (!safeValue) {
    return <span className="text-xs text-[var(--muted)]">No barcode</span>;
  }

  const { rects, width, height } = buildCode39Bars(safeValue);

  return (
    <div
      className={`border border-black/[0.08] bg-white ${
        small ? "p-1.5" : compact ? "p-2" : "p-3"
      }`}
    >
      <svg
        aria-label={`Barcode ${safeValue}`}
        className={small ? "h-9 w-full" : "h-14 w-full"}
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <rect fill="white" height={height} width={width} x="0" y="0" />
        {rects.map((rect) => (
          <rect fill="black" height={height} key={`${rect.x}-${rect.width}`} width={rect.width} x={rect.x} y="0" />
        ))}
      </svg>
      <p
        className={`mt-2 font-mono tracking-[0.16em] text-[var(--ink)] ${
          small ? "text-[9px]" : compact ? "text-[10px]" : "text-xs"
        }`}
      >
        {safeValue}
      </p>
    </div>
  );
}
