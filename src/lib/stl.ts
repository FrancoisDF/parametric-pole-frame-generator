import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { buildExportGeometry, buildIndependentSectionGeometries } from './geometry.js';
import type { Params } from './schema.js';
import { generateSVGPlan, generateCombinedSVGPlan } from './svg.js';
import { calculateSections } from './sectioning.js';
import JSZip from 'jszip';

/**
 * Builds the merged geometry, exports it as a binary STL + SVG plan in a zip,
 * and triggers a browser download.
 */
export async function exportSTL(params: Params): Promise<void> {
  const geometry = buildExportGeometry(params);
  const mesh = new THREE.Mesh(geometry);

  const exporter = new STLExporter();
  const stlDataView = exporter.parse(mesh, { binary: true }) as unknown as DataView;
  const stlData = new Uint8Array(stlDataView.buffer, stlDataView.byteOffset, stlDataView.byteLength);

  geometry.dispose();

  // Generate the SVG plans (circle and cross variants)
  const sections = calculateSections(params);
  const svgContent = sections.length === 1
    ? generateSVGPlan(sections[0], params)
    : generateCombinedSVGPlan(params);
  const svgCrossContent = sections.length === 1
    ? generateSVGPlan(sections[0], params, true)
    : generateCombinedSVGPlan(params, true);

  const zip = new JSZip();
  zip.file('pole_frame.stl', stlData);
  zip.file('pole_frame_plan.svg', svgContent);
  zip.file('pole_frame_plan_cross.svg', svgCrossContent);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pole_frame_${Date.now()}.zip`;
  anchor.click();

  URL.revokeObjectURL(url);
}

/**
 * Exports split sections as individual STL files + SVG plans in a zip.
 * Each section becomes a standalone STL with its own base plate.
 */
export async function exportSplitAsZip(params: Params): Promise<void> {
  const timestamp = Date.now();
  const zip = new JSZip();
  const exporter = new STLExporter();

  try {
    // Get independent geometries for each section
    const sectionGeoData = buildIndependentSectionGeometries(params);

    // Export each section as STL + SVG
    for (const { section, geometry } of sectionGeoData) {
      const label = `${section.rowIdx + 1}.${section.colIdx + 1}`;
      const filePrefix = `section_${section.rowIdx + 1}_${section.colIdx + 1}`;

      // Verify geometry has data
      const positionAttr = geometry.attributes.position;
      if (!positionAttr || positionAttr.count === 0) {
        console.warn(`[stl] Section ${label} has no geometry data, skipping`);
        geometry.dispose();
        continue;
      }

      const mesh = new THREE.Mesh(geometry);
      const stlDataView = exporter.parse(mesh, { binary: true }) as unknown as DataView;

      if (!stlDataView || stlDataView.byteLength === 0) {
        console.warn(`[stl] Section ${label} produced empty STL buffer`);
        geometry.dispose();
        continue;
      }

      const stlData = new Uint8Array(stlDataView.buffer, stlDataView.byteOffset, stlDataView.byteLength);
      zip.file(`${filePrefix}.stl`, stlData);

      zip.file(`${filePrefix}_plan.svg`, generateSVGPlan(section, params));
      zip.file(`${filePrefix}_plan_cross.svg`, generateSVGPlan(section, params, true));

      geometry.dispose();
    }

    // Add combined SVGs with all sections laid out with 1cm gaps
    zip.file(`all_sections_plan.svg`, generateCombinedSVGPlan(params));
    zip.file(`all_sections_plan_cross.svg`, generateCombinedSVGPlan(params, true));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pole_frame_split_${timestamp}.zip`;
    anchor.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[stl] Split export failed:', error);
    throw error;
  }
}
