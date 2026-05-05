import { createProjectFile, parseProjectFile, type ProjectFile } from './projectMetadata';
import type { Params } from './schema';

/**
 * Export the current project parameters as a JSON blob.
 * @param params - The parameters to export
 * @param name - Project name
 * @param description - Optional project description
 * @returns A Blob containing the JSON project file
 */
export function exportProjectAsJSON(params: Params, name: string, description?: string): Blob {
  const projectFile = createProjectFile(params, name, description);
  const json = JSON.stringify(projectFile, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Trigger a browser download of the project file.
 * @param blob - The file blob to download
 * @param filename - The filename for the downloaded file
 */
export function downloadProjectFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Import a project file from a File.
 * Parses, validates, and returns both metadata and params.
 * @param file - The file to import
 * @returns An object containing metadata and params
 * @throws Error if file is invalid or parsing fails
 */
export async function importProjectFromFile(file: File): Promise<{ metadata: Omit<ProjectFile, 'params'>; params: Params }> {
  if (!file.type.includes('json')) {
    throw new Error('File must be a JSON file');
  }

  const text = await file.text();
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON file');
  }

  try {
    const projectFile = parseProjectFile(data);
    const { params, ...metadata } = projectFile;
    return { metadata, params };
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Invalid project file: ${e.message}`);
    }
    throw new Error('Invalid project file format');
  }
}
