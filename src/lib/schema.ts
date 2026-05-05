import { z } from 'zod';

export const paramsSchema = z.object({
  // Grid dimensions in mm (width = X axis, height = Z axis)
  gridWidth: z.number().min(10).max(2000).default(490),
  gridHeight: z.number().min(10).max(2000).default(490),
  spacing: z.number().min(1).max(200).default(10),
  poleLayout: z.enum(['grid', 'random', 'circular', 'spiral']).default('grid'),
  layoutSeed: z.number().min(0).max(9999).default(42),

  // Pole dimensions
  poleDiameter: z.number().min(0.5).max(20).default(3),
  minHeight: z.number().min(0).max(200).default(5),
  maxHeight: z.number().min(0).max(200).default(30),
  poleShape: z.enum(['straight', 'tapered']).default('straight'),

  // Base plate
  baseHeight: z.number().min(0.5).max(20).default(2),
  baseMargin: z.number().min(0).max(50).default(5),

  // Height function
  heightFunction: z.enum(['wave', 'hill', 'pyramid', 'flat', 'ripple', 'saddle', 'checkerboard', 'spiral']).default('wave'),
  waveFrequency: z.number().min(0.1).max(10).default(1),

  // Sculpt brush
  sculptMode: z.enum(['anchor', 'path']).default('anchor'),
  brushRadius: z.number().min(5).max(500).default(40),
  brushStrength: z.number().min(0.1).max(20).default(5),
  customHeights: z.record(z.string(), z.number()).default({}),

  // Print splitting
  splitEnabled: z.boolean().default(false),
  splitMode: z.enum(['grid', 'printer']).default('grid'),
  splitGridCount: z.number().min(1).max(10).default(2),
  printerSize: z.number().min(50).max(1000).default(200),
  labelFontSize: z.number().min(3).max(40).default(10)
});

export type Params = z.infer<typeof paramsSchema>;

export const defaultParams: Params = paramsSchema.parse({});

/** Number of poles along the X axis (grid width direction). */
export function poleCountX(p: Params): number {
  return Math.max(1, Math.floor(p.gridWidth / p.spacing) + 1);
}

/** Number of poles along the Z axis (grid depth direction). */
export function poleCountZ(p: Params): number {
  return Math.max(1, Math.floor(p.gridHeight / p.spacing) + 1);
}

/** Base plate width in mm (X axis). */
export function plateSizeX(p: Params): number {
  return p.gridWidth + p.poleDiameter + 2 * p.baseMargin;
}

/** Base plate depth in mm (Z axis). */
export function plateSizeZ(p: Params): number {
  return p.gridHeight + p.poleDiameter + 2 * p.baseMargin;
}
