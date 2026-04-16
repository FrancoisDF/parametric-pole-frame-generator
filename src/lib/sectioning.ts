import { poleCount, plateSize, type Params } from './schema.js';

export interface Section {
  rowIdx: number; // 0-based row index (label row = rowIdx + 1)
  colIdx: number; // 0-based col index (label col = colIdx + 1)
  xMin: number;   // world-space x lower bound for pole filtering (inclusive)
  xMax: number;   // world-space x upper bound (exclusive except for the last column)
  zMin: number;   // world-space z lower bound (inclusive)
  zMax: number;   // world-space z upper bound (exclusive except for the last row)
}

/**
 * Returns how many sections per side will be created.
 */
export function numSectionsPerSide(params: Params): number {
  if (!params.splitEnabled) return 1;

  if (params.splitMode === 'printer') {
    const physical = plateSize(params);
    return Math.max(1, Math.ceil(physical / params.printerSize));
  }

  return Math.max(1, params.splitGridCount);
}

/**
 * Computes ns-1 spatial split points along one axis, placed halfway between
 * consecutive poles at the section seams (grid-equivalent spacing).
 * This ensures seam plates join flush regardless of the pole layout mode.
 */
function computeSplitPoints(params: Params, ns: number): number[] {
  const n = poleCount(params);
  const { spacing } = params;
  const polesPerSection = Math.ceil(n / ns);
  const splits: number[] = [];

  for (let k = 1; k < ns; k++) {
    const iMax = Math.min(k * polesPerSection - 1, n - 1);
    const worldCoord = (iMax - (n - 1) / 2) * spacing + spacing / 2;
    splits.push(worldCoord);
  }

  return splits;
}

/**
 * Calculates the array of spatial sections for the current params.
 * Each section stores world-space bounds used for pole filtering and
 * plate-edge computation in geometry building.
 */
export function calculateSections(params: Params): Section[] {
  const ns = numSectionsPerSide(params);
  const half = params.gridSize / 2;

  // Build split-point arrays including the outer boundaries
  const innerSplits = computeSplitPoints(params, ns);
  const xSplits = [-half, ...innerSplits, half];
  const zSplits = [-half, ...innerSplits, half];

  const sections: Section[] = [];

  for (let sRow = 0; sRow < ns; sRow++) {
    for (let sCol = 0; sCol < ns; sCol++) {
      sections.push({
        rowIdx: sRow,
        colIdx: sCol,
        xMin: xSplits[sCol],
        xMax: xSplits[sCol + 1],
        zMin: zSplits[sRow],
        zMax: zSplits[sRow + 1]
      });
    }
  }

  return sections;
}

/**
 * Returns the human-readable label for a section, e.g. "1.1", "2.3".
 */
export function sectionLabel(section: Section): string {
  return `${section.rowIdx + 1}.${section.colIdx + 1}`;
}

/**
 * Estimated physical width of a section's base plate in mm.
 */
export function sectionPhysicalSize(params: Params): number {
  const ns = numSectionsPerSide(params);
  return plateSize(params) / ns;
}
