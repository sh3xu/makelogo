import { type MouseEvent, useEffect, useRef, useState, type WheelEvent } from "react";
import type { StrokeMode } from "../canvas/drawing";
import {
  bresenhamLine,
  type CellCoord,
  ellipseCells,
  floodFill,
  rectangleCells,
} from "../canvas/shapes";
import { expandBrush, mirrorCells } from "../canvas/symmetry";
import type { CellData, Grid } from "../models/grid";
import type { LayerManager } from "../models/layers";
import { inverseRotatePoint } from "../models/rotation";
import type { ToolOptions } from "../models/tools";
import { Tool } from "../models/tools";

interface StrokeState {
  mode: StrokeMode;
  layerId: string;
  changes: Array<{
    row: number;
    col: number;
    before: CellData;
    after: CellData;
  }>;
  visited: Set<string>;
}

interface ShapeDragState {
  tool: Tool;
  layerId: string;
  anchorRow: number;
  anchorCol: number;
}

interface PixelCanvasProps {
  grid: Grid;
  layerManager: LayerManager;
  activeColor: string;
  activeTool: Tool;
  toolOptions: ToolOptions;
  version: number;
  onStrokeComplete: (
    layerId: string,
    changes: Array<{
      row: number;
      col: number;
      before: CellData;
      after: CellData;
    }>,
  ) => void;
  onCursorChange: (pos: { row: number; col: number } | null) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function PixelCanvas({
  grid,
  layerManager,
  activeColor,
  activeTool,
  toolOptions,
  version,
  onStrokeComplete,
  onCursorChange,
  zoom,
  onZoomChange,
}: PixelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<StrokeState | null>(null);
  const shapeDragRef = useRef<ShapeDragState | null>(null);
  const ghostRef = useRef<CellCoord[]>([]);
  const hoverRef = useRef<{ row: number; col: number } | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const spaceDownRef = useRef(false);
  const [maxSize, setMaxSize] = useState(0);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]!.contentRect;
      setMaxSize(Math.floor(Math.min(width, height)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track space key for pan mode
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !e.repeat) {
        spaceDownRef.current = true;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        spaceDownRef.current = false;
        isPanningRef.current = false;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const n = grid.n;
  const baseCellSize = maxSize > 0 ? Math.max(2, Math.floor(maxSize / n)) : 0;
  const cellSize = baseCellSize * zoom;
  const canvasPixels = cellSize * n;

  // Stable redraw ref
  const redrawRef = useRef<() => void>(() => {});
  redrawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvasPixels === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayW = Math.min(canvasPixels, maxSize);
    const displayH = displayW;
    const w = displayW * dpr;
    if (canvas.width !== w || canvas.height !== w) {
      canvas.width = w;
      canvas.height = w;
    }
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displayW, displayH);

    // Apply pan
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);

    // Checkerboard
    const cs = Math.max(cellSize, 8);
    const totalSize = cellSize * n;
    const checkerCols = Math.ceil(totalSize / cs);
    for (let r = 0; r < checkerCols; r++) {
      for (let c = 0; c < checkerCols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#1a1a1f" : "#151519";
        ctx.fillRect(c * cs, r * cs, cs, cs);
      }
    }

    // Filled cells — render per-layer with rotation
    const visibleLayers = layerManager.getVisibleLayers();
    const centerPx = (n * cellSize) / 2;

    for (const layer of visibleLayers) {
      ctx.save();
      if (layer.rotation !== 0) {
        ctx.translate(centerPx, centerPx);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-centerPx, -centerPx);
      }
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cell = grid.getCell(layer.id, r, c);
          if (cell.filled && cell.color) {
            ctx.fillStyle = cell.color;
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }
      ctx.restore();
    }

    // Grid lines
    if (cellSize >= 6) {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= n; i++) {
        const pos = i * cellSize + 0.25;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, totalSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(totalSize, pos);
        ctx.stroke();
      }
    }

    // Ghost + hover should match active-layer rotation
    const activeLayer = layerManager.getActiveLayer();
    ctx.save();
    if (activeLayer.rotation !== 0) {
      ctx.translate(centerPx, centerPx);
      ctx.rotate((activeLayer.rotation * Math.PI) / 180);
      ctx.translate(-centerPx, -centerPx);
    }

    // Ghost cells for shape tools
    const ghost = ghostRef.current;
    if (ghost.length > 0) {
      ctx.fillStyle = "rgba(99, 102, 241, 0.3)";
      for (const { row, col } of ghost) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }

    // Hover indicator
    const hover = hoverRef.current;
    if (hover && !strokeRef.current && !shapeDragRef.current) {
      ctx.fillStyle = "rgba(99, 102, 241, 0.18)";
      ctx.fillRect(hover.col * cellSize, hover.row * cellSize, cellSize, cellSize);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        hover.col * cellSize + 0.5,
        hover.row * cellSize + 0.5,
        cellSize - 1,
        cellSize - 1,
      );
    }

    ctx.restore(); // pan
  };

  // Redraw on state changes
  useEffect(() => {
    redrawRef.current();
  }, [version, maxSize, canvasPixels, zoom]);

  function getCell(e: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = parseFloat(canvas.style.width) / rect.width;
    const scaleY = parseFloat(canvas.style.height) / rect.height;
    let x = (e.clientX - rect.left) * scaleX - panRef.current.x;
    let y = (e.clientY - rect.top) * scaleY - panRef.current.y;

    // Apply inverse rotation of active layer for drawing
    const activeLayer = layerManager.getActiveLayer();
    if (activeLayer.rotation !== 0) {
      const centerPx = (n * cellSize) / 2;
      const inv = inverseRotatePoint(x, y, centerPx, centerPx, activeLayer.rotation);
      x = inv.x;
      y = inv.y;
    }

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (row < 0 || row >= n || col < 0 || col >= n) return null;
    return { row, col };
  }

  function applyCells(
    cells: CellCoord[],
    mode: "paint" | "erase",
  ): Array<{
    row: number;
    col: number;
    before: CellData;
    after: CellData;
  }> {
    // Apply brush expansion and symmetry
    let processed = cells;
    if (toolOptions.brushSize > 1 && activeTool !== Tool.Fill) {
      processed = expandBrush(processed, toolOptions.brushSize, n);
    }
    if (toolOptions.symmetry !== "none") {
      processed = mirrorCells(processed, n, toolOptions.symmetry);
    }

    const layerId = layerManager.activeLayerId;
    const changes: Array<{
      row: number;
      col: number;
      before: CellData;
      after: CellData;
    }> = [];

    for (const { row, col } of processed) {
      if (row < 0 || row >= n || col < 0 || col >= n) continue;
      const cellData = grid.getCell(layerId, row, col);
      const before: CellData = { filled: cellData.filled, color: cellData.color };
      const after: CellData =
        mode === "paint"
          ? { filled: true, color: activeColor }
          : { filled: false, color: undefined };

      if (before.filled !== after.filled || before.color !== after.color) {
        grid.setCell(layerId, row, col, after);
        changes.push({ row, col, before, after });
      }
    }

    return changes;
  }

  function handleMouseDown(e: MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();

    // Pan mode
    if (spaceDownRef.current) {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
      return;
    }

    const cell = getCell(e);
    if (!cell) return;

    const layerId = layerManager.activeLayerId;

    // Fill tool — immediate action
    if (activeTool === Tool.Fill) {
      const fillCells = floodFill(grid, layerId, cell.row, cell.col, activeColor);
      if (fillCells.length > 0) {
        const changes = applyCells(fillCells, "paint");
        if (changes.length > 0) {
          onStrokeComplete(layerId, changes);
        }
      }
      return;
    }

    // Shape tools — start drag
    if (activeTool === Tool.Line || activeTool === Tool.Rectangle || activeTool === Tool.Ellipse) {
      shapeDragRef.current = {
        tool: activeTool,
        layerId,
        anchorRow: cell.row,
        anchorCol: cell.col,
      };
      ghostRef.current = [cell];
      redrawRef.current();
      return;
    }

    // Draw/Erase — freehand stroke
    const cellData = grid.getCell(layerId, cell.row, cell.col);
    const mode: StrokeMode =
      activeTool === Tool.Erase
        ? "erase"
        : activeTool === Tool.Draw
          ? "paint"
          : cellData.filled
            ? "erase"
            : "paint";

    const changes = applyCells([cell], mode);

    strokeRef.current = {
      mode,
      layerId,
      changes,
      visited: new Set([`${cell.row},${cell.col}`]),
    };

    redrawRef.current();
  }

  function handleMouseMove(e: MouseEvent<HTMLCanvasElement>) {
    // Pan handling
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panRef.current = {
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      };
      redrawRef.current();
      return;
    }

    const cell = getCell(e);
    hoverRef.current = cell;
    onCursorChange(cell);

    // Shape drag — update ghost
    if (shapeDragRef.current && cell) {
      const { tool, anchorRow, anchorCol } = shapeDragRef.current;
      let cells: CellCoord[];

      switch (tool) {
        case Tool.Line:
          cells = bresenhamLine(anchorRow, anchorCol, cell.row, cell.col);
          break;
        case Tool.Rectangle:
          cells = rectangleCells(anchorRow, anchorCol, cell.row, cell.col, toolOptions.shapeFilled);
          break;
        case Tool.Ellipse:
          cells = ellipseCells(anchorRow, anchorCol, cell.row, cell.col, toolOptions.shapeFilled);
          break;
        default:
          cells = [];
      }

      // Apply brush + symmetry to ghost
      if (toolOptions.brushSize > 1) {
        cells = expandBrush(cells, toolOptions.brushSize, n);
      }
      if (toolOptions.symmetry !== "none") {
        cells = mirrorCells(cells, n, toolOptions.symmetry);
      }

      ghostRef.current = cells;
      redrawRef.current();
      return;
    }

    // Freehand stroke
    if (strokeRef.current && cell) {
      const key = `${cell.row},${cell.col}`;
      if (!strokeRef.current.visited.has(key)) {
        strokeRef.current.visited.add(key);
        const newChanges = applyCells([cell], strokeRef.current.mode);
        strokeRef.current.changes.push(...newChanges);
      }
    }

    redrawRef.current();
  }

  function finishStroke() {
    // Complete shape drag
    if (shapeDragRef.current) {
      const ghost = ghostRef.current;
      if (ghost.length > 0) {
        const changes = applyCells(ghost, "paint");
        if (changes.length > 0) {
          onStrokeComplete(shapeDragRef.current.layerId, changes);
        }
      }
      shapeDragRef.current = null;
      ghostRef.current = [];
    }

    // Complete freehand stroke
    if (strokeRef.current && strokeRef.current.changes.length > 0) {
      onStrokeComplete(strokeRef.current.layerId, strokeRef.current.changes);
    }
    strokeRef.current = null;
  }

  function handleMouseUp() {
    isPanningRef.current = false;
    finishStroke();
    redrawRef.current();
  }

  function handleMouseLeave() {
    hoverRef.current = null;
    onCursorChange(null);
    isPanningRef.current = false;
    finishStroke();
    redrawRef.current();
  }

  function handleWheel(e: WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(4, zoom + delta));
    onZoomChange(newZoom);
  }

  function handleDoubleClick() {
    panRef.current = { x: 0, y: 0 };
    onZoomChange(1);
    redrawRef.current();
  }

  const cursor = spaceDownRef.current || isPanningRef.current ? "grab" : "crosshair";

  if (maxSize === 0) {
    return <div ref={containerRef} className="canvas-container" />;
  }

  return (
    <div ref={containerRef} className="canvas-container">
      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          style={{ cursor }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    </div>
  );
}
