import layeredGemRaw from "./json/layered-gem.json?raw";
import robotBuddyRaw from "./json/robot-buddy.json?raw";
import sunburstMarkRaw from "./json/sunburst-mark.json?raw";

const SAMPLE_META = [
  {
    id: "layered-gem",
    title: "Crystal medallion",
    shortDescription:
      "Layered jewel: starfield with nebula patches, stepped gold bezel, and faceted teal core (64 grid).",
    learningNote:
      "Three stacked layers show how backgrounds, metalwork, and gem facets stay independent for edits and export.",
  },
  {
    id: "sunburst-mark",
    title: "Rose mandala",
    shortDescription:
      "Twelve-petal rosette, radial wine field, and a separate chief disk (64 grid, three layers).",
    learningNote:
      "Field, petals, and center live on different layers so you can recolor the rosette without touching the chief.",
  },
  {
    id: "robot-buddy",
    title: "Moonlit owl",
    shortDescription:
      "Night gradient with moon and hills, plus a separate owl and perch layer (64 grid).",
    learningNote:
      "Sky lives on one layer and the subject on another so you can repaint feathers without redoing the moon.",
  },
] as const;

type SampleId = (typeof SAMPLE_META)[number]["id"];

export interface SampleListEntry {
  id: string;
  title: string;
  shortDescription: string;
  learningNote: string;
}

const BUNDLED_SAMPLE_PROJECT_JSON: Record<SampleId, string> = {
  "layered-gem": layeredGemRaw,
  "sunburst-mark": sunburstMarkRaw,
  "robot-buddy": robotBuddyRaw,
};

export const SAMPLE_REGISTRY: readonly SampleListEntry[] = SAMPLE_META.map((meta) => ({
  id: meta.id,
  title: meta.title,
  shortDescription: meta.shortDescription,
  learningNote: meta.learningNote,
}));

/**
 * NOTE: Raw JSON string for bundled samples — parse with `parseProjectImportText` (same as file import).
 */
export function getBundledSampleProjectJson(id: string): string | undefined {
  return BUNDLED_SAMPLE_PROJECT_JSON[id as SampleId];
}
