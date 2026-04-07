import { defaultParams, type Params } from './schema.js';

/**
 * Shared reactive parameter state (Svelte 5 universal reactivity).
 * Any component that imports `params` and reads its properties will
 * automatically re-render when those properties are mutated.
 */
export const params: Params = $state({ ...defaultParams });
