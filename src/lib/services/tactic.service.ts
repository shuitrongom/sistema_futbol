import prisma from "@/lib/prisma";
import type { StrategyType } from "@prisma/client";

export interface CreateTacticInput {
  teamId: string;
  name: string;
  formation: string;
  strategy?: StrategyType | null;
  playerPositions: Record<string, string>;
  isPrimary?: boolean;
}

export interface UpdateTacticInput {
  name?: string;
  formation?: string;
  strategy?: StrategyType | null;
  playerPositions?: Record<string, string>;
  isPrimary?: boolean;
}

const tacticInclude = {
  team: { select: { id: true, name: true } },
};

/**
 * Validates that a formation string sums to 10 (+ 1 goalkeeper = 11).
 * E.g. "4-4-2" → 4+4+2 = 10, + 1 GK = 11
 */
export function validateFormation(formation: string): boolean {
  const parts = formation.split("-").map(Number);
  if (parts.some((n) => isNaN(n) || n <= 0)) return false;
  const sum = parts.reduce((a, b) => a + b, 0);
  return sum + 1 === 11; // +1 for goalkeeper
}

/**
 * Validates that the number of player positions matches the formation.
 * Formation "4-4-2" requires exactly 11 positions (10 outfield + 1 GK).
 */
export function validatePlayerPositionsCount(
  formation: string,
  playerPositions: Record<string, string>
): boolean {
  const positionCount = Object.keys(playerPositions).length;
  const parts = formation.split("-").map(Number);
  const expectedCount = parts.reduce((a, b) => a + b, 0) + 1; // +1 GK
  return positionCount === expectedCount;
}

export async function getTacticsByTeam(teamId: string) {
  return prisma.tactic.findMany({
    where: { teamId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    include: tacticInclude,
  });
}

export async function getTacticById(id: string) {
  return prisma.tactic.findUnique({
    where: { id },
    include: tacticInclude,
  });
}

export async function createTactic(data: CreateTacticInput) {
  // If marking as primary, unmark all others for this team
  if (data.isPrimary) {
    await prisma.tactic.updateMany({
      where: { teamId: data.teamId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.tactic.create({
    data: {
      teamId: data.teamId,
      name: data.name,
      formation: data.formation,
      strategy: data.strategy ?? null,
      playerPositions: data.playerPositions,
      isPrimary: data.isPrimary ?? false,
    },
    include: tacticInclude,
  });
}

export async function updateTactic(id: string, data: UpdateTacticInput) {
  const existing = await prisma.tactic.findUnique({
    where: { id },
    select: { teamId: true },
  });

  if (!existing) return null;

  // If marking as primary, unmark all others for this team
  if (data.isPrimary) {
    await prisma.tactic.updateMany({
      where: { teamId: existing.teamId, isPrimary: true, id: { not: id } },
      data: { isPrimary: false },
    });
  }

  return prisma.tactic.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.formation !== undefined && { formation: data.formation }),
      ...(data.strategy !== undefined && { strategy: data.strategy }),
      ...(data.playerPositions !== undefined && { playerPositions: data.playerPositions }),
      ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
    },
    include: tacticInclude,
  });
}

export async function deleteTactic(id: string) {
  return prisma.tactic.delete({ where: { id } });
}

export async function setTacticAsPrimary(id: string) {
  const tactic = await prisma.tactic.findUnique({
    where: { id },
    select: { teamId: true },
  });

  if (!tactic) return null;

  // Unmark all others for this team
  await prisma.tactic.updateMany({
    where: { teamId: tactic.teamId, isPrimary: true },
    data: { isPrimary: false },
  });

  return prisma.tactic.update({
    where: { id },
    data: { isPrimary: true },
    include: tacticInclude,
  });
}

/**
 * Get tactics used in matches for a team, with match results.
 */
export async function getTacticHistoryForTeam(teamId: string) {
  const matches = await prisma.match.findMany({
    where: {
      status: "completed",
      OR: [
        { homeTeamId: teamId, homeTacticId: { not: null } },
        { awayTeamId: teamId, awayTacticId: { not: null } },
      ],
    },
    orderBy: { dateTime: "desc" },
    select: {
      id: true,
      dateTime: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      homeTacticId: true,
      awayTacticId: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  });

  // Collect tactic IDs used by this team
  const tacticIds = new Set<string>();
  for (const m of matches) {
    if (m.homeTeamId === teamId && m.homeTacticId) tacticIds.add(m.homeTacticId);
    if (m.awayTeamId === teamId && m.awayTacticId) tacticIds.add(m.awayTacticId);
  }

  const tactics = await prisma.tactic.findMany({
    where: { id: { in: Array.from(tacticIds) } },
    select: { id: true, name: true, formation: true },
  });

  const tacticMap = new Map(tactics.map((t) => [t.id, t]));

  return matches.map((m) => {
    const isHome = m.homeTeamId === teamId;
    const tacticId = isHome ? m.homeTacticId : m.awayTacticId;
    const tactic = tacticId ? tacticMap.get(tacticId) : null;
    const teamScore = isHome ? m.homeScore : m.awayScore;
    const opponentScore = isHome ? m.awayScore : m.homeScore;
    const opponent = isHome ? m.awayTeam : m.homeTeam;

    let result: "win" | "draw" | "loss" | "unknown" = "unknown";
    if (teamScore !== null && opponentScore !== null) {
      if (teamScore > opponentScore) result = "win";
      else if (teamScore < opponentScore) result = "loss";
      else result = "draw";
    }

    return {
      matchId: m.id,
      dateTime: m.dateTime,
      opponent,
      teamScore,
      opponentScore,
      result,
      tactic,
    };
  });
}
