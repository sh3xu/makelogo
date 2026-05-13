export type CanvasTheme = "light" | "dark";

export interface CanvasThemeColors {
  checkerA: string;
  checkerB: string;
  gridLine: string;
}

// NOTE: defaults mirror the dark palette in styles.css and act as fallbacks
// when CSS variables are unavailable (e.g. during SSR or first paint).
const DARK_FALLBACK: CanvasThemeColors = {
  checkerA: "#18181c",
  checkerB: "#141417",
  gridLine: "rgba(255, 255, 255, 0.05)",
};

const LIGHT_FALLBACK: CanvasThemeColors = {
  checkerA: "#d8d8e0",
  checkerB: "#e4e4ec",
  gridLine: "rgba(0, 0, 0, 0.06)",
};

function readCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value.trim();
}

export function getCanvasThemeColors(theme: CanvasTheme): CanvasThemeColors {
  const fallback = theme === "light" ? LIGHT_FALLBACK : DARK_FALLBACK;
  const checkerA = readCssVar("--checker-a") || fallback.checkerA;
  const checkerB = readCssVar("--checker-b") || fallback.checkerB;
  const gridLine = theme === "light" ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.05)";
  return { checkerA, checkerB, gridLine };
}
