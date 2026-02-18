// ABOUTME: Input validation for the JSON DSL with user-friendly error messages.
// ABOUTME: Validates structural integrity beyond what Zod checks (e.g., dangling references).

import { DiagramSchema, type Diagram } from "./graph.js";

export type ValidationResult =
  | { ok: true; diagram: Diagram }
  | { ok: false; errors: string[] };

export function validateInput(input: unknown): ValidationResult {
  const parsed = DiagramSchema.safeParse(input);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return `${path}: ${issue.message}`;
    });
    return { ok: false, errors };
  }

  const diagram = parsed.data;
  const structuralErrors = validateStructure(diagram);

  if (structuralErrors.length > 0) {
    return { ok: false, errors: structuralErrors };
  }

  return { ok: true, diagram };
}

function validateStructure(diagram: Diagram): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(diagram.nodes.map((n) => n.id));
  const groupIds = new Set(diagram.groups.map((g) => g.id));
  const allIds = new Set([...nodeIds, ...groupIds]);

  // Check for duplicate IDs across nodes and groups
  const seenIds = new Set<string>();
  for (const node of diagram.nodes) {
    if (seenIds.has(node.id)) {
      errors.push(`Duplicate node ID: "${node.id}"`);
    }
    seenIds.add(node.id);
  }
  for (const group of diagram.groups) {
    if (seenIds.has(group.id)) {
      errors.push(`Duplicate ID "${group.id}" (used by both a node and a group, or duplicate group)`);
    }
    seenIds.add(group.id);
  }

  // Validate edge references
  for (const edge of diagram.edges) {
    if (!nodeIds.has(edge.from) && !groupIds.has(edge.from)) {
      errors.push(
        `Edge references unknown source "${edge.from}". Available IDs: ${[...allIds].join(", ")}`
      );
    }
    if (!nodeIds.has(edge.to) && !groupIds.has(edge.to)) {
      errors.push(
        `Edge references unknown target "${edge.to}". Available IDs: ${[...allIds].join(", ")}`
      );
    }
  }

  // Validate node group references
  for (const node of diagram.nodes) {
    if (node.group && !groupIds.has(node.group)) {
      errors.push(
        `Node "${node.id}" references unknown group "${node.group}". Available groups: ${[...groupIds].join(", ") || "(none)"}`
      );
    }
  }

  // Validate group parent references + detect cycles
  for (const group of diagram.groups) {
    if (group.parent !== null && !groupIds.has(group.parent)) {
      errors.push(
        `Group "${group.id}" references unknown parent "${group.parent}". Available groups: ${[...groupIds].join(", ")}`
      );
    }
  }

  const cycleError = detectGroupCycles(diagram.groups);
  if (cycleError) {
    errors.push(cycleError);
  }

  return errors;
}

function detectGroupCycles(
  groups: Diagram["groups"]
): string | null {
  const parentMap = new Map<string, string | null>();
  for (const group of groups) {
    parentMap.set(group.id, group.parent);
  }

  for (const group of groups) {
    const visited = new Set<string>();
    let current: string | null = group.id;

    while (current !== null) {
      if (visited.has(current)) {
        return `Circular group nesting detected involving "${current}"`;
      }
      visited.add(current);
      current = parentMap.get(current) ?? null;
    }
  }

  return null;
}
