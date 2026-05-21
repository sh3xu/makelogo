import { describe, expect, it } from "vitest";
import { Grid } from "../models/grid";
import { LayerManager } from "../models/layers";
import { applyProjectDocument } from "./applyProjectDocument";
import { parseProjectImportText } from "./projectImport";
import { serializeProjectDocument } from "./projectSerialize";

describe("serializeProjectDocument", () => {
  it("round-trips through parse and apply", () => {
    const grid = new Grid(8);
    const lm = new LayerManager();
    for (const layer of lm.layers) {
      grid.initLayer(layer.id);
    }
    grid.fillCell(lm.layers[0]!.id, 2, 3, "#ff0000");
    grid.fillCell(lm.layers[1]!.id, 4, 5, "#00ff00");

    const doc = serializeProjectDocument(grid, lm);
    expect(doc.gridSize).toBe(8);
    expect(doc.layers.length).toBe(2);
    expect(doc.layers[0]!.cells[0]).toBeNull();
    expect(doc.layers[0]!.cells[2 * 8 + 3]).toBe("#ff0000");
    expect(doc.layers[1]!.cells[4 * 8 + 5]).toBe("#00ff00");

    const parsed = parseProjectImportText(JSON.stringify(doc));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const { grid: g2, layerManager: lm2 } = applyProjectDocument(parsed.doc);
    expect(g2.getCell(lm2.layers[0]!.id, 2, 3).color).toBe("#ff0000");
    expect(g2.getCell(lm2.layers[1]!.id, 4, 5).color).toBe("#00ff00");
  });
});
