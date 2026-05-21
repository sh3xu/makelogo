import { describe, expect, it } from "vitest";
import { DrawStrokeCommand, History } from "../canvas/history";
import { applyProjectDocument } from "./applyProjectDocument";
import { parseProjectDocument } from "./schema";

function emptyLayerCellsJson(n: number): (string | null)[] {
  return Array.from({ length: n * n }, () => null);
}

describe("parseProjectDocument", () => {
  it("rejects invalid formatVersion", () => {
    expect(() =>
      parseProjectDocument({
        formatVersion: 2,
        gridSize: 8,
        layers: [],
      }),
    ).toThrow(/formatVersion/);
  });

  it("rejects wrong layer count", () => {
    expect(() =>
      parseProjectDocument({
        formatVersion: 1,
        gridSize: 8,
        layers: [],
      }),
    ).toThrow(/layers length/);
  });
});

describe("applyProjectDocument", () => {
  it("applies layers and active layer id", () => {
    const n = 8;
    const baseCells = emptyLayerCellsJson(n);
    baseCells[0] = "#ff0000";
    const topCells = emptyLayerCellsJson(n);
    topCells[n * n - 1] = "#00ff00";

    const doc = parseProjectDocument({
      formatVersion: 1,
      gridSize: n,
      activeLayerId: "top",
      layers: [
        { id: "base", name: "Base", visible: true, rotation: 0, cells: baseCells },
        { id: "top", name: "Top", visible: true, rotation: 0, cells: topCells },
      ],
    });

    const { grid, layerManager } = applyProjectDocument(doc);

    expect(grid.n).toBe(8);
    expect(layerManager.activeLayerId).toBe("top");
    expect(grid.getCell("base", 0, 0).filled).toBe(true);
    expect(grid.getCell("base", 0, 0).color).toBe("#ff0000");
    expect(grid.getCell("top", 7, 7).filled).toBe(true);
    expect(grid.getCell("top", 7, 7).color).toBe("#00ff00");
  });

  it("works with History.clear after prior commands", () => {
    const n = 8;
    const cellsA = emptyLayerCellsJson(n);
    const cellsB = emptyLayerCellsJson(n);
    cellsA[10] = "#0000ff";

    const doc = parseProjectDocument({
      formatVersion: 1,
      gridSize: n,
      layers: [
        { id: "x", name: "X", visible: true, rotation: 0, cells: cellsA },
        { id: "y", name: "Y", visible: true, rotation: 0, cells: cellsB },
      ],
    });

    const { grid, layerManager } = applyProjectDocument(doc);
    const history = new History();
    const row = 1;
    const col = 2;
    const before = grid.getCell("x", row, col);
    grid.setCell("x", row, col, { filled: true, color: "#abcdef" });
    const after = grid.getCell("x", row, col);
    history.push(new DrawStrokeCommand(grid, "x", [{ row, col, before, after }]));
    expect(history.canUndo).toBe(true);
    history.clear();
    expect(history.canUndo).toBe(false);
    expect(layerManager.layers.length).toBe(2);
  });
});
