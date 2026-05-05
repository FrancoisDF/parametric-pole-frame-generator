import type { Params } from './schema.js';
import { poleCountX, poleCountZ } from './schema.js';

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
  const nX = poleCountX(params);
  const nZ = poleCountZ(params);
  const { spacing } = params;
  const positions: PolePosition[] = [];
  for (let j = 0; j < nZ; j++) {
    for (let i = 0; i < nX; i++) {
      positions.push({
        x: (i - (nX - 1) / 2) * spacing,
        z: (j - (nZ - 1) / 2) * spacing
      });
    }
  }
  return positions;
}

function randomLayout(params: Params): PolePosition[] {
  const nX = poleCountX(params);
  const nZ = poleCountZ(params);
  const target = nX * nZ;
  const { spacing, gridWidth, gridHeight, layoutSeed } = params;
  const halfX = gridWidth / 2;
  const halfZ = gridHeight / 2;
  const minDist = Math.max(1, spacing - 3);
  const minDist2 = minDist * minDist;
  const rand = makeLCG(layoutSeed);
  const positions: PolePosition[] = [];
  const maxAttempts = target * 50;

  for (let a = 0; a < maxAttempts && positions.length < target; a++) {
    const x = (rand() * 2 - 1) * halfX;
    const z = (rand() * 2 - 1) * halfZ;

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
  const { spacing, gridWidth, gridHeight } = params;
  const halfX = gridWidth / 2;
  const halfZ = gridHeight / 2;
  const positions: PolePosition[] = [];

  // Center pole
  positions.push({ x: 0, z: 0 });

  // Continue rings until the radius reaches the corner of the rectangle,
  // but only keep poles that fall within the rectangular bounds.
  const corner = Math.sqrt(halfX * halfX + halfZ * halfZ);
  let k = 1;
  while (true) {
    const r = k * spacing;
    if (r > corner) break;
    const count = Math.max(1, Math.round((2 * Math.PI * r) / spacing));
    for (let m = 0; m < count; m++) {
      const angle = (m / count) * 2 * Math.PI;
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      if (Math.abs(x) <= halfX && Math.abs(z) <= halfZ) {
        positions.push({ x, z });
      }
    }
    k++;
  }

  return positions;
}

function spiralLayout(params: Params): PolePosition[] {
  const { spacing, gridWidth, gridHeight } = params;
  const halfX = gridWidth / 2;
  const halfZ = gridHeight / 2;
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

  // Continue until the spiral reaches the corner of the rectangle,
  // but only keep poles that fall within the rectangular bounds.
  const corner = Math.sqrt(halfX * halfX + halfZ * halfZ);
  while (true) {
    const r = a * theta;
    if (r > corner) break;

    // Arc-length element: ds = sqrt(r² + a²) · dθ
    const ds = Math.sqrt(r * r + a * a) * dTheta;
    arcSinceLastPole += ds;

    if (arcSinceLastPole >= spacing) {
      arcSinceLastPole -= spacing;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      if (Math.abs(x) <= halfX && Math.abs(z) <= halfZ) {
        positions.push({ x, z });
      }
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
