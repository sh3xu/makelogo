import { MoonIcon, RedoIcon, SunIcon, UndoIcon } from "../../components/icons";
import type { SampleSummary } from "./WorkspaceSamples";
import { WorkspaceSamples } from "./WorkspaceSamples";

interface WorkspaceHeaderProps {
  theme: "dark" | "light";
  gridSizeInput: string;
  gridMin: number;
  gridMax: number;
  canUndo: boolean;
  canRedo: boolean;
  onThemeToggle: () => void;
  onGridSizeInputChange: (value: string) => void;
  onGridSizeSubmit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  sampleSummaries: readonly SampleSummary[];
  canvasHasContent: boolean;
  onApplySample: (id: string) => void;
}

export function WorkspaceHeader({
  theme,
  gridSizeInput,
  gridMin,
  gridMax,
  canUndo,
  canRedo,
  onThemeToggle,
  onGridSizeInputChange,
  onGridSizeSubmit,
  onUndo,
  onRedo,
  sampleSummaries,
  canvasHasContent,
  onApplySample,
}: WorkspaceHeaderProps) {
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
          <input
            className="input input-sm"
            value={gridSizeInput}
            onChange={(event) => onGridSizeInputChange(event.target.value)}
            onBlur={onGridSizeSubmit}
            onKeyDown={(event) => event.key === "Enter" && onGridSizeSubmit()}
            aria-label={`Grid size (${gridMin}-${gridMax})`}
          />
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
