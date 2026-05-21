import { MoonIcon, RedoIcon, SunIcon, UndoIcon } from "../../components/icons";
import { gridSizeSelectOptions } from "../../models/grid";
import type { SampleSummary } from "./WorkspaceSamples";
import { WorkspaceSamples } from "./WorkspaceSamples";

interface WorkspaceHeaderProps {
  theme: "dark" | "light";
  gridSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onThemeToggle: () => void;
  onGridSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  sampleSummaries: readonly SampleSummary[];
  canvasHasContent: boolean;
  onApplySample: (id: string) => void;
}

export function WorkspaceHeader({
  theme,
  gridSize,
  canUndo,
  canRedo,
  onThemeToggle,
  onGridSizeChange,
  onUndo,
  onRedo,
  sampleSummaries,
  canvasHasContent,
  onApplySample,
}: WorkspaceHeaderProps) {
  const gridSizeOptions = gridSizeSelectOptions(gridSize);
  return (
    <header className="workspace-header">
      <div className="workspace-brand">
        <h1>Glyph Studio</h1>
        <p>Vector-first logo design workspace</p>
      </div>
      <div className="workspace-actions">
        <WorkspaceSamples
          entries={sampleSummaries}
          canvasHasContent={canvasHasContent}
          theme={theme}
          onApplySample={onApplySample}
        />
        <button className="btn btn-icon" type="button" onClick={onThemeToggle} title="Toggle theme">
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <label className="field">
          Grid
          <select
            className="input input-select"
            value={String(gridSize)}
            onChange={(event) => onGridSizeChange(Number(event.target.value))}
            aria-label="Grid size"
          >
            {gridSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn btn-icon"
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo"
        >
          <UndoIcon />
        </button>
        <button
          className="btn btn-icon"
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo"
        >
          <RedoIcon />
        </button>
      </div>
    </header>
  );
}
