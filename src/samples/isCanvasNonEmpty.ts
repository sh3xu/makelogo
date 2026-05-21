import type { Grid } from "../models/grid";
import type { LayerManager } from "../models/layers";

export function isCanvasNonEmpty(grid: Grid, layerManager: LayerManager): boolean {
  const n = grid.n;
  for (const layer of layerManager.layers) {
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (grid.getCell(layer.id, row, col).filled) {
          return true;
        }
      }
    }
  }
  return false;
}
