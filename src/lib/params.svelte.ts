import { defaultParams, paramsSchema, type Params } from './schema.js';

export const STORAGE_KEY = 'parametric-pole-params';

/**
 * Load parameters from localStorage, or return defaults if not found or invalid.
 * Migrates old single `gridSize` to separate `gridWidth` / `gridHeight`.
 */
export function loadParamsFromStorage(): Params {
  if (typeof window === 'undefined') {
    return { ...defaultParams };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate from old square gridSize to separate width/height
      if (parsed.gridSize != null && parsed.gridWidth == null) {
        parsed.gridWidth = parsed.gridSize;
        parsed.gridHeight = parsed.gridSize;
        delete parsed.gridSize;
      }
      // Validate against schema to ensure type safety
      return paramsSchema.parse(parsed);
    }
  } catch (error) {
    console.warn('Failed to load params from localStorage:', error);
  }

  return { ...defaultParams };
}

/**
 * Shared reactive parameter state (Svelte 5 universal reactivity).
 * Any component that imports `params` and reads its properties will
 * automatically re-render when those properties are mutated.
 */
export const params: Params = $state(loadParamsFromStorage());
