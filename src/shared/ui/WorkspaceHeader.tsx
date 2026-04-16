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
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-brand">
        <h1>MakeLogo Studio</h1>
        <p>Vector-first logo design workspace</p>
      </div>
      <div className="workspace-actions">
        <button className="btn btn-icon" type="button" onClick={onThemeToggle} title="Toggle theme">
          {theme === "dark" ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="7" cy="7" r="2.5" />
              <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.9 2.9l.7.7M10.4 10.4l.7.7M10.4 3.6l-.7.7M3.6 10.4l-.7.7" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M11.5 8.5A5 5 0 0 1 5.5 2.5a5 5 0 1 0 6 6z" />
            </svg>
          )}
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
            <path d="M3 5h5.5a3 3 0 0 1 0 6H8" />
            <path d="M5.5 2.5 3 5l2.5 2.5" />
          </svg>
        </button>
        <button
          className="btn btn-icon"
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo"
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
            <path d="M11 5H5.5a3 3 0 0 0 0 6H6" />
            <path d="M8.5 2.5 11 5 8.5 7.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
