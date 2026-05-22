import { z } from "zod/v4";

export const registerResultSchema = z.object({
  homeScore: z.number().int().min(0, "Los goles deben ser no negativos"),
  awayScore: z.number().int().min(0, "Los goles deben ser no negativos"),
});

export const matchEventSchema = z.object({
  teamId: z.string().uuid().optional(),
  playerId: z.string().uuid().optional(),
  eventType: z.enum(["goal", "yellow_card", "red_card", "substitution", "assist"]),
  minute: z.number().int().min(0).max(150).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type RegisterResultSchema = z.infer<typeof registerResultSchema>;
export type MatchEventSchema = z.infer<typeof matchEventSchema>;
