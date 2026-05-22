import { z } from "zod/v4";

const rating = z.number().int().min(1, "Mínimo 1").max(10, "Máximo 10");
const _optionalRating = rating.optional().nullable();

// Position-specific metric schemas
const goalkeeperMetrics = z.object({
  reflexes: rating,
  distribution: rating,
  aerialCommand: rating,
  oneOnOne: rating,
});

const defenderMetrics = z.object({
  tackling: rating,
  aerial: rating,
  marking: rating,
  coverageRange: rating,
});

const midfielderMetrics = z.object({
  passingRange: rating,
  vision: rating,
  workRate: rating,
  ballRetention: rating,
});

const forwardMetrics = z.object({
  finishing: rating,
  movement: rating,
  holdUpPlay: rating,
  composure: rating,
});

export const positionMetricsSchema = z.discriminatedUnion("position", [
  z.object({ position: z.literal("goalkeeper"), metrics: goalkeeperMetrics }),
  z.object({ position: z.literal("defender"), metrics: defenderMetrics }),
  z.object({ position: z.literal("midfielder"), metrics: midfielderMetrics }),
  z.object({ position: z.literal("forward"), metrics: forwardMetrics }),
]);

export const createEvaluationSchema = z.object({
  playerId: z.string().uuid("ID de jugador inválido"),
  teamId: z.string().uuid("ID de equipo inválido"),
  context: z.enum(["match", "training", "formal"]),
  evaluationDate: z.string(),
  // Technical
  ballControl: rating,
  passing: rating,
  dribbling: rating,
  shooting: rating,
  heading: rating,
  weakFoot: rating,
  technicalComments: z.string().max(2000).optional().nullable(),
  // Tactical
  positioning: rating,
  gameVision: rating,
  decisionMaking: rating,
  systemUnderstanding: rating,
  tacticalComments: z.string().max(2000).optional().nullable(),
  // Physical
  speed: rating,
  endurance: rating,
  strength: rating,
  agility: rating,
  coordination: rating,
  physicalComments: z.string().max(2000).optional().nullable(),
  // Mental
  concentration: rating,
  attitude: rating,
  leadership: rating,
  teamwork: rating,
  resilience: rating,
  mentalComments: z.string().max(2000).optional().nullable(),
  // Position metrics
  positionMetrics: positionMetricsSchema.optional().nullable(),
});

export type CreateEvaluationSchema = z.infer<typeof createEvaluationSchema>;
export type PositionMetrics = z.infer<typeof positionMetricsSchema>;
