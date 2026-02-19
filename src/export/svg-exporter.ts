// ABOUTME: Exports graph model as .drawio.svg — a dual-format file that's both valid SVG and editable draw.io.
// ABOUTME: Generates SVG rendering of the diagram and embeds compressed draw.io XML in the content attribute.

import { writeFile } from "fs/promises";
import { deflate } from "pako";
import type { GraphModel, GraphNode, GraphEdge } from "../core/graph-builder.js";
import { generateXml } from "../core/xml-generator.js";

export function exportDrawioSvg(model: GraphModel): string {
  const xml = generateXml(model);
  const compressedXml = compressDrawioXml(xml);
  const svgContent = renderSvg(model);

  // Inject the content attribute into the root <svg> element
  return svgContent.replace(
    "<svg ",
    `<svg content="${escapeAttr(compressedXml)}" `
  );
}

export async function exportDrawioSvgToFile(
  model: GraphModel,
  outputPath: string
): Promise<void> {
  const svg = exportDrawioSvg(model);
  await writeFile(outputPath, svg, "utf-8");
}

function compressDrawioXml(xml: string): string {
  const encoded = new TextEncoder().encode(xml);
  const compressed = deflate(encoded, { level: 9 });
  return btoa(String.fromCharCode(...compressed));
}

function renderSvg(model: GraphModel): string {
  const bounds = computeBounds(model);
  const padding = 20;
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  const offsetX = -bounds.minX + padding;
  const offsetY = -bounds.minY + padding;

  const elements: string[] = [];

  // Render groups (background rectangles)
  for (const group of model.groups) {
    const pos = group.position ?? { x: 0, y: 0 };
    const size = group.size ?? { width: 200, height: 200 };
    const fill = extractStyleProp(group.style, "fillColor") ?? "#f5f5f5";
    const stroke = extractStyleProp(group.style, "strokeColor") ?? "#999999";
    const dashed = group.style.includes("dashed=1");

    elements.push(
      `  <g>`,
      `    <rect x="${pos.x + offsetX}" y="${pos.y + offsetY}" width="${size.width}" height="${size.height}" ` +
        `fill="${fill}" stroke="${stroke}" stroke-width="1" rx="6"${dashed ? ' stroke-dasharray="8,4"' : ""}/>`,
      `    <text x="${pos.x + offsetX + 10}" y="${pos.y + offsetY + 18}" ` +
        `font-family="Helvetica" font-size="13" font-weight="bold" fill="${extractStyleProp(group.style, "fontColor") ?? "#333"}">${escapeXmlText(group.label)}</text>`,
      `  </g>`
    );
  }

  // Render nodes
  for (const node of model.nodes) {
    const x = (node.position?.x ?? 0) + offsetX;
    const y = (node.position?.y ?? 0) + offsetY;
    const w = node.size.width;
    const h = node.size.height;
    const fill = extractStyleProp(node.style, "fillColor") ?? "#dae8fc";
    const stroke = extractStyleProp(node.style, "strokeColor") ?? "#6c8ebf";
    const strokeWidth = extractStyleProp(node.style, "strokeWidth") ?? "1";
    const isDashed = node.style.includes("dashed=1");
    const isRounded = node.style.includes("rounded=1");
    const isDecision = node.style.includes("rhombus");
    const isCylinder = node.style.includes("cylinder");
    const isEllipse = node.style.includes("ellipse");

    if (isDecision) {
      // Diamond shape for decisions
      const cx = x + w / 2;
      const cy = y + h / 2;
      elements.push(
        `  <g>`,
        `    <polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" ` +
          `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`,
        renderSvgText(node.label, x, y, w, h, node.style),
        `  </g>`
      );
    } else if (isEllipse || node.style.includes("shape=cloud")) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      elements.push(
        `  <g>`,
        `    <ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" ` +
          `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`,
        renderSvgText(node.label, x, y, w, h, node.style),
        `  </g>`
      );
    } else if (isCylinder) {
      // Simplified cylinder
      const ellipseRy = 10;
      elements.push(
        `  <g>`,
        `    <path d="M${x},${y + ellipseRy} ` +
          `A${w / 2},${ellipseRy} 0 0,1 ${x + w},${y + ellipseRy} ` +
          `V${y + h - ellipseRy} ` +
          `A${w / 2},${ellipseRy} 0 0,1 ${x},${y + h - ellipseRy} Z" ` +
          `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`,
        `    <ellipse cx="${x + w / 2}" cy="${y + ellipseRy}" rx="${w / 2}" ry="${ellipseRy}" ` +
          `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`,
        renderSvgText(node.label, x, y, w, h, node.style),
        `  </g>`
      );
    } else {
      // Rounded rectangle (default)
      const rx = isRounded ? 6 : 0;
      elements.push(
        `  <g>`,
        `    <rect x="${x}" y="${y}" width="${w}" height="${h}" ` +
          `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${rx}"${isDashed ? ' stroke-dasharray="6,3"' : ""}/>`,
        renderSvgText(node.label, x, y, w, h, node.style),
        `  </g>`
      );
    }
  }

  // Render edges — connect from nearest edge of source to nearest edge of target
  for (const edge of model.edges) {
    const sourceNode = model.nodes.find((n) => n.id === edge.sourceId);
    const targetNode = model.nodes.find((n) => n.id === edge.targetId);

    if (sourceNode?.position && targetNode?.position) {
      const srcCx = (sourceNode.position.x ?? 0) + offsetX + sourceNode.size.width / 2;
      const srcCy = (sourceNode.position.y ?? 0) + offsetY + sourceNode.size.height / 2;
      const tgtCx = (targetNode.position.x ?? 0) + offsetX + targetNode.size.width / 2;
      const tgtCy = (targetNode.position.y ?? 0) + offsetY + targetNode.size.height / 2;

      // Pick connection points on the edges of the rectangles
      const [sx, sy] = getConnectionPoint(
        sourceNode.position.x + offsetX, sourceNode.position.y + offsetY,
        sourceNode.size.width, sourceNode.size.height,
        tgtCx, tgtCy
      );
      const [tx, ty] = getConnectionPoint(
        targetNode.position.x + offsetX, targetNode.position.y + offsetY,
        targetNode.size.width, targetNode.size.height,
        srcCx, srcCy
      );

      const strokeColor = extractStyleProp(edge.style, "strokeColor") ?? "#666";
      const strokeWidth = extractStyleProp(edge.style, "strokeWidth") ?? "1";

      elements.push(
        `  <g>`,
        `    <line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" ` +
          `stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-end="url(#arrowhead)"/>`,
      );

      if (edge.label) {
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        elements.push(
          `    <text x="${mx}" y="${my - 5}" text-anchor="middle" ` +
            `font-family="Helvetica" font-size="11" fill="${extractStyleProp(edge.style, "fontColor") ?? "#333"}">${escapeXmlText(unescapeXml(edge.label))}</text>`
        );
      }

      elements.push(`  </g>`);
    }
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg1.1.dtd">`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `version="1.1" width="${Math.ceil(width)}px" height="${Math.ceil(height)}px" ` +
      `viewBox="0 0 ${Math.ceil(width)} ${Math.ceil(height)}">`,
    `  <defs>`,
    `    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">`,
    `      <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>`,
    `    </marker>`,
    `  </defs>`,
    ...elements,
    `</svg>`,
  ].join("\n");
}


function getConnectionPoint(
  rx: number, ry: number, rw: number, rh: number,
  toX: number, toY: number
): [number, number] {
  // Find where a line from the rect center to (toX, toY) intersects the rect border
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const dx = toX - cx;
  const dy = toY - cy;

  if (dx === 0 && dy === 0) return [cx, cy];

  const hw = rw / 2;
  const hh = rh / 2;

  // Scale factor to reach the rect border
  const scaleX = dx !== 0 ? hw / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? hh / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return [cx + dx * scale, cy + dy * scale];
}

function computeBounds(model: GraphModel): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of model.nodes) {
    const x = node.position?.x ?? 0;
    const y = node.position?.y ?? 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + node.size.width);
    maxY = Math.max(maxY, y + node.size.height);
  }

  for (const group of model.groups) {
    const g = group;
    const x = g.position?.x ?? 0;
    const y = g.position?.y ?? 0;
    const w = g.size?.width ?? 200;
    const h = g.size?.height ?? 200;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 200, maxY: 200 };
  }

  return { minX, minY, maxX, maxY };
}

function extractStyleProp(style: string, prop: string): string | null {
  const regex = new RegExp(`${prop}=([^;]+)`);
  const match = style.match(regex);
  return match?.[1] ?? null;
}

function renderSvgText(
  label: string,
  cellX: number, cellY: number,
  cellW: number, cellH: number,
  style: string
): string {
  const text = unescapeXml(label);
  if (!text.trim()) return "";

  const fontSize = parseInt(extractStyleProp(style, "fontSize") ?? "12");
  const fontColor = extractStyleProp(style, "fontColor") ?? "#333";
  const align = extractStyleProp(style, "align") ?? "center";
  const vAlign = extractStyleProp(style, "verticalAlign") ?? "middle";
  const spacingLeft = parseInt(extractStyleProp(style, "spacingLeft") ?? "5");
  const spacingRight = parseInt(extractStyleProp(style, "spacingRight") ?? "5");
  const spacingTop = parseInt(extractStyleProp(style, "spacingTop") ?? "5");
  const spacingBottom = parseInt(extractStyleProp(style, "spacingBottom") ?? "5");
  const fontStyleNum = parseInt(extractStyleProp(style, "fontStyle") ?? "0");
  const isBold = (fontStyleNum & 1) !== 0;
  const isItalic = (fontStyleNum & 2) !== 0;

  // Available text area
  const availWidth = cellW - spacingLeft - spacingRight;

  // Estimate characters per line (Helvetica average char width)
  const avgCharWidth = fontSize * (isBold ? 0.65 : 0.58);
  const charsPerLine = Math.max(10, Math.floor(availWidth / avgCharWidth));

  // Handle explicit newlines, then word-wrap each segment
  const segments = text.split("\n");
  const allLines: string[] = [];
  for (const segment of segments) {
    allLines.push(...wordWrap(segment, charsPerLine));
  }

  const lineHeight = fontSize * 1.3;
  const totalTextHeight = allLines.length * lineHeight;

  // Horizontal positioning
  const textAnchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
  let textX: number;
  if (align === "left") textX = cellX + spacingLeft;
  else if (align === "right") textX = cellX + cellW - spacingRight;
  else textX = cellX + cellW / 2;

  // Vertical positioning (baseline of first line)
  let startY: number;
  if (vAlign === "top") {
    startY = cellY + spacingTop + fontSize * 0.85;
  } else if (vAlign === "bottom") {
    startY = cellY + cellH - spacingBottom - totalTextHeight + fontSize * 0.85;
  } else {
    startY = cellY + (cellH - totalTextHeight) / 2 + fontSize * 0.85;
  }

  // Font attributes
  const fontAttrs = [
    `font-family="Helvetica"`,
    `font-size="${fontSize}"`,
    isBold ? `font-weight="bold"` : "",
    isItalic ? `font-style="italic"` : "",
    `fill="${fontColor}"`,
  ].filter(Boolean).join(" ");

  const tspans = allLines.map((line, i) =>
    `<tspan x="${textX}" dy="${i === 0 ? 0 : lineHeight}">${escapeXmlText(line)}</tspan>`
  ).join("");

  return `    <text x="${textX}" y="${startY}" text-anchor="${textAnchor}" ${fontAttrs}>${tspans}</text>`;
}

function wordWrap(text: string, maxChars: number): string[] {
  if (!text.trim()) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine === "") {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxChars) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.length > 0 ? lines : [""];
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXmlText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
