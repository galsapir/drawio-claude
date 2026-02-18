// ABOUTME: Theme registry mapping theme names to color/style configurations.
// ABOUTME: Each theme defines defaults for fills, strokes, fonts, and edges.

import type { ThemeNameType } from "../schema/graph.js";

export interface Theme {
  name: ThemeNameType;
  background: string;
  node: {
    fillColor: string;
    strokeColor: string;
    fontColor: string;
    fontSize: number;
    fontFamily: string;
    rounded: boolean;
    shadow: boolean;
  };
  edge: {
    strokeColor: string;
    strokeWidth: number;
    fontColor: string;
    fontSize: number;
  };
  group: {
    fillColor: string;
    strokeColor: string;
    fontColor: string;
    fontSize: number;
    dashed: boolean;
  };
  palette: string[];
}

const professional: Theme = {
  name: "professional",
  background: "#ffffff",
  node: {
    fillColor: "#dae8fc",
    strokeColor: "#6c8ebf",
    fontColor: "#333333",
    fontSize: 12,
    fontFamily: "Helvetica",
    rounded: true,
    shadow: false,
  },
  edge: {
    strokeColor: "#666666",
    strokeWidth: 1,
    fontColor: "#333333",
    fontSize: 11,
  },
  group: {
    fillColor: "#f5f5f5",
    strokeColor: "#999999",
    fontColor: "#333333",
    fontSize: 13,
    dashed: true,
  },
  palette: ["#dae8fc", "#d5e8d4", "#fff2cc", "#f8cecc", "#e1d5e7", "#d0cee2"],
};

const colorful: Theme = {
  name: "colorful",
  background: "#ffffff",
  node: {
    fillColor: "#4FC3F7",
    strokeColor: "#0288D1",
    fontColor: "#ffffff",
    fontSize: 12,
    fontFamily: "Helvetica",
    rounded: true,
    shadow: true,
  },
  edge: {
    strokeColor: "#455A64",
    strokeWidth: 2,
    fontColor: "#333333",
    fontSize: 11,
  },
  group: {
    fillColor: "#E3F2FD",
    strokeColor: "#64B5F6",
    fontColor: "#1565C0",
    fontSize: 13,
    dashed: false,
  },
  palette: ["#4FC3F7", "#81C784", "#FFD54F", "#E57373", "#BA68C8", "#4DD0E1"],
};

const monochrome: Theme = {
  name: "monochrome",
  background: "#ffffff",
  node: {
    fillColor: "#f0f0f0",
    strokeColor: "#333333",
    fontColor: "#000000",
    fontSize: 12,
    fontFamily: "Helvetica",
    rounded: false,
    shadow: false,
  },
  edge: {
    strokeColor: "#333333",
    strokeWidth: 1,
    fontColor: "#000000",
    fontSize: 11,
  },
  group: {
    fillColor: "#fafafa",
    strokeColor: "#666666",
    fontColor: "#000000",
    fontSize: 13,
    dashed: true,
  },
  palette: ["#f0f0f0", "#d9d9d9", "#bfbfbf", "#a6a6a6", "#8c8c8c", "#737373"],
};

const blueprint: Theme = {
  name: "blueprint",
  background: "#1a237e",
  node: {
    fillColor: "#283593",
    strokeColor: "#5c6bc0",
    fontColor: "#e8eaf6",
    fontSize: 12,
    fontFamily: "Courier New",
    rounded: false,
    shadow: false,
  },
  edge: {
    strokeColor: "#7986cb",
    strokeWidth: 1,
    fontColor: "#c5cae9",
    fontSize: 11,
  },
  group: {
    fillColor: "#1a237e",
    strokeColor: "#5c6bc0",
    fontColor: "#c5cae9",
    fontSize: 13,
    dashed: true,
  },
  palette: ["#283593", "#1565C0", "#00838F", "#2E7D32", "#F57F17", "#BF360C"],
};

const pastel: Theme = {
  name: "pastel",
  background: "#ffffff",
  node: {
    fillColor: "#B3E5FC",
    strokeColor: "#81D4FA",
    fontColor: "#37474F",
    fontSize: 12,
    fontFamily: "Helvetica",
    rounded: true,
    shadow: false,
  },
  edge: {
    strokeColor: "#90A4AE",
    strokeWidth: 1,
    fontColor: "#546E7A",
    fontSize: 11,
  },
  group: {
    fillColor: "#F3E5F5",
    strokeColor: "#CE93D8",
    fontColor: "#4A148C",
    fontSize: 13,
    dashed: true,
  },
  palette: ["#B3E5FC", "#C8E6C9", "#FFF9C4", "#FFCDD2", "#E1BEE7", "#D1C4E9"],
};

const themes: Record<ThemeNameType, Theme> = {
  professional,
  colorful,
  monochrome,
  blueprint,
  pastel,
};

export function getTheme(name: ThemeNameType): Theme {
  return themes[name];
}

export function listThemes(): Theme[] {
  return Object.values(themes);
}
