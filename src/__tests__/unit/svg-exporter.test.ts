// ABOUTME: Tests for the .drawio.svg exporter.
// ABOUTME: Verifies SVG structure, compressed XML embedding, and visual element rendering.

import { describe, it, expect } from "vitest";
import { inflate } from "pako";
import { exportDrawioSvg } from "../../export/svg-exporter.js";
import type { GraphModel } from "../../core/graph-builder.js";

function makeModel(partial: Partial<GraphModel>): GraphModel {
  return {
    title: "Test",
    nodes: [],
    edges: [],
    groups: [],
    background: "#ffffff",
    ...partial,
  };
}

describe("exportDrawioSvg", () => {
  it("produces valid SVG with xml declaration", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "A", style: "rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333;fontSize=12;", group: null, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
      ],
    });

    const svg = exportDrawioSvg(model);
    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("xmlns=");
  });

  it("embeds compressed draw.io XML in content attribute", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "Hello", style: "rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333;fontSize=12;", group: null, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
      ],
    });

    const svg = exportDrawioSvg(model);
    expect(svg).toContain('content="');

    // Extract and decompress the content
    const contentMatch = svg.match(/content="([^"]+)"/);
    expect(contentMatch).not.toBeNull();

    const base64 = contentMatch![1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    const compressed = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const xml = new TextDecoder().decode(inflate(compressed));

    expect(xml).toContain("<mxfile");
    expect(xml).toContain("Hello");
    expect(xml).toContain('id="0"');
    expect(xml).toContain('id="1"');
  });

  it("renders nodes as SVG rect elements", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "Box", style: "rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333;fontSize=12;", group: null, position: { x: 10, y: 20 }, size: { width: 100, height: 50 } },
      ],
    });

    const svg = exportDrawioSvg(model);
    expect(svg).toContain("<rect");
    expect(svg).toContain("Box");
  });

  it("renders edges as SVG line elements with arrowheads", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "A", style: "rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333;fontSize=12;", group: null, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
        { id: "b", cellId: 3, label: "B", style: "rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333;fontSize=12;", group: null, position: { x: 0, y: 150 }, size: { width: 100, height: 50 } },
      ],
      edges: [
        { cellId: 4, sourceId: "a", targetId: "b", sourceCellId: 2, targetCellId: 3, label: "", style: "strokeColor=#666;strokeWidth=1;" },
      ],
    });

    const svg = exportDrawioSvg(model);
    expect(svg).toContain("<line");
    expect(svg).toContain("marker-end");
    expect(svg).toContain("arrowhead");
  });

  it("renders decision nodes as diamonds", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "Yes?", style: "rhombus;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#333;fontSize=12;", group: null, position: { x: 0, y: 0 }, size: { width: 100, height: 80 } },
      ],
    });

    const svg = exportDrawioSvg(model);
    expect(svg).toContain("<polygon");
    expect(svg).toContain("Yes?");
  });

  it("renders edge labels", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "A", style: "rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333;fontSize=12;", group: null, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
        { id: "b", cellId: 3, label: "B", style: "rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333;fontSize=12;", group: null, position: { x: 0, y: 150 }, size: { width: 100, height: 50 } },
      ],
      edges: [
        { cellId: 4, sourceId: "a", targetId: "b", sourceCellId: 2, targetCellId: 3, label: "next step", style: "strokeColor=#666;strokeWidth=1;fontColor=#333;" },
      ],
    });

    const svg = exportDrawioSvg(model);
    expect(svg).toContain("next step");
  });
});
