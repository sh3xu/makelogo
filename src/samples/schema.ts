import type { CellData } from "../models/grid";
import { assertValidGridSize } from "../models/grid";
import { LAYER_MAX_COUNT, LAYER_MIN_COUNT } from "../models/layers";

export const PROJECT_DOCUMENT_FORMAT_VERSION = 1 as const;

/** NOTE: null = empty cell; string = filled with that hex color. */
export type ProjectCellJson = string | null;

export interface ProjectLayerSpec {
  id: string;
  name: string;
  visible: boolean;
  rotation: number;
  cells: ProjectCellJson[];
}

export interface ProjectDocument {
  formatVersion: typeof PROJECT_DOCUMENT_FORMAT_VERSION;
  gridSize: number;
  layers: ProjectLayerSpec[];
  activeLayerId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCellJson(raw: unknown, layerId: string, index: number): ProjectCellJson {
  if (raw === null) {
    return null;
  }
  if (typeof raw === "string") {
    if (raw.length === 0) {
      throw new TypeError(
        `Layer "${layerId}" cell at index ${index} color string must be non-empty`,
      );
    }
    return raw;
  }
  throw new TypeError(
    `Layer "${layerId}" cell at index ${index} must be null or a color string, got ${typeof raw}`,
  );
}

function parseLayer(raw: unknown, gridSize: number): ProjectLayerSpec {
  if (!isRecord(raw)) {
    throw new TypeError("Layer must be an object");
  }
  const id = raw.id;
  if (typeof id !== "string" || id.length === 0) {
    throw new TypeError("Layer.id must be a non-empty string");
  }
  const name = raw.name;
  if (typeof name !== "string") {
    throw new TypeError("Layer.name must be a string");
  }
  const visible = raw.visible;
  if (typeof visible !== "boolean") {
    throw new TypeError("Layer.visible must be a boolean");
  }
  const rotation = raw.rotation;
  if (typeof rotation !== "number" || !Number.isFinite(rotation)) {
    throw new TypeError("Layer.rotation must be a finite number");
  }
  const cellsRaw = raw.cells;
  if (!Array.isArray(cellsRaw)) {
    throw new TypeError("Layer.cells must be an array");
  }
  const expected = gridSize * gridSize;
  if (cellsRaw.length !== expected) {
    throw new RangeError(`Layer "${id}" cells length must be ${expected}, got ${cellsRaw.length}`);
  }
  const cells = cellsRaw.map((cell, index) => parseCellJson(cell, id, index));
  return { id, name, visible, rotation, cells };
}

/**
 * NOTE: Validates untrusted JSON-shaped input for bundled samples or import.
 */
export function parseProjectDocument(raw: unknown): ProjectDocument {
  if (!isRecord(raw)) {
    throw new TypeError("Document must be an object");
  }
  const formatVersion = raw.formatVersion;
  if (formatVersion !== PROJECT_DOCUMENT_FORMAT_VERSION) {
    throw new RangeError(`Unsupported formatVersion: ${String(formatVersion)}`);
  }
  const gridSize = raw.gridSize;
  if (typeof gridSize !== "number" || !Number.isInteger(gridSize)) {
    throw new TypeError("gridSize must be an integer");
  }
  assertValidGridSize(gridSize);

  const layersRaw = raw.layers;
  if (!Array.isArray(layersRaw)) {
    throw new TypeError("layers must be an array");
  }
  if (layersRaw.length < LAYER_MIN_COUNT || layersRaw.length > LAYER_MAX_COUNT) {
    throw new RangeError(
      `layers length must be between ${LAYER_MIN_COUNT} and ${LAYER_MAX_COUNT}, got ${layersRaw.length}`,
    );
  }
  const layers = layersRaw.map((layer) => parseLayer(layer, gridSize));

  const activeLayerId = raw.activeLayerId;
  if (activeLayerId !== undefined && typeof activeLayerId !== "string") {
    throw new TypeError("activeLayerId must be a string when present");
  }

  const ids = new Set(layers.map((l) => l.id));
  if (ids.size !== layers.length) {
    throw new RangeError("Layer ids must be unique");
  }
  if (activeLayerId !== undefined && !ids.has(activeLayerId)) {
    throw new RangeError(`activeLayerId "${activeLayerId}" does not match any layer`);
  }

  return {
    formatVersion: PROJECT_DOCUMENT_FORMAT_VERSION,
    gridSize,
    layers,
    activeLayerId: activeLayerId === undefined ? undefined : activeLayerId,
  };
}

export function projectCellsToCellData(cells: readonly ProjectCellJson[]): CellData[] {
  return cells.map((c) =>
    c === null ? { filled: false, color: undefined } : { filled: true, color: c },
  );
}
