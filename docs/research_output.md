# A draw.io CLI skill for scientific figures

**Draw.io is a strong choice for a Claude Code diagram skill — its stable XML schema, rich shape libraries, and mature export tooling make it the better platform for professional scientific figures, despite XML being harder for LLMs than Excalidraw's JSON.** The critical discovery in this research is the `.drawio.svg` dual-format file: a single artifact that renders as SVG in browsers and papers while remaining fully editable in draw.io. This can be generated programmatically using mxGraph + jsdom in Node.js with **zero Electron or browser dependency** (~50MB footprint), as already demonstrated by the Sujimoshi/drawio-mcp project. The recommended architecture is a TypeScript skill with ELK.js for layout, a validation loop to catch the XML errors LLMs predictably make, and a two-tier export pipeline producing `.drawio.svg` by default with optional high-fidelity PNG via a Docker-based fallback.

---

## The XML schema is verbose but highly regular

The draw.io file format centers on `mxGraphModel` containing `mxCell` elements, each with an `id`, a `parent` reference, and a semicolon-delimited `style` string. Every file requires two invisible foundation cells (`id="0"` as root, `id="1"` as default layer) — omitting these is the single most common LLM failure mode. A minimal valid `.drawio` file is just 8 lines:

```xml
<mxfile host="app.diagrams.net">
  <diagram name="Page-1" id="p1">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1"
      tooltips="1" connect="1" arrows="1" fold="1" page="1"
      pageScale="1" pageWidth="1100" pageHeight="850" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

Shapes are vertices (`vertex="1"`) with absolute positioning via `<mxGeometry x="" y="" width="" height="">`. Connectors are edges (`edge="1"`) referencing `source` and `target` cell IDs with `relative="1"` geometry. Style strings pack all visual properties into a single attribute: `style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"`. **No formal XSD or DTD exists** — the JGraph team acknowledged this gap in 2018 — but the format has maintained backwards compatibility since 2005.

Groups work by setting a child's `parent` attribute to the group cell's ID (with child geometry relative to the group). Multi-page diagrams use multiple `<diagram>` elements within `<mxfile>`. The `<object>` wrapper adds custom metadata properties to any cell. Shape library references follow the pattern `shape=mxgraph.<library>.<shape>` — for example, `shape=mxgraph.aws4.lambda` for AWS Lambda, `shape=mxgraph.electrical.resistors.resistor_2` for a resistor, or `shape=mxgraph.flowchart.database` for a database cylinder.

---

## LLM failure modes are predictable and preventable

Research from the drawio-ninja project and the GenAI-DrawIO-Creator academic paper identifies **ten recurring error patterns** when LLMs generate draw.io XML. The top five account for nearly all failures:

**Missing foundation cells** tops the list — LLMs skip `id="0"` and `id="1"` because they're invisible infrastructure. **Orphaned edge references** rank second: LLMs generate text sequentially, but edges require referencing vertex IDs that may not exist yet. The fix is rigid ordering — all vertices before all edges. **Invalid style strings** come third: LLMs inject CSS-style names (`background-color` instead of `fillColor`), quote hex values inside the attribute, or forget that the first style token can be a bare shape name without `=`. **Geometry omissions** — forgetting `<mxGeometry>`, `relative="1"` on edges, or `as="geometry"` — cause shapes to render at zero dimensions. **XML escaping failures** round out the top five: ampersands in labels need `&amp;`, less-than needs `&lt;`.

The recommended **generation protocol for the skill** is:

1. Always emit the `<mxfile>` wrapper and foundation cells first
2. Use simple sequential numeric IDs starting at 2
3. Generate ALL vertex cells, then ALL edge cells
4. Validate every `source`/`target` attribute references an existing vertex ID
5. Never use IDs 0 or 1 for content cells
6. Run a post-generation XML validator that checks for these specific patterns

A bundled validator script can catch **all five** of these categories mechanically, making the "generate → validate → fix → re-validate" loop highly effective.

---

## The `.drawio.svg` dual format is the killer feature

A `.drawio.svg` file is simultaneously a valid SVG image (renderable in any browser, GitHub README, LaTeX `\includegraphics`, or PDF pipeline) AND contains embedded draw.io XML data (editable when opened in the draw.io desktop app, web editor, or VS Code extension). The embedding works by storing the full `<mxfile>` XML — compressed with deflate, then base64-encoded — in the `content` attribute of the root `<svg>` element. The SVG visual elements (rects, paths, text, foreignObject) provide the rendered view.

**This can be generated entirely in Node.js without any draw.io app.** The Sujimoshi/drawio-mcp project proves the approach: mxGraph library + jsdom creates a server-side DOM, constructs the graph model programmatically, serializes to draw.io XML, generates basic SVG rendering, and embeds the compressed XML into the SVG's `content` attribute. The result opens and edits correctly in VS Code's `hediet.vscode-drawio` extension, the draw.io desktop app, and diagrams.net. **Total dependency footprint: ~50MB** (mxGraph + jsdom + pako), compared to ~450MB+ for Electron-based approaches.

For high-fidelity PNG export (needed for papers requiring raster formats), the recommended fallback pipeline is:

- **Primary (zero-dep)**: Generate `.drawio.svg` using mxGraph + jsdom. This covers ~90% of use cases.
- **Secondary (Docker)**: Use `rlespinasse/drawio-desktop-headless` Docker image for pixel-perfect PNG/PDF export. Command: `docker run -v $(pwd):/data rlespinasse/drawio-desktop-headless drawio -x -f png -s 2 --crop input.drawio -o output.png`
- **Tertiary (local app)**: If the user has draw.io Desktop installed, use `xvfb-run drawio --export --format png --scale 2 --crop input.drawio -o output.png` (Linux) or `drawio --export ...` directly (macOS/Windows).

The `.drawio.png` format also exists (XML embedded in PNG zTXt metadata chunk), but `.drawio.svg` is superior: it's text-based (Git-diffable), smaller, and natively supported everywhere SVG is.

---

## Shape libraries excel for architecture but require supplements for biology

Draw.io's built-in shape libraries represent its strongest advantage over Excalidraw. **System architecture diagrams rate 10/10** with native libraries spanning AWS (five generations: 2017–2025), Azure, GCP, IBM Cloud, Alibaba Cloud, Cisco, and generic networking. **Flowcharts and experimental pipelines rate 9/10** with full standard flowchart shapes plus BPMN 2.0. **UML rates 9/10** with comprehensive class, sequence, activity, and state diagram shapes.

Scientific domains fare worse. **Clinical trial CONSORT diagrams rate 6/10** — manually constructable from flowchart shapes, and draw.io was identified in a PHUSE 2022 paper as one of the most efficient manual tools, but there are no data-driven CONSORT templates. **Neural network architectures rate 5/10** — community templates exist (GitHub repos by kennethleungty and WangX0111 provide .drawio files for VGG16, U-Net, YOLO), but no dedicated ML shapes. **Molecular/chemical structures rate 4/10** — solid and dashed wedge connectors were added for Natta projections, but benzene rings and functional groups must be built manually. **Cell signaling pathways rate 3/10** with no native biological shapes.

The critical supplement for biomedical use is **Bioicons** (bioicons.com): an open-source library providing **1,900+ scientific icons** organized into categories including nucleic acids (96 shapes), cell membranes (89), receptors/channels (66), intracellular components (120), genetics (85), blood/immunology (205), and microbiology (154). These load via draw.io's custom library URL mechanism (`?clibs=Uhttps://bioicons.com/path/library.xml`) and appear as image-based shapes in the XML: `style="shape=image;image=data:image/svg+xml,[BASE64_DATA];"`. The skill should pre-bundle the most commonly needed Bioicons as embedded SVG data URIs, eliminating runtime library loading.

---

## Auto-layout cannot be triggered from XML but can run in Node.js

Draw.io's layout algorithms (hierarchical, organic, tree, radial tree, circle, org chart) are computed by the JavaScript runtime — **they cannot be embedded in static XML or triggered via the CLI**. The desktop app's `--export` flag has no `--layout` option; it renders the XML coordinates as-is.

Three viable approaches exist for programmatic layout:

**ELK.js (recommended)** is the Eclipse Layout Kernel transpiled to JavaScript. It runs natively in Node.js, supports hierarchical (Sugiyama), force-directed, stress, radial, tree, and box algorithms with hundreds of configuration options. It handles compound graphs (sub-graphs/containers), which is essential for grouped scientific diagram elements. Integration: build an ELK graph JSON object with nodes (id, width, height, children) and edges → call `elk.layout(graph)` → read computed positions → write as `mxGeometry x/y` attributes.

**dagre** is simpler but unmaintained since 2018 and lacks compound graph support. It handles basic hierarchical layout well and is what MermaidJS uses internally.

**mxGraph's own layout algorithms** can run in Node.js via jsdom, as demonstrated by Sujimoshi/drawio-mcp, which supports hierarchical, circle, organic, compact-tree, radial-tree, partition, and stack layouts. This approach uses the actual draw.io layout engine but depends on the archived mxGraph library. **maxGraph** (the active successor, `@maxgraph/core` v0.22.0 on npm with ~4,200 weekly downloads) also works headlessly in Node.js with jsdom and inherits all mxGraph layouts, but is still pre-1.0 with possible API changes.

For the skill, the recommended approach is **ELK.js as the primary layout engine** (actively maintained, most sophisticated algorithms, native Node.js) with a **Graphviz fallback** via graphviz2drawio for users who have Graphviz installed and prefer DOT notation.

---

## Recommended skill architecture

The skill should be **TypeScript** (not Python) for three reasons: tighter integration with mxGraph/maxGraph APIs, native ELK.js compatibility, and the ability to generate `.drawio.svg` files using the proven jsdom approach. Python alternatives like drawpyo exist but only support tree layouts and cannot produce dual-format `.drawio.svg`.

### File structure

```
drawio-figures/
├── SKILL.md                    # Core instructions (<5k tokens)
├── scripts/
│   ├── generate.ts             # Main diagram generation CLI
│   ├── validate.ts             # XML validation (checks 10 LLM error patterns)
│   ├── export.sh               # PNG/PDF export via Docker or local draw.io
│   └── install-deps.sh         # One-time: npm install + optional Docker pull
├── references/
│   ├── xml-format.md           # Full mxGraphModel/mxCell reference
│   ├── style-guide.md          # Style string reference + color palettes
│   ├── shape-libraries.md      # Library namespaces and shape names
│   └── templates/
│       ├── flowchart.drawio    # Pipeline/workflow template
│       ├── architecture.drawio # System architecture template
│       ├── consort.drawio      # Clinical trial CONSORT template
│       └── signaling.drawio    # Cell signaling pathway template
├── lib/
│   ├── graph-builder.ts        # Programmatic mxGraphModel construction
│   ├── layout-engine.ts        # ELK.js integration wrapper
│   ├── svg-exporter.ts         # .drawio.svg generation (mxGraph + jsdom)
│   ├── validator.ts            # Structural XML validation
│   └── bioicons/               # Pre-bundled biomedical SVG icons
├── examples/
│   ├── experimental-pipeline.drawio.svg
│   ├── cloud-architecture.drawio.svg
│   └── signaling-pathway.drawio.svg
├── package.json
└── tsconfig.json
```

### Key dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `mxgraph` (or `@maxgraph/core`) | Graph model construction + SVG serialization | ~15MB |
| `jsdom` | Server-side DOM for mxGraph | ~20MB |
| `elkjs` | Auto-layout computation | ~5MB |
| `pako` | Deflate compression for .drawio.svg embedding | ~200KB |
| `fast-xml-parser` | XML validation and parsing | ~500KB |
| **Total** | | **~40MB** |

### SKILL.md design (abbreviated)

The skill should follow Anthropic's progressive disclosure pattern: concise core instructions in SKILL.md with detailed references loaded on demand.

```yaml
---
name: generating-drawio-figures
description: >
  Create professional scientific diagrams as .drawio.svg files —
  editable in draw.io/VS Code AND renderable as SVG in papers.
  Use for: flowcharts, architecture diagrams, experimental pipelines,
  signaling pathways, CONSORT diagrams, network diagrams.
---
```

Core instructions should enforce the generation protocol (foundation cells first, vertices before edges, sequential IDs), mandate the validate → fix loop, and specify that `.drawio.svg` is the default output format. The `references/xml-format.md` file provides the full schema when Claude needs it.

---

## Draw.io vs Excalidraw for scientific diagram generation

| Dimension | draw.io | Excalidraw | Verdict |
|-----------|---------|------------|---------|
| **LLM format difficulty** | XML with encoded style strings; 10 known failure patterns | JSON with flat key-value properties | Excalidraw wins — JSON is natively easier for LLMs |
| **Validation feasibility** | All common errors are mechanically detectable | Fewer errors possible, but binding IDs still fail | draw.io's validator loop compensates for format difficulty |
| **Shape library breadth** | Hundreds of built-in libraries (AWS, UML, BPMN, electrical, networking) | 7 basic shapes + community libraries | **draw.io wins decisively** |
| **Scientific suitability** | Flowcharts 9/10, architecture 10/10, bio 3/10 (6/10 with Bioicons) | Flowcharts 7/10, architecture 6/10, bio 2/10 | draw.io wins for all except hand-drawn aesthetics |
| **Headless export** | Desktop CLI (needs Xvfb), draw-image-export2, Docker solutions | jsdom for SVG, Playwright for PNG — no stable official path | **draw.io wins** — battle-tested CLI + Docker |
| **Dual-format output** | `.drawio.svg`: valid SVG + editable draw.io XML in one file | `.excalidraw.png`: embeds scene in PNG metadata | **draw.io wins** — SVG is text-based, Git-friendly, universal |
| **Zero-dep generation** | mxGraph + jsdom (~50MB) → `.drawio.svg` | Pure Python/JSON (~0 deps) → `.excalidraw` | Excalidraw wins on simplicity; draw.io wins on output quality |
| **Auto-layout** | ELK.js or mxGraph layouts via jsdom | dagre only (via robtaylor's Flowchart class) | **draw.io wins** — more algorithms, compound graph support |
| **Visual aesthetic** | Polished, precise — imprecision looks broken | Hand-drawn — imprecision looks intentional | Context-dependent. Publications: draw.io. Presentations: Excalidraw |
| **Professional polish** | Clean vector output suitable for journals | Hand-drawn style inappropriate for most formal papers | **draw.io wins** for scientific publishing |
| **Install footprint** | ~50MB (mxGraph+jsdom+ELK) or ~450MB (with Docker export) | ~0 (Python) or ~250MB (with Playwright for PNG) | Comparable when export is included |
| **Existing MCP/skill ecosystem** | Sujimoshi/drawio-mcp (layout + .drawio.svg), @drawio/mcp (official, URL-only) | Official excalidraw-mcp (streaming SVG), multiple community servers | Excalidraw has more MCP options; draw.io has the better file-generation MCP |
| **Connector routing** | Orthogonal, elbow, entity-relation, segment, isometric with waypoints | Basic straight/elbow arrows only | **draw.io wins** — critical for complex diagrams |

**Bottom line**: For a researcher producing figures for papers and presentations, draw.io wins on shape breadth, export reliability, professional aesthetics, and the `.drawio.svg` dual-format killer feature. Excalidraw's JSON simplicity advantage is real but mitigated by a good validator. The hand-drawn aesthetic is a strength only for informal contexts.

---

## Prioritized implementation roadmap

**Phase 1 — Core generation (weeks 1–2)**: TypeScript skill with SKILL.md, XML validator, and direct `.drawio` file generation using string templates. No layout engine yet — LLM computes coordinates with guidance from reference templates. This matches the robtaylor/excalidraw-diagrams approach: minimal dependencies, immediate value. Deliverables: flowcharts, experimental pipelines, basic architecture diagrams.

**Phase 2 — Dual-format export (week 3)**: Add mxGraph + jsdom for `.drawio.svg` generation. Port the compression/embedding pipeline from Sujimoshi/drawio-mcp. Add `scripts/export.sh` wrapping Docker-based PNG export. Deliverable: every generated diagram is a `.drawio.svg` viewable on GitHub AND editable in VS Code.

**Phase 3 — Auto-layout (weeks 4–5)**: Integrate ELK.js. Support `layout: hierarchical | organic | tree | radial` parameter in the generation API. Parse LLM-generated graph structure (nodes + edges) → compute layout → emit positioned XML. This eliminates the hardest part of LLM diagram generation: manual coordinate calculation.

**Phase 4 — Scientific templates (weeks 6–8)**: Pre-bundle Bioicons SVG data URIs for common biological shapes. Create curated templates for CONSORT diagrams, cell signaling pathways, neural network architectures, and experimental pipelines. Add shape library reference docs so the LLM can use AWS/Azure/GCP/networking shapes by name. Each template is both a `.drawio.svg` example and a reference for the LLM.

**Phase 5 — Polish and ecosystem (weeks 9–10)**: Add Mermaid-to-draw.io conversion (via draw.io's built-in Mermaid support or a custom parser). Investigate maxGraph migration (from archived mxGraph). Add CI tests generating a diagram gallery. Publish to Anthropic's skill registry.

---

## Conclusion

The draw.io skill should target **`.drawio.svg` as its primary output format** — this single design choice solves the editability-vs-renderability tension that plagues all diagram generation tools. The format is a valid SVG (embeddable anywhere) that is also a fully editable draw.io document. Combined with ELK.js for auto-layout and a strict XML validation loop to catch the predictable LLM failure patterns, this approach delivers professional scientific figures from Claude Code with a ~50MB dependency footprint — lighter than any Playwright or Electron-based alternative. The main gap remains biomedical shape coverage, addressable by pre-bundling Bioicons SVG data rather than requiring runtime library loading. TypeScript is the right language choice: it's the only path to mxGraph/maxGraph integration, jsdom-based `.drawio.svg` generation, and native ELK.js layout — all of which are JavaScript-ecosystem capabilities that Python cannot match for this specific use case.
