// ABOUTME: Tests for ELK.js layout integration.
// ABOUTME: Verifies layout computation, position assignment, and manual override handling.

import { describe, it, expect } from "vitest";
import { computeLayout } from "../../layout/elk-layout.js";
import type { GraphModel } from "../../core/graph-builder.js";
import type { LayoutConfig } from "../../schema/graph.js";

const defaultLayout: LayoutConfig = {
  algorithm: "hierarchical",
  direction: "TB",
  spacing: { node: 50, layer: 80 },
};

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

describe("computeLayout", () => {
  it("assigns positions to nodes without manual positions", async () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "A", style: "s;", group: null, position: null, size: { width: 100, height: 50 } },
        { id: "b", cellId: 3, label: "B", style: "s;", group: null, position: null, size: { width: 100, height: 50 } },
      ],
      edges: [
        { cellId: 4, sourceId: "a", targetId: "b", sourceCellId: 2, targetCellId: 3, label: "", style: "s;" },
      ],
    });

    const result = await computeLayout(model, defaultLayout);

    expect(result.nodes[0].position).not.toBeNull();
    expect(result.nodes[1].position).not.toBeNull();
    expect(result.nodes[0].position!.x).toBeTypeOf("number");
    expect(result.nodes[0].position!.y).toBeTypeOf("number");
  });

  it("preserves manual positions", async () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "A", style: "s;", group: null, position: { x: 500, y: 500 }, size: { width: 100, height: 50 } },
        { id: "b", cellId: 3, label: "B", style: "s;", group: null, position: null, size: { width: 100, height: 50 } },
      ],
    });

    const result = await computeLayout(model, defaultLayout);

    expect(result.nodes[0].position).toEqual({ x: 500, y: 500 });
    expect(result.nodes[1].position).not.toBeNull();
  });

  it("skips layout when algorithm is none", async () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "A", style: "s;", group: null, position: null, size: { width: 100, height: 50 } },
      ],
    });

    const result = await computeLayout(model, { ...defaultLayout, algorithm: "none" });
    expect(result.nodes[0].position).toBeNull();
  });

  it("handles grouped nodes", async () => {
    const model = makeModel({
      groups: [
        { id: "g1", cellId: 2, label: "Group", parent: null, parentCellId: 1, style: "s;" },
      ],
      nodes: [
        { id: "a", cellId: 3, label: "A", style: "s;", group: "g1", position: null, size: { width: 100, height: 50 } },
        { id: "b", cellId: 4, label: "B", style: "s;", group: "g1", position: null, size: { width: 100, height: 50 } },
      ],
      edges: [
        { cellId: 5, sourceId: "a", targetId: "b", sourceCellId: 3, targetCellId: 4, label: "", style: "s;" },
      ],
    });

    const result = await computeLayout(model, defaultLayout);
    expect(result.nodes[0].position).not.toBeNull();
    expect(result.nodes[1].position).not.toBeNull();
  });

  it("arranges nodes top-to-bottom in hierarchical layout", async () => {
    const model = makeModel({
      nodes: [
        { id: "a", cellId: 2, label: "A", style: "s;", group: null, position: null, size: { width: 100, height: 50 } },
        { id: "b", cellId: 3, label: "B", style: "s;", group: null, position: null, size: { width: 100, height: 50 } },
      ],
      edges: [
        { cellId: 4, sourceId: "a", targetId: "b", sourceCellId: 2, targetCellId: 3, label: "", style: "s;" },
      ],
    });

    const result = await computeLayout(model, { ...defaultLayout, direction: "TB" });

    // Source node should be above target node (lower y value)
    expect(result.nodes[0].position!.y).toBeLessThan(result.nodes[1].position!.y);
  });
});
