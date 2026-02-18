// ABOUTME: Tests for XML generator — internal graph model to draw.io XML.
// ABOUTME: Verifies XML structure, foundation cells, vertex/edge ordering, and attribute correctness.

import { describe, it, expect } from "vitest";
import { generateXml } from "../../core/xml-generator.js";
import { validateDrawioXml } from "../../core/xml-validator.js";
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

describe("generateXml", () => {
  it("produces valid XML with foundation cells", () => {
    const model = makeModel({
      nodes: [
        {
          id: "a",
          cellId: 2,
          label: "A",
          style: "rounded=1;",
          group: null,
          position: { x: 10, y: 20 },
          size: { width: 120, height: 60 },
        },
      ],
    });

    const xml = generateXml(model);
    expect(xml).toContain("<mxfile");
    expect(xml).toContain('id="0"');
    expect(xml).toContain('id="1" parent="0"');
  });

  it("generates vertex cells with correct geometry", () => {
    const model = makeModel({
      nodes: [
        {
          id: "a",
          cellId: 2,
          label: "Hello",
          style: "rounded=1;",
          group: null,
          position: { x: 100, y: 200 },
          size: { width: 120, height: 60 },
        },
      ],
    });

    const xml = generateXml(model);
    expect(xml).toContain('id="2"');
    expect(xml).toContain('value="Hello"');
    expect(xml).toContain('vertex="1"');
    expect(xml).toContain('x="100"');
    expect(xml).toContain('y="200"');
    expect(xml).toContain('width="120"');
    expect(xml).toContain('height="60"');
    expect(xml).toContain('as="geometry"');
  });

  it("generates edge cells with source/target and relative geometry", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "A", style: "s;", group: null, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
        { id: "b", cellId: 3, label: "B", style: "s;", group: null, position: { x: 200, y: 0 }, size: { width: 100, height: 50 } },
      ],
      edges: [
        {
          cellId: 4,
          sourceId: "a",
          targetId: "b",
          sourceCellId: 2,
          targetCellId: 3,
          label: "",
          style: "edgeStyle=orthogonalEdgeStyle;",
        },
      ],
    });

    const xml = generateXml(model);
    expect(xml).toContain('edge="1"');
    expect(xml).toContain('source="2"');
    expect(xml).toContain('target="3"');
    expect(xml).toContain('relative="1"');
  });

  it("places groups before nodes before edges", () => {
    const model = makeModel({
      groups: [
        { id: "g1", cellId: 2, label: "Group", parent: null, parentCellId: 1, style: "s;" },
      ],
      nodes: [
        { id: "a", cellId: 3, label: "A", style: "s;", group: "g1", position: null, size: { width: 100, height: 50 } },
      ],
      edges: [
        { cellId: 4, sourceId: "a", targetId: "a", sourceCellId: 3, targetCellId: 3, label: "", style: "s;" },
      ],
    });

    const xml = generateXml(model);
    const groupIdx = xml.indexOf('id="2"');
    const nodeIdx = xml.indexOf('id="3"');
    const edgeIdx = xml.indexOf('id="4"');

    expect(groupIdx).toBeLessThan(nodeIdx);
    expect(nodeIdx).toBeLessThan(edgeIdx);
  });

  it("sets node parent to group cell ID when grouped", () => {
    const model = makeModel({
      groups: [
        { id: "g1", cellId: 2, label: "Group", parent: null, parentCellId: 1, style: "s;" },
      ],
      nodes: [
        { id: "a", cellId: 3, label: "A", style: "s;", group: "g1", position: null, size: { width: 100, height: 50 } },
      ],
    });

    const xml = generateXml(model);
    // Node should have parent="2" (the group's cellId)
    expect(xml).toMatch(/id="3"[^>]*parent="2"/);
  });

  it("passes XML validator on generated output", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "Start", style: "rounded=1;", group: null, position: { x: 0, y: 0 }, size: { width: 120, height: 60 } },
        { id: "b", cellId: 3, label: "End", style: "rounded=1;", group: null, position: { x: 200, y: 0 }, size: { width: 120, height: 60 } },
      ],
      edges: [
        { cellId: 4, sourceId: "a", targetId: "b", sourceCellId: 2, targetCellId: 3, label: "next", style: "edgeStyle=orthogonalEdgeStyle;" },
      ],
    });

    const xml = generateXml(model);
    const result = validateDrawioXml(xml);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("escapes special characters in label attributes", () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: 'A &amp; B &lt; "C"', style: "s;", group: null, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
      ],
    });

    const xml = generateXml(model);
    // The label is already escaped by graph-builder, and xml-generator escapes for attributes
    expect(xml).toContain("value=");
    // Should not contain unescaped special chars
    const result = validateDrawioXml(xml);
    expect(result.valid).toBe(true);
  });
});
