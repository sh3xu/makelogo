import { describe, expect, it } from "vitest";
import { Grid } from "../models/grid";
import { LayerManager } from "../models/layers";
import type { SmoothedLayerResult } from "../smoothing/slider";
import { type ExportConfig, exportSvg } from "./integration";

const MOCK_LAYERS: SmoothedLayerResult[] = [
  {
    layerId: "l1",
    rotation: 0,
    paths: [
      {
        segments: [
          { p0: { x: 0, y: 0 }, c1: { x: 0.5, y: 0 }, c2: { x: 1, y: 0.5 }, p3: { x: 1, y: 1 } },
          { p0: { x: 1, y: 1 }, c1: { x: 0.5, y: 1 }, c2: { x: 0, y: 0.5 }, p3: { x: 0, y: 0 } },
        ],
        isHole: false,
        color: "#ff0000",
      },
    ],
  },
];

const BASE_CONFIG: ExportConfig = {
  width: 10,
  height: 10,
  layers: MOCK_LAYERS,
  styling: "styled",
  background: { type: "transparent" },
  mode: "light",
  lightBg: "#ffffff",
  darkBg: "#000000",
  lightFg: "#000000",
  darkFg: "#ffffff",
};

describe("exportSvg integration (T-021)", () => {
  it("no-bg mode omits background rect", () => {
    const svg = exportSvg({ ...BASE_CONFIG, mode: "no-bg" });
    expect(svg).not.toContain("<rect");
  });

  it("light mode has no media query", () => {
    const svg = exportSvg({ ...BASE_CONFIG, mode: "light" });
    expect(svg).not.toContain("prefers-color-scheme");
  });

  it("dark mode has no media query", () => {
    const svg = exportSvg({ ...BASE_CONFIG, mode: "dark" });
    expect(svg).not.toContain("prefers-color-scheme");
  });

  it("solid background with light mode includes rect", () => {
    const svg = exportSvg({
      ...BASE_CONFIG,
      mode: "light",
      background: { type: "solid", color: "#cccccc" },
    });
    expect(svg).toContain('fill="#cccccc"');
  });

  it("transparent background produces clean SVG", () => {
    const svg = exportSvg({
      ...BASE_CONFIG,
      background: { type: "transparent" },
    });
    expect(svg).toContain("<path");
    expect(svg).toContain("</svg>");
  });

  it("as-is export uses pixel rects from the grid", () => {
    const grid = new Grid(8);
    const layerManager = new LayerManager([
      { id: "l1", name: "Layer 1", visible: true, rotation: 0 },
    ]);
    grid.initLayer("l1");
    grid.fillCell("l1", 1, 1, "#ff0000");

    const svg = exportSvg({
      ...BASE_CONFIG,
      width: 10,
      height: 10,
      styling: "as-is",
      mode: "no-bg",
      grid,
      layerManager,
    });

    expect(svg).toContain("<rect");
    expect(svg).not.toContain("<path");
    expect(svg).toContain('fill="#ff0000"');
  });
});
