// ABOUTME: Exports graph model as raw .drawio XML file.
// ABOUTME: Simple wrapper that generates XML and writes to file or returns as string.

import { writeFile } from "fs/promises";
import type { GraphModel } from "../core/graph-builder.js";
import { generateXml } from "../core/xml-generator.js";

export function exportDrawio(model: GraphModel): string {
  return generateXml(model);
}

export async function exportDrawioToFile(
  model: GraphModel,
  outputPath: string
): Promise<void> {
  const xml = exportDrawio(model);
  await writeFile(outputPath, xml, "utf-8");
}
