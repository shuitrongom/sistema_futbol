import { z } from "zod/v4";

export const createLocationSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  address: z.string().min(2, "La dirección es requerida"),
  capacity: z.number().int().positive("La capacidad debe ser positiva").nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255).optional(),
  address: z.string().min(2, "La dirección es requerida").optional(),
  capacity: z.number().int().positive("La capacidad debe ser positiva").nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export type CreateLocationSchema = z.infer<typeof createLocationSchema>;
export type UpdateLocationSchema = z.infer<typeof updateLocationSchema>;
