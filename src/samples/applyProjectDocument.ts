import { Grid } from "../models/grid";
import { LayerManager } from "../models/layers";
import { type ProjectDocument, projectCellsToCellData } from "./schema";

export interface ApplyProjectDocumentResult {
  grid: Grid;
  layerManager: LayerManager;
}

/**
 * NOTE: Replaces grid and layer manager contents from a validated document.
 */
export function applyProjectDocument(doc: ProjectDocument): ApplyProjectDocumentResult {
  const layerMeta = doc.layers.map(({ id, name, visible, rotation }) => ({
    id,
    name,
    visible,
    rotation,
  }));
  const grid = new Grid(doc.gridSize);
  const layerManager = new LayerManager(layerMeta);

  for (const layer of doc.layers) {
    grid.importLayerCells(layer.id, projectCellsToCellData(layer.cells));
  }

  if (doc.activeLayerId !== undefined) {
    if (layerManager.getLayer(doc.activeLayerId)) {
      layerManager.setActiveLayer(doc.activeLayerId);
    }
  }

  return { grid, layerManager };
}
