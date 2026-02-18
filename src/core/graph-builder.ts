// ABOUTME: Transforms validated JSON DSL input into an internal graph model.
// ABOUTME: Resolves shape types, applies theme defaults, and prepares for layout + XML generation.

import type { Diagram, Node, Edge, Group, StyleOverride } from "../schema/graph.js";
import { getTheme, type Theme } from "../themes/index.js";
import { resolveShapeStyle, suggestShape } from "../shapes/registry.js";

export interface GraphNode {
  id: string;
  cellId: number;
  label: string;
  style: string;
  group: string | null;
  position: { x: number; y: number } | null;
  size: { width: number; height: number };
}

export interface GraphEdge {
  cellId: number;
  sourceId: string;
  targetId: string;
  sourceCellId: number;
  targetCellId: number;
  label: string;
  style: string;
}

export interface GraphGroup {
  id: string;
  cellId: number;
  label: string;
  parent: string | null;
  parentCellId: number;
  style: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface GraphModel {
  title: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: GraphGroup[];
  background: string;
}

const DEFAULT_NODE_SIZE = { width: 120, height: 60 };

export function buildGraph(diagram: Diagram): GraphModel {
  const theme = getTheme(diagram.theme);
  let nextCellId = 2; // 0 and 1 are reserved foundation cells

  // Build groups first so we can resolve parent cell IDs
  const groupCellIds = new Map<string, number>();
  const groups: GraphGroup[] = [];

  // Assign cell IDs to all groups first
  for (const group of diagram.groups) {
    groupCellIds.set(group.id, nextCellId++);
  }

  // Now build groups with resolved parent cell IDs
  for (const group of diagram.groups) {
    const cellId = groupCellIds.get(group.id)!;
    const parentCellId = group.parent ? groupCellIds.get(group.parent)! : 1;
    groups.push({
      id: group.id,
      cellId,
      label: group.label,
      parent: group.parent,
      parentCellId,
      style: buildGroupStyle(theme, group.style),
    });
  }

  // Build nodes
  const nodeCellIds = new Map<string, number>();
  const nodes: GraphNode[] = [];

  for (const node of diagram.nodes) {
    const cellId = nextCellId++;
    nodeCellIds.set(node.id, cellId);
    nodes.push({
      id: node.id,
      cellId,
      label: escapeXml(node.label),
      style: buildNodeStyle(node.type, theme, node.style),
      group: node.group ?? null,
      position: node.position ?? null,
      size: node.size ?? DEFAULT_NODE_SIZE,
    });
  }

  // Build edges
  const edges: GraphEdge[] = [];
  for (const edge of diagram.edges) {
    const sourceCellId = nodeCellIds.get(edge.from) ?? groupCellIds.get(edge.from)!;
    const targetCellId = nodeCellIds.get(edge.to) ?? groupCellIds.get(edge.to)!;
    edges.push({
      cellId: nextCellId++,
      sourceId: edge.from,
      targetId: edge.to,
      sourceCellId,
      targetCellId,
      label: escapeXml(edge.label ?? ""),
      style: buildEdgeStyle(edge.routing, theme, edge.style),
    });
  }

  return {
    title: diagram.title,
    nodes,
    edges,
    groups,
    background: theme.background,
  };
}

function buildNodeStyle(
  typeName: string,
  theme: Theme,
  overrides?: StyleOverride
): string {
  let baseStyle = resolveShapeStyle(typeName);

  if (!baseStyle) {
    // Check if it looks like a raw draw.io style string (contains = or ;)
    if (typeName.includes("=") || typeName.includes(";")) {
      baseStyle = typeName;
    } else {
      const suggestion = suggestShape(typeName);
      const hint = suggestion ? ` Did you mean "${suggestion}"?` : "";
      console.warn(`Unknown shape type "${typeName}".${hint} Using default.`);
      baseStyle = "rounded=1;whiteSpace=wrap;html=1;";
    }
  }

  // Apply theme defaults
  const themeStyle = [
    `fillColor=${overrides?.fillColor ?? theme.node.fillColor}`,
    `strokeColor=${overrides?.strokeColor ?? theme.node.strokeColor}`,
    `fontColor=${overrides?.fontColor ?? theme.node.fontColor}`,
    `fontSize=${overrides?.fontSize ?? theme.node.fontSize}`,
    `fontFamily=${overrides?.fontFamily ?? theme.node.fontFamily}`,
  ];

  if (overrides?.rounded !== undefined) {
    themeStyle.push(`rounded=${overrides.rounded ? 1 : 0}`);
  }
  if (overrides?.shadow !== undefined || theme.node.shadow) {
    themeStyle.push(`shadow=${overrides?.shadow ?? theme.node.shadow ? 1 : 0}`);
  }
  if (overrides?.dashed !== undefined) {
    themeStyle.push(`dashed=${overrides.dashed ? 1 : 0}`);
  }
  if (overrides?.opacity !== undefined) {
    themeStyle.push(`opacity=${overrides.opacity}`);
  }
  if (overrides?.strokeWidth !== undefined) {
    themeStyle.push(`strokeWidth=${overrides.strokeWidth}`);
  }

  return baseStyle + themeStyle.join(";") + ";";
}

function buildEdgeStyle(
  routing: "straight" | "orthogonal",
  theme: Theme,
  overrides?: StyleOverride
): string {
  const parts: string[] = [];

  if (routing === "orthogonal") {
    parts.push("edgeStyle=orthogonalEdgeStyle");
    parts.push("rounded=1");
  }

  parts.push("html=1");
  parts.push(`strokeColor=${overrides?.strokeColor ?? theme.edge.strokeColor}`);
  parts.push(`strokeWidth=${overrides?.strokeWidth ?? theme.edge.strokeWidth}`);
  parts.push(`fontColor=${overrides?.fontColor ?? theme.edge.fontColor}`);
  parts.push(`fontSize=${overrides?.fontSize ?? theme.edge.fontSize}`);

  return parts.join(";") + ";";
}

function buildGroupStyle(theme: Theme, overrides?: StyleOverride): string {
  const parts: string[] = [
    "rounded=1",
    "whiteSpace=wrap",
    "html=1",
    "container=1",
    "collapsible=0",
    `fillColor=${overrides?.fillColor ?? theme.group.fillColor}`,
    `strokeColor=${overrides?.strokeColor ?? theme.group.strokeColor}`,
    `fontColor=${overrides?.fontColor ?? theme.group.fontColor}`,
    `fontSize=${overrides?.fontSize ?? theme.group.fontSize}`,
    `dashed=${overrides?.dashed ?? theme.group.dashed ? 1 : 0}`,
    "verticalAlign=top",
    "fontStyle=1",
  ];

  if (overrides?.opacity !== undefined) {
    parts.push(`opacity=${overrides.opacity}`);
  }

  return parts.join(";") + ";";
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
