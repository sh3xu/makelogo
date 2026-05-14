import { describe, expect, it } from "vitest";
import { parseProjectImportText } from "./projectImport";
import { getBundledSampleProjectJson, SAMPLE_REGISTRY } from "./registry";

describe("bundled samples", () => {
  it("each registry entry loads and parses", () => {
    for (const entry of SAMPLE_REGISTRY) {
      const text = getBundledSampleProjectJson(entry.id);
      expect(text, entry.id).toBeDefined();
      const result = parseProjectImportText(text!);
      expect(result.ok, entry.id).toBe(true);
      if (result.ok) {
        expect(result.doc.gridSize).toBeGreaterThanOrEqual(8);
        expect(result.doc.layers.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
