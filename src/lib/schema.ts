import { z } from 'zod';

export const paramsSchema = z.object({
  // Grid — gridSize is the physical side length of the pole grid in mm
  gridSize: z.number().min(10).max(2000).default(490),
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
  brushRadius: z.number().min(5).max(300).default(40),
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

/**
 * Number of poles per side, derived from physical grid size and spacing.
 * Changing spacing keeps gridSize fixed and only changes pole count.
 */
export function poleCount(p: Params): number {
  return Math.max(1, Math.floor(p.gridSize / p.spacing) + 1);
}

/** Computes base plate side length (mm) from current params. */
export function plateSize(p: Params): number {
  return p.gridSize + p.poleDiameter + 2 * p.baseMargin;
}
