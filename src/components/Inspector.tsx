import { useState } from "react";
import type { PngScale } from "../export/png";
import { clampPngScale, MAX_PNG_SCALE, MIN_PNG_SCALE } from "../export/png";
import type { Layer } from "../models/layers";
import type { SymmetryMode, ToolOptions } from "../models/tools";
import { Tool } from "../models/tools";
import type { SmoothingMode } from "../smoothing/slider";
import { ColorPickerIcon, EyeIcon, EyeOffIcon, RotateLeftIcon, RotateRightIcon, TrashIcon } from "./icons";
import { SegmentedControl } from "./SegmentedControl";

type ExportMode = "light" | "dark" | "no-bg";

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
  canRemoveLayer: boolean;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onRotateLayer: (id: string, degrees: number) => void;
  onRemoveLayer: (id: string) => void;

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
        canRemoveLayer={props.canRemoveLayer}
        onSelectLayer={props.onSelectLayer}
        onToggleVisibility={props.onToggleVisibility}
        onAddLayer={props.onAddLayer}
        onRotateLayer={props.onRotateLayer}
        onRemoveLayer={props.onRemoveLayer}
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
  const iconColor = getContrastingColor(activeColor);

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
        <div className="color-input-wrap" style={{ background: activeColor }}>
          <ColorPickerIcon className="color-input-icon" stroke={iconColor} aria-hidden="true" />
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

function getContrastingColor(hex: string): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return "#ffffff";
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "#111111" : "#f8fafc";
}

interface LayersSectionProps {
  layers: readonly Layer[];
  activeLayerId: string;
  canAddLayer: boolean;
  canRemoveLayer: boolean;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onRotateLayer: (id: string, degrees: number) => void;
  onRemoveLayer: (id: string) => void;
}

export function LayersSection({
  layers,
  activeLayerId,
  canAddLayer,
  canRemoveLayer,
  onSelectLayer,
  onToggleVisibility,
  onAddLayer,
  onRotateLayer,
  onRemoveLayer,
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
          <div className={`layer-item${layer.id === activeLayerId ? " layer-item-active" : ""}`}>
            <button
              type="button"
              className="layer-select-btn"
              onClick={() => onSelectLayer(layer.id)}
              aria-label={`Select ${layer.name}`}
            >
              <span className="layer-name">{layer.name}</span>
            </button>
            <span className="layer-item-end">
              <button
                type="button"
                className={`layer-eye-btn${!layer.visible ? " layer-eye-btn-hidden" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                aria-pressed={layer.visible}
                aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.name}`}
                title={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? <EyeIcon aria-hidden="true" /> : <EyeOffIcon aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="layer-trash-btn"
                disabled={!canRemoveLayer}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveLayer(layer.id);
                }}
                aria-label={`Delete ${layer.name}`}
                title={canRemoveLayer ? "Delete layer" : "Cannot delete: minimum layers reached"}
              >
                <TrashIcon aria-hidden="true" />
              </button>
            </span>
          </div>
          <div className="layer-rotation">
            <button
              type="button"
              className="btn btn-xs btn-icon"
              title="Rotate left"
              aria-label={`Rotate ${layer.name} left`}
              onClick={() => onRotateLayer(layer.id, normalizeRotation(layer.rotation - 15))}
            >
              <RotateLeftIcon />
            </button>
            <button
              type="button"
              className="btn btn-xs btn-icon"
              title="Rotate right"
              aria-label={`Rotate ${layer.name} right`}
              onClick={() => onRotateLayer(layer.id, normalizeRotation(layer.rotation + 15))}
            >
              <RotateRightIcon />
            </button>
            <span className="layer-angle" aria-label={`${layer.name} rotation angle`}>
              {layer.rotation}°
            </span>
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
      <span className="inspector-label">Styling</span>
      <SegmentedControl
        size="sm"
        options={[
          { value: "pixel", label: "Pixel" },
          { value: "squircle", label: "Squircle" },
          { value: "smooth", label: "Smooth" },
          { value: "handbrush", label: "Brush" },
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
          aria-label="Styling intensity"
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
  const [exportFormat, setExportFormat] = useState<"svg" | "png">("svg");
  const [pngQuality, setPngQuality] = useState<PngScale>(8);

  function handleExport() {
    if (exportFormat === "svg") {
      onExportSvg();
      return;
    }
    onExportPng(clampPngScale(pngQuality));
  }

  return (
    <div className="inspector-section">
      <span className="inspector-label">Export</span>
      <SegmentedControl
        size="sm"
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "no-bg", label: "No-bg" },
        ]}
        value={exportMode}
        onChange={onExportModeChange}
      />
      <div className="inspector-row">
        <span className="inspector-sublabel">Format</span>
        <SegmentedControl
          size="sm"
          options={[
            { value: "svg", label: "SVG" },
            { value: "png", label: "PNG" },
          ]}
          value={exportFormat}
          onChange={(value) => setExportFormat(value as "svg" | "png")}
        />
      </div>

      <div className="inspector-row">
        <span className="inspector-sublabel">Quality</span>
        <div className="smoothing-bar">
          <input
            className="slider"
            type="range"
            min={MIN_PNG_SCALE}
            max={MAX_PNG_SCALE}
            step={1}
            value={pngQuality}
            onChange={(e) => setPngQuality(clampPngScale(Number(e.target.value)))}
            aria-label="PNG quality scale"
            disabled={exportFormat !== "png"}
          />
          <span className="slider-value">{pngQuality}x</span>
        </div>
      </div>

      <div className="inspector-export-btns">
        <button type="button" className="btn btn-sm btn-accent" onClick={handleExport}>
          Export {exportFormat.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
