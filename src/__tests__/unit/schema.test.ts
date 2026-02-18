// ABOUTME: Tests for JSON DSL schema validation.
// ABOUTME: Covers valid inputs, structural validation, and error messages.

import { describe, it, expect } from "vitest";
import { validateInput } from "../../schema/validate.js";

const minimalValid = {
  nodes: [{ id: "a", label: "Hello" }],
};

describe("DiagramSchema", () => {
  it("accepts minimal valid input", () => {
    const result = validateInput(minimalValid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diagram.nodes).toHaveLength(1);
      expect(result.diagram.theme).toBe("professional");
      expect(result.diagram.layout.algorithm).toBe("hierarchical");
    }
  });

  it("applies defaults for omitted fields", () => {
    const result = validateInput({ nodes: [{ id: "a" }] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diagram.title).toBe("Untitled Diagram");
      expect(result.diagram.edges).toEqual([]);
      expect(result.diagram.groups).toEqual([]);
      expect(result.diagram.nodes[0].label).toBe("");
      expect(result.diagram.nodes[0].type).toBe("flowchart.process");
    }
  });

  it("accepts full input with all fields", () => {
    const full = {
      title: "Test Diagram",
      theme: "blueprint",
      layout: {
        algorithm: "force",
        direction: "LR",
        spacing: { node: 30, layer: 60 },
      },
      nodes: [
        {
          id: "a",
          label: "Start",
          type: "flowchart.terminal",
          style: { fillColor: "#ff0000", rounded: true },
          position: { x: 100, y: 200 },
          size: { width: 120, height: 60 },
        },
        {
          id: "b",
          label: "End",
          group: "g1",
        },
      ],
      edges: [
        {
          from: "a",
          to: "b",
          label: "next",
          routing: "straight" as const,
          style: { strokeColor: "#333" },
        },
      ],
      groups: [{ id: "g1", label: "Group 1", parent: null }],
    };

    const result = validateInput(full);
    expect(result.ok).toBe(true);
  });

  it("rejects empty nodes array", () => {
    const result = validateInput({ nodes: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("at least one node"))).toBe(true);
    }
  });

  it("rejects missing nodes", () => {
    const result = validateInput({});
    expect(result.ok).toBe(false);
  });

  it("rejects invalid theme name", () => {
    const result = validateInput({
      theme: "neon",
      nodes: [{ id: "a" }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid layout algorithm", () => {
    const result = validateInput({
      layout: { algorithm: "spiral" },
      nodes: [{ id: "a" }],
    });
    expect(result.ok).toBe(false);
  });
});

describe("structural validation", () => {
  it("detects edges referencing non-existent nodes", () => {
    const result = validateInput({
      nodes: [{ id: "a" }],
      edges: [{ from: "a", to: "missing" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('unknown target "missing"');
    }
  });

  it("detects nodes referencing non-existent groups", () => {
    const result = validateInput({
      nodes: [{ id: "a", group: "missing" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('unknown group "missing"');
    }
  });

  it("detects duplicate node IDs", () => {
    const result = validateInput({
      nodes: [{ id: "a" }, { id: "a" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain("Duplicate node ID");
    }
  });

  it("detects circular group nesting", () => {
    const result = validateInput({
      nodes: [{ id: "n1", group: "g1" }],
      groups: [
        { id: "g1", parent: "g2" },
        { id: "g2", parent: "g1" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("Circular"))).toBe(true);
    }
  });

  it("detects group with unknown parent", () => {
    const result = validateInput({
      nodes: [{ id: "n1" }],
      groups: [{ id: "g1", parent: "missing" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('unknown parent "missing"');
    }
  });

  it("allows edges between nodes in different groups", () => {
    const result = validateInput({
      nodes: [
        { id: "a", group: "g1" },
        { id: "b", group: "g2" },
      ],
      edges: [{ from: "a", to: "b" }],
      groups: [
        { id: "g1", parent: null },
        { id: "g2", parent: null },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("allows nested groups", () => {
    const result = validateInput({
      nodes: [{ id: "n1", group: "inner" }],
      groups: [
        { id: "outer", parent: null },
        { id: "inner", parent: "outer" },
      ],
    });
    expect(result.ok).toBe(true);
  });
});
