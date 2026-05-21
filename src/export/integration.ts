import type { Grid } from "../models/grid";
import type { LayerManager } from "../models/layers";
import type { SmoothedLayerResult, SmoothingMode } from "../smoothing/slider";
import { usesRawGridStyling } from "../smoothing/slider";
import type { BackgroundOption } from "./background";
import { generateSvgWithBackground } from "./background";
import { type PngScale, rasterizeSvgToPng } from "./png";
import { generatePixelModeSvg, generatePixelSvg } from "./pixelSvg";
import { generateModeSvg, generateSvg } from "./svg";

export interface ExportConfig {
  width: number;
  height: number;
  layers: SmoothedLayerResult[];
  smoothingMode: SmoothingMode;
  grid?: Grid;
  layerManager?: LayerManager;
  background: BackgroundOption;
  mode: "light" | "dark" | "no-bg";
  lightBg: string;
  darkBg: string;
  lightFg: string;
  darkFg: string;
}

function requireGridExport(config: ExportConfig): { grid: Grid; layerManager: LayerManager } {
  if (!config.grid || !config.layerManager) {
    throw new Error("as-is export requires grid and layerManager");
  }
  return { grid: config.grid, layerManager: config.layerManager };
}

function exportAsIsSvg(config: ExportConfig): string {
  const { grid, layerManager } = requireGridExport(config);
  const { width, height } = config;

  if (config.mode === "no-bg") {
    return generatePixelSvg(grid, layerManager, width, height);
  }

  const bg = config.mode === "light" ? config.lightBg : config.darkBg;
  return generatePixelModeSvg(grid, layerManager, width, height, bg);
}

function exportStyledSvg(config: ExportConfig): string {
  if (config.mode === "no-bg") {
    return generateSvg({ width: config.width, height: config.height, layers: config.layers });
  }

  const bg = config.mode === "light" ? config.lightBg : config.darkBg;
  const fg = config.mode === "light" ? config.lightFg : config.darkFg;

  if (config.background.type !== "transparent") {
    return generateSvgWithBackground(config.width, config.height, config.layers, config.background);
  }

  return generateModeSvg(
    { width: config.width, height: config.height, layers: config.layers },
    config.mode,
    bg,
    fg,
  );
}

/**
 * Generate SVG string respecting mode and background settings.
 */
export function exportSvg(config: ExportConfig): string {
  if (usesRawGridStyling(config.smoothingMode)) {
    return exportAsIsSvg(config);
  }
  return exportStyledSvg(config);
}

/**
 * Generate PNG blob respecting mode and background settings.
 */
export async function exportPng(config: ExportConfig, scale: PngScale): Promise<Blob> {
  const svgString = exportSvg(config);
  return rasterizeSvgToPng(svgString, config.width, config.height, scale);
}
