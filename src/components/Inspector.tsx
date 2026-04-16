import type { PngScale } from "../export/png";
import type { Layer } from "../models/layers";
import type { SymmetryMode, ToolOptions } from "../models/tools";
import { Tool } from "../models/tools";
import type { SmoothingMode } from "../smoothing/slider";
import { SegmentedControl } from "./SegmentedControl";

type ExportMode = "light" | "dark" | "adaptive";

export interface InspectorProps {
  // Tool options
  activeTool: Tool;
  toolOptions: ToolOptions;
  onBrushSizeChange: (size: 1 | 2 | 3 | 4) => void;
  onSymmetryChange: (mode: SymmetryMode) => void;
  onShapeFilledChange: (filled: boolean) => void;

  // Colors
  activeColor: string;
  onColorChange: (color: string) => void;

  // Layers
  layers: readonly Layer[];
  activeLayerId: string;
  canAddLayer: boolean;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onRotateLayer: (id: string, degrees: number) => void;

  // Smoothing
  alpha: number;
  onAlphaChange: (value: number) => void;
  smoothingMode: SmoothingMode;
  onSmoothingModeChange: (mode: SmoothingMode) => void;

  // Export
  exportMode: ExportMode;
  onExportModeChange: (mode: ExportMode) => void;
  onExportSvg: () => void;
  onExportPng: (scale: PngScale) => void;
}

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function Inspector({ ...props }: InspectorProps) {
  return (
    <div className="inspector">
      <ToolOptionsSection
        activeTool={props.activeTool}
        toolOptions={props.toolOptions}
        onBrushSizeChange={props.onBrushSizeChange}
        onSymmetryChange={props.onSymmetryChange}
        onShapeFilledChange={props.onShapeFilledChange}
      />
      <ColorSection activeColor={props.activeColor} onColorChange={props.onColorChange} />
      <LayersSection
        layers={props.layers}
        activeLayerId={props.activeLayerId}
        canAddLayer={props.canAddLayer}
        onSelectLayer={props.onSelectLayer}
        onToggleVisibility={props.onToggleVisibility}
        onAddLayer={props.onAddLayer}
        onRotateLayer={props.onRotateLayer}
      />
      <SmoothingSection
        alpha={props.alpha}
        onAlphaChange={props.onAlphaChange}
        smoothingMode={props.smoothingMode}
        onSmoothingModeChange={props.onSmoothingModeChange}
      />
      <ExportSection
        exportMode={props.exportMode}
        onExportModeChange={props.onExportModeChange}
        onExportSvg={props.onExportSvg}
        onExportPng={props.onExportPng}
      />
    </div>
  );
}

interface ToolOptionsSectionProps {
  activeTool: Tool;
  toolOptions: ToolOptions;
  onBrushSizeChange: (size: 1 | 2 | 3 | 4) => void;
  onSymmetryChange: (mode: SymmetryMode) => void;
  onShapeFilledChange: (filled: boolean) => void;
}

export function ToolOptionsSection({
  activeTool,
  toolOptions,
  onBrushSizeChange,
  onSymmetryChange,
  onShapeFilledChange,
}: ToolOptionsSectionProps) {
  const isShapeTool =
    activeTool === Tool.Line || activeTool === Tool.Rectangle || activeTool === Tool.Ellipse;
  const isDrawOrErase = activeTool === Tool.Draw || activeTool === Tool.Erase;

  return (
    <div className="inspector-section">
      <span className="inspector-label">Tool</span>

      {isDrawOrErase && (
        <>
          <div className="inspector-row">
            <span className="inspector-sublabel">Brush</span>
            <SegmentedControl
              size="sm"
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
              ]}
              value={String(toolOptions.brushSize)}
              onChange={(v) => onBrushSizeChange(Number(v) as 1 | 2 | 3 | 4)}
            />
          </div>
          <div className="inspector-row">
            <span className="inspector-sublabel">Mirror</span>
            <SegmentedControl
              size="sm"
              options={[
                { value: "none", label: "Off" },
                { value: "horizontal", label: "H" },
                { value: "vertical", label: "V" },
                { value: "both", label: "HV" },
              ]}
              value={toolOptions.symmetry}
              onChange={(v) => onSymmetryChange(v as SymmetryMode)}
            />
          </div>
        </>
      )}

      {isShapeTool && (
        <div className="inspector-row">
          <span className="inspector-sublabel">Fill</span>
          <SegmentedControl
            size="sm"
            options={[
              { value: "outline", label: "Outline" },
              { value: "filled", label: "Filled" },
            ]}
            value={toolOptions.shapeFilled ? "filled" : "outline"}
            onChange={(v) => onShapeFilledChange(v === "filled")}
          />
        </div>
      )}

      {activeTool === Tool.Fill && (
        <div className="inspector-row">
          <span className="inspector-sublabel" style={{ opacity: 0.7 }}>
            Click a region to fill
          </span>
        </div>
      )}
    </div>
  );
}

interface ColorSectionProps {
  activeColor: string;
  onColorChange: (color: string) => void;
}

export function ColorSection({ activeColor, onColorChange }: ColorSectionProps) {
  return (
    <div className="inspector-section">
      <span className="inspector-label">Color</span>
      <div className="swatches">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`swatch${color === activeColor ? " swatch-active" : ""}`}
            style={{ background: color }}
            onClick={() => onColorChange(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
        <div className="color-input-wrap">
          <input
            type="color"
            className="color-input"
            value={activeColor}
            onChange={(e) => onColorChange(e.target.value)}
            aria-label="Custom color picker"
          />
        </div>
      </div>
    </div>
  );
}

interface LayersSectionProps {
  layers: readonly Layer[];
  activeLayerId: string;
  canAddLayer: boolean;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onRotateLayer: (id: string, degrees: number) => void;
}

export function LayersSection({
  layers,
  activeLayerId,
  canAddLayer,
  onSelectLayer,
  onToggleVisibility,
  onAddLayer,
  onRotateLayer,
}: LayersSectionProps) {
  function normalizeRotation(degrees: number) {
    const normalized = degrees % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }

  return (
    <div className="inspector-section">
      <span className="inspector-label">Layers</span>
      {layers.map((layer) => (
        <div key={layer.id} className="inspector-layer">
          <button
            type="button"
            className={`layer-item${layer.id === activeLayerId ? " layer-item-active" : ""}`}
            onClick={() => onSelectLayer(layer.id)}
          >
            <span
              className={`layer-vis${!layer.visible ? " layer-vis-hidden" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              role="switch"
              aria-checked={layer.visible}
              aria-label={`Toggle ${layer.name} visibility`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }
              }}
            />
            {layer.name}
          </button>
          <div className="layer-rotation">
            <button
              type="button"
              className="btn btn-xs btn-icon"
              title="Rotate left"
              aria-label={`Rotate ${layer.name} left`}
              onClick={() => onRotateLayer(layer.id, normalizeRotation(layer.rotation - 15))}
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
                <path d="M4 4H1.5V1.5" />
                <path d="M2 4a5 5 0 1 1 2 8" />
              </svg>
            </button>
            <button
              type="button"
              className="btn btn-xs btn-icon"
              title="Rotate right"
              aria-label={`Rotate ${layer.name} right`}
              onClick={() => onRotateLayer(layer.id, normalizeRotation(layer.rotation + 15))}
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
                <path d="M10 4h2.5V1.5" />
                <path d="M12 4a5 5 0 1 0-2 8" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      {canAddLayer && (
        <button
          type="button"
          className="btn btn-sm"
          onClick={onAddLayer}
          aria-label="Add layer"
          style={{ alignSelf: "flex-start" }}
        >
          + Layer
        </button>
      )}
    </div>
  );
}

interface SmoothingSectionProps {
  alpha: number;
  onAlphaChange: (value: number) => void;
  smoothingMode: SmoothingMode;
  onSmoothingModeChange: (mode: SmoothingMode) => void;
}

export function SmoothingSection({
  alpha,
  onAlphaChange,
  smoothingMode,
  onSmoothingModeChange,
}: SmoothingSectionProps) {
  return (
    <div className="inspector-section">
      <span className="inspector-label">Smoothing</span>
      <SegmentedControl
        size="sm"
        options={[
          { value: "squircle", label: "Squircle" },
          { value: "smooth", label: "Smooth" },
        ]}
        value={smoothingMode}
        onChange={onSmoothingModeChange}
      />
      <div className="smoothing-bar">
        <input
          className="slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={alpha}
          onChange={(e) => onAlphaChange(parseFloat(e.target.value))}
          aria-label="Smoothing amount"
        />
        <span className="slider-value">{alpha.toFixed(2)}</span>
      </div>
    </div>
  );
}

interface ExportSectionProps {
  exportMode: ExportMode;
  onExportModeChange: (mode: ExportMode) => void;
  onExportSvg: () => void;
  onExportPng: (scale: PngScale) => void;
}

export function ExportSection({
  exportMode,
  onExportModeChange,
  onExportSvg,
  onExportPng,
}: ExportSectionProps) {
  return (
    <div className="inspector-section">
      <span className="inspector-label">Export</span>
      <SegmentedControl
        size="sm"
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "adaptive", label: "Auto" },
        ]}
        value={exportMode}
        onChange={onExportModeChange}
      />
      <div className="inspector-export-btns">
        <button type="button" className="btn btn-sm btn-accent" onClick={onExportSvg}>
          SVG
        </button>
        <button type="button" className="btn btn-sm" onClick={() => onExportPng(1)}>
          1x
        </button>
        <button type="button" className="btn btn-sm" onClick={() => onExportPng(2)}>
          2x
        </button>
        <button type="button" className="btn btn-sm" onClick={() => onExportPng(4)}>
          4x
        </button>
      </div>
    </div>
  );
}
