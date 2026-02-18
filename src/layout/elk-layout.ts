// ABOUTME: ELK.js integration for automatic graph layout computation.
// ABOUTME: Converts internal graph model to ELK format, runs layout, and writes positions back.

import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs";
import type { GraphModel, GraphNode, GraphGroup } from "../core/graph-builder.js";
import type { LayoutConfig } from "../schema/graph.js";

const elk = new ELK();

const ALGORITHM_MAP: Record<string, string> = {
  hierarchical: "layered",
  force: "force",
  tree: "mrtree",
  radial: "radialTree",
  box: "rectpacking",
};

const DIRECTION_MAP: Record<string, string> = {
  TB: "DOWN",
  BT: "UP",
  LR: "RIGHT",
  RL: "LEFT",
};

export async function computeLayout(
  model: GraphModel,
  config: LayoutConfig
): Promise<GraphModel> {
  if (config.algorithm === "none") {
    return model;
  }

  const elkGraph = buildElkGraph(model, config);
  const result = await elk.layout(elkGraph);
  return applyLayout(model, result);
}

function buildElkGraph(model: GraphModel, config: LayoutConfig): ElkNode {
  const algorithm = ALGORITHM_MAP[config.algorithm] ?? "layered";
  const direction = DIRECTION_MAP[config.direction] ?? "DOWN";

  // Build a map of group children for nesting
  const groupChildren = new Map<string | null, (GraphNode | GraphGroup)[]>();
  groupChildren.set(null, []);

  for (const group of model.groups) {
    groupChildren.set(group.id, []);
    const parentKey = group.parent;
    if (!groupChildren.has(parentKey)) {
      groupChildren.set(parentKey, []);
    }
    groupChildren.get(parentKey)!.push(group);
  }

  for (const node of model.nodes) {
    const parentKey = node.group;
    if (!groupChildren.has(parentKey)) {
      groupChildren.set(parentKey, []);
    }
    groupChildren.get(parentKey)!.push(node);
  }

  function buildElkChildren(parentId: string | null): ElkNode[] {
    const children = groupChildren.get(parentId) ?? [];
    const elkNodes: ElkNode[] = [];

    for (const child of children) {
      if ("cellId" in child && "size" in child) {
        // It's a GraphNode
        const node = child as GraphNode;
        const elkNode: ElkNode = {
          id: String(node.cellId),
          width: node.size.width,
          height: node.size.height,
        };

        // If node has manual position, set it as a fixed constraint
        if (node.position) {
          elkNode.x = node.position.x;
          elkNode.y = node.position.y;
          elkNode.layoutOptions = {
            "elk.position": `(${node.position.x}, ${node.position.y})`,
            "org.eclipse.elk.noLayout": "true",
          };
        }

        elkNodes.push(elkNode);
      } else {
        // It's a GraphGroup
        const group = child as GraphGroup;
        const nestedChildren = buildElkChildren(group.id);
        const elkNode: ElkNode = {
          id: String(group.cellId),
          children: nestedChildren,
          layoutOptions: {
            "elk.padding": "[top=40,left=20,bottom=20,right=20]",
          },
        };
        elkNodes.push(elkNode);
      }
    }

    return elkNodes;
  }

  // All edges at root — INCLUDE_CHILDREN handles cross-hierarchy routing
  const edges: ElkExtendedEdge[] = model.edges.map((edge) => ({
    id: String(edge.cellId),
    sources: [String(edge.sourceCellId)],
    targets: [String(edge.targetCellId)],
  }));

  return {
    id: "root",
    children: buildElkChildren(null),
    edges,
    layoutOptions: {
      "elk.algorithm": algorithm,
      "elk.direction": direction,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.spacing.nodeNode": String(config.spacing.node),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(config.spacing.layer),
      "elk.edgeRouting": "ORTHOGONAL",
    },
  };
}

function applyLayout(model: GraphModel, elkResult: ElkNode): GraphModel {
  // ELK returns positions relative to parent containers.
  // We need absolute positions for SVG rendering.
  const absolutePositionMap = new Map<number, { x: number; y: number }>();
  const sizeMap = new Map<number, { width: number; height: number }>();

  function collectPositions(elkNode: ElkNode, parentX: number, parentY: number) {
    if (elkNode.id !== "root") {
      const cellId = parseInt(elkNode.id, 10);
      const absX = parentX + (elkNode.x ?? 0);
      const absY = parentY + (elkNode.y ?? 0);
      absolutePositionMap.set(cellId, { x: absX, y: absY });

      if (elkNode.width !== undefined && elkNode.height !== undefined) {
        sizeMap.set(cellId, { width: elkNode.width, height: elkNode.height });
      }

      // Children are relative to this node's position
      for (const child of elkNode.children ?? []) {
        collectPositions(child, absX, absY);
      }
    } else {
      for (const child of elkNode.children ?? []) {
        collectPositions(child, parentX, parentY);
      }
    }
  }

  collectPositions(elkResult, 0, 0);

  const updatedNodes = model.nodes.map((node) => {
    const pos = absolutePositionMap.get(node.cellId);
    if (pos && !node.position) {
      return { ...node, position: pos };
    }
    return node;
  });

  const updatedGroups = model.groups.map((group) => {
    const pos = absolutePositionMap.get(group.cellId);
    const size = sizeMap.get(group.cellId);
    return { ...group, position: pos, size };
  });

  return {
    ...model,
    nodes: updatedNodes,
    groups: updatedGroups,
  };
}
