// ABOUTME: Tests for graph builder — JSON DSL to internal graph model transformation.
// ABOUTME: Verifies cell ID assignment, style resolution, theme application, and XML escaping.

import { describe, it, expect } from "vitest";
import { buildGraph } from "../../core/graph-builder.js";
import type { Diagram } from "../../schema/graph.js";

function makeDiagram(partial: Partial<Diagram>): Diagram {
  return {
    title: "Test",
    theme: "professional",
    layout: { algorithm: "hierarchical", direction: "TB", spacing: { node: 50, layer: 80 } },
    nodes: [],
    edges: [],
    groups: [],
    ...partial,
  };
}

describe("buildGraph", () => {
  it("assigns cell IDs starting from 2", () => {
    const diagram = makeDiagram({
      nodes: [
        { id: "a", label: "A", type: "flowchart.process" },
        { id: "b", label: "B", type: "flowchart.process" },
      ],
    });

    const model = buildGraph(diagram);
    expect(model.nodes[0].cellId).toBe(2);
    expect(model.nodes[1].cellId).toBe(3);
  });

  it("assigns group cell IDs before node cell IDs", () => {
    const diagram = makeDiagram({
      nodes: [{ id: "n1", label: "Node", type: "flowchart.process", group: "g1" }],
      groups: [{ id: "g1", label: "Group", parent: null }],
    });

    const model = buildGraph(diagram);
    expect(model.groups[0].cellId).toBe(2);
    expect(model.nodes[0].cellId).toBe(3);
  });

  it("resolves edge source/target cell IDs", () => {
    const diagram = makeDiagram({
      nodes: [
        { id: "a", label: "A", type: "flowchart.process" },
        { id: "b", label: "B", type: "flowchart.process" },
      ],
      edges: [{ from: "a", to: "b", routing: "orthogonal" }],
    });

    const model = buildGraph(diagram);
    expect(model.edges[0].sourceCellId).toBe(model.nodes[0].cellId);
    expect(model.edges[0].targetCellId).toBe(model.nodes[1].cellId);
  });

  it("applies theme colors to node styles", () => {
    const diagram = makeDiagram({
      theme: "professional",
      nodes: [{ id: "a", label: "A", type: "flowchart.process" }],
    });

    const model = buildGraph(diagram);
    expect(model.nodes[0].style).toContain("fillColor=#dae8fc");
    expect(model.nodes[0].style).toContain("strokeColor=#6c8ebf");
  });

  it("applies style overrides over theme defaults", () => {
    const diagram = makeDiagram({
      nodes: [
        {
          id: "a",
          label: "A",
          type: "flowchart.process",
          style: { fillColor: "#ff0000" },
        },
      ],
    });

    const model = buildGraph(diagram);
    expect(model.nodes[0].style).toContain("fillColor=#ff0000");
    expect(model.nodes[0].style).not.toContain("fillColor=#dae8fc");
  });

  it("escapes XML special characters in labels", () => {
    const diagram = makeDiagram({
      nodes: [{ id: "a", label: "A & B < C", type: "flowchart.process" }],
    });

    const model = buildGraph(diagram);
    expect(model.nodes[0].label).toBe("A &amp; B &lt; C");
  });

  it("uses default size when not specified", () => {
    const diagram = makeDiagram({
      nodes: [{ id: "a", label: "A", type: "flowchart.process" }],
    });

    const model = buildGraph(diagram);
    expect(model.nodes[0].size).toEqual({ width: 120, height: 60 });
  });

  it("preserves manual position when specified", () => {
    const diagram = makeDiagram({
      nodes: [
        {
          id: "a",
          label: "A",
          type: "flowchart.process",
          position: { x: 100, y: 200 },
        },
      ],
    });

    const model = buildGraph(diagram);
    expect(model.nodes[0].position).toEqual({ x: 100, y: 200 });
  });

  it("resolves nested group parent cell IDs", () => {
    const diagram = makeDiagram({
      nodes: [{ id: "n1", label: "N", type: "flowchart.process", group: "inner" }],
      groups: [
        { id: "outer", label: "Outer", parent: null },
        { id: "inner", label: "Inner", parent: "outer" },
      ],
    });

    const model = buildGraph(diagram);
    const outer = model.groups.find((g) => g.id === "outer")!;
    const inner = model.groups.find((g) => g.id === "inner")!;

    expect(outer.parentCellId).toBe(1); // default layer
    expect(inner.parentCellId).toBe(outer.cellId);
  });

  it("falls back gracefully for unknown shape types", () => {
    const diagram = makeDiagram({
      nodes: [{ id: "a", label: "A", type: "unknown.shape" }],
    });

    const model = buildGraph(diagram);
    // Should still produce a node with a default style
    expect(model.nodes[0].style).toContain("rounded=1");
  });

  it("passes through raw style strings as type", () => {
    const diagram = makeDiagram({
      nodes: [{ id: "a", label: "A", type: "rounded=0;whiteSpace=wrap;html=1;" }],
    });

    const model = buildGraph(diagram);
    expect(model.nodes[0].style).toContain("rounded=0;whiteSpace=wrap;html=1;");
  });
});
