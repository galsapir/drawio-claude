// ABOUTME: Flowchart shape definitions mapping type names to draw.io style strings.
// ABOUTME: Covers standard flowchart shapes: process, decision, terminal, I/O, etc.

export const flowchartShapes: Record<string, string> = {
  "flowchart.process":
    "rounded=1;whiteSpace=wrap;html=1;",
  "flowchart.decision":
    "rhombus;whiteSpace=wrap;html=1;",
  "flowchart.terminal":
    "rounded=1;whiteSpace=wrap;html=1;arcSize=50;",
  "flowchart.io":
    "shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;",
  "flowchart.document":
    "shape=document;whiteSpace=wrap;html=1;boundedLbl=1;",
  "flowchart.database":
    "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;size=15;",
  "flowchart.delay":
    "shape=delay;whiteSpace=wrap;html=1;",
  "flowchart.merge":
    "triangle;whiteSpace=wrap;html=1;",
  "flowchart.predefined-process":
    "shape=process;whiteSpace=wrap;html=1;",
  "flowchart.manual-input":
    "shape=manualInput;whiteSpace=wrap;html=1;",
  "flowchart.preparation":
    "shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;",
  "flowchart.data-store":
    "shape=datastore;whiteSpace=wrap;html=1;",
  "flowchart.or":
    "shape=orEllipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;",
  "flowchart.summing-junction":
    "shape=sumEllipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;",
  "flowchart.display":
    "shape=display;whiteSpace=wrap;html=1;",
  "flowchart.note":
    "shape=note;whiteSpace=wrap;html=1;",
  "flowchart.card":
    "shape=card;whiteSpace=wrap;html=1;",
  "flowchart.cloud":
    "ellipse;shape=cloud;whiteSpace=wrap;html=1;",
};
