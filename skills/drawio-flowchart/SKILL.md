---
name: drawio-flowchart
description: >
  Generate flowcharts, pipelines, decision trees, and process flows as .drawio.svg files.
  Produces dual-format files: viewable as SVG anywhere AND editable in draw.io/VS Code.
---

# Flowchart Diagram Generation

You generate flowcharts using the `drawio-claude` CLI tool. You describe the diagram as JSON, and the tool handles XML generation, auto-layout, and SVG export.

## Quick Start

```bash
echo '<JSON>' | npx drawio-claude generate -o diagram.drawio.svg
```

## JSON DSL Format

```json
{
  "title": "My Flowchart",
  "theme": "professional",
  "layout": {
    "algorithm": "hierarchical",
    "direction": "TB",
    "spacing": { "node": 50, "layer": 80 }
  },
  "nodes": [
    { "id": "start", "label": "Start", "type": "flowchart.terminal" },
    { "id": "process1", "label": "Fetch Data", "type": "flowchart.process" },
    { "id": "decision1", "label": "Valid?", "type": "flowchart.decision" },
    { "id": "end", "label": "Done", "type": "flowchart.terminal" }
  ],
  "edges": [
    { "from": "start", "to": "process1" },
    { "from": "process1", "to": "decision1" },
    { "from": "decision1", "to": "end", "label": "Yes" },
    { "from": "decision1", "to": "process1", "label": "No" }
  ]
}
```

## Available Flowchart Shapes

| Type | Shape | Use For |
|------|-------|---------|
| `flowchart.process` | Rounded rectangle | Actions, steps, operations |
| `flowchart.decision` | Diamond | Yes/no decisions, conditions |
| `flowchart.terminal` | Stadium (rounded ends) | Start/end points |
| `flowchart.io` | Parallelogram | Input/output |
| `flowchart.document` | Wavy bottom rect | Documents, reports |
| `flowchart.database` | Cylinder | Databases, data stores |
| `flowchart.delay` | Half-rounded rect | Wait states, delays |
| `flowchart.preparation` | Hexagon | Setup/preparation steps |
| `flowchart.predefined-process` | Double-bordered rect | Subroutines, predefined processes |
| `flowchart.data-store` | Open-ended rect | Data repositories |
| `flowchart.note` | Folded corner | Comments, annotations |
| `flowchart.cloud` | Cloud shape | External systems, services |

## Themes

`professional` (default), `colorful`, `monochrome`, `blueprint`, `pastel`

## Layout Options

- `algorithm`: `hierarchical` (default, best for flowcharts), `tree`, `force`, `radial`, `box`, `none`
- `direction`: `TB` (top-bottom, default), `LR` (left-right), `BT`, `RL`
- `spacing.node`: gap between siblings (default 50)
- `spacing.layer`: gap between layers (default 80)

## Style Overrides

Override theme colors per node/edge:

```json
{
  "id": "error",
  "label": "Error",
  "type": "flowchart.process",
  "style": { "fillColor": "#f8cecc", "strokeColor": "#b85450" }
}
```

## Groups

Use groups to visually contain related steps:

```json
{
  "groups": [
    { "id": "phase1", "label": "Phase 1: Setup" },
    { "id": "phase2", "label": "Phase 2: Execution" }
  ],
  "nodes": [
    { "id": "step1", "label": "Configure", "group": "phase1" },
    { "id": "step2", "label": "Run", "group": "phase2" }
  ]
}
```

## Edge Routing

- `"routing": "orthogonal"` (default) — right-angle connectors
- `"routing": "straight"` — direct lines

## Example: Experimental Pipeline

```json
{
  "title": "RNA-seq Pipeline",
  "theme": "professional",
  "layout": { "algorithm": "hierarchical", "direction": "TB" },
  "nodes": [
    { "id": "sample", "label": "Sample Collection", "type": "flowchart.terminal" },
    { "id": "extract", "label": "RNA Extraction" },
    { "id": "qc1", "label": "Quality Check", "type": "flowchart.decision" },
    { "id": "library", "label": "Library Prep" },
    { "id": "sequence", "label": "Sequencing", "type": "flowchart.io" },
    { "id": "align", "label": "Read Alignment" },
    { "id": "count", "label": "Gene Counting", "type": "flowchart.database" },
    { "id": "de", "label": "Differential Expression" },
    { "id": "results", "label": "Results", "type": "flowchart.document" }
  ],
  "edges": [
    { "from": "sample", "to": "extract" },
    { "from": "extract", "to": "qc1" },
    { "from": "qc1", "to": "library", "label": "Pass" },
    { "from": "qc1", "to": "extract", "label": "Fail" },
    { "from": "library", "to": "sequence" },
    { "from": "sequence", "to": "align" },
    { "from": "align", "to": "count" },
    { "from": "count", "to": "de" },
    { "from": "de", "to": "results" }
  ]
}
```

## Output

The generated `.drawio.svg` file:
- Renders as SVG in browsers, GitHub, LaTeX, Markdown
- Opens and edits in draw.io Desktop, diagrams.net, or VS Code (with hediet.vscode-drawio extension)
- Git-diffable (text-based format)
