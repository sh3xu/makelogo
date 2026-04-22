import { useMemo, useState } from "react";
import {
  ColorSection,
  ExportSection,
  LayersSection,
  SmoothingSection,
  ToolOptionsSection,
} from "../../components/Inspector";
import type { PngScale } from "../../export/png";
import type { Layer } from "../../models/layers";
import type { SymmetryMode, Tool, ToolOptions } from "../../models/tools";
import type { SmoothingMode } from "../../smoothing/slider";

type ExportMode = "light" | "dark" | "no-bg";

interface InspectorPanelProps {
  activeTool: Tool;
  toolOptions: ToolOptions;
  activeColor: string;
  layers: readonly Layer[];
  activeLayerId: string;
  canAddLayer: boolean;
  alpha: number;
  smoothingMode: SmoothingMode;
  exportMode: ExportMode;
  onBrushSizeChange: (size: 1 | 2 | 3 | 4) => void;
  onSymmetryChange: (mode: SymmetryMode) => void;
  onShapeFilledChange: (filled: boolean) => void;
  onColorChange: (color: string) => void;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onRotateLayer: (id: string, degrees: number) => void;
  onAlphaChange: (value: number) => void;
  onSmoothingModeChange: (mode: SmoothingMode) => void;
  onExportModeChange: (mode: ExportMode) => void;
  onExportSvg: () => void;
  onExportPng: (scale: PngScale) => void;
}

type InspectorTab = "tools" | "layers" | "export";

export function InspectorPanel(props: InspectorPanelProps) {
  const tabs = useMemo(
    () =>
      [
        { id: "tools", label: "Tools" },
        { id: "layers", label: "Layers" },
        { id: "export", label: "Export" },
      ] as const,
    [],
  );
  const [tab, setTab] = useState<InspectorTab>("tools");

  return (
    <section className="inspector-layout">
      <div className="section-header">Inspector</div>
      <div className="inspector-tabs" role="tablist" aria-label="Inspector sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`inspector-tab${tab === t.id ? " inspector-tab-active" : ""}`}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="inspector-content">
        {tab === "tools" && (
          <>
            <ToolOptionsSection
              activeTool={props.activeTool}
              toolOptions={props.toolOptions}
              onBrushSizeChange={props.onBrushSizeChange}
              onSymmetryChange={props.onSymmetryChange}
              onShapeFilledChange={props.onShapeFilledChange}
            />
            <ColorSection activeColor={props.activeColor} onColorChange={props.onColorChange} />
          </>
        )}

        {tab === "layers" && (
          <>
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
          </>
        )}

        {tab === "export" && (
          <ExportSection
            exportMode={props.exportMode}
            onExportModeChange={props.onExportModeChange}
            onExportSvg={props.onExportSvg}
            onExportPng={props.onExportPng}
          />
        )}
      </div>
    </section>
  );
}
