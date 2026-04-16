import { poleCount, type Params } from './schema.js';
import { poleHeight } from './heightFunctions.js';
import type { Section } from './sectioning.js';

/**
 * Generates an SVG plan (2D top-view) of a section.
 * Shows pole positions as circles with 0.1mm offset for paper cutting.
 * Each pole is represented with a circle that's 0.1mm larger than physical diameter.
 */
export function generateSVGPlan(section: Section, params: Params): string {
  const {
    spacing,
    poleDiameter,
    baseHeight,
    baseMargin,
    heightFunction,
    waveFrequency,
    minHeight,
    maxHeight
  } = params;

  const n = poleCount(params);
  const radius = poleDiameter / 2;
  const offsetRadius = radius + 0.1; // 0.1mm offset for paper cutting
  const baseOffsetMargin = baseMargin + 0.1; // 0.1mm offset on edges

  // Section base plate dimensions
  const plateW = (section.iMax - section.iMin) * spacing + poleDiameter + 2 * baseMargin;
  const plateD = (section.jMax - section.jMin) * spacing + poleDiameter + 2 * baseMargin;

  // SVG dimensions with 10mm padding for label space
  const padding = 10;
  const svgW = plateW + 2 * padding;
  const svgH = plateD + 2 * padding + 20; // Extra space for label

  // Build SVG content
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}mm" height="${svgH}mm">`
  );

  // Title/label at top
  const label = `Section ${section.rowIdx + 1}.${section.colIdx + 1}`;
  lines.push(`  <text x="${svgW / 2}" y="${padding - 2}" text-anchor="middle" font-size="8" font-weight="bold" fill="#000">${label}</text>`);

  // Group for the plan (offset by padding)
  lines.push(`  <g transform="translate(${padding}, ${padding + 15})">`);

  // Base plate outline with offset
  lines.push(`    <!-- Base plate outline (offset by 0.1mm) -->`);
  lines.push(
    `    <rect x="${-baseOffsetMargin}" y="${-baseOffsetMargin}" width="${plateW + 2 * baseOffsetMargin}" height="${plateD + 2 * baseOffsetMargin}" ` +
      `fill="none" stroke="#999" stroke-width="0.5" stroke-dasharray="1,1"/>`
  );

  // Original base plate (reference)
  lines.push(`    <!-- Original base plate (reference) -->`);
  lines.push(`    <rect x="0" y="0" width="${plateW}" height="${plateD}" fill="none" stroke="#000" stroke-width="0.3"/>`);

  // Poles
  lines.push(`    <!-- Poles (with 0.1mm offset) -->`);
  for (let j = section.jMin; j <= section.jMax; j++) {
    for (let i = section.iMin; i <= section.iMax; i++) {
      // Local position relative to section
      const localX = (i - section.iMin) * spacing + radius + baseMargin;
      const localZ = (j - section.jMin) * spacing + radius + baseMargin;

      // Get pole height for visualization (optional, shown as circle radius variation or label)
      const h = poleHeight(i, j, n, heightFunction, waveFrequency, minHeight, maxHeight);

      // Draw pole circle with offset
      lines.push(
        `    <circle cx="${localX}" cy="${localZ}" r="${offsetRadius}" fill="none" stroke="#0066cc" stroke-width="0.3" />`
      );

      // Add pole label (grid position)
      lines.push(
        `    <text x="${localX}" y="${localZ + 1}" text-anchor="middle" font-size="2" fill="#0066cc">${i + 1},${j + 1}</text>`
      );

      // Optional: add height indicator as circle color/opacity if height varies significantly
      const heightPercent = (h - minHeight) / (maxHeight - minHeight);
      if (heightFunction !== 'flat' && heightPercent > 0) {
        const opacity = 0.3 + heightPercent * 0.3; // Vary opacity based on height
        lines.push(
          `    <circle cx="${localX}" cy="${localZ}" r="${offsetRadius * 0.6}" fill="#0066cc" opacity="${opacity.toFixed(2)}" />`
        );
      }
    }
  }

  // Scale reference
  lines.push(`    <!-- Scale reference: 1mm = 1 SVG unit -->`);
  lines.push(`    <text x="0" y="${plateD + baseOffsetMargin + 8}" font-size="6" fill="#666">Scale: 1mm = 1 unit</text>`);

  // Dimensions
  lines.push(`    <!-- Dimensions -->`);
  lines.push(
    `    <text x="${plateW / 2}" y="${plateD + baseOffsetMargin + 8}" text-anchor="middle" font-size="6" fill="#666">${plateW.toFixed(1)}mm × ${plateD.toFixed(1)}mm</text>`
  );

  lines.push(`  </g>`);
  lines.push(`</svg>`);

  return lines.join('\n');
}
