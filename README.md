# Logo Designer

Browser-based logo editor for drawing pixel-grid artwork and exporting polished assets as SVG and PNG.

- Live app: [https://sh3xu.github.io/makelogo/](https://sh3xu.github.io/makelogo/)
- Local-first: no backend required
- Stack: React + TypeScript + Vite

## Features

- Grid-based editor (small to large canvas sizes)
- Draw, erase, line, rectangle, ellipse, and flood-fill tools
- Brush sizes, symmetry modes, and shape fill/outline options
- Multi-layer workflow with visibility and transformation controls
- Smooth vector mode (Bezier) and pixel mode rendering
- SVG and PNG export with light, dark, and adaptive themes
- Action-level undo/redo history

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start local development server |
| `pnpm build` | Run TypeScript build and generate production bundle |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run unit tests once with Vitest |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm check` | Run Biome checks on `src` |
| `pnpm format` | Auto-fix formatting/lint issues in `src` |

## Project Structure

```text
src/
├── app/          # Application composition and workspace hooks
├── features/     # Feature-level UI (editor, inspector, preview)
├── shared/       # Reusable UI building blocks
├── models/       # Core data models and domain utilities
├── canvas/       # Drawing interactions, rendering, and history
├── smoothing/    # Contour extraction and curve processing
├── export/       # SVG/PNG generation and download flows
└── components/   # Legacy/shared components still in use
```

## Rendering Pipeline

```text
Grid State -> Contour Extraction -> Smoothing/Styling -> Export (SVG/PNG)
```

The editing model and export pipeline are intentionally separated so export style changes do not mutate source drawing data.


## License

MIT
