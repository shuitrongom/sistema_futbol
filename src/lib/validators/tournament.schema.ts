import { z } from "zod/v4";

const TOURNAMENT_FORMATS = [
  "league",
  "knockout",
  "group_knockout",
  "double_knockout",
  "swiss",
  "league_playoff",
  "league_single",
  "cup",
  "round_robin_groups",
  "mini_tournament",
] as const;

export const createTournamentSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255, "El nombre no puede exceder 255 caracteres"),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha de inicio inválida"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha de fin inválida"),
  format: z.enum(TOURNAMENT_FORMATS, {
    message: "Formato de torneo no válido",
  }),
  minTeams: z.number().int().min(2, "Mínimo 2 equipos").default(2),
  maxTeams: z.number().int().min(2, "El máximo de equipos debe ser al menos 2"),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["endDate"],
}).refine((data) => data.maxTeams >= data.minTeams, {
  message: "El máximo de equipos debe ser mayor o igual al mínimo",
  path: ["maxTeams"],
});

export const updateTournamentSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255).optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida").optional(),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida").optional(),
  format: z.enum(TOURNAMENT_FORMATS).optional(),
  minTeams: z.number().int().min(2).optional(),
  maxTeams: z.number().int().min(2).optional(),
  status: z.enum(["draft", "registration", "in_progress", "completed", "cancelled"]).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export const inscribeTeamSchema = z.object({
  teamId: z.string().uuid("ID de equipo inválido"),
});

export type CreateTournamentSchema = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentSchema = z.infer<typeof updateTournamentSchema>;
export type InscribeTeamSchema = z.infer<typeof inscribeTeamSchema>;
