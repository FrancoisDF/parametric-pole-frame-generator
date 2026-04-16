import { plateSize, type Params } from './schema.js';
import { poleHeightFromWorld } from './heightFunctions.js';
import { generatePolePositions } from './poleLayout.js';
import { numSectionsPerSide, type Section } from './sectioning.js';

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
    gridSize
  } = params;

  const ns = numSectionsPerSide(params);
  const radius = poleDiameter / 2;
  const offsetRadius = radius + 0.1; // 0.1mm offset for paper cutting
  const halfPlate = plateSize(params) / 2;
  const half = gridSize / 2;

  // Compute plate extent using the same logic as geometry.ts:
  // exterior edge → full plate boundary; interior edge → spatial split point
  const plateXMin = section.colIdx === 0 ? -halfPlate : section.xMin;
  const plateXMax = section.colIdx === ns - 1 ? halfPlate : section.xMax;
  const plateZMin = section.rowIdx === 0 ? -halfPlate : section.zMin;
  const plateZMax = section.rowIdx === ns - 1 ? halfPlate : section.zMax;
  const plateW = plateXMax - plateXMin;
  const plateD = plateZMax - plateZMin;

  // Filter all layout positions to this section's bounds
  const allPositions = generatePolePositions(params);
  const sectionPositions = allPositions.filter(({ x, z }) => {
    const inX =
      section.colIdx === ns - 1
        ? x >= section.xMin && x <= section.xMax
        : x >= section.xMin && x < section.xMax;
    const inZ =
      section.rowIdx === ns - 1
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

    const h = poleHeightFromWorld(x, z, half, heightFunction, waveFrequency, minHeight, maxHeight);

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
