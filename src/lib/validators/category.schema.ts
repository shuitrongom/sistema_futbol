import { z } from "zod/v4";

export const createCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  description: z.string().max(500).nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
