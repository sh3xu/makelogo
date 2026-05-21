import { useEffect, useRef, useState } from "react";
import type { Grid } from "../models/grid";
import type { LayerManager } from "../models/layers";
import { pathToSvgD } from "../smoothing/bezier";
import type { SmoothedLayerResult, SmoothingMode } from "../smoothing/slider";
import { usesRawGridStyling } from "../smoothing/slider";

interface PreviewProps {
  smoothedResult: SmoothedLayerResult[];
  gridSize: number;
  smoothingMode: SmoothingMode;
  grid: Grid;
  layerManager: LayerManager;
}

export function Preview({
  smoothedResult,
  gridSize,
  smoothingMode,
  grid,
  layerManager,
}: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxSize, setMaxSize] = useState(0);

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

  const viewSize = gridSize + 2;
  const svgPixels = maxSize > 0 ? maxSize : 400;
  const center = viewSize / 2;
  const pad = 1;
  const rawGrid = usesRawGridStyling(smoothingMode);

  const hasPaths = smoothedResult.some((l) => l.paths.length > 0);
  const hasPixelCells = rawGrid
    ? layerManager.getVisibleLayers().some((layer) => {
        for (let row = 0; row < grid.n; row++) {
          for (let col = 0; col < grid.n; col++) {
            const cell = grid.getCell(layer.id, row, col);
            if (cell.filled && cell.color) {
              return true;
            }
          }
        }
        return false;
      })
    : false;

  const hasContent = rawGrid ? hasPixelCells : hasPaths;

  return (
    <div ref={containerRef} className="preview-container">
      <div className="preview-frame" style={{ width: svgPixels, height: svgPixels }}>
        {hasContent ? (
          <svg viewBox={`0 0 ${viewSize} ${viewSize}`} width={svgPixels} height={svgPixels}>
            {rawGrid
              ? layerManager.getVisibleLayers().map((layer) => {
                  const rot = layer.rotation ?? 0;
                  const transform =
                    rot !== 0 ? `rotate(${rot}, ${center}, ${center})` : undefined;
                  const rects: Array<{ key: string; x: number; y: number; fill: string }> = [];
                  for (let row = 0; row < grid.n; row++) {
                    for (let col = 0; col < grid.n; col++) {
                      const cell = grid.getCell(layer.id, row, col);
                      if (cell.filled && cell.color) {
                        rects.push({
                          key: `${row},${col}`,
                          x: col + pad,
                          y: row + pad,
                          fill: cell.color,
                        });
                      }
                    }
                  }
                  return (
                    <g key={layer.id} transform={transform}>
                      {rects.map((rect) => (
                        <rect
                          key={rect.key}
                          x={rect.x}
                          y={rect.y}
                          width={1}
                          height={1}
                          fill={rect.fill}
                        />
                      ))}
                    </g>
                  );
                })
              : smoothedResult.map((layer) => {
                  const rot = layer.rotation ?? 0;
                  const transform =
                    rot !== 0 ? `rotate(${rot}, ${center}, ${center})` : undefined;
                  const byColor = new Map<string, string[]>();
                  for (const path of layer.paths) {
                    const d = pathToSvgD(path);
                    if (!d) continue;
                    const arr = byColor.get(path.color);
                    if (arr) arr.push(d);
                    else byColor.set(path.color, [d]);
                  }

                  return (
                    <g key={layer.layerId} transform={transform}>
                      {[...byColor.entries()].map(([color, ds]) => (
                        <path key={color} d={ds.join(" ")} fill={color} fillRule="evenodd" />
                      ))}
                    </g>
                  );
                })}
          </svg>
        ) : (
          <div className="preview-empty" style={{ width: svgPixels, height: svgPixels }}>
            Draw to see preview
          </div>
        )}
      </div>
    </div>
  );
}
