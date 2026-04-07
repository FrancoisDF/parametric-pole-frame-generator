import { z } from 'zod';

export const paramsSchema = z.object({
  // Grid
  gridSize: z.number().int().min(1).max(100).default(10),
  spacing: z.number().min(1).max(100).default(10),

  // Pole dimensions
  poleDiameter: z.number().min(0.5).max(20).default(3),
  minHeight: z.number().min(0).max(200).default(5),
  maxHeight: z.number().min(0).max(200).default(30),
  poleShape: z.enum(['straight', 'tapered']).default('straight'),

  // Base plate
  baseHeight: z.number().min(0.5).max(20).default(2),
  baseMargin: z.number().min(0).max(50).default(5),

  // Height function
  heightFunction: z.enum(['wave', 'hill', 'pyramid', 'flat']).default('wave'),
  waveFrequency: z.number().min(0.1).max(10).default(1)
});

export type Params = z.infer<typeof paramsSchema>;

export const defaultParams: Params = paramsSchema.parse({});

/** Computes base plate side length (mm) from current params. */
export function plateSize(p: Params): number {
  return (p.gridSize - 1) * p.spacing + p.poleDiameter + 2 * p.baseMargin;
}
