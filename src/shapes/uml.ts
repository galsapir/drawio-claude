// ABOUTME: UML shape definitions mapping type names to draw.io style strings.
// ABOUTME: Covers class, component, actor, use case, and package shapes.

export const umlShapes: Record<string, string> = {
  "uml.class":
    "swimlane;fontStyle=1;align=center;startSize=26;html=1;whiteSpace=wrap;",
  "uml.interface":
    "swimlane;fontStyle=1;align=center;startSize=26;html=1;whiteSpace=wrap;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;collapsible=1;marginBottom=0;",
  "uml.actor":
    "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;",
  "uml.usecase":
    "ellipse;whiteSpace=wrap;html=1;",
  "uml.component":
    "shape=component;align=left;spacingLeft=36;html=1;whiteSpace=wrap;",
  "uml.package":
    "shape=folder;fontStyle=1;tabWidth=110;tabHeight=30;tabPosition=left;html=1;whiteSpace=wrap;",
  "uml.node":
    "shape=cube;whiteSpace=wrap;html=1;size=10;",
  "uml.object":
    "rounded=0;whiteSpace=wrap;html=1;",
  "uml.state":
    "rounded=1;whiteSpace=wrap;html=1;arcSize=40;",
  "uml.initial-state":
    "ellipse;html=1;shape=doubleCircle;whiteSpace=wrap;aspect=fixed;fillColor=#000000;strokeColor=#ffffff;",
  "uml.final-state":
    "ellipse;html=1;shape=doubleCircle;whiteSpace=wrap;aspect=fixed;fillColor=#000000;strokeColor=#000000;",
  "uml.activity":
    "rounded=1;whiteSpace=wrap;html=1;",
  "uml.decision":
    "rhombus;whiteSpace=wrap;html=1;",
  "uml.note":
    "shape=note;whiteSpace=wrap;html=1;size=14;",
};
