# drawio-claude

Give Claude the ability to generate professional [draw.io](https://draw.io) diagrams from natural language. Outputs `.drawio.svg` files that are both valid SVG images and editable in draw.io.

## Setup (give this to Claude)

Tell Claude Code:

> Clone https://github.com/galsapir/drawio-claude.git, install dependencies, build it, and install the skills from the skills/ directory.

Claude will:
1. Clone the repo and run `pnpm install && pnpm build`
2. Read the skills in `skills/` to learn the JSON DSL and available shapes
3. Be ready to generate diagrams

Then just ask:

> Draw me an AWS architecture diagram with a load balancer, two API servers, and a database.

Claude generates the JSON, pipes it through the CLI, and produces a `.drawio.svg` file you can open in draw.io, VS Code, or any browser.

## What you get

- **150+ shapes** — AWS, Azure, GCP, UML, flowchart, network, and 79 scientific Bioicons
- **Auto-layout** — ELK.js handles positioning (hierarchical, force, tree, radial)
- **5 themes** — professional, colorful, monochrome, blueprint, pastel
- **Dual-format output** — `.drawio.svg` files render as SVG anywhere AND open in draw.io for editing
- **Groups** — nested containers for VPCs, subnets, layers, compartments

## Skills included

| Skill | Use for |
|-------|---------|
| `drawio-flowchart` | Flowcharts, pipelines, decision trees, process flows |
| `drawio-architecture` | Cloud architecture, system design, network diagrams |
| `drawio-scientific` | Lab protocols, signaling pathways, CONSORT diagrams, Bioicons |
| `drawio-uml` | Class diagrams, component diagrams, state machines |

## Manual CLI usage

If you want to use the CLI directly instead of through Claude:

```bash
git clone https://github.com/galsapir/drawio-claude.git
cd drawio-claude
pnpm install
pnpm build
```

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

Or link globally: `pnpm link --global` then use `drawio-claude generate ...`

## JSON input format

```jsonc
{
  "title": "My Diagram",          // optional
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
