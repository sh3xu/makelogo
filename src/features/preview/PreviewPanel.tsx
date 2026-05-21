import { useEffect, useState } from "react";
import { CloseIcon, ExpandIcon } from "../../components/icons";
import { Preview } from "../../components/Preview";
import type { Grid } from "../../models/grid";
import type { LayerManager } from "../../models/layers";
import type { SmoothedLayerResult, SmoothingMode } from "../../smoothing/slider";

interface PreviewPanelProps {
  smoothedResult: SmoothedLayerResult[];
  gridSize: number;
  smoothingMode: SmoothingMode;
  grid: Grid;
  layerManager: LayerManager;
}

export function PreviewPanel({
  smoothedResult,
  gridSize,
  smoothingMode,
  grid,
  layerManager,
}: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  return (
    <section className="preview-layout">
      <div className="section-header section-header-split">
        <span>Preview</span>
        <button
          type="button"
          className="btn btn-icon"
          title="Full screen preview"
          aria-label="Full screen preview"
          onClick={() => setIsFullscreen(true)}
        >
          <ExpandIcon />
        </button>
      </div>
      <Preview
        smoothedResult={smoothedResult}
        gridSize={gridSize}
        smoothingMode={smoothingMode}
        grid={grid}
        layerManager={layerManager}
      />

      {isFullscreen && (
        <div className="fullscreen-overlay" role="dialog" aria-label="Full screen preview">
          <div className="fullscreen-topbar">
            <div className="fullscreen-title">Preview</div>
            <button
              type="button"
              className="btn btn-icon"
              title="Close"
              aria-label="Close full screen preview"
              onClick={() => setIsFullscreen(false)}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="fullscreen-body">
            <Preview
        smoothedResult={smoothedResult}
        gridSize={gridSize}
        smoothingMode={smoothingMode}
        grid={grid}
        layerManager={layerManager}
      />
          </div>
        </div>
      )}
    </section>
  );
}
