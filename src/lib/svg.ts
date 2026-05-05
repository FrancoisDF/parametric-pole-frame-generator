import { plateSizeX, plateSizeZ, type Params } from './schema.js';
import { poleHeightFromWorld } from './heightFunctions.js';
import { generatePolePositions } from './poleLayout.js';
import { numSectionsX, numSectionsZ, calculateSections, type Section } from './sectioning.js';

/**
 * Generates an SVG plan (2D top-view) of a section.
 * Shows pole positions as circles with 0.1mm offset for paper cutting.
 */
export function generateSVGPlan(section: Section, params: Params): string {
  const {
    poleDiameter,
    heightFunction,
    waveFrequency,
    minHeight,
    maxHeight,
    gridWidth,
    gridHeight
  } = params;

  const nsX = numSectionsX(params);
  const nsZ = numSectionsZ(params);
  const radius = poleDiameter / 2;
  const offsetRadius = radius + 0.1; // 0.1mm offset for paper cutting
  const halfPlateX = plateSizeX(params) / 2;
  const halfPlateZ = plateSizeZ(params) / 2;
  const halfX = gridWidth / 2;
  const halfZ = gridHeight / 2;

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

  // SVG dimensions with 10mm padding for label space
  const padding = 10;
  const svgW = plateW + 2 * padding;
  const svgH = plateD + 2 * padding;

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}mm" height="${svgH}mm">`
  );

  lines.push(`  <g transform="translate(${padding}, ${padding})">`);

  // Base plate outline
  lines.push(`    <!-- Original base plate (reference) -->`);
  lines.push(
    `    <rect x="0" y="0" width="${plateW}" height="${plateD}" fill="none" stroke="#000" stroke-width="0.3"/>`
  );

  // Poles
  lines.push(`    <!-- Poles (with 0.1mm offset) -->`);
  for (const { x, z } of sectionPositions) {
    const localX = x - plateXMin;
    const localZ = z - plateZMin;

    const h = poleHeightFromWorld(x, z, halfX, halfZ, heightFunction, waveFrequency, minHeight, maxHeight);

    lines.push(
      `    <circle cx="${localX}" cy="${localZ}" r="${offsetRadius}" fill="none" stroke="#0066cc" stroke-width="0.3" />`
    );

    const heightPercent = maxHeight > minHeight ? (h - minHeight) / (maxHeight - minHeight) : 0;
    if (heightFunction !== 'flat' && heightPercent > 0) {
      const opacity = 0.3 + heightPercent * 0.3;
      lines.push(
        `    <circle cx="${localX}" cy="${localZ}" r="${offsetRadius * 0.6}" fill="#0066cc" opacity="${opacity.toFixed(2)}" />`
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
export function generateCombinedSVGPlan(params: Params): string {
  const {
    poleDiameter,
    heightFunction,
    waveFrequency,
    minHeight,
    maxHeight,
    gridWidth,
    gridHeight
  } = params;

  const nsX = numSectionsX(params);
  const nsZ = numSectionsZ(params);
  const sections = calculateSections(params);
  const radius = poleDiameter / 2;
  const offsetRadius = radius + 0.1;
  const halfPlateX = plateSizeX(params) / 2;
  const halfPlateZ = plateSizeZ(params) / 2;
  const halfX = gridWidth / 2;
  const halfZ = gridHeight / 2;
  const gap = 10; // 1cm gap between sections
  const padding = 10;

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

  // Cumulative offsets for each column/row
  const colOffsets: number[] = [0];
  for (let c = 0; c < nsX - 1; c++) colOffsets.push(colOffsets[c] + colWidths[c] + gap);
  const rowOffsets: number[] = [0];
  for (let r = 0; r < nsZ - 1; r++) rowOffsets.push(rowOffsets[r] + rowHeights[r] + gap);

  const totalW = colOffsets[nsX - 1] + colWidths[nsX - 1];
  const totalH = rowOffsets[nsZ - 1] + rowHeights[nsZ - 1];
  const svgW = totalW + 2 * padding;
  const svgH = totalH + 2 * padding;

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}mm" height="${svgH}mm">`
  );
  lines.push(`  <g transform="translate(${padding}, ${padding})">`);

  for (const section of sections) {
    const { plateXMin, plateZMin, plateW, plateD } = plateBounds(section);
    const originX = colOffsets[section.colIdx];
    const originY = rowOffsets[section.rowIdx];

    lines.push(`    <!-- Section ${section.rowIdx + 1}.${section.colIdx + 1} -->`);
    lines.push(`    <g transform="translate(${originX}, ${originY})">`);

    // Base plate outline
    lines.push(
      `      <rect x="0" y="0" width="${plateW}" height="${plateD}" fill="none" stroke="#000" stroke-width="0.3"/>`
    );

    // Section label
    lines.push(
      `      <text x="${plateW / 2}" y="${plateD + 4}" text-anchor="middle" font-size="3" fill="#666">${section.rowIdx + 1}.${section.colIdx + 1}</text>`
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
      const localX = x - plateXMin;
      const localZ = z - plateZMin;
      const h = poleHeightFromWorld(x, z, halfX, halfZ, heightFunction, waveFrequency, minHeight, maxHeight);

      lines.push(
        `      <circle cx="${localX}" cy="${localZ}" r="${offsetRadius}" fill="none" stroke="#0066cc" stroke-width="0.3" />`
      );

      const heightPercent = maxHeight > minHeight ? (h - minHeight) / (maxHeight - minHeight) : 0;
      if (heightFunction !== 'flat' && heightPercent > 0) {
        const opacity = 0.3 + heightPercent * 0.3;
        lines.push(
          `      <circle cx="${localX}" cy="${localZ}" r="${offsetRadius * 0.6}" fill="#0066cc" opacity="${opacity.toFixed(2)}" />`
        );
      }
    }

    lines.push(`    </g>`);
  }

  lines.push(`  </g>`);
  lines.push(`</svg>`);

  return lines.join('\n');
}
