import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { plateSize, type Params } from './schema.js';
import { poleHeight } from './heightFunctions.js';

/**
 * Builds a merged, watertight-ish BufferGeometry for STL export.
 * The base plate and every pole are individual geometries, translated
 * into world-space positions, then merged into one.
 *
 * Coordinate system: Y-up, all values in mm.
 *   - Base plate sits at Y = 0 → Y = baseHeight
 *   - Poles sit on top: Y = baseHeight → Y = baseHeight + poleHeight
 */
export function buildExportGeometry(params: Params): THREE.BufferGeometry {
  const {
    gridSize,
    spacing,
    poleDiameter,
    poleShape,
    minHeight,
    maxHeight,
    baseHeight,
    heightFunction,
    waveFrequency
  } = params;

  const pw = plateSize(params);
  const geometries: THREE.BufferGeometry[] = [];

  // ── Base plate ────────────────────────────────────────────────────────────
  const baseGeo = new THREE.BoxGeometry(pw, baseHeight, pw);
  baseGeo.translate(0, baseHeight / 2, 0);
  geometries.push(baseGeo);

  // ── Poles ──────────────────────────────────────────────────────────────────
  const radius = poleDiameter / 2;

  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      const h = poleHeight(i, j, gridSize, heightFunction, waveFrequency, minHeight, maxHeight);

      const x = (i - (gridSize - 1) / 2) * spacing;
      const z = (j - (gridSize - 1) / 2) * spacing;
      const y = baseHeight + h / 2; // centre of the cylinder

      let poleGeo: THREE.CylinderGeometry;

      if (poleShape === 'tapered') {
        poleGeo = new THREE.CylinderGeometry(radius * 0.3, radius, h, 8, 1);
      } else {
        poleGeo = new THREE.CylinderGeometry(radius, radius, h, 8, 1);
      }

      poleGeo.translate(x, y, z);
      geometries.push(poleGeo);
    }
  }

  const merged = mergeGeometries(geometries, false);

  // Dispose individual geometries to free memory
  geometries.forEach((g) => g.dispose());

  return merged;
}
