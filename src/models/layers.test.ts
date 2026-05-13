import { beforeEach, describe, expect, it } from "vitest";
import { LAYER_MAX_COUNT, LAYER_MIN_COUNT, LayerManager } from "./layers";

describe("LayerManager", () => {
  let manager: LayerManager;

  beforeEach(() => {
    manager = new LayerManager();
  });

  it("creates 2 layers by default", () => {
    expect(manager.layers.length).toBe(2);
  });

  it("rejects initialization with fewer than 2 layers", () => {
    expect(
      () => new LayerManager([{ id: "a", name: "Layer 1", visible: true, rotation: 0 }]),
    ).toThrow(RangeError);
  });

  it("rejects initialization with more than 3 layers", () => {
    expect(
      () =>
        new LayerManager([
          { id: "a", name: "L1", visible: true, rotation: 0 },
          { id: "b", name: "L2", visible: true, rotation: 0 },
          { id: "c", name: "L3", visible: true, rotation: 0 },
          { id: "d", name: "L4", visible: true, rotation: 0 },
        ]),
    ).toThrow(RangeError);
  });

  it("can have exactly 3 layers", () => {
    manager.addLayer("Layer 3");
    expect(manager.layers.length).toBe(3);
  });

  it("cannot exceed 3 layers", () => {
    manager.addLayer("Layer 3");
    expect(() => manager.addLayer("Layer 4")).toThrow();
    expect(manager.layers.length).toBe(3);
  });

  it("cannot remove below 2 layers", () => {
    const id = manager.layers[0]!.id;
    expect(() => manager.removeLayer(id)).toThrow();
    expect(manager.layers.length).toBe(2);
  });

  it("can remove a layer when count is 3", () => {
    manager.addLayer("Layer 3");
    const id = manager.layers[0]!.id;
    manager.removeLayer(id);
    expect(manager.layers.length).toBe(2);
  });

  it("layers are visible by default", () => {
    for (const layer of manager.layers) {
      expect(layer.visible).toBe(true);
    }
  });

  it("each layer can be toggled visible/hidden independently", () => {
    const [l0, l1] = manager.layers;
    manager.toggleVisibility(l0!.id);
    expect(manager.getLayer(l0!.id)!.visible).toBe(false);
    expect(manager.getLayer(l1!.id)!.visible).toBe(true);
  });

  it("toggling visibility twice restores original state", () => {
    const id = manager.layers[0]!.id;
    manager.toggleVisibility(id);
    manager.toggleVisibility(id);
    expect(manager.getLayer(id)!.visible).toBe(true);
  });

  it("setVisibility explicitly sets layer visibility", () => {
    const id = manager.layers[0]!.id;
    manager.setVisibility(id, false);
    expect(manager.getLayer(id)!.visible).toBe(false);
    manager.setVisibility(id, true);
    expect(manager.getLayer(id)!.visible).toBe(true);
  });

  it("getVisibleLayers returns only visible layers", () => {
    const [l0, l1] = manager.layers;
    manager.setVisibility(l0!.id, false);
    const visible = manager.getVisibleLayers();
    expect(visible.length).toBe(1);
    expect(visible[0]!.id).toBe(l1!.id);
  });

  it("hidden layers are excluded from getVisibleLayers", () => {
    for (const layer of manager.layers) {
      manager.setVisibility(layer.id, false);
    }
    expect(manager.getVisibleLayers().length).toBe(0);
  });

  it("starts with exactly one active layer", () => {
    expect(manager.activeLayerId).toBeDefined();
    expect(typeof manager.activeLayerId).toBe("string");
  });

  it("can switch the active layer", () => {
    const [l0, l1] = manager.layers;
    manager.setActiveLayer(l0!.id);
    expect(manager.activeLayerId).toBe(l0!.id);
    manager.setActiveLayer(l1!.id);
    expect(manager.activeLayerId).toBe(l1!.id);
  });

  it("switching active layer is reflected in getActiveLayer()", () => {
    const [l0] = manager.layers;
    manager.setActiveLayer(l0!.id);
    expect(manager.getActiveLayer().id).toBe(l0!.id);
  });

  it("throws when setting an invalid layer as active", () => {
    expect(() => manager.setActiveLayer("nonexistent")).toThrow();
  });

  it("after removing active layer, a different layer becomes active", () => {
    manager.addLayer("Layer 3");
    const activeId = manager.activeLayerId;
    manager.removeLayer(activeId);
    expect(manager.getLayer(manager.activeLayerId)).toBeDefined();
    expect(manager.activeLayerId).not.toBe(activeId);
  });

  it("can move a layer up in the stack", () => {
    const [l0, l1] = manager.layers;
    manager.moveLayerUp(l0!.id);
    expect(manager.layers[1]!.id).toBe(l0!.id);
    expect(manager.layers[0]!.id).toBe(l1!.id);
  });

  it("moveLayerUp is a no-op at the top", () => {
    const topId = manager.layers[manager.layers.length - 1]!.id;
    const orderBefore = manager.layers.map((l) => l.id).join(",");
    manager.moveLayerUp(topId);
    const orderAfter = manager.layers.map((l) => l.id).join(",");
    expect(orderBefore).toBe(orderAfter);
  });

  it("can move a layer down in the stack", () => {
    const [l0, l1] = manager.layers;
    manager.moveLayerDown(l1!.id);
    expect(manager.layers[0]!.id).toBe(l1!.id);
    expect(manager.layers[1]!.id).toBe(l0!.id);
  });

  it("moveLayerDown is a no-op at the bottom", () => {
    const bottomId = manager.layers[0]!.id;
    const orderBefore = manager.layers.map((l) => l.id).join(",");
    manager.moveLayerDown(bottomId);
    const orderAfter = manager.layers.map((l) => l.id).join(",");
    expect(orderBefore).toBe(orderAfter);
  });

  it("reorder with 3 layers works correctly", () => {
    manager.addLayer("Layer 3");
    const [l0, l1, l2] = manager.layers;
    manager.moveLayerUp(l1!.id);
    expect(manager.layers[0]!.id).toBe(l0!.id);
    expect(manager.layers[1]!.id).toBe(l2!.id);
    expect(manager.layers[2]!.id).toBe(l1!.id);
  });

  it("LAYER_MIN_COUNT is 2 and LAYER_MAX_COUNT is 3", () => {
    expect(LAYER_MIN_COUNT).toBe(2);
    expect(LAYER_MAX_COUNT).toBe(3);
  });

  it("insertLayerAt inserts at index and respects max count", () => {
    const [l0, l1] = manager.layers;
    manager.insertLayerAt(
      { id: "mid", name: "Mid", visible: true, rotation: 0 },
      1,
    );
    expect(manager.layers.length).toBe(3);
    expect(manager.layers.map((l) => l.id).join(",")).toBe(`${l0!.id},mid,${l1!.id}`);
    expect(() =>
      manager.insertLayerAt({ id: "x", name: "X", visible: true, rotation: 0 }, 0),
    ).toThrow();
  });

  it("insertLayerAt rejects out of range index", () => {
    expect(() =>
      manager.insertLayerAt({ id: "x", name: "X", visible: true, rotation: 0 }, 5),
    ).toThrow(RangeError);
  });

  it("switching active layer means subsequent draw ops target new layer", () => {
    const [l0, l1] = manager.layers;
    manager.setActiveLayer(l1!.id);
    expect(manager.activeLayerId).toBe(l1!.id);
    manager.setActiveLayer(l0!.id);
    expect(manager.activeLayerId).toBe(l0!.id);
  });
});
