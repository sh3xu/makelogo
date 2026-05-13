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

// NOTE: theme tokens are scoped to [data-theme] on `.app-shell`, not on <html>.
// Callers must pass an element inside the themed subtree (e.g. the canvas)
// so CSS custom property inheritance resolves the active theme correctly.
function readCssVar(name: string, element: Element | null): string {
  if (typeof window === "undefined" || !element) return "";
  return getComputedStyle(element).getPropertyValue(name).trim();
}

export function getCanvasThemeColors(
  theme: CanvasTheme,
  element: Element | null,
): CanvasThemeColors {
  const fallback = theme === "light" ? LIGHT_FALLBACK : DARK_FALLBACK;
  return {
    checkerA: readCssVar("--checker-a", element) || fallback.checkerA,
    checkerB: readCssVar("--checker-b", element) || fallback.checkerB,
    gridLine: fallback.gridLine,
  };
}
