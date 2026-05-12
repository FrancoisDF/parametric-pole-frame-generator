import { plateSizeX, plateSizeZ, type Params } from './schema.js';
import { generatePolePositions } from './poleLayout.js';
import { numSectionsX, numSectionsZ, calculateSections, type Section } from './sectioning.js';

// CSS standard: 96 px per inch, 25.4 mm per inch → 1mm = 96/25.4 px
// Cricut Design Space (and most cutting software) treats raw SVG user-units as CSS pixels.
// By working in px internally and declaring width/height in mm, the physical size is correct.
const MM_TO_PX = 96 / 25.4;

function px(mm: number): number {
  return Math.round(mm * MM_TO_PX * 1000) / 1000;
}

function crossPathData(cx: number, cy: number, halfArm: number): string {
  return `M ${cx - halfArm},${cy} L ${cx + halfArm},${cy} M ${cx},${cy - halfArm} L ${cx},${cy + halfArm}`;
}

/**
 * Generates an SVG plan (2D top-view) of a section.
 * Shows pole positions as circles with 0.1mm offset for paper cutting.
 */
export function generateSVGPlan(section: Section, params: Params, useCross = false): string {
  const { poleDiameter } = params;

  const nsX = numSectionsX(params);
  const nsZ = numSectionsZ(params);
  const radius = poleDiameter / 2;
  const offsetRadius = radius + 0.4; // 0.4mm offset for physical pole fit
  const crossHalfArm = px((poleDiameter + 5) / 2);
  const halfPlateX = plateSizeX(params) / 2;
  const halfPlateZ = plateSizeZ(params) / 2;

  // Compute plate extent using the same logic as geometry.ts:
  // exterior edge → full plate boundary; interior edge → spatial split point
  const plateXMin = section.colIdx === 0 ? -halfPlateX : section.xMin;
  const plateXMax = section.colIdx === nsX - 1 ? halfPlateX : section.xMax;
  const plateZMin = section.rowIdx === 0 ? -halfPlateZ : section.zMin;
  const plateZMax = section.rowIdx === nsZ - 1 ? halfPlateZ : section.zMax;
  const plateW = plateXMax - plateXMin;
  const plateD = plateZMax - plateZMin;

  // Filter all layout positions to this section's bounds
  const allPositions = generatePolePositions(params);
  const sectionPositions = allPositions.filter(({ x, z }) => {
    const inX =
      section.colIdx === nsX - 1
        ? x >= section.xMin && x <= section.xMax
        : x >= section.xMin && x < section.xMax;
    const inZ =
      section.rowIdx === nsZ - 1
        ? z >= section.zMin && z <= section.zMax
        : z >= section.zMin && z < section.zMax;
    return inX && inZ;
  });

  // SVG dimensions with 10mm padding — converted to px for cutting software compatibility
  const padding = 10; // mm
  const svgWmm = plateW + 2 * padding;
  const svgHmm = plateD + 2 * padding;
  const svgW = px(svgWmm);
  const svgH = px(svgHmm);

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  // viewBox in px (so cutting software gets correct physical size), width/height in mm for human readability
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgWmm}mm" height="${svgHmm}mm">`
  );

  lines.push(`  <g transform="translate(${px(padding)}, ${px(padding)})">`);

  // Base plate outline
  lines.push(`    <!-- Original base plate (reference) -->`);
  lines.push(
    `    <rect x="0" y="0" width="${px(plateW)}" height="${px(plateD)}" fill="none" stroke="#000" stroke-width="${px(0.3)}"/>`
  );

  // Poles
  lines.push(`    <!-- Poles -->`);
  for (const { x, z } of sectionPositions) {
    const localX = px(x - plateXMin);
    const localZ = px(z - plateZMin);

    if (useCross) {
      lines.push(
        `    <path d="${crossPathData(localX, localZ, crossHalfArm)}" fill="none" stroke="#0066cc" stroke-width="${px(0.3)}" stroke-linecap="round"/>`
      );
    } else {
      lines.push(
        `    <circle cx="${localX}" cy="${localZ}" r="${px(offsetRadius)}" fill="none" stroke="#0066cc" stroke-width="${px(0.3)}" />`
      );
    }
  }

  lines.push(`  </g>`);
  lines.push(`</svg>`);

  return lines.join('\n');
}

/**
 * Generates a single SVG file containing all section plans arranged in a grid,
 * with 10mm (1cm) gaps between sections — ready to import into cutting software.
 */
export function generateCombinedSVGPlan(params: Params, useCross = false): string {
  const { poleDiameter } = params;

  const nsX = numSectionsX(params);
  const nsZ = numSectionsZ(params);
  const sections = calculateSections(params);
  const radius = poleDiameter / 2;
  const offsetRadius = radius + 0.4; // 0.4mm offset for physical pole fit
  const crossHalfArm = px((poleDiameter + 5) / 2);
  const halfPlateX = plateSizeX(params) / 2;
  const halfPlateZ = plateSizeZ(params) / 2;
  const gap = 10; // mm — 1cm gap between sections
  const padding = 10; // mm

  const allPositions = generatePolePositions(params);

  // Compute plate extents per section (same logic as generateSVGPlan)
  function plateBounds(section: Section) {
    const plateXMin = section.colIdx === 0 ? -halfPlateX : section.xMin;
    const plateXMax = section.colIdx === nsX - 1 ? halfPlateX : section.xMax;
    const plateZMin = section.rowIdx === 0 ? -halfPlateZ : section.zMin;
    const plateZMax = section.rowIdx === nsZ - 1 ? halfPlateZ : section.zMax;
    return {
      plateXMin,
      plateXMax,
      plateZMin,
      plateZMax,
      plateW: plateXMax - plateXMin,
      plateD: plateZMax - plateZMin
    };
  }

  // Compute column widths (from sections in row 0) and row heights (from sections in col 0)
  const colWidths: number[] = [];
  const rowHeights: number[] = [];
  for (let c = 0; c < nsX; c++) {
    const s = sections.find((sec) => sec.rowIdx === 0 && sec.colIdx === c)!;
    colWidths.push(plateBounds(s).plateW);
  }
  for (let r = 0; r < nsZ; r++) {
    const s = sections.find((sec) => sec.rowIdx === r && sec.colIdx === 0)!;
    rowHeights.push(plateBounds(s).plateD);
  }

  // Cumulative offsets for each column/row (in mm, converted to px when emitting)
  const colOffsets: number[] = [0];
  for (let c = 0; c < nsX - 1; c++) colOffsets.push(colOffsets[c] + colWidths[c] + gap);
  const rowOffsets: number[] = [0];
  for (let r = 0; r < nsZ - 1; r++) rowOffsets.push(rowOffsets[r] + rowHeights[r] + gap);

  const totalW = colOffsets[nsX - 1] + colWidths[nsX - 1];
  const totalH = rowOffsets[nsZ - 1] + rowHeights[nsZ - 1];
  const svgWmm = totalW + 2 * padding;
  const svgHmm = totalH + 2 * padding;
  const svgW = px(svgWmm);
  const svgH = px(svgHmm);

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  // viewBox in px (so cutting software gets correct physical size), width/height in mm for human readability
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgWmm}mm" height="${svgHmm}mm">`
  );
  lines.push(`  <g transform="translate(${px(padding)}, ${px(padding)})">`);

  for (const section of sections) {
    const { plateXMin, plateZMin, plateW, plateD } = plateBounds(section);
    const originX = px(colOffsets[section.colIdx]);
    const originY = px(rowOffsets[section.rowIdx]);

    lines.push(`    <!-- Section ${section.rowIdx + 1}.${section.colIdx + 1} -->`);
    lines.push(`    <g transform="translate(${originX}, ${originY})">`);

    // Base plate outline
    lines.push(
      `      <rect x="0" y="0" width="${px(plateW)}" height="${px(plateD)}" fill="none" stroke="#000" stroke-width="${px(0.3)}"/>`
    );

    // Section label
    lines.push(
      `      <text x="${px(plateW / 2)}" y="${px(plateD + 4)}" text-anchor="middle" font-size="${px(3)}" fill="#666">${section.rowIdx + 1}.${section.colIdx + 1}</text>`
    );

    // Filter poles for this section
    const sectionPositions = allPositions.filter(({ x, z }) => {
      const inX =
        section.colIdx === nsX - 1
          ? x >= section.xMin && x <= section.xMax
          : x >= section.xMin && x < section.xMax;
      const inZ =
        section.rowIdx === nsZ - 1
          ? z >= section.zMin && z <= section.zMax
          : z >= section.zMin && z < section.zMax;
      return inX && inZ;
    });

    // Draw poles
    for (const { x, z } of sectionPositions) {
      const localX = px(x - plateXMin);
      const localZ = px(z - plateZMin);
      if (useCross) {
        lines.push(
          `      <path d="${crossPathData(localX, localZ, crossHalfArm)}" fill="none" stroke="#0066cc" stroke-width="${px(0.3)}" stroke-linecap="round"/>`
        );
      } else {
        lines.push(
          `      <circle cx="${localX}" cy="${localZ}" r="${px(offsetRadius)}" fill="none" stroke="#0066cc" stroke-width="${px(0.3)}" />`
        );
      }
    }

    lines.push(`    </g>`);
  }

  lines.push(`  </g>`);
  lines.push(`</svg>`);

  return lines.join('\n');
}
