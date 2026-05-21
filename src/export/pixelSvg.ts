import type { Grid } from "../models/grid";
import type { LayerManager } from "../models/layers";

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
            `    <rect x="${col + pad}" y="${row + pad}" width="1" height="1" fill="${cell.color}" />`,
          );
        }
      }
    }

    const rot = layer.rotation ?? 0;
    const transformAttr = rot !== 0 ? ` transform="rotate(${rot}, ${cx}, ${cy})"` : "";
    return `  <g data-layer="${layer.id}"${transformAttr}>\n${rects.join("\n")}\n  </g>`;
  });
}

/** NOTE: Exports grid cells as 1x1 rects with no contour smoothing. */
export function generatePixelSvg(
  grid: Grid,
  layerManager: LayerManager,
  width: number,
  height: number,
): string {
  const groups = buildPixelLayerGroups(grid, layerManager, width, height);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    ...groups,
    `</svg>`,
  ].join("\n");
}

export function generatePixelModeSvg(
  grid: Grid,
  layerManager: LayerManager,
  width: number,
  height: number,
  bg: string,
): string {
  const groups = buildPixelLayerGroups(grid, layerManager, width, height);
  const bgRect = `  <rect width="100%" height="100%" fill="${bg}" />`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    bgRect,
    ...groups,
    `</svg>`,
  ].join("\n");
}
