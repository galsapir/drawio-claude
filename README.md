# drawio-claude

Generate professional [draw.io](https://draw.io) diagrams from JSON descriptions. Outputs `.drawio.svg` files that are both valid SVG images and editable in draw.io.

Built for use with LLMs — give Claude (or any agent) the JSON schema and it can produce publication-quality architecture diagrams, flowcharts, and scientific figures.

## Install from source

```bash
git clone https://github.com/galsapir/drawio-claude.git
cd drawio-claude
pnpm install
pnpm build
```

Then run with:

```bash
node dist/cli.js generate input.json -o diagram.drawio.svg
```

Or link globally:

```bash
pnpm link --global
drawio-claude generate input.json -o diagram.drawio.svg
```

## Quick start

```bash
echo '{
  "nodes": [
    { "id": "start", "label": "Start", "type": "flowchart.terminal" },
    { "id": "process", "label": "Process Data" },
    { "id": "end", "label": "End", "type": "flowchart.terminal" }
  ],
  "edges": [
    { "from": "start", "to": "process" },
    { "from": "process", "to": "end" }
  ]
}' | node dist/cli.js generate -o flowchart.drawio.svg
```

Open the resulting `.drawio.svg` in draw.io, VS Code (with the draw.io extension), or any browser.

## JSON input format

```jsonc
{
  "title": "My Diagram",          // optional, default: "Untitled Diagram"
  "theme": "professional",         // professional | colorful | monochrome | blueprint | pastel
  "layout": {
    "algorithm": "hierarchical",   // hierarchical | force | tree | radial | box | none
    "direction": "TB",             // TB | BT | LR | RL
    "spacing": { "node": 50, "layer": 80 }
  },
  "nodes": [
    {
      "id": "n1",
      "label": "My Node",
      "type": "flowchart.process",  // see: drawio-claude shapes
      "group": "g1",                // optional group membership
      "position": { "x": 100, "y": 200 },  // optional, for layout=none
      "size": { "width": 120, "height": 60 }
    }
  ],
  "edges": [
    {
      "from": "n1",
      "to": "n2",
      "label": "connects to",
      "routing": "orthogonal"       // orthogonal | straight
    }
  ],
  "groups": [
    {
      "id": "g1",
      "label": "My Group",
      "parent": null                // nested groups supported
    }
  ]
}
```

## CLI commands

```
drawio-claude generate [input] -o <output>   Generate diagram from JSON
drawio-claude validate <file>                Validate .drawio XML
drawio-claude shapes [category]              List available shape types
drawio-claude themes                         List built-in themes
drawio-claude schema                         Output JSON schema (for agents)
```

All commands support `--json` for machine-readable output.

## Shape categories

150+ built-in shapes across 7 categories:

| Category | Examples |
|----------|----------|
| `flowchart` | process, decision, terminal, database, document |
| `aws` | lambda, ec2, s3, rds, api-gateway, dynamodb, ... |
| `azure` | vm, app-service, sql-database, functions, ... |
| `gcp` | compute-engine, cloud-storage, bigquery, ... |
| `uml` | class, interface, actor, usecase, component, ... |
| `network` | server, firewall, router, switch, cloud, ... |
| `bio` | 79 curated Bioicons for scientific diagrams |

Run `drawio-claude shapes <category>` to see all shapes in a category.

## Output formats

- **`.drawio.svg`** (default) — dual-format file: valid SVG that's also editable in draw.io
- **`.drawio`** — raw draw.io XML

## Using with Claude Code

This repo includes [skills](/skills) that teach Claude Code how to generate diagrams. Once installed, Claude can produce diagrams directly from natural language descriptions.

## Examples

See the [`examples/`](examples/) directory for sample outputs.

## Development

```bash
pnpm test          # run tests
pnpm test:watch    # run tests in watch mode
pnpm typecheck     # type-check without emitting
pnpm dev           # run CLI from source (tsx)
```

## License

MIT
