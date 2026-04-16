import type { Params } from './schema.js';
import { poleCount } from './schema.js';

export interface PolePosition {
  x: number;
  z: number;
}

// ── Seeded PRNG (LCG) ────────────────────────────────────────────────────────

/** Returns a seeded pseudo-random number generator yielding values in [0, 1). */
function makeLCG(seed: number): () => number {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ── Layout algorithms ────────────────────────────────────────────────────────

function gridLayout(params: Params): PolePosition[] {
  const n = poleCount(params);
  const { spacing } = params;
  const positions: PolePosition[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      positions.push({
        x: (i - (n - 1) / 2) * spacing,
        z: (j - (n - 1) / 2) * spacing
      });
    }
  }
  return positions;
}

function randomLayout(params: Params): PolePosition[] {
  const n = poleCount(params);
  const target = n * n;
  const { spacing, gridSize, layoutSeed } = params;
  const half = gridSize / 2;
  const minDist = Math.max(1, spacing - 3);
  const minDist2 = minDist * minDist;
  const rand = makeLCG(layoutSeed);
  const positions: PolePosition[] = [];
  const maxAttempts = target * 50;

  for (let a = 0; a < maxAttempts && positions.length < target; a++) {
    const x = (rand() * 2 - 1) * half;
    const z = (rand() * 2 - 1) * half;

    let ok = true;
    for (const p of positions) {
      const dx = p.x - x;
      const dz = p.z - z;
      if (dx * dx + dz * dz < minDist2) {
        ok = false;
        break;
      }
    }
    if (ok) positions.push({ x, z });
  }

  return positions;
}

function circularLayout(params: Params): PolePosition[] {
  const { spacing, gridSize } = params;
  const half = gridSize / 2;
  const positions: PolePosition[] = [];

  // Center pole
  positions.push({ x: 0, z: 0 });

  let k = 1;
  while (true) {
    const r = k * spacing;
    if (r > half) break;
    const count = Math.max(1, Math.round((2 * Math.PI * r) / spacing));
    for (let m = 0; m < count; m++) {
      const angle = (m / count) * 2 * Math.PI;
      positions.push({ x: r * Math.cos(angle), z: r * Math.sin(angle) });
    }
    k++;
  }

  return positions;
}

function spiralLayout(params: Params): PolePosition[] {
  const { spacing, gridSize } = params;
  const half = gridSize / 2;
  const positions: PolePosition[] = [];

  // Archimedean spiral: r(θ) = a·θ, where a = spacing / (2π)
  // We step in small θ increments and accumulate arc length,
  // placing a pole whenever we've travelled ~spacing along the curve.
  const a = spacing / (2 * Math.PI);
  const dTheta = 0.01; // radians per step

  // Center pole (θ = 0, r = 0)
  positions.push({ x: 0, z: 0 });

  let theta = dTheta;
  let arcSinceLastPole = 0;

  while (true) {
    const r = a * theta;
    if (r > half) break;

    // Arc-length element: ds = sqrt(r² + a²) · dθ
    const ds = Math.sqrt(r * r + a * a) * dTheta;
    arcSinceLastPole += ds;

    if (arcSinceLastPole >= spacing) {
      arcSinceLastPole -= spacing;
      positions.push({ x: r * Math.cos(theta), z: r * Math.sin(theta) });
    }

    theta += dTheta;
  }

  return positions;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the list of pole world-space positions for the current params.
 * All coordinates are in mm, centred at origin (X-Z plane).
 */
export function generatePolePositions(params: Params): PolePosition[] {
  switch (params.poleLayout) {
    case 'random':
      return randomLayout(params);
    case 'circular':
      return circularLayout(params);
    case 'spiral':
      return spiralLayout(params);
    default:
      return gridLayout(params);
  }
}
