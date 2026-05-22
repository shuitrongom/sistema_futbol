import { z } from "zod/v4";

export const createPlayerSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  birthDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date < new Date();
  }, "La fecha de nacimiento debe ser una fecha válida en el pasado"),
  idNumber: z.string().min(1, "El número de identificación es requerido").max(50),
  position: z.enum(["goalkeeper", "defender", "midfielder", "forward"], {
    message: "Posición inválida",
  }),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email("Email inválido").max(255).nullable().optional(),
  photoUrl: z.string().max(500).nullable().optional(),
});

export const updatePlayerSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  birthDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date < new Date();
  }, "La fecha de nacimiento debe ser una fecha válida en el pasado").optional(),
  position: z.enum(["goalkeeper", "defender", "midfielder", "forward"]).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  photoUrl: z.string().max(500).nullable().optional(),
});

export type CreatePlayerSchema = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerSchema = z.infer<typeof updatePlayerSchema>;
