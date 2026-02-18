// ABOUTME: Generates valid draw.io XML (mxGraphModel) from the internal graph model.
// ABOUTME: Handles foundation cells, geometry, vertex/edge ordering, and proper XML structure.

import type { GraphModel, GraphNode, GraphEdge, GraphGroup } from "./graph-builder.js";

export function generateXml(model: GraphModel): string {
  const lines: string[] = [];

  lines.push(`<mxfile host="drawio-claude" modified="${new Date().toISOString()}" type="device">`);
  lines.push(`  <diagram name="${escapeAttr(model.title)}" id="diagram-1">`);
  lines.push(`    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" math="0" shadow="0" background="${escapeAttr(model.background)}">`);
  lines.push(`      <root>`);

  // Foundation cells (required by draw.io)
  lines.push(`        <mxCell id="0"/>`);
  lines.push(`        <mxCell id="1" parent="0"/>`);

  // Groups first (containers must exist before their children)
  for (const group of model.groups) {
    lines.push(generateGroupCell(group, model.groups));
  }

  // Vertices (all nodes)
  for (const node of model.nodes) {
    const parentCellId = resolveParentCellId(node, model.groups);
    lines.push(generateNodeCell(node, parentCellId, model.groups));
  }

  // Edges last (source/target must exist)
  for (const edge of model.edges) {
    lines.push(generateEdgeCell(edge));
  }

  lines.push(`      </root>`);
  lines.push(`    </mxGraphModel>`);
  lines.push(`  </diagram>`);
  lines.push(`</mxfile>`);

  return lines.join("\n");
}

function resolveParentCellId(node: GraphNode, groups: GraphGroup[]): number {
  if (!node.group) return 1;
  const group = groups.find((g) => g.id === node.group);
  return group ? group.cellId : 1;
}

function generateGroupCell(group: GraphGroup, allGroups: GraphGroup[]): string {
  const absX = group.position?.x ?? 0;
  const absY = group.position?.y ?? 0;
  const width = group.size?.width ?? 200;
  const height = group.size?.height ?? 200;

  // draw.io expects positions relative to parent group
  const parentGroup = group.parent ? allGroups.find((g) => g.id === group.parent) : null;
  const relX = parentGroup?.position ? absX - parentGroup.position.x : absX;
  const relY = parentGroup?.position ? absY - parentGroup.position.y : absY;

  return [
    `        <mxCell id="${group.cellId}" value="${escapeAttr(group.label)}" style="${escapeAttr(group.style)}" vertex="1" parent="${group.parentCellId}">`,
    `          <mxGeometry x="${relX}" y="${relY}" width="${width}" height="${height}" as="geometry"/>`,
    `        </mxCell>`,
  ].join("\n");
}

function generateNodeCell(node: GraphNode, parentCellId: number, allGroups: GraphGroup[]): string {
  const absX = node.position?.x ?? 0;
  const absY = node.position?.y ?? 0;

  // draw.io expects positions relative to parent group
  const parentGroup = node.group ? allGroups.find((g) => g.id === node.group) : null;
  const relX = parentGroup?.position ? absX - parentGroup.position.x : absX;
  const relY = parentGroup?.position ? absY - parentGroup.position.y : absY;

  return [
    `        <mxCell id="${node.cellId}" value="${escapeAttr(node.label)}" style="${escapeAttr(node.style)}" vertex="1" parent="${parentCellId}">`,
    `          <mxGeometry x="${relX}" y="${relY}" width="${node.size.width}" height="${node.size.height}" as="geometry"/>`,
    `        </mxCell>`,
  ].join("\n");
}

function generateEdgeCell(edge: GraphEdge): string {
  const valueAttr = edge.label ? ` value="${escapeAttr(edge.label)}"` : "";

  return [
    `        <mxCell id="${edge.cellId}"${valueAttr} style="${escapeAttr(edge.style)}" edge="1" source="${edge.sourceCellId}" target="${edge.targetCellId}" parent="1">`,
    `          <mxGeometry relative="1" as="geometry"/>`,
    `        </mxCell>`,
  ].join("\n");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
