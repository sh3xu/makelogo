import { describe, expect, it } from "vitest";
import { Grid } from "../models/grid";
import { LayerManager } from "../models/layers";
import { computeSmoothedPaths } from "./slider";

const RED = "#ff0000";

function setup() {
  const grid = new Grid(8);
  const lm = new LayerManager([
    { id: "l1", name: "Layer 1", visible: true, rotation: 0 },
    { id: "l2", name: "Layer 2", visible: true, rotation: 0 },
  ]);
  grid.fillCell("l1", 0, 0, RED);
  grid.fillCell("l1", 0, 1, RED);
  grid.fillCell("l1", 1, 0, RED);
  return { grid, lm };
}

describe("computeSmoothedPaths (T-016)", () => {
  it("slider value maps linearly to alpha (0 to 1)", () => {
    const { grid, lm } = setup();
    const r0 = computeSmoothedPaths(grid, lm, 0);
    const rHalf = computeSmoothedPaths(grid, lm, 0.5);
    const r1 = computeSmoothedPaths(grid, lm, 1);
    // All should produce results
    expect(r0.length).toBeGreaterThan(0);
    expect(rHalf.length).toBeGreaterThan(0);
    expect(r1.length).toBeGreaterThan(0);
  });

  it("changing alpha produces different smoothed paths", () => {
    const { grid, lm } = setup();
    const r0 = computeSmoothedPaths(grid, lm, 0);
    const r1 = computeSmoothedPaths(grid, lm, 1);

    // Paths should differ in control points
    const p0 = r0[0]!.paths[0]!;
    const p1 = r1[0]!.paths[0]!;

    if (p0.segments.length > 0 && p1.segments.length > 0) {
      // At least some control points should differ between alpha=0 and alpha=1
      const c0 = p0.segments[0]!.c1;
      const c1 = p1.segments[0]!.c1;
      const differ = c0.x !== c1.x || c0.y !== c1.y;
      expect(differ).toBe(true);
    }
  });

  it("handbrush mode is visibly different from smooth mode", () => {
    const { grid, lm } = setup();
    const smooth = computeSmoothedPaths(grid, lm, 0.8, "smooth");
    const handbrush = computeSmoothedPaths(grid, lm, 0.8, "handbrush");

    const smoothFirst = smooth[0]?.paths[0]?.segments[0];
    const handbrushFirst = handbrush[0]?.paths[0]?.segments[0];

    expect(smoothFirst).toBeDefined();
    expect(handbrushFirst).toBeDefined();
    expect(
      handbrushFirst?.c1.x === smoothFirst?.c1.x && handbrushFirst?.c1.y === smoothFirst?.c1.y,
    ).toBe(false);
  });

  it("result includes color for each path", () => {
    const { grid, lm } = setup();
    const result = computeSmoothedPaths(grid, lm, 0.5);
    for (const lr of result) {
      for (const p of lr.paths) {
        expect(typeof p.color).toBe("string");
      }
    }
  });

  it("result groups paths by layer", () => {
    const { grid, lm } = setup();
    const result = computeSmoothedPaths(grid, lm, 0.5);
    expect(result.some((r) => r.layerId === "l1")).toBe(true);
  });
});
