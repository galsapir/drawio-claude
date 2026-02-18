// ABOUTME: Public API entry point for the drawio-claude library.
// ABOUTME: Re-exports core types and functions for programmatic use.

export { DiagramSchema, type Diagram, type Node, type Edge, type Group } from "./schema/graph.js";
export { validateInput } from "./schema/validate.js";
export { buildGraph, type GraphModel, type GraphNode, type GraphEdge } from "./core/graph-builder.js";
export { generateXml } from "./core/xml-generator.js";
export { validateDrawioXml } from "./core/xml-validator.js";
export { computeLayout } from "./layout/elk-layout.js";
export { exportDrawio, exportDrawioToFile } from "./export/drawio-exporter.js";
export { exportDrawioSvg, exportDrawioSvgToFile } from "./export/svg-exporter.js";
export { getTheme, listThemes } from "./themes/index.js";
export { resolveShapeStyle, listShapes, listCategories } from "./shapes/registry.js";
