import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import fontJson from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { plateSize, poleCount, type Params } from './schema.js';
import { poleHeight } from './heightFunctions.js';
import { calculateSections, type Section } from './sectioning.js';

// Parse the bundled helvetiker font once at module load
const _fontLoader = new FontLoader();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _font = _fontLoader.parse(fontJson as any);

/**
 * Builds a merged BufferGeometry for STL export.
 * When splitEnabled, the model is divided into sections arranged in a
 * grid layout with 5 mm gaps, each with an embossed row.col label.
 *
 * Coordinate system: Y-up, all values in mm.
 *   Base plate: Y = 0 → Y = baseHeight
 *   Poles:      Y = baseHeight → Y = baseHeight + poleHeight
 */
export function buildExportGeometry(params: Params): THREE.BufferGeometry {
  if (params.splitEnabled) {
    return buildSectionedGeometry(params);
  }
  return buildSingleGeometry(params);
}

// ─── Single-piece build (original behaviour) ──────────────────────────────────

function buildSingleGeometry(params: Params): THREE.BufferGeometry {
  const { spacing, poleDiameter, poleShape, minHeight, maxHeight, baseHeight, heightFunction, waveFrequency } = params;

  const n = poleCount(params);
  const pw = plateSize(params);
  const geometries: THREE.BufferGeometry[] = [];

  // Base plate
  const baseGeo = new THREE.BoxGeometry(pw, baseHeight, pw);
  baseGeo.translate(0, baseHeight / 2, 0);
  geometries.push(baseGeo);

  // Poles
  const radius = poleDiameter / 2;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const h = poleHeight(i, j, n, heightFunction, waveFrequency, minHeight, maxHeight);
      const x = (i - (n - 1) / 2) * spacing;
      const z = (j - (n - 1) / 2) * spacing;
      const y = baseHeight + h / 2;

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
  geometries.forEach((g) => g.dispose());
  return merged;
}

// ─── Multi-section build ──────────────────────────────────────────────────────

function buildSectionedGeometry(params: Params): THREE.BufferGeometry {
  const { spacing, poleDiameter, baseMargin } = params;
  const sections = calculateSections(params);
  const LAYOUT_GAP = 5; // mm between sections in export

  // Compute max section dimensions for consistent grid layout
  let maxW = 0;
  let maxD = 0;
  for (const s of sections) {
    const w = (s.iMax - s.iMin) * spacing + poleDiameter + 2 * baseMargin;
    const d = (s.jMax - s.jMin) * spacing + poleDiameter + 2 * baseMargin;
    if (w > maxW) maxW = w;
    if (d > maxD) maxD = d;
  }

  const allGeometries: THREE.BufferGeometry[] = [];

  for (const section of sections) {
    const sectionGeo = buildOneSectionGeometry(section, params);

    // Place section in export grid (col in X, row in Z)
    const offsetX = section.colIdx * (maxW + LAYOUT_GAP);
    const offsetZ = section.rowIdx * (maxD + LAYOUT_GAP);
    sectionGeo.translate(offsetX, 0, offsetZ);

    allGeometries.push(sectionGeo);
  }

  const merged = mergeGeometries(allGeometries, false);
  allGeometries.forEach((g) => g.dispose());
  return merged;
}

/**
 * Builds one section's geometry in local space.
 * Origin = bottom-left corner of the section's base plate.
 */
function buildOneSectionGeometry(section: Section, params: Params): THREE.BufferGeometry {
  const {
    spacing,
    poleDiameter,
    poleShape,
    minHeight,
    maxHeight,
    baseHeight,
    baseMargin,
    heightFunction,
    waveFrequency,
    labelFontSize
  } = params;

  const n = poleCount(params);
  const radius = poleDiameter / 2;
  const geometries: THREE.BufferGeometry[] = [];

  // Section base plate dimensions in local space
  const plateW = (section.iMax - section.iMin) * spacing + poleDiameter + 2 * baseMargin;
  const plateD = (section.jMax - section.jMin) * spacing + poleDiameter + 2 * baseMargin;

  // Base plate: sits from Y=0 to Y=baseHeight, X=[0,plateW], Z=[0,plateD]
  const baseGeo = new THREE.BoxGeometry(plateW, baseHeight, plateD);
  baseGeo.translate(plateW / 2, baseHeight / 2, plateD / 2);
  geometries.push(baseGeo);

  // Poles
  for (let j = section.jMin; j <= section.jMax; j++) {
    for (let i = section.iMin; i <= section.iMax; i++) {
      const h = poleHeight(i, j, n, heightFunction, waveFrequency, minHeight, maxHeight);

      // Local position: offset from section's iMin / jMin
      const localX = (i - section.iMin) * spacing + radius + baseMargin;
      const localZ = (j - section.jMin) * spacing + radius + baseMargin;
      const localY = baseHeight + h / 2;

      let poleGeo: THREE.CylinderGeometry;
      if (poleShape === 'tapered') {
        poleGeo = new THREE.CylinderGeometry(radius * 0.3, radius, h, 8, 1);
      } else {
        poleGeo = new THREE.CylinderGeometry(radius, radius, h, 8, 1);
      }
      poleGeo.translate(localX, localY, localZ);
      geometries.push(poleGeo);
    }
  }

  // Embossed label on top of base plate
  const label = `${section.rowIdx + 1}.${section.colIdx + 1}`;
  const labelGeo = createLabelGeometry(label, labelFontSize, plateW, plateD, baseHeight);
  if (labelGeo) geometries.push(labelGeo);

  const merged = mergeGeometries(geometries, false);
  geometries.forEach((g) => g.dispose());
  return merged;
}

/**
 * Creates an embossed text label that lies flat on the XZ plane.
 * The label is centred within the given plate dimensions and raised
 * 1.5 mm above the base plate top surface (Y = baseHeight).
 *
 * Returns null if the font/text geometry fails (non-fatal).
 */
function createLabelGeometry(
  text: string,
  size: number,
  plateW: number,
  plateD: number,
  baseHeight: number
): THREE.BufferGeometry | null {
  try {
    const textGeo = new TextGeometry(text, {
      font: _font,
      size,
      depth: 1.5, // emboss thickness in mm
      curveSegments: 4,
      bevelEnabled: false
    });

    // TextGeometry faces +Z as extrusion direction and +Y as character height.
    // Rotate −90° around X so the text lies flat on the XZ plane:
    //   character width  → X (unchanged)
    //   character height → Z
    //   extrusion depth  → +Y (upward)
    textGeo.rotateX(-Math.PI / 2);

    textGeo.computeBoundingBox();
    const bb = textGeo.boundingBox!;
    const textW = bb.max.x - bb.min.x;
    const textD = bb.max.z - bb.min.z;

    // Centre on base plate, sitting on top of it
    textGeo.translate(plateW / 2 - textW / 2, baseHeight, plateD / 2 - textD / 2);

    return textGeo;
  } catch (err) {
    console.warn('[geometry] Label creation failed:', err);
    return null;
  }
}
