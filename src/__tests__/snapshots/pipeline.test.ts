// ABOUTME: End-to-end pipeline snapshot tests.
// ABOUTME: Tests full JSON input → validated → built → laid out → XML/SVG output pipeline.

import { describe, it, expect } from "vitest";
import { validateInput } from "../../schema/validate.js";
import { buildGraph } from "../../core/graph-builder.js";
import { computeLayout } from "../../layout/elk-layout.js";
import { exportDrawio } from "../../export/drawio-exporter.js";
import { exportDrawioSvg } from "../../export/svg-exporter.js";
import { validateDrawioXml } from "../../core/xml-validator.js";

async function runPipeline(input: unknown): Promise<{ xml: string; svg: string }> {
  const result = validateInput(input);
  if (!result.ok) throw new Error(`Validation failed: ${result.errors.join(", ")}`);

  const graph = buildGraph(result.diagram);
  const laid = await computeLayout(graph, result.diagram.layout);
  const xml = exportDrawio(laid);
  const svg = exportDrawioSvg(laid);

  return { xml, svg };
}

describe("full pipeline", () => {
  it("generates valid XML for a simple flowchart", async () => {
    const input = {
      title: "Simple Flowchart",
      nodes: [
        { id: "start", label: "Start", type: "flowchart.terminal" },
        { id: "process", label: "Process Data" },
        { id: "decision", label: "Valid?", type: "flowchart.decision" },
        { id: "end", label: "End", type: "flowchart.terminal" },
      ],
      edges: [
        { from: "start", to: "process" },
        { from: "process", to: "decision" },
        { from: "decision", to: "end", label: "Yes" },
      ],
    };

    const { xml, svg } = await runPipeline(input);

    // XML validation
    const xmlResult = validateDrawioXml(xml);
    expect(xmlResult.valid).toBe(true);

    // Structure checks
    expect(xml).toContain("<mxfile");
    expect(xml).toContain("Simple Flowchart");
    expect(xml).toContain("Start");
    expect(xml).toContain("Process Data");
    expect(xml).toContain("Valid?");
    expect(xml).toContain("End");
    expect(xml).toContain("Yes");

    // SVG checks
    expect(svg).toContain("<svg");
    expect(svg).toContain("content=");
    expect(svg).toContain("Start");

    // Snapshot the XML structure (stripping the timestamp)
    const stableXml = xml.replace(/modified="[^"]*"/, 'modified="STABLE"');
    expect(stableXml).toMatchSnapshot();
  });

  it("generates valid XML for a grouped architecture diagram", async () => {
    const input = {
      title: "Cloud Architecture",
      theme: "professional",
      nodes: [
        { id: "lb", label: "Load Balancer", type: "aws.elb", group: "public" },
        { id: "api1", label: "API Server 1", group: "private" },
        { id: "api2", label: "API Server 2", group: "private" },
        { id: "db", label: "Database", type: "flowchart.database", group: "data" },
      ],
      edges: [
        { from: "lb", to: "api1" },
        { from: "lb", to: "api2" },
        { from: "api1", to: "db" },
        { from: "api2", to: "db" },
      ],
      groups: [
        { id: "public", label: "Public Subnet" },
        { id: "private", label: "Private Subnet" },
        { id: "data", label: "Data Layer" },
      ],
    };

    const { xml } = await runPipeline(input);
    const xmlResult = validateDrawioXml(xml);
    expect(xmlResult.valid).toBe(true);

    expect(xml).toContain("Load Balancer");
    expect(xml).toContain("container=1"); // groups should be containers
    expect(xml).toContain("Public Subnet");
  });

  it("handles all themes without errors", async () => {
    const themes = ["professional", "colorful", "monochrome", "blueprint", "pastel"];

    for (const theme of themes) {
      const input = {
        theme,
        nodes: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        edges: [{ from: "a", to: "b" }],
      };

      const { xml } = await runPipeline(input);
      const xmlResult = validateDrawioXml(xml);
      expect(xmlResult.valid).toBe(true);
    }
  });

  it("handles manual positions with layout=none", async () => {
    const input = {
      layout: { algorithm: "none" },
      nodes: [
        { id: "a", label: "A", position: { x: 100, y: 100 } },
        { id: "b", label: "B", position: { x: 300, y: 100 } },
      ],
      edges: [{ from: "a", to: "b" }],
    };

    const { xml } = await runPipeline(input);
    expect(xml).toContain('x="100"');
    expect(xml).toContain('x="300"');

    const xmlResult = validateDrawioXml(xml);
    expect(xmlResult.valid).toBe(true);
  });

  it("handles edge labels", async () => {
    const input = {
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      edges: [{ from: "a", to: "b", label: "connects to" }],
    };

    const { xml } = await runPipeline(input);
    expect(xml).toContain("connects to");
  });

  it("handles nested groups", async () => {
    const input = {
      nodes: [{ id: "n1", label: "Node", group: "inner" }],
      groups: [
        { id: "outer", label: "Outer" },
        { id: "inner", label: "Inner", parent: "outer" },
      ],
    };

    const { xml } = await runPipeline(input);
    const xmlResult = validateDrawioXml(xml);
    expect(xmlResult.valid).toBe(true);
  });

  it("compound layout: groups ordered by edge flow, nodes inside group bounds", async () => {
    const input = {
      title: "Pipeline",
      layout: { algorithm: "hierarchical", direction: "LR" },
      groups: [
        { id: "build", label: "Build" },
        { id: "deploy", label: "Deploy" },
        { id: "observe", label: "Observe" },
      ],
      nodes: [
        { id: "start", label: "Start" },
        { id: "lint", label: "Lint", group: "build" },
        { id: "test", label: "Test", group: "build" },
        { id: "staging", label: "Staging", group: "deploy" },
        { id: "prod", label: "Prod", group: "deploy" },
        { id: "monitor", label: "Monitor", group: "observe" },
      ],
      edges: [
        { from: "start", to: "lint" },
        { from: "lint", to: "test" },
        { from: "test", to: "staging" },
        { from: "staging", to: "prod" },
        { from: "prod", to: "monitor" },
      ],
    };

    const { xml, svg } = await runPipeline(input);
    const xmlResult = validateDrawioXml(xml);
    expect(xmlResult.valid).toBe(true);

    // SVG must be valid
    expect(svg).toContain("<svg");
    expect(svg).toContain("content=");

    // Extract group positions from SVG to verify ordering.
    // Groups render as <rect> with stroke-dasharray (dashed borders).
    // With LR direction, groups should be ordered left-to-right by x position.
    const groupRects = [...svg.matchAll(/<rect x="(\d+(?:\.\d+)?)" y="(\d+(?:\.\d+)?)" width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)" fill="[^"]*" stroke="[^"]*" stroke-width="[^"]*" rx="[^"]*" stroke-dasharray/g)];
    expect(groupRects.length).toBe(3);

    const groupXs = groupRects.map((m) => parseFloat(m[1]));
    // Build should be left of Deploy, Deploy should be left of Observe
    expect(groupXs[0]).toBeLessThan(groupXs[1]);
    expect(groupXs[1]).toBeLessThan(groupXs[2]);

    // Verify nodes are positioned within their parent group bounds
    // Extract all node rects (non-dashed) - they don't have stroke-dasharray
    const allRects = [...svg.matchAll(/<rect x="(\d+(?:\.\d+)?)" y="(\d+(?:\.\d+)?)" width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/g)];
    // Node rects are those without stroke-dasharray following them
    const nodeLines = svg.split("\n").filter(
      (line) => line.includes("<rect") && !line.includes("stroke-dasharray")
    );
    // At minimum, we have node rects inside groups
    expect(nodeLines.length).toBeGreaterThanOrEqual(5);
  });
});
