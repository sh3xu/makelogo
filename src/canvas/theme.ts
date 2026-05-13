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

// NOTE: read from a specific element so the nearest [data-theme]
function readCssVar(name: string, element: Element | null): string {
  if (typeof window === "undefined" || !element) return "";
  const value = getComputedStyle(element).getPropertyValue(name);
  return value.trim();
}

export function getCanvasThemeColors(
  theme: CanvasTheme,
  element: Element | null = typeof document !== "undefined" ? document.body : null,
): CanvasThemeColors {
  const fallback = theme === "light" ? LIGHT_FALLBACK : DARK_FALLBACK;
  const checkerA = readCssVar("--checker-a", element) || fallback.checkerA;
  const checkerB = readCssVar("--checker-b", element) || fallback.checkerB;
  const gridLine = theme === "light" ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.05)";
  return { checkerA, checkerB, gridLine };
}
