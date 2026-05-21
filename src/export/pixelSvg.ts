import type { Grid } from "../models/grid";
import type { LayerManager } from "../models/layers";
import type { BackgroundOption } from "./background";
import { escapeXmlAttr } from "./xmlEscape";

function backgroundElement(background: BackgroundOption): string {
  if (background.type === "solid") {
    return `  <rect width="100%" height="100%" fill="${escapeXmlAttr(background.color)}" />`;
  }
  if (background.type === "image") {
    return `  <image href="${escapeXmlAttr(background.dataUrl)}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />`;
  }
  return "";
}

function buildPixelLayerGroups(
  grid: Grid,
  layerManager: LayerManager,
  width: number,
  height: number,
): string[] {
  const n = grid.n;
  const cx = width / 2;
  const cy = height / 2;
  const pad = 1;

  return layerManager.getVisibleLayers().map((layer) => {
    const rects: string[] = [];
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const cell = grid.getCell(layer.id, row, col);
        if (cell.filled && cell.color) {
          rects.push(
            `    <rect x="${col + pad}" y="${row + pad}" width="1" height="1" fill="${escapeXmlAttr(cell.color)}" />`,
          );
        }
      }
    }

    const rot = layer.rotation ?? 0;
    const transformAttr = rot !== 0 ? ` transform="rotate(${rot}, ${cx}, ${cy})"` : "";
    const layerId = escapeXmlAttr(layer.id);
    return `  <g data-layer="${layerId}"${transformAttr}>\n${rects.join("\n")}\n  </g>`;
  });
}

function wrapPixelSvg(width: number, height: number, inner: string[]): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    ...inner,
    `</svg>`,
  ].join("\n");
}

/** NOTE: Exports grid cells as 1x1 rects with no contour smoothing. */
export function generatePixelSvg(
  grid: Grid,
  layerManager: LayerManager,
  width: number,
  height: number,
): string {
  return wrapPixelSvg(width, height, buildPixelLayerGroups(grid, layerManager, width, height));
}

export function generatePixelModeSvg(
  grid: Grid,
  layerManager: LayerManager,
  width: number,
  height: number,
  bg: string,
): string {
  const bgRect = `  <rect width="100%" height="100%" fill="${escapeXmlAttr(bg)}" />`;
  return wrapPixelSvg(width, height, [
    bgRect,
    ...buildPixelLayerGroups(grid, layerManager, width, height),
  ]);
}

export function generatePixelSvgWithBackground(
  grid: Grid,
  layerManager: LayerManager,
  width: number,
  height: number,
  background: BackgroundOption,
): string {
  const bgElement = backgroundElement(background);
  const parts: string[] = [];
  if (bgElement) {
    parts.push(bgElement);
  }
  parts.push(...buildPixelLayerGroups(grid, layerManager, width, height));
  return wrapPixelSvg(width, height, parts);
}
