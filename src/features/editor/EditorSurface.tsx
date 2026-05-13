import type { CanvasTheme } from "../../canvas/theme";
import { PixelCanvas } from "../../components/PixelCanvas";
import type { CellData, Grid } from "../../models/grid";
import type { LayerManager } from "../../models/layers";
import type { Tool, ToolOptions } from "../../models/tools";

interface EditorSurfaceProps {
  grid: Grid;
  layerManager: LayerManager;
  activeColor: string;
  activeTool: Tool;
  toolOptions: ToolOptions;
  version: number;
  zoom: number;
  theme: CanvasTheme;
  onZoomChange: (zoom: number) => void;
  onCursorChange: (value: { row: number; col: number } | null) => void;
  onStrokeComplete: (
    layerId: string,
    changes: Array<{
      row: number;
      col: number;
      before: CellData;
      after: CellData;
    }>,
  ) => void;
}

export function EditorSurface({
  grid,
  layerManager,
  activeColor,
  activeTool,
  toolOptions,
  version,
  zoom,
  theme,
  onZoomChange,
  onCursorChange,
  onStrokeComplete,
}: EditorSurfaceProps) {
  return (
    <section className="editor-layout">
      <div className="editor-canvas">
        <div className="section-header section-header-split">
          <span>Editor</span>
          <span className="editor-header-zoom">{Math.round(zoom * 100)}%</span>
        </div>
        <PixelCanvas
          grid={grid}
          layerManager={layerManager}
          activeColor={activeColor}
          activeTool={activeTool}
          toolOptions={toolOptions}
          version={version}
          zoom={zoom}
          theme={theme}
          onZoomChange={onZoomChange}
          onCursorChange={onCursorChange}
          onStrokeComplete={onStrokeComplete}
        />
      </div>
    </section>
  );
}
