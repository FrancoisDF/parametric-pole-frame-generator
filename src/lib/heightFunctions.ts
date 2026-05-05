/**
 * All height functions take normalized coordinates (nx, ny) in [-1, 1]
 * and return a value in [0, 1] which is then mapped to [minHeight, maxHeight].
 */

export function getHeightT(
  nx: number,
  ny: number,
  fn: string,
  waveFrequency: number
): number {
  switch (fn) {
    case 'flat':
      return 0.5;

    case 'wave':
      return (
        0.5 +
        0.5 * Math.sin(nx * waveFrequency * Math.PI) * Math.cos(ny * waveFrequency * Math.PI)
      );

    case 'hill':
      // Gaussian bell — peaks at center (0,0)
      return Math.exp(-(nx * nx + ny * ny) / 0.5);

    case 'pyramid':
      // Diamond / pyramid — tallest at center, edges at 0
      return Math.max(0, 1 - Math.max(Math.abs(nx), Math.abs(ny)));

    case 'ripple': {
      // Radial waves emanating from the center
      const r = Math.sqrt(nx * nx + ny * ny);
      return 0.5 + 0.5 * Math.sin(r * waveFrequency * Math.PI);
    }

    case 'saddle':
      // Hyperbolic paraboloid — no extra param needed
      return 0.5 + 0.5 * (nx * ny);

    case 'checkerboard': {
      // Alternating cells; waveFrequency controls cell count
      const cx = Math.floor((nx + 1) * waveFrequency * 2);
      const cy = Math.floor((ny + 1) * waveFrequency * 2);
      return (cx + cy) % 2 === 0 ? 0 : 1;
    }

    case 'spiral': {
      // Height follows spiral arms; waveFrequency controls number of turns
      const sr = Math.sqrt(nx * nx + ny * ny);
      const angle = Math.atan2(ny, nx) / (2 * Math.PI) + 0.5;
      return ((angle + sr * waveFrequency) % 1 + 1) % 1;
    }

    default:
      return 0.5;
  }
}

/** Maps a normalized [0,1] value to the [minHeight, maxHeight] range (mm). */
export function mapToHeight(t: number, minHeight: number, maxHeight: number): number {
  return minHeight + t * (maxHeight - minHeight);
}

/**
 * Computes the actual pole height in mm for a world-space position (x, z).
 * Normalises x to [-1, 1] using halfX and z using halfZ, then delegates to getHeightT.
 */
export function poleHeightFromWorld(
  x: number,
  z: number,
  halfX: number,
  halfZ: number,
  heightFunction: string,
  waveFrequency: number,
  minHeight: number,
  maxHeight: number
): number {
  const nx = halfX > 0 ? Math.max(-1, Math.min(1, x / halfX)) : 0;
  const ny = halfZ > 0 ? Math.max(-1, Math.min(1, z / halfZ)) : 0;
  const t = getHeightT(nx, ny, heightFunction, waveFrequency);
  return Math.max(0.01, mapToHeight(t, minHeight, maxHeight));
}

/**
 * Returns a stable string key for a pole at world position (x, z).
 * Uses 0.1 mm precision so keys survive baseHeight/diameter changes.
 */
export function polePositionKey(x: number, z: number): string {
  return `${Math.round(x * 10)},${Math.round(z * 10)}`;
}

/**
 * Returns the effective height for a pole, respecting any custom sculpt
 * override stored in params.customHeights. Falls back to the math function.
 */
export function effectivePoleHeight(
  x: number,
  z: number,
  halfX: number,
  halfZ: number,
  heightFunction: string,
  waveFrequency: number,
  minHeight: number,
  maxHeight: number,
  customHeights: Record<string, number>
): number {
  const key = polePositionKey(x, z);
  if (customHeights[key] != null) return Math.max(minHeight, Math.min(maxHeight, customHeights[key]));
  return poleHeightFromWorld(x, z, halfX, halfZ, heightFunction, waveFrequency, minHeight, maxHeight);
}
