import { z } from "zod/v4";

export const createTrainingPlanSchema = z.object({
  teamId: z.string().uuid("ID de equipo inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  targetAgeMin: z.number().int().min(4).max(99).optional().nullable(),
  targetAgeMax: z.number().int().min(4).max(99).optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
  objectives: z.string().max(2000).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isShared: z.boolean().optional().default(false),
});

export const updateTrainingPlanSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  targetAgeMin: z.number().int().min(4).max(99).optional().nullable(),
  targetAgeMax: z.number().int().min(4).max(99).optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
  objectives: z.string().max(2000).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isShared: z.boolean().optional(),
  effectivenessNotes: z.string().max(2000).optional().nullable(),
});

export const createSessionSchema = z.object({
  sessionDate: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(1).max(600).optional().nullable(),
  phase: z.enum(["warmup", "main", "cooldown"]).optional().nullable(),
  sessionOrder: z.number().int().min(1),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid("ID de ejercicio inválido"),
        exerciseOrder: z.number().int().min(1),
      })
    )
    .optional()
    .default([]),
});

export const executeSessionSchema = z.object({
  executedAt: z.string().optional(),
  attendance: z.array(z.string().uuid("ID de jugador inválido")).optional().default([]),
  exerciseRatings: z
    .array(
      z.object({
        sessionExerciseId: z.string().uuid(),
        effectivenessRating: z.number().int().min(1).max(5),
        coachNotes: z.string().max(1000).optional().nullable(),
      })
    )
    .optional()
    .default([]),
});

export type CreateTrainingPlanSchema = z.infer<typeof createTrainingPlanSchema>;
export type UpdateTrainingPlanSchema = z.infer<typeof updateTrainingPlanSchema>;
export type CreateSessionSchema = z.infer<typeof createSessionSchema>;
export type ExecuteSessionSchema = z.infer<typeof executeSessionSchema>;
