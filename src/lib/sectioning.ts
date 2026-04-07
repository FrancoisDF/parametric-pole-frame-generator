import { poleCount, plateSize, type Params } from './schema.js';

export interface Section {
  rowIdx: number; // 0-based row index (label row = rowIdx + 1)
  colIdx: number; // 0-based col index (label col = colIdx + 1)
  iMin: number; // pole x-index start (inclusive)
  iMax: number; // pole x-index end (inclusive)
  jMin: number; // pole z-index start (inclusive)
  jMax: number; // pole z-index end (inclusive)
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
 * Calculates the array of sections for the current params.
 */
export function calculateSections(params: Params): Section[] {
  const n = poleCount(params);
  const ns = numSectionsPerSide(params);
  const polesPerSection = Math.ceil(n / ns);
  const sections: Section[] = [];

  for (let sRow = 0; sRow < ns; sRow++) {
    for (let sCol = 0; sCol < ns; sCol++) {
      const iMin = sCol * polesPerSection;
      const iMax = Math.min((sCol + 1) * polesPerSection - 1, n - 1);
      const jMin = sRow * polesPerSection;
      const jMax = Math.min((sRow + 1) * polesPerSection - 1, n - 1);

      // Skip if pole range is empty (n < ns case)
      if (iMin >= n || jMin >= n) continue;

      sections.push({ rowIdx: sRow, colIdx: sCol, iMin, iMax, jMin, jMax });
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
