import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DrawStrokeCommand, History, ResizeCommand } from "../canvas/history";
import { resizeGrid } from "../canvas/resize";
import { downloadPng, downloadSvg, generateFilename } from "../export/download";
import type { ExportConfig } from "../export/integration";
import { exportPng, exportSvg } from "../export/integration";
import type { PngScale } from "../export/png";
import type { CellData } from "../models/grid";
import { clampGridSize, GRID_MAX, GRID_MIN, Grid } from "../models/grid";
import { LayerManager } from "../models/layers";
import type { SymmetryMode, ToolOptions } from "../models/tools";
import { DEFAULT_TOOL_OPTIONS, Tool } from "../models/tools";
import type { SmoothedLayerResult, SmoothingMode } from "../smoothing/slider";
import { computeSmoothedPaths } from "../smoothing/slider";

type ExportMode = "light" | "dark" | "no-bg";

export function useEditorWorkspace() {
  const gridRef = useRef(new Grid(16));
  const layerManagerRef = useRef(new LayerManager());
  const historyRef = useRef(new History());

  const [version, setVersion] = useState(0);
  const [activeColor, setActiveColor] = useState("#ffffff");
  const [alpha, setAlpha] = useState(0.5);
  const [smoothingMode, setSmoothingMode] = useState<SmoothingMode>("smooth");
  const [smoothedResult, setSmoothedResult] = useState<SmoothedLayerResult[]>([]);
  const [exportMode, setExportMode] = useState<ExportMode>("no-bg");
  const [gridSizeInput, setGridSizeInput] = useState("16");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTool, setActiveTool] = useState<Tool>(Tool.Draw);
  const [toolOptions, setToolOptions] = useState<ToolOptions>(DEFAULT_TOOL_OPTIONS);
  const [zoom, setZoom] = useState(1);
  const [cursorPos, setCursorPos] = useState<{ row: number; col: number } | null>(null);

  const bump = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    const grid = gridRef.current;
    for (const layer of layerManagerRef.current.layers) {
      grid.initLayer(layer.id);
    }
    setVersion(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSmoothedResult(
        computeSmoothedPaths(gridRef.current, layerManagerRef.current, alpha, smoothingMode),
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [version, alpha, smoothingMode]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        historyRef.current.undo();
        setGridSizeInput(String(gridRef.current.n));
        setVersion((current) => current + 1);
        return;
      }

      if (modifier && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
        event.preventDefault();
        historyRef.current.redo();
        setGridSizeInput(String(gridRef.current.n));
        setVersion((current) => current + 1);
        return;
      }

      if (modifier || event.shiftKey) {
        return;
      }

      switch (event.key) {
        case "d":
          setActiveTool(Tool.Draw);
          break;
        case "e":
          setActiveTool(Tool.Erase);
          break;
        case "l":
          setActiveTool(Tool.Line);
          break;
        case "r":
          setActiveTool(Tool.Rectangle);
          break;
        case "o":
          setActiveTool(Tool.Ellipse);
          break;
        case "f":
          setActiveTool(Tool.Fill);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleStrokeComplete = useCallback(
    (
      layerId: string,
      changes: Array<{
        row: number;
        col: number;
        before: CellData;
        after: CellData;
      }>,
    ) => {
      historyRef.current.push(new DrawStrokeCommand(gridRef.current, layerId, changes));
      bump();
    },
    [bump],
  );

  const handleUndo = useCallback(() => {
    historyRef.current.undo();
    setGridSizeInput(String(gridRef.current.n));
    bump();
  }, [bump]);

  const handleRedo = useCallback(() => {
    historyRef.current.redo();
    setGridSizeInput(String(gridRef.current.n));
    bump();
  }, [bump]);

  const handleResize = useCallback(
    (newSize: number) => {
      const clamped = clampGridSize(newSize);
      if (clamped === gridRef.current.n) {
        return;
      }

      const oldGrid = gridRef.current;
      const newGrid = resizeGrid(oldGrid, layerManagerRef.current, clamped);
      gridRef.current = newGrid;
      historyRef.current.push(
        new ResizeCommand(
          (grid) => {
            gridRef.current = grid;
          },
          oldGrid,
          newGrid,
        ),
      );
      setGridSizeInput(String(clamped));
      bump();
    },
    [bump],
  );

  const handleGridSizeSubmit = useCallback(() => {
    const value = Number.parseInt(gridSizeInput, 10);
    if (Number.isNaN(value)) {
      setGridSizeInput(String(gridRef.current.n));
      return;
    }
    handleResize(value);
  }, [gridSizeInput, handleResize]);

  const handleSelectLayer = useCallback(
    (id: string) => {
      layerManagerRef.current.setActiveLayer(id);
      bump();
    },
    [bump],
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      layerManagerRef.current.toggleVisibility(id);
      bump();
    },
    [bump],
  );

  const handleAddLayer = useCallback(() => {
    const layer = layerManagerRef.current.addLayer();
    gridRef.current.initLayer(layer.id);
    bump();
  }, [bump]);

  const handleRotateLayer = useCallback(
    (id: string, degrees: number) => {
      layerManagerRef.current.setRotation(id, degrees);
      bump();
    },
    [bump],
  );

  const handleBrushSizeChange = useCallback((size: 1 | 2 | 3 | 4) => {
    setToolOptions((current) => ({ ...current, brushSize: size }));
  }, []);

  const handleSymmetryChange = useCallback((mode: SymmetryMode) => {
    setToolOptions((current) => ({ ...current, symmetry: mode }));
  }, []);

  const handleShapeFilledChange = useCallback((filled: boolean) => {
    setToolOptions((current) => ({ ...current, shapeFilled: filled }));
  }, []);

  const buildExportConfig = useCallback((): ExportConfig => {
    const gridSize = gridRef.current.n;
    return {
      width: gridSize + 2,
      height: gridSize + 2,
      layers: smoothedResult,
      background: { type: "transparent" },
      mode: exportMode,
      lightBg: "#ffffff",
      darkBg: "#000000",
      lightFg: "#000000",
      darkFg: "#ffffff",
    };
  }, [exportMode, smoothedResult]);

  const handleExportSvg = useCallback(() => {
    const svg = exportSvg(buildExportConfig());
    downloadSvg(svg, generateFilename("svg", { mode: exportMode }));
  }, [buildExportConfig, exportMode]);

  const handleExportPng = useCallback(
    async (scale: PngScale) => {
      const blob = await exportPng(buildExportConfig(), scale);
      downloadPng(blob, scale, `logo-${exportMode}`);
    },
    [buildExportConfig, exportMode],
  );

  const layerManager = layerManagerRef.current;
  const history = historyRef.current;
  const activeLayer = layerManager.getActiveLayer();

  return useMemo(
    () => ({
      state: {
        gridRef,
        layerManager,
        version,
        activeColor,
        alpha,
        smoothingMode,
        smoothedResult,
        exportMode,
        gridSizeInput,
        theme,
        activeTool,
        toolOptions,
        zoom,
        cursorPos,
        layers: layerManager.layers,
        activeLayerId: layerManager.activeLayerId,
        activeLayerName: activeLayer.name,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        canAddLayer: layerManager.layers.length < 3,
        gridMin: GRID_MIN,
        gridMax: GRID_MAX,
      },
      actions: {
        setTheme,
        setGridSizeInput,
        setActiveTool,
        setZoom,
        setCursorPos,
        setActiveColor,
        setAlpha,
        setSmoothingMode,
        setExportMode,
        handleUndo,
        handleRedo,
        handleGridSizeSubmit,
        handleStrokeComplete,
        handleBrushSizeChange,
        handleSymmetryChange,
        handleShapeFilledChange,
        handleSelectLayer,
        handleToggleVisibility,
        handleAddLayer,
        handleRotateLayer,
        handleExportSvg,
        handleExportPng,
      },
    }),
    [
      layerManager,
      version,
      activeColor,
      alpha,
      smoothingMode,
      smoothedResult,
      exportMode,
      gridSizeInput,
      theme,
      activeTool,
      toolOptions,
      zoom,
      cursorPos,
      activeLayer.name,
      history.canUndo,
      history.canRedo,
      handleUndo,
      handleRedo,
      handleGridSizeSubmit,
      handleStrokeComplete,
      handleBrushSizeChange,
      handleSymmetryChange,
      handleShapeFilledChange,
      handleSelectLayer,
      handleToggleVisibility,
      handleAddLayer,
      handleRotateLayer,
      handleExportSvg,
      handleExportPng,
    ],
  );
}
