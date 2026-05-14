import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export interface SampleSummary {
  id: string;
  title: string;
  shortDescription: string;
  learningNote: string;
}

interface WorkspaceSamplesProps {
  entries: readonly SampleSummary[];
  canvasHasContent: boolean;
  theme: "dark" | "light";
  onApplySample: (id: string) => void;
}

export function WorkspaceSamples({
  entries,
  canvasHasContent,
  theme,
  onApplySample,
}: WorkspaceSamplesProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || confirmOpen) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      const el = rootRef.current;
      if (el && !el.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, confirmOpen]);

  if (entries.length === 0) {
    return null;
  }

  function requestLoad(id: string) {
    if (canvasHasContent) {
      setPendingId(id);
      setConfirmOpen(true);
      setOpen(false);
    } else {
      onApplySample(id);
      setOpen(false);
    }
  }

  function handleConfirmReplace() {
    const id = pendingId;
    setPendingId(null);
    setConfirmOpen(false);
    if (id !== null) {
      onApplySample(id);
    }
  }

  function handleCancelReplace() {
    setPendingId(null);
    setConfirmOpen(false);
  }

  return (
    <div className="workspace-samples" ref={rootRef}>
      <button
        type="button"
        className="btn btn-sm"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="workspace-samples-menu"
        onClick={() => setOpen((current) => !current)}
      >
        Samples
      </button>
      {open ? (
        <div
          id="workspace-samples-menu"
          className="workspace-samples-panel"
          role="menu"
          aria-label="Starter samples"
        >
          <div className="workspace-samples-intro">
            Starter scenes are the project JSON files under{" "}
            <code className="workspace-samples-code">src/samples/json</code> (same compact cell
            format as project export/import). Titles and copy are listed in{" "}
            <code className="workspace-samples-code">registry.ts</code> next to each import.
          </div>
          <ul className="workspace-samples-list theme-scroll">
            {entries.map((entry) => (
              <li key={entry.id} className="workspace-samples-item">
                <div className="workspace-samples-copy">
                  <div className="workspace-samples-title">{entry.title}</div>
                  <p className="workspace-samples-desc">{entry.shortDescription}</p>
                  <p className="workspace-samples-hint">{entry.learningNote}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm workspace-samples-load"
                  role="menuitem"
                  onClick={() => requestLoad(entry.id)}
                >
                  Load
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        theme={theme}
        title="Replace canvas?"
        message="Loading a sample will replace your current artwork and clear undo history for this session."
        confirmLabel="Replace canvas"
        cancelLabel="Cancel"
        onConfirm={handleConfirmReplace}
        onCancel={handleCancelReplace}
      />
    </div>
  );
}
