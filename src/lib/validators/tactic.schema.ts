import { z } from "zod/v4";

const SUPPORTED_FORMATIONS = ["4-4-2", "4-3-3", "3-5-2", "5-3-2", "4-2-3-1"] as const;

export const formationSchema = z.enum(SUPPORTED_FORMATIONS, {
  error: "Formación no soportada. Use: 4-4-2, 4-3-3, 3-5-2, 5-3-2, 4-2-3-1",
});

export const strategySchema = z.enum(["offensive", "defensive", "counter_attack", "possession"]).optional().nullable();

export const createTacticSchema = z.object({
  teamId: z.string().uuid("ID de equipo inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  formation: formationSchema,
  strategy: strategySchema,
  playerPositions: z.record(z.string(), z.string().uuid("ID de jugador inválido")),
  isPrimary: z.boolean().optional().default(false),
});

export const updateTacticSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255).optional(),
  formation: formationSchema.optional(),
  strategy: strategySchema,
  playerPositions: z.record(z.string(), z.string().uuid("ID de jugador inválido")).optional(),
  isPrimary: z.boolean().optional(),
});

export type CreateTacticSchema = z.infer<typeof createTacticSchema>;
export type UpdateTacticSchema = z.infer<typeof updateTacticSchema>;
