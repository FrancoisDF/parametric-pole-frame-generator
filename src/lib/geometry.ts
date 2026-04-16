import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import fontJson from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { plateSize, type Params } from './schema.js';
import { poleHeightFromWorld } from './heightFunctions.js';
import { generatePolePositions } from './poleLayout.js';
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

// ─── Single-piece build ───────────────────────────────────────────────────────

function buildSingleGeometry(params: Params): THREE.BufferGeometry {
  const { poleDiameter, minHeight, maxHeight, baseHeight, heightFunction, waveFrequency, gridSize } =
    params;

  const pw = plateSize(params);
  const half = gridSize / 2;
  const geometries: THREE.BufferGeometry[] = [];

  // Base plate (centred at origin)
  const baseGeo = new THREE.BoxGeometry(pw, baseHeight, pw);
  baseGeo.translate(0, baseHeight / 2, 0);
  geometries.push(baseGeo);

  // Poles — iterate position list from the active layout
  const radius = poleDiameter / 2;
  for (const { x, z } of generatePolePositions(params)) {
    const h = poleHeightFromWorld(x, z, half, heightFunction, waveFrequency, minHeight, maxHeight);
    const poleGeo = new THREE.CylinderGeometry(radius, radius, h, 8, 1);
    poleGeo.translate(x, baseHeight + h / 2, z);
    geometries.push(poleGeo);
  }

  const merged = mergeGeos(geometries);
  geometries.forEach((g) => g.dispose());
  return merged;
}

// ─── Multi-section build ──────────────────────────────────────────────────────

function buildSectionedGeometry(params: Params): THREE.BufferGeometry {
  const sections = calculateSections(params);
  const ns = numSectionsPerSide(params);
  const LAYOUT_GAP = 5; // mm between sections in export layout

  // Pre-compute the plate dimensions of every section so we can derive a
  // consistent grid layout (use max width/depth for uniform column/row spacing).
  const halfPlate = plateSize(params) / 2;
  let maxW = 0;
  let maxD = 0;
  for (const s of sections) {
    const plateXMin = s.colIdx === 0 ? -halfPlate : s.xMin;
    const plateXMax = s.colIdx === ns - 1 ? halfPlate : s.xMax;
    const plateZMin = s.rowIdx === 0 ? -halfPlate : s.zMin;
    const plateZMax = s.rowIdx === ns - 1 ? halfPlate : s.zMax;
    const w = plateXMax - plateXMin;
    const d = plateZMax - plateZMin;
    if (w > maxW) maxW = w;
    if (d > maxD) maxD = d;
  }

  const allGeometries: THREE.BufferGeometry[] = [];

  for (const section of sections) {
    const sectionGeo = buildOneSectionGeometry(section, params, ns);

    // Place section in export grid (col → X, row → Z)
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
 * Each geometry is centred at the origin (not arranged in a grid).
 * Used for split exports where each section is a standalone STL file.
 */
export function buildIndependentSectionGeometries(params: Params): SectionGeometryData[] {
  const sections = calculateSections(params);
  const ns = numSectionsPerSide(params);
  const result: SectionGeometryData[] = [];

  for (const section of sections) {
    const geometry = buildOneSectionGeometry(section, params, ns);

    if (geometry.attributes.position && geometry.attributes.position.count > 0) {
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
 * Origin = bottom-left corner of the section's base plate (world-space min corner).
 *
 * Exterior edges keep the full plate boundary (poleDiameter/2 + baseMargin beyond
 * the grid). Interior edges are cut at the spatial split point so that placing two
 * adjacent sections edge-to-edge restores the correct inter-pole spacing at seams.
 */
function buildOneSectionGeometry(
  section: Section,
  params: Params,
  ns: number
): THREE.BufferGeometry {
  const { poleDiameter, minHeight, maxHeight, baseHeight, heightFunction, waveFrequency, gridSize, labelFontSize } = params;

  const radius = poleDiameter / 2;
  const halfPlate = plateSize(params) / 2;
  const half = gridSize / 2;
  const geometries: THREE.BufferGeometry[] = [];

  // Plate extent in world space:
  //   Exterior edge → full plate boundary
  //   Interior edge → spatial split point (xMin / xMax)
  const plateXMin = section.colIdx === 0 ? -halfPlate : section.xMin;
  const plateXMax = section.colIdx === ns - 1 ? halfPlate : section.xMax;
  const plateZMin = section.rowIdx === 0 ? -halfPlate : section.zMin;
  const plateZMax = section.rowIdx === ns - 1 ? halfPlate : section.zMax;
  const plateW = plateXMax - plateXMin;
  const plateD = plateZMax - plateZMin;

  // Base plate in local space (origin at bottom-left-front corner)
  const baseGeo = new THREE.BoxGeometry(plateW, baseHeight, plateD);
  baseGeo.translate(plateW / 2, baseHeight / 2, plateD / 2);
  geometries.push(baseGeo);

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

  for (const { x, z } of sectionPositions) {
    const h = poleHeightFromWorld(x, z, half, heightFunction, waveFrequency, minHeight, maxHeight);
    // Convert world coords to local (section plate space)
    const localX = x - plateXMin;
    const localZ = z - plateZMin;
    const localY = baseHeight + h / 2;

    const poleGeo = new THREE.CylinderGeometry(radius, radius, h, 8, 1);
    poleGeo.translate(localX, localY, localZ);
    geometries.push(poleGeo);
  }

  // Embossed section label
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
      depth: 0.4,
      curveSegments: 4,
      bevelEnabled: false
    });

    // TextGeometry faces +Z as extrusion direction and +Y as character height.
    // Rotate −90° around X so the text lies flat on the XZ plane.
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
