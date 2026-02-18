// ABOUTME: CLI entry point for drawio-claude.
// ABOUTME: Parses commands and delegates to core modules.

import { Command } from "commander";
import { readFile, writeFile } from "fs/promises";
import { validateInput } from "./schema/validate.js";
import { buildGraph } from "./core/graph-builder.js";
import { computeLayout } from "./layout/elk-layout.js";
import { validateDrawioXml } from "./core/xml-validator.js";
import { exportDrawio, exportDrawioToFile } from "./export/drawio-exporter.js";
import { exportDrawioSvg, exportDrawioSvgToFile } from "./export/svg-exporter.js";
import { listShapes, listCategories } from "./shapes/registry.js";
import { listThemes } from "./themes/index.js";
import { DiagramSchema } from "./schema/graph.js";

const program = new Command();

program
  .name("drawio-claude")
  .description(
    "Generate professional draw.io diagrams from JSON graph descriptions.\n\n" +
      "Examples:\n" +
      '  echo \'{"nodes":[{"id":"a","label":"Hello"}]}\' | drawio-claude generate -o hello.drawio.svg\n' +
      "  drawio-claude generate input.json -o diagram.drawio.svg\n" +
      "  drawio-claude shapes flowchart\n" +
      "  drawio-claude themes"
  )
  .version("0.1.0");

// === generate ===
program
  .command("generate [input]")
  .description(
    "Generate a draw.io diagram from a JSON graph description.\n\n" +
      "  Input can be a file path or piped via stdin.\n" +
      "  Output format is determined by the -o file extension (.drawio.svg or .drawio).\n\n" +
      "  Examples:\n" +
      "    drawio-claude generate input.json -o diagram.drawio.svg\n" +
      "    cat input.json | drawio-claude generate -o output.drawio\n" +
      "    drawio-claude generate input.json --stdout --format drawio"
  )
  .option("-o, --output <path>", "Output file path")
  .option("--stdout", "Write output to stdout instead of a file")
  .option(
    "-f, --format <format>",
    "Output format: drawio-svg (default) or drawio",
    "drawio-svg"
  )
  .option("--json", "Output result as JSON (for machine consumption)")
  .action(async (inputPath: string | undefined, options) => {
    try {
      const jsonStr = await readInput(inputPath);
      const parsed = JSON.parse(jsonStr);
      const validation = validateInput(parsed);

      if (!validation.ok) {
        if (options.json) {
          console.log(JSON.stringify({ error: true, errors: validation.errors }));
        } else {
          console.error("Validation errors:");
          for (const err of validation.errors) {
            console.error(`  - ${err}`);
          }
        }
        process.exit(1);
      }

      const diagram = validation.diagram;
      const graph = buildGraph(diagram);
      const laid = await computeLayout(graph, diagram.layout);

      // Determine format
      const format = resolveFormat(options.format, options.output);

      let output: string;
      if (format === "drawio") {
        output = exportDrawio(laid);
      } else {
        output = exportDrawioSvg(laid);
      }

      // Validate the generated XML
      const xmlValidation = validateDrawioXml(
        format === "drawio" ? output : exportDrawio(laid)
      );
      if (!xmlValidation.valid) {
        console.error("Generated XML has validation errors (this is a bug):");
        for (const err of xmlValidation.errors) {
          console.error(`  - ${err}`);
        }
        process.exit(2);
      }

      if (options.stdout) {
        process.stdout.write(output);
      } else if (options.output) {
        await writeFile(options.output, output, "utf-8");
        if (options.json) {
          console.log(
            JSON.stringify({
              success: true,
              output: options.output,
              format,
              nodes: diagram.nodes.length,
              edges: diagram.edges.length,
            })
          );
        } else {
          console.log(`Written to ${options.output} (${diagram.nodes.length} nodes, ${diagram.edges.length} edges)`);
        }
      } else {
        // No output specified — write to stdout
        process.stdout.write(output);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (options.json) {
        console.log(JSON.stringify({ error: true, message }));
      } else {
        console.error(`Error: ${message}`);
      }
      process.exit(1);
    }
  });

// === validate ===
program
  .command("validate <input>")
  .description(
    "Validate an existing .drawio file against known error patterns.\n\n" +
      "  Examples:\n" +
      "    drawio-claude validate diagram.drawio"
  )
  .option("--json", "Output result as JSON")
  .action(async (inputPath: string, options) => {
    try {
      const xml = await readFile(inputPath, "utf-8");
      const result = validateDrawioXml(xml);

      if (options.json) {
        console.log(JSON.stringify(result));
      } else {
        if (result.valid) {
          console.log("Valid draw.io XML");
        } else {
          console.error("Validation errors:");
          for (const err of result.errors) {
            console.error(`  - ${err}`);
          }
        }
        if (result.warnings.length > 0) {
          console.warn("Warnings:");
          for (const warn of result.warnings) {
            console.warn(`  - ${warn}`);
          }
        }
      }

      process.exit(result.valid ? 0 : 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

// === shapes ===
program
  .command("shapes [category]")
  .description(
    "List available shape types.\n\n" +
      "  Without a category, lists all categories.\n" +
      "  With a category, lists all shapes in that category.\n\n" +
      "  Examples:\n" +
      "    drawio-claude shapes\n" +
      "    drawio-claude shapes flowchart\n" +
      "    drawio-claude shapes aws"
  )
  .option("--json", "Output as JSON")
  .action((category: string | undefined, options) => {
    if (!category) {
      const categories = listCategories();
      if (options.json) {
        console.log(JSON.stringify({ categories }));
      } else {
        console.log("Available shape categories:");
        for (const cat of categories) {
          const shapes = listShapes(cat);
          console.log(`  ${cat} (${Object.keys(shapes).length} shapes)`);
        }
      }
    } else {
      const shapes = listShapes(category);
      if (Object.keys(shapes).length === 0) {
        const categories = listCategories();
        console.error(
          `Unknown category "${category}". Available: ${categories.join(", ")}`
        );
        process.exit(1);
      }
      if (options.json) {
        console.log(JSON.stringify({ category, shapes }));
      } else {
        console.log(`Shapes in "${category}":`);
        for (const [name] of Object.entries(shapes)) {
          console.log(`  ${name}`);
        }
      }
    }
  });

// === themes ===
program
  .command("themes")
  .description(
    "List available built-in themes.\n\n" +
      "  Examples:\n" +
      "    drawio-claude themes"
  )
  .option("--json", "Output as JSON")
  .action((options) => {
    const themes = listThemes();
    if (options.json) {
      console.log(JSON.stringify({ themes: themes.map((t) => ({ name: t.name, background: t.background })) }));
    } else {
      console.log("Available themes:");
      for (const theme of themes) {
        console.log(`  ${theme.name} (background: ${theme.background})`);
      }
    }
  });

// === schema ===
program
  .command("schema")
  .description(
    "Output the JSON input schema for diagram generation.\n\n" +
      "  Useful for agents/LLMs to understand the expected input format.\n\n" +
      "  Examples:\n" +
      "    drawio-claude schema"
  )
  .action(() => {
    const schema = JSON.stringify(DiagramSchema, null, 2);
    console.log(schema);
  });

program.parse();

// === Helpers ===

async function readInput(filePath?: string): Promise<string> {
  if (filePath) {
    return readFile(filePath, "utf-8");
  }

  // Read from stdin
  if (process.stdin.isTTY) {
    throw new Error(
      "No input file provided and stdin is a terminal.\n" +
        "Usage: drawio-claude generate <input.json> -o <output>\n" +
        '   or: echo \'{"nodes":[...]}\' | drawio-claude generate -o <output>'
    );
  }

  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk: string) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function resolveFormat(
  formatFlag: string,
  outputPath?: string
): "drawio-svg" | "drawio" {
  if (outputPath?.endsWith(".drawio.svg")) return "drawio-svg";
  if (outputPath?.endsWith(".drawio")) return "drawio";
  if (formatFlag === "drawio") return "drawio";
  return "drawio-svg";
}
