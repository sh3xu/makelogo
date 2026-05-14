import type { CellData, Grid } from "../models/grid";
import type { Layer, LayerManager } from "../models/layers";

export interface Command {
  execute(): void;
  undo(): void;
}

export class DrawStrokeCommand implements Command {
  private _grid: Grid;
  private _layerId: string;
  private _changes: Array<{ row: number; col: number; before: CellData; after: CellData }>;

  constructor(
    grid: Grid,
    layerId: string,
    changes: Array<{ row: number; col: number; before: CellData; after: CellData }>,
  ) {
    this._grid = grid;
    this._layerId = layerId;
    this._changes = changes;
  }

  execute(): void {
    for (const { row, col, after } of this._changes) {
      this._grid.setCell(this._layerId, row, col, after);
    }
  }

  undo(): void {
    for (const { row, col, before } of this._changes) {
      this._grid.setCell(this._layerId, row, col, before);
    }
  }
}

export interface GridSnapshot {
  n: number;
  layers: Map<string, CellData[]>;
}

export interface RemoveLayerSnapshot {
  layer: Layer;
  insertIndex: number;
  cells: CellData[];
  activeLayerIdBefore: string;
}

export class RemoveLayerCommand implements Command {
  private _grid: Grid;
  private _layerManager: LayerManager;
  private _snapshot: RemoveLayerSnapshot;

  constructor(grid: Grid, layerManager: LayerManager, snapshot: RemoveLayerSnapshot) {
    this._grid = grid;
    this._layerManager = layerManager;
    this._snapshot = snapshot;
  }

  execute(): void {
    this._layerManager.removeLayer(this._snapshot.layer.id);
    this._grid.removeLayer(this._snapshot.layer.id);
  }

  undo(): void {
    this._layerManager.insertLayerAt(this._snapshot.layer, this._snapshot.insertIndex);
    this._grid.restoreLayerCells(this._snapshot.layer.id, this._snapshot.cells);
    this._layerManager.setActiveLayer(this._snapshot.activeLayerIdBefore);
  }
}

export class ResizeCommand implements Command {
  private _setGrid: (grid: Grid) => void;
  private _beforeGrid: Grid;
  private _afterGrid: Grid;

  constructor(setGrid: (grid: Grid) => void, beforeGrid: Grid, afterGrid: Grid) {
    this._setGrid = setGrid;
    this._beforeGrid = beforeGrid;
    this._afterGrid = afterGrid;
  }

  execute(): void {
    this._setGrid(this._afterGrid);
  }

  undo(): void {
    this._setGrid(this._beforeGrid);
  }
}

export class History {
  private _undoStack: Command[] = [];
  private _redoStack: Command[] = [];

  push(command: Command): void {
    this._undoStack.push(command);
    this._redoStack = [];
  }

  undo(): void {
    const cmd = this._undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this._redoStack.push(cmd);
  }

  redo(): void {
    const cmd = this._redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this._undoStack.push(cmd);
  }

  get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }
}
