import { defaultParams, paramsSchema, type Params } from './schema.js';

const STORAGE_KEY = 'parametric-pole-params';

/**
 * Load parameters from localStorage, or return defaults if not found or invalid.
 */
function loadParamsFromStorage(): Params {
  if (typeof window === 'undefined') {
    return { ...defaultParams };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
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
 *
 * Parameters are automatically persisted to localStorage.
 */
export const params: Params = $state(loadParamsFromStorage());

/**
 * Save params to localStorage whenever they change.
 * Using $effect with an untracked write to localStorage.
 */
let saveTimeout: ReturnType<typeof setTimeout>;

$effect(() => {
  // Touch all properties to establish dependencies
  void (
    params.gridSize +
    params.spacing +
    params.poleDiameter +
    params.minHeight +
    params.maxHeight +
    params.poleShape.length +
    params.baseHeight +
    params.baseMargin +
    params.heightFunction.length +
    params.waveFrequency
  );

  // Debounce saves to avoid excessive writes
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (typeof window !== 'undefined') {
      try {
        const snapshot = { ...params };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.warn('Failed to save params to localStorage:', error);
      }
    }
  }, 300);
});
