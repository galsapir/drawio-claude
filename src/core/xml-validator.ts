// ABOUTME: Validates generated draw.io XML against known error patterns.
// ABOUTME: Checks foundation cells, edge refs, geometry, style strings, and XML structure.

export interface XmlValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDrawioXml(xml: string): XmlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check for mxfile wrapper
  if (!xml.includes("<mxfile")) {
    errors.push("Missing <mxfile> wrapper element");
  }

  // 2. Check for foundation cells
  if (!xml.includes('id="0"')) {
    errors.push('Missing foundation cell id="0" (root cell)');
  }
  if (!xml.includes('id="1"') || !xml.includes('parent="0"')) {
    errors.push('Missing foundation cell id="1" with parent="0" (default layer)');
  }

  // 3. Check that all vertices have geometry
  const vertexMatches = xml.matchAll(/<mxCell[^>]*vertex="1"[^>]*>/g);
  for (const match of vertexMatches) {
    const cellStr = match[0];
    const idMatch = cellStr.match(/id="([^"]+)"/);
    const cellId = idMatch?.[1] ?? "unknown";

    // Find the closing tag and check for geometry
    const startIdx = xml.indexOf(cellStr);
    const closingIdx = xml.indexOf("</mxCell>", startIdx);
    const cellBlock = xml.substring(startIdx, closingIdx + 9);

    if (!cellBlock.includes("<mxGeometry")) {
      errors.push(`Vertex cell id="${cellId}" is missing <mxGeometry> element`);
    }
    if (!cellBlock.includes('as="geometry"')) {
      errors.push(`Vertex cell id="${cellId}" geometry is missing as="geometry" attribute`);
    }
  }

  // 4. Check that all edges have relative geometry
  const edgeMatches = xml.matchAll(/<mxCell[^>]*edge="1"[^>]*>/g);
  for (const match of edgeMatches) {
    const cellStr = match[0];
    const idMatch = cellStr.match(/id="([^"]+)"/);
    const cellId = idMatch?.[1] ?? "unknown";

    // Check for source and target
    if (!cellStr.includes("source=")) {
      errors.push(`Edge cell id="${cellId}" is missing source attribute`);
    }
    if (!cellStr.includes("target=")) {
      errors.push(`Edge cell id="${cellId}" is missing target attribute`);
    }

    // Check for relative geometry
    const startIdx = xml.indexOf(cellStr);
    const closingIdx = xml.indexOf("</mxCell>", startIdx);
    const cellBlock = xml.substring(startIdx, closingIdx + 9);

    if (!cellBlock.includes('relative="1"')) {
      errors.push(`Edge cell id="${cellId}" geometry is missing relative="1" attribute`);
    }
  }

  // 5. Collect all defined cell IDs
  const allIds = new Set<string>();
  const idMatches = xml.matchAll(/<mxCell[^>]*id="([^"]+)"[^>]*/g);
  for (const match of idMatches) {
    allIds.add(match[1]);
  }

  // 6. Verify edge source/target references exist
  const edgeRefMatches = xml.matchAll(
    /<mxCell[^>]*edge="1"[^>]*source="([^"]+)"[^>]*target="([^"]+)"[^>]*/g
  );
  for (const match of edgeRefMatches) {
    if (!allIds.has(match[1])) {
      errors.push(`Edge references non-existent source id="${match[1]}"`);
    }
    if (!allIds.has(match[2])) {
      errors.push(`Edge references non-existent target id="${match[2]}"`);
    }
  }

  // Also check reverse attribute order (target before source)
  const edgeRefMatches2 = xml.matchAll(
    /<mxCell[^>]*edge="1"[^>]*target="([^"]+)"[^>]*source="([^"]+)"[^>]*/g
  );
  for (const match of edgeRefMatches2) {
    if (!allIds.has(match[2])) {
      errors.push(`Edge references non-existent source id="${match[2]}"`);
    }
    if (!allIds.has(match[1])) {
      errors.push(`Edge references non-existent target id="${match[1]}"`);
    }
  }

  // 7. Check for common style string errors
  const styleMatches = xml.matchAll(/style="([^"]+)"/g);
  for (const match of styleMatches) {
    const style = match[1];

    // CSS-style names instead of draw.io names
    if (style.includes("background-color")) {
      warnings.push("Style contains CSS 'background-color' — use 'fillColor' instead");
    }
    if (style.includes("border-color")) {
      warnings.push("Style contains CSS 'border-color' — use 'strokeColor' instead");
    }
    if (style.includes("font-size")) {
      warnings.push("Style contains CSS 'font-size' — use 'fontSize' instead");
    }

    // Quoted hex values inside style string
    if (style.match(/'#[0-9a-fA-F]+'/)) {
      warnings.push("Style contains quoted hex color — hex values should not be quoted inside style strings");
    }
  }

  // 8. Check for XML escaping issues
  // Look for unescaped ampersands in attribute values (but not XML entities)
  const attrValues = xml.matchAll(/="([^"]+)"/g);
  for (const match of attrValues) {
    const val = match[1];
    // Find bare & not followed by amp; lt; gt; quot; apos; or #
    if (val.match(/&(?!amp;|lt;|gt;|quot;|apos;|#)/)) {
      warnings.push(`Possible unescaped ampersand in attribute value: "${val.substring(0, 50)}..."`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
