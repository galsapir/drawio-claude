// ABOUTME: Zod schemas and TypeScript types for the JSON DSL input format.
// ABOUTME: Defines the contract between Claude and the drawio-claude CLI.

import { z } from "zod/v4";

const StyleOverrideSchema = z.object({
  fillColor: z.string().optional(),
  strokeColor: z.string().optional(),
  fontColor: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  rounded: z.boolean().optional(),
  dashed: z.boolean().optional(),
  shadow: z.boolean().optional(),
  opacity: z.number().min(0).max(100).optional(),
  strokeWidth: z.number().optional(),
});

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const SizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

const NodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().default(""),
  type: z.string().default("flowchart.process"),
  group: z.string().optional(),
  style: StyleOverrideSchema.optional(),
  position: PositionSchema.optional(),
  size: SizeSchema.optional(),
});

const EdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
  style: StyleOverrideSchema.optional(),
  routing: z.enum(["straight", "orthogonal"]).default("orthogonal"),
});

const GroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().default(""),
  parent: z.string().nullable().default(null),
  style: StyleOverrideSchema.optional(),
});

const LayoutAlgorithm = z.enum([
  "hierarchical",
  "force",
  "tree",
  "radial",
  "box",
  "none",
]);

const LayoutDirection = z.enum(["TB", "BT", "LR", "RL"]);

const SpacingSchema = z.object({
  node: z.number().positive().default(50),
  layer: z.number().positive().default(80),
});

const LayoutSchema = z.object({
  algorithm: LayoutAlgorithm.default("hierarchical"),
  direction: LayoutDirection.default("TB"),
  spacing: SpacingSchema.default({ node: 50, layer: 80 }),
}).default({ algorithm: "hierarchical", direction: "TB", spacing: { node: 50, layer: 80 } });

const ThemeName = z.enum([
  "professional",
  "colorful",
  "monochrome",
  "blueprint",
  "pastel",
]);

export const DiagramSchema = z.object({
  title: z.string().default("Untitled Diagram"),
  theme: ThemeName.default("professional"),
  layout: LayoutSchema,
  nodes: z.array(NodeSchema).min(1, "Diagram must have at least one node"),
  edges: z.array(EdgeSchema).default([]),
  groups: z.array(GroupSchema).default([]),
});

export type Diagram = z.infer<typeof DiagramSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type StyleOverride = z.infer<typeof StyleOverrideSchema>;
export type LayoutConfig = z.infer<typeof LayoutSchema>;
export type ThemeNameType = z.infer<typeof ThemeName>;
export type LayoutAlgorithmType = z.infer<typeof LayoutAlgorithm>;
export type LayoutDirectionType = z.infer<typeof LayoutDirection>;
