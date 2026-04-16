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
  const svgH = plateD + 2 * padding;

  // Build SVG content
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}mm" height="${svgH}mm">`
  );

  // Group for the plan (offset by padding)
  lines.push(`  <g transform="translate(${padding}, ${padding})">`);

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

  lines.push(`  </g>`);
  lines.push(`</svg>`);

  return lines.join('\n');
}
