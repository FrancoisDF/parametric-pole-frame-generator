import { z } from 'zod';
import { paramsSchema, type Params } from './schema';

/**
 * ProjectFile schema: defines the structure of exported JSON project files.
 * Includes metadata for tracking project origin and updates, plus the complete params.
 */
export const projectFileSchema = z.object({
  version: z.number().default(1),
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(500).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  params: paramsSchema
});

export type ProjectFile = z.infer<typeof projectFileSchema>;

/**
 * Create a new ProjectFile from parameters and metadata.
 */
export function createProjectFile(
  params: Params,
  name: string,
  description?: string
): ProjectFile {
  const now = new Date().toISOString();
  return {
    version: 1,
    name,
    description: description || undefined,
    createdAt: now,
    updatedAt: now,
    params
  };
}

/**
 * Validate and parse a JSON object as a ProjectFile.
 * Throws ZodError if validation fails.
 */
export function parseProjectFile(data: unknown): ProjectFile {
  return projectFileSchema.parse(data);
}
