import { poleCountX, poleCountZ, plateSizeX, plateSizeZ, type Params } from './schema.js';

export interface Section {
  rowIdx: number; // 0-based row index (label row = rowIdx + 1)
  colIdx: number; // 0-based col index (label col = colIdx + 1)
  xMin: number;   // world-space x lower bound for pole filtering (inclusive)
  xMax: number;   // world-space x upper bound (exclusive except for the last column)
  zMin: number;   // world-space z lower bound (inclusive)
  zMax: number;   // world-space z upper bound (exclusive except for the last row)
}

/**
 * Returns how many sections along the X axis will be created.
 */
export function numSectionsX(params: Params): number {
  if (!params.splitEnabled) return 1;

  if (params.splitMode === 'printer') {
    return Math.max(1, Math.ceil(plateSizeX(params) / params.printerSize));
  }

  return Math.max(1, params.splitGridCount);
}

/**
 * Returns how many sections along the Z axis will be created.
 */
export function numSectionsZ(params: Params): number {
  if (!params.splitEnabled) return 1;

  if (params.splitMode === 'printer') {
    return Math.max(1, Math.ceil(plateSizeZ(params) / params.printerSize));
  }

  return Math.max(1, params.splitGridCount);
}

/**
 * Computes ns-1 spatial split points along one axis, placed halfway between
 * consecutive poles at the section seams (grid-equivalent spacing).
 * This ensures seam plates join flush regardless of the pole layout mode.
 */
function computeSplitPoints(nPoles: number, ns: number, spacing: number): number[] {
  const polesPerSection = Math.ceil(nPoles / ns);
  const splits: number[] = [];

  for (let k = 1; k < ns; k++) {
    const iMax = Math.min(k * polesPerSection - 1, nPoles - 1);
    const worldCoord = (iMax - (nPoles - 1) / 2) * spacing + spacing / 2;
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
  const nsX = numSectionsX(params);
  const nsZ = numSectionsZ(params);
  const halfX = params.gridWidth / 2;
  const halfZ = params.gridHeight / 2;

  const innerSplitsX = computeSplitPoints(poleCountX(params), nsX, params.spacing);
  const innerSplitsZ = computeSplitPoints(poleCountZ(params), nsZ, params.spacing);

  const xSplits = [-halfX, ...innerSplitsX, halfX];
  const zSplits = [-halfZ, ...innerSplitsZ, halfZ];

  const sections: Section[] = [];

  for (let sRow = 0; sRow < nsZ; sRow++) {
    for (let sCol = 0; sCol < nsX; sCol++) {
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
 * Estimated physical width of a section's base plate in mm (X axis).
 */
export function sectionPhysicalSizeX(params: Params): number {
  return plateSizeX(params) / numSectionsX(params);
}

/**
 * Estimated physical depth of a section's base plate in mm (Z axis).
 */
export function sectionPhysicalSizeZ(params: Params): number {
  return plateSizeZ(params) / numSectionsZ(params);
}
