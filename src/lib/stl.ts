import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { buildExportGeometry, buildIndependentSectionGeometries } from './geometry.js';
import type { Params } from './schema.js';
import { generateSVGPlan } from './svg.js';
import JSZip from 'jszip';

/**
 * Builds the merged geometry, exports it as a binary STL, and
 * triggers a browser download. All work is done client-side.
 */
export function exportSTL(params: Params): void {
  const geometry = buildExportGeometry(params);

  // STLExporter requires a Mesh (not a bare geometry)
  const mesh = new THREE.Mesh(geometry);

  const exporter = new STLExporter();
  const buffer = exporter.parse(mesh, { binary: true }) as unknown as ArrayBuffer;

  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pole_frame_${Date.now()}.stl`;
  anchor.click();

  // Clean up
  URL.revokeObjectURL(url);
  geometry.dispose();
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

      // Export as binary STL
      const mesh = new THREE.Mesh(geometry);
      const stlBuffer = exporter.parse(mesh, { binary: true }) as unknown as ArrayBuffer;
      // Convert ArrayBuffer to Uint8Array for jszip compatibility
      const stlData = new Uint8Array(stlBuffer);
      zip.file(`${filePrefix}.stl`, stlData);

      // Generate SVG plan
      const svgContent = generateSVGPlan(section, params);
      zip.file(`${filePrefix}_plan.svg`, svgContent);

      // Clean up
      geometry.dispose();
    }

    // Create and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pole_frame_split_${timestamp}.zip`;
    anchor.click();

    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[stl] Split export failed:', error);
    throw error;
  }
}
