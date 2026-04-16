import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import fontJson from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { plateSize, poleCount, type Params } from './schema.js';
import { poleHeight } from './heightFunctions.js';
import { calculateSections, numSectionsPerSide, type Section } from './sectioning.js';

export interface SectionGeometryData {
  section: Section;
  geometry: THREE.BufferGeometry;
}

// Parse the bundled helvetiker font once at module load
const _fontLoader = new FontLoader();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _font = _fontLoader.parse(fontJson as any);

/**
 * Manually merges an array of BufferGeometries by concatenating their
 * position and normal Float32Arrays directly.
 * This avoids all Three.js mergeGeometries compatibility checks
 * (indexed vs non-indexed, attribute set mismatches, groups, etc.).
 */
function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Expand each geometry to non-indexed, keeping only position + normal
  const expanded = geos.map((geo) => {
    const g = geo.index !== null ? geo.toNonIndexed() : geo;

    // Ensure normals
    if (!g.attributes.normal) g.computeVertexNormals();

    return g;
  });

  // Count total vertices
  let totalVerts = 0;
  for (const g of expanded) {
    if (g.attributes.position) totalVerts += g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  let offset = 0;

  for (const g of expanded) {
    const posAttr = g.attributes.position as THREE.BufferAttribute;
    const normAttr = g.attributes.normal as THREE.BufferAttribute;
    if (!posAttr) continue;

    const count = posAttr.count;
    positions.set(posAttr.array as Float32Array, offset * 3);
    if (normAttr) normals.set(normAttr.array as Float32Array, offset * 3);
    offset += count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return merged;
}

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
  const {
    spacing,
    poleDiameter,
    poleShape,
    minHeight,
    maxHeight,
    baseHeight,
    heightFunction,
    waveFrequency
  } = params;

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

      let poleGeo: THREE.BufferGeometry;
      if (poleShape === 'tapered') {
        poleGeo = new THREE.CylinderGeometry(radius * 0.3, radius, h, 8, 1);
      } else {
        poleGeo = new THREE.CylinderGeometry(radius, radius, h, 8, 1);
      }
      poleGeo.translate(x, y, z);
      geometries.push(poleGeo);
    }
  }

  const merged = mergeGeos(geometries);
  geometries.forEach((g) => g.dispose());
  return merged;
}

// ─── Multi-section build ──────────────────────────────────────────────────────

function buildSectionedGeometry(params: Params): THREE.BufferGeometry {
  const { spacing, poleDiameter, baseMargin } = params;
  const sections = calculateSections(params);
  const ns = numSectionsPerSide(params);
  const LAYOUT_GAP = 5; // mm between sections in export

  // Compute max section dimensions for consistent grid layout.
  // Corner sections (exterior on both sides) are largest.
  const radius = poleDiameter / 2;
  const outerOffset = radius + baseMargin;
  const innerOffset = spacing / 2;

  let maxW = 0;
  let maxD = 0;
  for (const s of sections) {
    const leftOffset = s.colIdx === 0 ? outerOffset : innerOffset;
    const rightOffset = s.colIdx === ns - 1 ? outerOffset : innerOffset;
    const frontOffset = s.rowIdx === 0 ? outerOffset : innerOffset;
    const backOffset = s.rowIdx === ns - 1 ? outerOffset : innerOffset;
    const w = leftOffset + (s.iMax - s.iMin) * spacing + rightOffset;
    const d = frontOffset + (s.jMax - s.jMin) * spacing + backOffset;
    if (w > maxW) maxW = w;
    if (d > maxD) maxD = d;
  }

  const allGeometries: THREE.BufferGeometry[] = [];

  for (const section of sections) {
    const sectionGeo = buildOneSectionGeometry(section, params, ns);

    // Place section in export grid (col in X, row in Z)
    const offsetX = section.colIdx * (maxW + LAYOUT_GAP);
    const offsetZ = section.rowIdx * (maxD + LAYOUT_GAP);
    sectionGeo.translate(offsetX, 0, offsetZ);

    allGeometries.push(sectionGeo);
  }

  const merged = mergeGeos(allGeometries);
  allGeometries.forEach((g) => g.dispose());
  return merged;
}

/**
 * Builds independent section geometries, one per section.
 * Each geometry has its own base plate centered at origin (not in a grid).
 * Used for split exports where each section is a standalone STL file.
 */
export function buildIndependentSectionGeometries(
  params: Params
): SectionGeometryData[] {
  const sections = calculateSections(params);
  const ns = numSectionsPerSide(params);
  const result: SectionGeometryData[] = [];

  for (const section of sections) {
    const geometry = buildOneSectionGeometry(section, params, ns);

    // Verify geometry has data before centering
    if (geometry.attributes.position && geometry.attributes.position.count > 0) {
      // Center the geometry so the base plate is centered at origin
      geometry.computeBoundingBox();
      const bb = geometry.boundingBox;
      if (bb) {
        const centerX = (bb.max.x + bb.min.x) / 2;
        const centerZ = (bb.max.z + bb.min.z) / 2;
        geometry.translate(-centerX, 0, -centerZ);
      }
    } else {
      console.warn(`[geometry] Section ${section.rowIdx}.${section.colIdx} has no position data`);
    }

    result.push({ section, geometry });
  }

  return result;
}

/**
 * Builds one section's geometry in local space.
 * Origin = bottom-left corner of the section's base plate.
 *
 * Exterior edges (the outermost sides of the full model) keep the full
 * `baseMargin + radius` offset so the assembled model matches the original
 * plate outline. Interior edges (shared with an adjacent section) use
 * `spacing / 2` so that placing two sections edge-to-edge restores the
 * correct pole-to-pole spacing at every seam.
 */
function buildOneSectionGeometry(section: Section, params: Params, ns: number): THREE.BufferGeometry {
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

  // Per-side offsets:
  //   exterior side → radius + baseMargin  (matches the original outer plate edge)
  //   interior side → spacing / 2          (cut at midpoint between adjacent poles)
  const outerOffset = radius + baseMargin;
  const innerOffset = spacing / 2;
  const leftOffset  = section.colIdx === 0      ? outerOffset : innerOffset;
  const rightOffset = section.colIdx === ns - 1  ? outerOffset : innerOffset;
  const frontOffset = section.rowIdx === 0      ? outerOffset : innerOffset;
  const backOffset  = section.rowIdx === ns - 1  ? outerOffset : innerOffset;

  // Section base plate dimensions in local space
  const plateW = leftOffset + (section.iMax - section.iMin) * spacing + rightOffset;
  const plateD = frontOffset + (section.jMax - section.jMin) * spacing + backOffset;

  // Base plate: sits from Y=0 to Y=baseHeight, X=[0,plateW], Z=[0,plateD]
  const baseGeo = new THREE.BoxGeometry(plateW, baseHeight, plateD);
  baseGeo.translate(plateW / 2, baseHeight / 2, plateD / 2);
  geometries.push(baseGeo);

  // Poles
  for (let j = section.jMin; j <= section.jMax; j++) {
    for (let i = section.iMin; i <= section.iMax; i++) {
      const h = poleHeight(i, j, n, heightFunction, waveFrequency, minHeight, maxHeight);

      // Local position: pole centre within this section's plate
      const localX = leftOffset + (i - section.iMin) * spacing;
      const localZ = frontOffset + (j - section.jMin) * spacing;
      const localY = baseHeight + h / 2;

      let poleGeo: THREE.BufferGeometry;
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

  const merged = mergeGeos(geometries);
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
      depth: 0.4, // emboss thickness in mm
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
