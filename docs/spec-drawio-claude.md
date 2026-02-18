# drawio-claude — Spec

## Overview

A TypeScript CLI tool that takes JSON graph descriptions and produces professional draw.io diagrams as `.drawio.svg` files. Distributed via npx with zero install friction. Paired with multiple specialized Claude Code skills for different diagram families (flowcharts, architecture, scientific figures, etc.).

The core insight: Claude describes *what* the diagram contains via a JSON DSL; tested code handles the XML generation, layout, and rendering — eliminating the XML error patterns that plague LLM-generated draw.io files.

## Goals & Non-Goals

### Goals

- Generate valid `.drawio.svg` files from a JSON graph description
- Produce diagrams that are simultaneously viewable as SVG and editable in draw.io/VS Code
- Auto-layout via ELK.js with manual coordinate override
- Ship with built-in themes and a shape type registry (AWS, UML, flowchart, bio, etc.)
- Support arbitrary nesting (groups within groups)
- Runnable via `npx drawio-claude` with zero install
- Bundle ~100 curated Bioicons for scientific diagrams
- Support stdin/stdout piping and file-based I/O
- Multiple specialized Claude Code skills for different diagram domains

### Non-Goals

- PNG/PDF export (no Docker/Electron dependency in core)
- MCP server protocol (CLI is sufficient)
- Raw draw.io XML generation by Claude (the DSL abstracts this away)
- Real-time/interactive diagram editing
- Mermaid-to-draw.io conversion (potential future extension)

## JSON DSL Format

The CLI accepts a JSON graph description. Core schema:

```json
{
  "title": "My Diagram",
  "theme": "professional",
  "layout": {
    "algorithm": "hierarchical",
    "direction": "TB",
    "spacing": { "node": 50, "layer": 80 }
  },
  "nodes": [
    {
      "id": "a",
      "label": "API Gateway",
      "type": "aws.api-gateway",
      "group": "vpc-1",
      "style": { "fillColor": "#dae8fc" },
      "position": { "x": 100, "y": 200 }
    }
  ],
  "groups": [
    {
      "id": "vpc-1",
      "label": "VPC",
      "parent": null,
      "style": { "fillColor": "#f5f5f5", "dashed": true }
    }
  ],
  "edges": [
    {
      "from": "a",
      "to": "b",
      "label": "REST",
      "style": { "strokeColor": "#666", "curved": true }
    }
  ]
}
```

Key design decisions:
- **`type` field**: Maps to draw.io shape styles via a built-in registry (e.g., `"aws.lambda"` → `shape=mxgraph.aws4.lambda;...`)
- **`position` is optional**: When omitted, ELK.js computes placement. When provided, overrides auto-layout for that node.
- **`groups` support arbitrary nesting** via `parent` references
- **`theme`**: One of the built-in themes. Per-node/edge `style` overrides theme defaults.
- **`layout.algorithm`**: `hierarchical` (default), `force`, `tree`, `radial`, `box`, or `none` (manual only)

## Built-in Themes

Ship with 4-5 curated themes:

| Theme | Description | Use Case |
|-------|-------------|----------|
| `professional` | Clean blues/grays, thin borders, white background | Papers, documentation |
| `colorful` | Distinct colors per node type, white background | Presentations, teaching |
| `monochrome` | Black/white/gray only | Print-friendly, formal papers |
| `blueprint` | Dark background, light lines/text | Technical/engineering |
| `pastel` | Soft muted colors, rounded shapes | Infographics, blog posts |

Each theme defines: default fill colors, stroke colors, font family/size, border radius, edge style, background color, and shadow settings.

## Shape Type Registry

The CLI maintains a mapping from friendly type names to draw.io style strings:

```
flowchart.process     → "rounded=1;whiteSpace=wrap;html=1;"
flowchart.decision    → "rhombus;whiteSpace=wrap;html=1;"
flowchart.database    → "shape=cylinder3;whiteSpace=wrap;html=1;"
aws.lambda            → "shape=mxgraph.aws4.lambda;..."
aws.api-gateway       → "shape=mxgraph.aws4.api_gateway;..."
uml.class             → "swimlane;fontStyle=1;align=center;..."
bio.cell              → "shape=image;image=data:image/svg+xml,..."
```

Categories to ship with:
- **flowchart**: process, decision, terminal, io, document, database, delay, merge
- **aws**: ~30 most common services (lambda, ec2, s3, rds, api-gateway, etc.)
- **azure**: ~20 most common services
- **gcp**: ~20 most common services
- **uml**: class, interface, actor, usecase, component, package
- **network**: server, router, switch, firewall, cloud, user, laptop
- **bio**: ~100 curated Bioicons (bundled as SVG data URIs)

Fallback: if `type` is not in the registry, treat it as a raw draw.io style string for escape-hatch flexibility.

## Technical Architecture

### CLI Interface

```bash
# From file
npx drawio-claude generate input.json -o diagram.drawio.svg

# From stdin
cat input.json | npx drawio-claude generate -o diagram.drawio.svg

# Output to stdout
npx drawio-claude generate input.json --stdout

# Raw .drawio output (no SVG rendering)
npx drawio-claude generate input.json -o diagram.drawio --format drawio

# Validate existing .drawio file
npx drawio-claude validate diagram.drawio

# List available shape types
npx drawio-claude shapes [category]

# List available themes
npx drawio-claude themes

# Show JSON schema
npx drawio-claude schema

# Help (LLM-friendly: structured, parseable, includes examples)
npx drawio-claude --help
npx drawio-claude generate --help
```

**LLM/Agent-friendly CLI design principles:**
- `--help` output is structured and parseable (not just a wall of text)
- Every command includes inline usage examples
- Error messages include the fix, not just what went wrong (e.g., "Unknown type 'aws.lamda'. Did you mean 'aws.lambda'?")
- `schema` command outputs the full JSON schema so an agent can self-serve
- `shapes` and `themes` commands let an agent discover available options programmatically
- All output supports `--json` flag for machine-readable responses
- Exit codes are meaningful (0=success, 1=validation error, 2=generation error)

### Module Architecture

```
src/
├── cli.ts                  # CLI entry point (commander.js or similar)
├── schema/
│   ├── graph.ts            # JSON DSL type definitions + Zod schema
│   └── validate.ts         # Input validation
├── core/
│   ├── graph-builder.ts    # JSON DSL → internal graph model
│   ├── xml-generator.ts    # Internal model → draw.io XML (mxGraphModel)
│   └── xml-validator.ts    # Validates generated XML against known error patterns
├── layout/
│   ├── elk-layout.ts       # ELK.js integration
│   └── manual-layout.ts    # Manual coordinate handling
├── export/
│   ├── drawio-exporter.ts  # Outputs raw .drawio XML
│   └── svg-exporter.ts     # Outputs .drawio.svg (mxGraph + jsdom + pako)
├── themes/
│   ├── index.ts            # Theme registry
│   ├── professional.ts
│   ├── colorful.ts
│   ├── monochrome.ts
│   ├── blueprint.ts
│   └── pastel.ts
├── shapes/
│   ├── registry.ts         # Type → style mapping registry
│   ├── flowchart.ts
│   ├── aws.ts
│   ├── azure.ts
│   ├── gcp.ts
│   ├── uml.ts
│   ├── network.ts
│   └── bio/
│       ├── index.ts
│       └── icons/          # Bundled Bioicons as SVG data URIs
└── __tests__/
    ├── unit/
    │   ├── graph-builder.test.ts
    │   ├── xml-generator.test.ts
    │   ├── xml-validator.test.ts
    │   ├── elk-layout.test.ts
    │   └── themes.test.ts
    └── snapshots/
        ├── flowchart.test.ts       # Full pipeline → snapshot comparison
        ├── architecture.test.ts
        └── nested-groups.test.ts
```

### Key Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `mxgraph` or `@maxgraph/core` | Graph model + SVG serialization for .drawio.svg | ~15MB |
| `jsdom` | Server-side DOM for mxGraph | ~20MB |
| `elkjs` | Auto-layout engine | ~5MB |
| `pako` | Deflate compression for .drawio.svg embedding | ~200KB |
| `zod` | JSON input schema validation | ~60KB |
| `commander` | CLI framework | ~100KB |
| **Total** | | **~40MB** |

### Pipeline Flow

```
JSON input
  → Zod schema validation
  → Graph model construction (nodes, edges, groups)
  → Theme application (merge theme defaults with per-element overrides)
  → Shape type resolution (registry lookup → draw.io style strings)
  → Layout computation (ELK.js, respecting manual position overrides)
  → XML generation (mxGraphModel with positioned mxCells)
  → XML validation (check for known error patterns)
  → Export (.drawio or .drawio.svg)
```

## Claude Code Skills

Multiple specialized skills, each with a SKILL.md:

### /drawio-flowchart
- Flowcharts, pipelines, experimental workflows, decision trees
- References: flowchart shape types, common patterns, examples
- Template-guided: "experimental pipeline", "decision tree", "process flow"

### /drawio-architecture
- Cloud architecture (AWS/Azure/GCP), system design, network diagrams
- References: cloud service shape types, architecture patterns
- Template-guided: "microservices", "serverless", "data pipeline"

### /drawio-scientific
- CONSORT diagrams, signaling pathways, neural network architectures
- References: Bioicons catalog, scientific diagram conventions
- Template-guided: "CONSORT", "pathway", "experiment design"

### /drawio-uml
- Class diagrams, sequence diagrams, component diagrams
- References: UML shape types, relationship conventions

Each skill:
1. Teaches Claude the JSON DSL schema
2. Provides domain-specific shape type references
3. Includes 2-3 example JSON inputs with rendered outputs
4. Instructs Claude to call the CLI via `npx drawio-claude generate`

## Edge Cases & Error Handling

- **Invalid JSON input**: Zod validation with clear error messages pointing to the problematic field
- **Unknown shape type**: Fall through to raw style string interpretation; warn if it looks invalid
- **Circular group nesting**: Detect and reject with error message
- **Edge referencing non-existent node**: Reject with error listing the bad reference
- **ELK layout failure**: Fall back to simple grid layout with warning
- **Empty diagram**: Valid — produce a blank .drawio file (useful as a starting point)
- **Very large diagrams**: No hard limit, but warn above ~500 nodes that layout may be slow
- **Duplicate node IDs**: Reject with error

## Testing Strategy

- **Unit tests**: Each module tested in isolation (graph-builder, xml-generator, layout, themes, shape registry)
- **Snapshot tests**: Full pipeline tests that generate XML/SVG from known JSON inputs and compare against committed snapshots. Snapshots are committed to git and reviewed on changes.
- **Validation tests**: Ensure the XML validator catches all 10 known LLM error patterns from the research doc
- **Schema tests**: Ensure Zod schema accepts valid inputs and rejects invalid ones with useful messages
- **CLI integration tests**: Run the actual CLI binary with test inputs and verify exit codes + output files

## Open Questions

1. **mxGraph vs maxGraph**: mxGraph is archived but proven; maxGraph is actively maintained but pre-1.0. Need to evaluate maxGraph stability before committing. The Sujimoshi/drawio-mcp project uses mxGraph successfully.
2. **Bioicons licensing**: Verify that bundling a curated subset is compatible with Bioicons' open-source license.
3. **Edge routing styles**: How many edge routing styles to support initially? (straight, orthogonal, curved, entity-relation)
4. **Multi-page diagrams**: Support in v1 or defer? The draw.io format supports multiple `<diagram>` elements.

## Implementation Notes

- The phased roadmap from the research doc still applies, but Phase 1 now starts with the JSON DSL + graph builder (not raw XML templates)
- Phase 1: CLI skeleton, JSON schema, graph builder, XML generator, basic themes, unit tests
- Phase 2: mxGraph/jsdom integration for .drawio.svg export
- Phase 3: ELK.js layout engine integration
- Phase 4: Shape type registry (AWS, UML, flowchart, bio), Bioicons bundling
- Phase 5: Claude Code skills, snapshot tests, npx publishing, polish
- All XML generation is in tested code — Claude never writes XML directly
- The JSON DSL is the contract between Claude and the tool; changes to it should be versioned
