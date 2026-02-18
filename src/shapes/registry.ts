// ABOUTME: Central shape type registry mapping friendly names to draw.io style strings.
// ABOUTME: Aggregates all shape category modules and provides lookup with fuzzy suggestions.

import { flowchartShapes } from "./flowchart.js";
import { awsShapes } from "./aws.js";
import { azureShapes } from "./azure.js";
import { gcpShapes } from "./gcp.js";
import { umlShapes } from "./uml.js";
import { networkShapes } from "./network.js";

const allShapes: Record<string, string> = {
  ...flowchartShapes,
  ...awsShapes,
  ...azureShapes,
  ...gcpShapes,
  ...umlShapes,
  ...networkShapes,
};

export function resolveShapeStyle(typeName: string): string | null {
  return allShapes[typeName] ?? null;
}

export function suggestShape(typeName: string): string | null {
  const lower = typeName.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = Infinity;

  for (const key of Object.keys(allShapes)) {
    const distance = levenshtein(lower, key.toLowerCase());
    if (distance < bestScore && distance <= 3) {
      bestScore = distance;
      bestMatch = key;
    }
  }

  return bestMatch;
}

export function listShapes(category?: string): Record<string, string> {
  if (!category) return { ...allShapes };

  const prefix = category + ".";
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(allShapes)) {
    if (key.startsWith(prefix)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

export function listCategories(): string[] {
  const categories = new Set<string>();
  for (const key of Object.keys(allShapes)) {
    const dot = key.indexOf(".");
    if (dot > 0) {
      categories.add(key.substring(0, dot));
    }
  }
  return [...categories].sort();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
