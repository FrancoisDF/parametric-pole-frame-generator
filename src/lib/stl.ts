import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { buildExportGeometry } from './geometry.js';
import type { Params } from './schema.js';

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
