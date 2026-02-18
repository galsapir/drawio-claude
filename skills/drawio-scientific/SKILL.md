---
name: drawio-scientific
description: >
  Generate scientific figures: experimental pipelines, signaling pathways, CONSORT diagrams,
  and biological illustrations using 79 bundled Bioicons. Output as .drawio.svg.
---

# Scientific Diagram Generation

You generate scientific figures using the `drawio-claude` CLI tool with bundled Bioicons (CC-0 licensed from bioicons.com). Describe the diagram as JSON, and the tool handles layout and rendering.

## Quick Start

```bash
echo '<JSON>' | npx drawio-claude generate -o figure.drawio.svg
```

## Bundled Bioicons (79 shapes)

### Lab Apparatus (17 shapes)
`bio.lab-apparatus.microscope-cartoon`, `bio.lab-apparatus.beakers`, `bio.lab-apparatus.bioreactor`, `bio.lab-apparatus.incubator`, `bio.lab-apparatus.erlenmeyer-filled`, `bio.lab-apparatus.1000-ml-erlenmeyer-flask`, `bio.lab-apparatus.simple-syringe-cartoon`, `bio.lab-apparatus.flow-cytometer-cell-sorter`, `bio.lab-apparatus.qpcr-machine`, `bio.lab-apparatus.mass-spectrometer-ms`, `bio.lab-apparatus.chromatography`, `bio.lab-apparatus.sonicator`, `bio.lab-apparatus.vortex-mixer`, `bio.lab-apparatus.water-bath`, `bio.lab-apparatus.round-bottomed-flask-cartoon`, `bio.lab-apparatus.dropper`, `bio.lab-apparatus.microfluids-chip`

### Nucleic Acids (11 shapes)
`bio.nucleic-acids.ssdna-single-stranded`, `bio.nucleic-acids.trna-secondary-structure`, `bio.nucleic-acids.plasmid-2`, `bio.nucleic-acids.restriction-enzyme`, `bio.nucleic-acids.chromatin-histones`, `bio.nucleic-acids.atp`, `bio.nucleic-acids.adenine`, `bio.nucleic-acids.cytosine`, `bio.nucleic-acids.guanine`, `bio.nucleic-acids.thymine`, `bio.nucleic-acids.uracil`

### Cell Culture (9 shapes)
`bio.cell-culture.96-well-plate`, `bio.cell-culture.6-well-plate`, `bio.cell-culture.cc-dish`, `bio.cell-culture.organoid`, `bio.cell-culture.simple-e-coli`, `bio.cell-culture.stem-cell-colony`, `bio.cell-culture.cells-bilayer`, `bio.cell-culture.bacteria-colonies`, `bio.cell-culture.bacteria-culture-loop`

### Cell Types (6 shapes)
`bio.cell-types.simple-cell1`, `bio.cell-types.cell-group`, `bio.cell-types.redbloodcell`, `bio.cell-types.mii-oocyte`, `bio.cell-types.simple-cardiomyocyte`, `bio.cell-types.smooth-muscle-cell-v2`

### Genetics (5 shapes)
`bio.genetics.crispr-cas9`, `bio.genetics.aav-adenovirus`, `bio.genetics.budding-yeast`, `bio.genetics.plasmid-library`, `bio.genetics.sequence-histogram`

### Chemistry (5 shapes)
`bio.chemistry.beaker-water`, `bio.chemistry.bottle-brown-protected`, `bio.chemistry.emulsion`, `bio.chemistry.particles-solution`, `bio.chemistry.u-tube`

### Microbiology (5 shapes)
`bio.microbiology.generic-bacterium`, `bio.microbiology.phage`, `bio.microbiology.yeast`, `bio.microbiology.agarose-gel`, `bio.microbiology.bacteria-swimming`

### Intracellular Components (5 shapes)
`bio.intracellular-components.mitochondria`, `bio.intracellular-components.ribosome`, `bio.intracellular-components.endoplasmic-reticulum`, `bio.intracellular-components.proteasome`, `bio.intracellular-components.histone-complex`

### Human Physiology (4 shapes)
`bio.human-physiology.patient`, `bio.human-physiology.syringe-with-blood`, `bio.human-physiology.drugs`, `bio.human-physiology.pyramidal-neuron`

### Scientific Graphs (3 shapes)
`bio.scientific-graphs.qpcr-plot`, `bio.scientific-graphs.action-potentials`, `bio.scientific-graphs.patch-clamp-recording`

### Blood & Immunology (2 shapes)
`bio.blood-immunology.blood-sample-tube`, `bio.blood-immunology.antibody-heavy-chain-vdj-recombination`

### Tissues (2 shapes)
`bio.tissues.human-heart`, `bio.tissues.nephron-2d`

### Viruses (2 shapes)
`bio.viruses.virus-sketch`, `bio.viruses.virus-titer-plaque-assay`

### General Items (3 shapes)
`bio.general-items.magnifying-glass`, `bio.general-items.thermometer`, `bio.general-items.document`

## Also Available

Standard flowchart shapes work well for scientific diagrams:
- `flowchart.process` — steps in a protocol
- `flowchart.decision` — branch points
- `flowchart.terminal` — start/end
- `flowchart.database` — data storage
- `flowchart.document` — outputs/reports

## Example: Experimental Pipeline (Drug Screening)

```json
{
  "title": "Drug Screening Pipeline",
  "theme": "professional",
  "layout": { "algorithm": "hierarchical", "direction": "TB" },
  "nodes": [
    { "id": "cells", "label": "Cell Culture", "type": "bio.cell-culture.cc-dish" },
    { "id": "treat", "label": "Drug Treatment", "type": "bio.human-physiology.drugs" },
    { "id": "plate", "label": "96-Well Plate", "type": "bio.cell-culture.96-well-plate" },
    { "id": "incubate", "label": "Incubation\n48h", "type": "bio.lab-apparatus.incubator" },
    { "id": "measure", "label": "Plate Reader", "type": "bio.lab-apparatus.qpcr-machine" },
    { "id": "analyze", "label": "Analysis", "type": "flowchart.document" }
  ],
  "edges": [
    { "from": "cells", "to": "treat" },
    { "from": "treat", "to": "plate" },
    { "from": "plate", "to": "incubate" },
    { "from": "incubate", "to": "measure" },
    { "from": "measure", "to": "analyze" }
  ]
}
```

## Example: CONSORT Diagram

```json
{
  "title": "CONSORT Flow Diagram",
  "theme": "monochrome",
  "layout": { "algorithm": "hierarchical", "direction": "TB", "spacing": { "node": 40, "layer": 60 } },
  "nodes": [
    { "id": "assessed", "label": "Assessed for eligibility\n(n=500)" },
    { "id": "excluded", "label": "Excluded (n=150)\n- Not meeting criteria (n=80)\n- Declined (n=50)\n- Other (n=20)" },
    { "id": "randomized", "label": "Randomized\n(n=350)" },
    { "id": "alloc-treat", "label": "Allocated to treatment\n(n=175)" },
    { "id": "alloc-control", "label": "Allocated to control\n(n=175)" },
    { "id": "lost-treat", "label": "Lost to follow-up\n(n=10)" },
    { "id": "lost-control", "label": "Lost to follow-up\n(n=12)" },
    { "id": "analyzed-treat", "label": "Analyzed\n(n=165)" },
    { "id": "analyzed-control", "label": "Analyzed\n(n=163)" }
  ],
  "edges": [
    { "from": "assessed", "to": "excluded" },
    { "from": "assessed", "to": "randomized" },
    { "from": "randomized", "to": "alloc-treat" },
    { "from": "randomized", "to": "alloc-control" },
    { "from": "alloc-treat", "to": "lost-treat" },
    { "from": "alloc-control", "to": "lost-control" },
    { "from": "alloc-treat", "to": "analyzed-treat" },
    { "from": "alloc-control", "to": "analyzed-control" }
  ]
}
```

## Example: Cell Signaling Pathway

```json
{
  "title": "Simplified Signaling Pathway",
  "theme": "pastel",
  "layout": { "algorithm": "hierarchical", "direction": "TB" },
  "groups": [
    { "id": "extracellular", "label": "Extracellular" },
    { "id": "membrane", "label": "Cell Membrane" },
    { "id": "cytoplasm", "label": "Cytoplasm" },
    { "id": "nucleus", "label": "Nucleus" }
  ],
  "nodes": [
    { "id": "ligand", "label": "Ligand", "group": "extracellular" },
    { "id": "receptor", "label": "Receptor", "group": "membrane" },
    { "id": "kinase1", "label": "Kinase A", "group": "cytoplasm" },
    { "id": "kinase2", "label": "Kinase B", "group": "cytoplasm" },
    { "id": "tf", "label": "Transcription Factor", "group": "nucleus" },
    { "id": "gene", "label": "Target Gene", "type": "bio.nucleic-acids.plasmid-2", "group": "nucleus" }
  ],
  "edges": [
    { "from": "ligand", "to": "receptor", "label": "binds" },
    { "from": "receptor", "to": "kinase1", "label": "activates" },
    { "from": "kinase1", "to": "kinase2", "label": "phosphorylates" },
    { "from": "kinase2", "to": "tf", "label": "activates" },
    { "from": "tf", "to": "gene", "label": "transcribes" }
  ]
}
```

## Tips for Scientific Figures

- Use `monochrome` theme for journal submissions (print-friendly)
- Use `professional` for presentations and posters
- Bio shapes render as images — they work best at larger sizes. Consider `"size": { "width": 80, "height": 80 }`
- Use `\n` in labels for multi-line text
- Group nodes by biological compartment (extracellular, membrane, cytoplasm, nucleus)
- Use edge labels to annotate interactions (binds, activates, inhibits, phosphorylates)
