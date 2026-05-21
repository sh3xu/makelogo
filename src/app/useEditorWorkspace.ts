import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DrawStrokeCommand, History, RemoveLayerCommand, ResizeCommand } from "../canvas/history";
import { resizeGrid } from "../canvas/resize";
import {
  downloadPng,
  downloadProjectJson,
  downloadSvg,
  generateFilename,
} from "../export/download";
import type { ExportConfig } from "../export/integration";
import { exportPng, exportSvg } from "../export/integration";
import type { PngScale } from "../export/png";
import type { CellData } from "../models/grid";
import { clampGridSize, Grid } from "../models/grid";
import { LAYER_MAX_COUNT, LAYER_MIN_COUNT, LayerManager } from "../models/layers";
import type { SymmetryMode, ToolOptions } from "../models/tools";
import { DEFAULT_TOOL_OPTIONS, Tool } from "../models/tools";
import { applyProjectDocument } from "../samples/applyProjectDocument";
import { isCanvasNonEmpty } from "../samples/isCanvasNonEmpty";
import { parseProjectImportText } from "../samples/projectImport";
import { serializeProjectDocument } from "../samples/projectSerialize";
import { getBundledSampleProjectJson, SAMPLE_REGISTRY } from "../samples/registry";
import type { ProjectDocument } from "../samples/schema";
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTool, setActiveTool] = useState<Tool>(Tool.Draw);
  const [toolOptions, setToolOptions] = useState<ToolOptions>(DEFAULT_TOOL_OPTIONS);
  const [zoom, setZoom] = useState(1);
  const [cursorPos, setCursorPos] = useState<{ row: number; col: number } | null>(null);

  const bump = useCallback(() => setVersion((current) => current + 1), []);

  const sampleSummaries = useMemo(
    () =>
      SAMPLE_REGISTRY.map(({ id, title, shortDescription, learningNote }) => ({
        id,
        title,
        shortDescription,
        learningNote,
      })),
    [],
  );

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
    function isUndoRedoTarget(target: EventTarget | null): boolean {
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      const modifier = (event.metaKey || event.ctrlKey) && !event.altKey;
      if (modifier) {
        const zMatch = event.code === "KeyZ" || event.key.toLowerCase() === "z";
        const yMatch = event.code === "KeyY" || event.key.toLowerCase() === "y";
        const isUndo = zMatch && !event.shiftKey;
        const isRedo = yMatch || (zMatch && event.shiftKey);

        if ((isUndo || isRedo) && isUndoRedoTarget(event.target)) {
          return;
        }

        if (isUndo) {
          event.preventDefault();
          historyRef.current.undo();
          setVersion((current) => current + 1);
          return;
        }

        if (isRedo) {
          event.preventDefault();
          historyRef.current.redo();
          setVersion((current) => current + 1);
          return;
        }
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey) {
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
    bump();
  }, [bump]);

  const handleRedo = useCallback(() => {
    historyRef.current.redo();
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
      bump();
    },
    [bump],
  );

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

  const handleRenameLayer = useCallback(
    (id: string, name: string) => {
      layerManagerRef.current.setLayerName(id, name);
      bump();
    },
    [bump],
  );

  const [canvasViewResetKey, setCanvasViewResetKey] = useState(0);
  const handleResetCanvasView = useCallback(() => {
    setZoom(1);
    setCanvasViewResetKey((key) => key + 1);
  }, []);

  const handleRemoveLayer = useCallback(
    (id: string) => {
      const lm = layerManagerRef.current;
      const grid = gridRef.current;
      if (lm.layers.length <= LAYER_MIN_COUNT) {
        return;
      }
      const layer = lm.getLayer(id);
      if (!layer) {
        return;
      }
      const insertIndex = lm.layers.findIndex((l) => l.id === id);
      const activeLayerIdBefore = lm.activeLayerId;
      const layerSnapshot = { ...layer };
      const cells = grid.getLayerCells(id).map((c) => ({ ...c }));

      lm.removeLayer(id);
      grid.removeLayer(id);

      historyRef.current.push(
        new RemoveLayerCommand(grid, lm, {
          layer: layerSnapshot,
          insertIndex,
          cells,
          activeLayerIdBefore,
        }),
      );
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
      smoothingMode,
      grid: gridRef.current,
      layerManager: layerManagerRef.current,
      background: { type: "transparent" },
      mode: exportMode,
      lightBg: "#ffffff",
      darkBg: "#000000",
      lightFg: "#000000",
      darkFg: "#ffffff",
    };
  }, [exportMode, smoothingMode, smoothedResult]);

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

  const applyLoadedProjectDocument = useCallback(
    (doc: ProjectDocument) => {
      const { grid, layerManager } = applyProjectDocument(doc);
      gridRef.current = grid;
      layerManagerRef.current = layerManager;
      historyRef.current.clear();
      setZoom(1);
      setCanvasViewResetKey((key) => key + 1);
      bump();
    },
    [bump],
  );

  const handleLoadSampleById = useCallback(
    (sampleId: string) => {
      const text = getBundledSampleProjectJson(sampleId);
      if (text === undefined) {
        return;
      }
      const result = parseProjectImportText(text);
      if (!result.ok) {
        return;
      }
      applyLoadedProjectDocument(result.doc);
    },
    [applyLoadedProjectDocument],
  );

  const handleExportProject = useCallback(() => {
    const doc = serializeProjectDocument(gridRef.current, layerManagerRef.current);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadProjectJson(doc, `glyph-project-${stamp}.json`);
  }, []);

  const layerManager = layerManagerRef.current;
  const history = historyRef.current;
  const activeLayer = layerManager.getActiveLayer();
  const canvasHasContent = isCanvasNonEmpty(gridRef.current, layerManagerRef.current);

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
        gridSize: gridRef.current.n,
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
        canAddLayer: layerManager.layers.length < LAYER_MAX_COUNT,
        canRemoveLayer: layerManager.layers.length > LAYER_MIN_COUNT,
        sampleSummaries,
        canvasHasContent,
        canvasViewResetKey,
      },
      actions: {
        setTheme,
        setActiveTool,
        setZoom,
        setCursorPos,
        setActiveColor,
        setAlpha,
        setSmoothingMode,
        setExportMode,
        handleUndo,
        handleRedo,
        handleGridSizeChange: handleResize,
        handleStrokeComplete,
        handleBrushSizeChange,
        handleSymmetryChange,
        handleShapeFilledChange,
        handleSelectLayer,
        handleToggleVisibility,
        handleAddLayer,
        handleRotateLayer,
        handleRenameLayer,
        handleRemoveLayer,
        handleExportSvg,
        handleExportPng,
        handleExportProject,
        applyImportedProject: applyLoadedProjectDocument,
        handleLoadSampleById,
        handleResetCanvasView,
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
      handleResize,
      handleStrokeComplete,
      handleBrushSizeChange,
      handleSymmetryChange,
      handleShapeFilledChange,
      handleSelectLayer,
      handleToggleVisibility,
      handleAddLayer,
      handleRotateLayer,
      handleRenameLayer,
      handleRemoveLayer,
      handleExportSvg,
      handleExportPng,
      handleExportProject,
      applyLoadedProjectDocument,
      sampleSummaries,
      canvasHasContent,
      canvasViewResetKey,
      handleLoadSampleById,
      handleResetCanvasView,
    ],
  );
}
