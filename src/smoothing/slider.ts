import { useCallback, useEffect, useRef, useState } from "react";
import type { Grid } from "../models/grid";
import type { LayerManager } from "../models/layers";
import { type SmoothedPath, smoothContour, smoothContourSubdivision, smoothContourHandbrush } from "./bezier";
import { extractAllLayerContours } from "./multicolor";
import type { Contour } from "./contour";

export interface SmoothedLayerResult {
  layerId: string;
  paths: Array<SmoothedPath & { color: string }>;
  rotation: number;
}

export type SmoothingMode = "pixel" | "squircle" | "smooth" | "handbrush";

// Each mode declares its own smoother + stylizer + alpha transform — no external conditions
const MODE_CONFIG: Record<
  SmoothingMode,
  {
    smoother: (contour: Contour, alpha: number) => SmoothedPath;
    alphaTransform: (a: number) => number;
  }
> = {
  pixel:     { smoother: smoothContour,             alphaTransform: () => 0  },
  squircle:  { smoother: smoothContour,             alphaTransform: (a) => a },
  smooth:    { smoother: smoothContourSubdivision,  alphaTransform: (a) => a },
  handbrush: { smoother: smoothContourHandbrush,    alphaTransform: (a) => a },
  //              ↑ owns its entire pipeline, no stylizer needed at all
};

export function computeSmoothedPaths(
  grid: Grid,
  layerManager: LayerManager,
  alpha: number,
  mode: SmoothingMode = "squircle",
): SmoothedLayerResult[] {
  const layerContours = extractAllLayerContours(grid, layerManager);
  const { smoother, alphaTransform } = MODE_CONFIG[mode];
  const adjustedAlpha = alphaTransform(alpha);

  return layerContours.map((lc) => {
    const layer = layerManager.getLayer(lc.layerId);
    return {
      layerId: lc.layerId,
      paths: lc.contours.map((c) => ({
        ...smoother(c, adjustedAlpha),
        color: c.color,
      })),
      rotation: layer?.rotation ?? 0,
    };
  });
}

export interface SmoothingSliderState {
  alpha: number;
  setAlpha: (value: number) => void;
  mode: SmoothingMode;
  setMode: (mode: SmoothingMode) => void;
  result: SmoothedLayerResult[];
}

export function useSmoothingSlider(
  grid: Grid,
  layerManager: LayerManager,
  debounceMs: number = 150,
  initialMode: SmoothingMode = "squircle",
): SmoothingSliderState {
  const [alpha, setAlphaRaw] = useState(0.5);
  const [mode, setMode] = useState<SmoothingMode>(initialMode);
  const [result, setResult] = useState<SmoothedLayerResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setAlpha = useCallback((value: number) => {
    setAlphaRaw(Math.max(0, Math.min(1, value)));
  }, []);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setResult(computeSmoothedPaths(grid, layerManager, alpha, mode));
      timerRef.current = null;
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [alpha, mode, grid, layerManager, debounceMs]);

  return { alpha, setAlpha, mode, setMode, result };
}
