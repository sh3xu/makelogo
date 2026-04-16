import { StatusBar } from "../components/StatusBar";
import { ToolPalette } from "../components/ToolPalette";
import { EditorSurface } from "../features/editor/EditorSurface";
import { InspectorPanel } from "../features/inspector/InspectorPanel";
import { PreviewPanel } from "../features/preview/PreviewPanel";
import { WorkspaceHeader } from "../shared/ui/WorkspaceHeader";
import { useEditorWorkspace } from "./useEditorWorkspace";

export function AppShell() {
  const { state, actions } = useEditorWorkspace();

  return (
    <div className="app-shell" data-theme={state.theme}>
      <WorkspaceHeader
        theme={state.theme}
        gridSizeInput={state.gridSizeInput}
        gridMin={state.gridMin}
        gridMax={state.gridMax}
        canUndo={state.canUndo}
        canRedo={state.canRedo}
        onThemeToggle={() => actions.setTheme(state.theme === "dark" ? "light" : "dark")}
        onGridSizeInputChange={actions.setGridSizeInput}
        onGridSizeSubmit={actions.handleGridSizeSubmit}
        onUndo={actions.handleUndo}
        onRedo={actions.handleRedo}
      />
      <main className="workspace-grid">
        <aside className="workspace-tools">
          <ToolPalette activeTool={state.activeTool} onToolChange={actions.setActiveTool} />
        </aside>
        <div className="workspace-editor">
          <EditorSurface
            grid={state.gridRef.current}
            layerManager={state.layerManager}
            activeColor={state.activeColor}
            activeTool={state.activeTool}
            toolOptions={state.toolOptions}
            version={state.version}
            zoom={state.zoom}
            onZoomChange={actions.setZoom}
            onCursorChange={actions.setCursorPos}
            onStrokeComplete={actions.handleStrokeComplete}
          />
        </div>
        <aside className="workspace-side">
          <PreviewPanel smoothedResult={state.smoothedResult} gridSize={state.gridRef.current.n} />
          <InspectorPanel
            activeTool={state.activeTool}
            toolOptions={state.toolOptions}
            activeColor={state.activeColor}
            layers={state.layers}
            activeLayerId={state.activeLayerId}
            canAddLayer={state.canAddLayer}
            alpha={state.alpha}
            smoothingMode={state.smoothingMode}
            exportMode={state.exportMode}
            onBrushSizeChange={actions.handleBrushSizeChange}
            onSymmetryChange={actions.handleSymmetryChange}
            onShapeFilledChange={actions.handleShapeFilledChange}
            onColorChange={actions.setActiveColor}
            onSelectLayer={actions.handleSelectLayer}
            onToggleVisibility={actions.handleToggleVisibility}
            onAddLayer={actions.handleAddLayer}
            onRotateLayer={actions.handleRotateLayer}
            onAlphaChange={actions.setAlpha}
            onSmoothingModeChange={actions.setSmoothingMode}
            onExportModeChange={actions.setExportMode}
            onExportSvg={actions.handleExportSvg}
            onExportPng={actions.handleExportPng}
          />
        </aside>
      </main>
      <StatusBar
        zoom={state.zoom}
        gridSize={state.gridRef.current.n}
        cursorPos={state.cursorPos}
        activeLayerName={state.activeLayerName}
      />
    </div>
  );
}
