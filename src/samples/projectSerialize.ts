import type { Grid } from "../models/grid";
import type { LayerManager } from "../models/layers";
import type { ProjectDocument } from "./schema";
import { PROJECT_DOCUMENT_FORMAT_VERSION } from "./schema";

/**
 * NOTE: Produces the same JSON shape as bundled samples and `parseProjectDocument` input.
 */
export function serializeProjectDocument(grid: Grid, layerManager: LayerManager): ProjectDocument {
  const n = grid.n;
  const layers = layerManager.layers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    rotation: layer.rotation,
    cells: grid.getLayerCells(layer.id).map((cell) => {
      if (!cell.filled) {
        return null;
      }
      return cell.color ?? "#000000";
    }),
  }));

  return {
    formatVersion: PROJECT_DOCUMENT_FORMAT_VERSION,
    gridSize: n,
    layers,
    activeLayerId: layerManager.activeLayerId,
  };
}
