import { z } from "zod/v4";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hexadecimal inválido").nullable().optional();

export const createTeamSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  badgeUrl: z.string().max(500).nullable().optional(),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  city: z.string().max(255).nullable().optional(),
  coachId: z.string().uuid().nullable().optional(),
  homeUniformPrimary: hexColor,
  homeUniformSecondary: hexColor,
  homeUniformDescription: z.string().nullable().optional(),
  homeUniformImageUrl: z.string().max(500).nullable().optional(),
  awayUniformPrimary: hexColor,
  awayUniformSecondary: hexColor,
  awayUniformDescription: z.string().nullable().optional(),
  awayUniformImageUrl: z.string().max(500).nullable().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const addPlayerToTeamSchema = z.object({
  playerId: z.string().uuid("ID de jugador inválido"),
  jerseyNumber: z.number().int().min(1, "Mínimo 1").max(99, "Máximo 99"),
});

export type CreateTeamSchema = z.infer<typeof createTeamSchema>;
export type UpdateTeamSchema = z.infer<typeof updateTeamSchema>;
export type AddPlayerToTeamSchema = z.infer<typeof addPlayerToTeamSchema>;
