import { poleCount, type Params } from './schema.js';
import { poleHeight } from './heightFunctions.js';
import { numSectionsPerSide, type Section } from './sectioning.js';

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
  const ns = numSectionsPerSide(params);
  const radius = poleDiameter / 2;
  const offsetRadius = radius + 0.1; // 0.1mm offset for paper cutting

  // Mirror the same interior/exterior offset logic used in geometry.ts:
  // exterior sides keep the full margin; interior (shared) sides use spacing/2.
  const outerOffset = radius + baseMargin;
  const innerOffset = spacing / 2;
  const leftOffset  = section.colIdx === 0      ? outerOffset : innerOffset;
  const rightOffset = section.colIdx === ns - 1  ? outerOffset : innerOffset;
  const frontOffset = section.rowIdx === 0      ? outerOffset : innerOffset;
  const backOffset  = section.rowIdx === ns - 1  ? outerOffset : innerOffset;

  // Section base plate dimensions
  const plateW = leftOffset + (section.iMax - section.iMin) * spacing + rightOffset;
  const plateD = frontOffset + (section.jMax - section.jMin) * spacing + backOffset;

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
      const localX = leftOffset + (i - section.iMin) * spacing;
      const localZ = frontOffset + (j - section.jMin) * spacing;

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
