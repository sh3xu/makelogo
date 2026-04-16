import { useEffect, useState } from "react";
import { Preview } from "../../components/Preview";
import type { SmoothedLayerResult } from "../../smoothing/slider";

interface PreviewPanelProps {
  smoothedResult: SmoothedLayerResult[];
  gridSize: number;
}

export function PreviewPanel({ smoothedResult, gridSize }: PreviewPanelProps) {
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5.5 2H2v3.5M8.5 2H12v3.5M12 8.5V12H8.5M2 8.5V12h3.5" />
          </svg>
        </button>
      </div>
      <Preview smoothedResult={smoothedResult} gridSize={gridSize} />

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
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l8 8M11 3 3 11" />
              </svg>
            </button>
          </div>
          <div className="fullscreen-body">
            <Preview smoothedResult={smoothedResult} gridSize={gridSize} />
          </div>
        </div>
      )}
    </section>
  );
}
