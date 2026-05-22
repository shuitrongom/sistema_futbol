import prisma from "@/lib/prisma";
import type { MatchStatus } from "@prisma/client";

export interface RegisterResultInput {
  homeScore: number;
  awayScore: number;
}

export interface MatchEventInput {
  teamId?: string;
  playerId?: string;
  eventType: "goal" | "yellow_card" | "red_card" | "substitution" | "assist";
  minute?: number;
  details?: Record<string, unknown>;
}

const matchInclude = {
  homeTeam: { select: { id: true, name: true, badgeUrl: true, primaryColor: true } },
  awayTeam: { select: { id: true, name: true, badgeUrl: true, primaryColor: true } },
  tournament: { select: { id: true, name: true } },
  phase: { select: { id: true, name: true, type: true } },
  location: { select: { id: true, name: true, address: true } },
  events: {
    include: {
      player: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { minute: "asc" as const },
  },
};

export async function getAllMatches(filters?: {
  tournamentId?: string;
  status?: MatchStatus;
  teamId?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.tournamentId) where.tournamentId = filters.tournamentId;
  if (filters?.status) where.status = filters.status;
  if (filters?.teamId) {
    where.OR = [
      { homeTeamId: filters.teamId },
      { awayTeamId: filters.teamId },
    ];
  }

  return prisma.match.findMany({
    where,
    include: matchInclude,
    orderBy: { dateTime: "asc" },
  });
}

export async function getMatchById(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: matchInclude,
  });
}


/**
 * Register or update the result of a match.
 * Validates match exists and is scheduled/in_progress.
 * Updates standings automatically after registering.
 */
export async function registerResult(matchId: string, data: RegisterResultInput) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Partido no encontrado");

  if (!["scheduled", "in_progress"].includes(match.status)) {
    throw new Error("Solo se pueden registrar resultados de partidos programados o en curso");
  }

  if (data.homeScore < 0 || data.awayScore < 0) {
    throw new Error("Los goles deben ser números enteros no negativos");
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      status: "completed",
    },
    include: matchInclude,
  });

  // Recalculate standings for the tournament/phase
  const { recalculateStandings } = await import("./standings.service");
  await recalculateStandings(match.tournamentId, match.phaseId ?? undefined);

  // Process suspensions from match events
  const { processMatchSuspensions } = await import("./suspension.service");
  await processMatchSuspensions(matchId);

  return updated;
}

/**
 * Update an already completed match result and recalculate.
 */
export async function updateResult(matchId: string, data: RegisterResultInput) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Partido no encontrado");

  if (data.homeScore < 0 || data.awayScore < 0) {
    throw new Error("Los goles deben ser números enteros no negativos");
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      status: "completed",
    },
    include: matchInclude,
  });

  const { recalculateStandings } = await import("./standings.service");
  await recalculateStandings(match.tournamentId, match.phaseId ?? undefined);

  return updated;
}

/**
 * Add an event to a match (goal, card, substitution, assist).
 */
export async function addMatchEvent(matchId: string, event: MatchEventInput) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Partido no encontrado");

  const validTypes = ["goal", "yellow_card", "red_card", "substitution", "assist"];
  if (!validTypes.includes(event.eventType)) {
    throw new Error(`Tipo de evento inválido: ${event.eventType}`);
  }

  // Validate team belongs to the match
  if (event.teamId && event.teamId !== match.homeTeamId && event.teamId !== match.awayTeamId) {
    throw new Error("El equipo no participa en este partido");
  }

  const created = await prisma.matchEvent.create({
    data: {
      matchId,
      teamId: event.teamId ?? null,
      playerId: event.playerId ?? null,
      eventType: event.eventType,
      minute: event.minute ?? null,
      details: event.details ? JSON.parse(JSON.stringify(event.details)) : undefined,
    },
    include: {
      player: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return created;
}

/**
 * Get all events for a match.
 */
export async function getMatchEvents(matchId: string) {
  return prisma.matchEvent.findMany({
    where: { matchId },
    include: {
      player: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { minute: "asc" },
  });
}

/**
 * Change match status (e.g., to in_progress, postponed, cancelled).
 */
export async function updateMatchStatus(matchId: string, status: MatchStatus) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Partido no encontrado");

  return prisma.match.update({
    where: { id: matchId },
    data: { status },
    include: matchInclude,
  });
}
