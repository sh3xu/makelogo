import { type ProjectDocument, parseProjectDocument } from "./schema";

export type ParseProjectImportResult =
  | { ok: true; doc: ProjectDocument }
  | { ok: false; error: string };

/**
 * NOTE: Parses user-provided JSON from disk or clipboard; safe to call on untrusted text.
 */
export function parseProjectImportText(text: string): ParseProjectImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }
  try {
    const doc = parseProjectDocument(raw);
    return { ok: true, doc };
  } catch (e) {
    const message = e instanceof Error ? e.message : "This file is not a valid Glyph project.";
    return { ok: false, error: message };
  }
}
