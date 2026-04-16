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

      // Verify geometry has data
      const positionAttr = geometry.attributes.position;
      if (!positionAttr || positionAttr.count === 0) {
        console.warn(`[stl] Section ${label} has no geometry data, skipping`);
        geometry.dispose();
        continue;
      }

      // Export as binary STL
      // STLExporter.parse() with binary:true returns a DataView (not an ArrayBuffer).
      // We must read .buffer/.byteOffset/.byteLength to get the real bytes.
      const mesh = new THREE.Mesh(geometry);
      const stlDataView = exporter.parse(mesh, { binary: true }) as unknown as DataView;

      // Verify buffer has data
      if (!stlDataView || stlDataView.byteLength === 0) {
        console.warn(`[stl] Section ${label} produced empty STL buffer`);
        geometry.dispose();
        continue;
      }

      // Extract the underlying ArrayBuffer slice as Uint8Array for jszip
      const stlData = new Uint8Array(stlDataView.buffer, stlDataView.byteOffset, stlDataView.byteLength);
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
