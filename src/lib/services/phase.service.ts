import prisma from "@/lib/prisma";
import type { PhaseType } from "@prisma/client";

export interface CreatePhaseInput {
  tournamentId: string;
  name: string;
  type: PhaseType;
  phaseOrder: number;
  classificationCriteria?: Record<string, unknown>;
}

export interface ClassificationCriteria {
  topN?: number; // top N teams from standings qualify
  customTeamIds?: string[]; // manually selected teams
}

export async function getPhasesByTournament(tournamentId: string) {
  return prisma.phase.findMany({
    where: { tournamentId },
    include: {
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
        orderBy: { dateTime: "asc" },
      },
      standings: {
        include: { team: { select: { id: true, name: true } } },
        orderBy: { points: "desc" },
      },
    },
    orderBy: { phaseOrder: "asc" },
  });
}

export async function getPhaseById(id: string) {
  return prisma.phase.findUnique({
    where: { id },
    include: {
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
        orderBy: { dateTime: "asc" },
      },
      standings: {
        include: { team: { select: { id: true, name: true } } },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
      },
    },
  });
}

export async function createPhase(data: CreatePhaseInput) {
  return prisma.phase.create({
    data: {
      tournamentId: data.tournamentId,
      name: data.name,
      type: data.type,
      phaseOrder: data.phaseOrder,
      classificationCriteria: data.classificationCriteria
        ? JSON.parse(JSON.stringify(data.classificationCriteria))
        : undefined,
      status: "pending",
    },
  });
}

export async function updatePhaseStatus(id: string, status: string) {
  return prisma.phase.update({
    where: { id },
    data: { status },
  });
}

export async function setClassificationCriteria(
  id: string,
  criteria: ClassificationCriteria
) {
  return prisma.phase.update({
    where: { id },
    data: {
      classificationCriteria: JSON.parse(JSON.stringify(criteria)),
    },
  });
}

/**
 * Determine qualified teams from a phase based on standings and criteria.
 * Returns team IDs that qualify for the next phase.
 */
export async function getQualifiedTeams(phaseId: string): Promise<string[]> {
  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: {
      standings: {
        orderBy: [
          { points: "desc" },
          { goalDifference: "desc" },
          { goalsFor: "desc" },
        ],
        include: { team: { select: { id: true, name: true } } },
      },
    },
  });

  if (!phase) throw new Error("Fase no encontrada");

  const criteria = phase.classificationCriteria as ClassificationCriteria | null;

  // If custom team IDs are specified, use those
  if (criteria?.customTeamIds && criteria.customTeamIds.length > 0) {
    return criteria.customTeamIds;
  }

  // Default: top N teams from standings
  const topN = criteria?.topN ?? 2;
  return phase.standings.slice(0, topN).map((s) => s.teamId);
}

/**
 * Advance teams to the next phase manually.
 * Creates matches in the next phase for the given teams.
 */
export async function advanceTeamsToNextPhase(
  currentPhaseId: string,
  teamIds: string[]
) {
  const currentPhase = await prisma.phase.findUnique({
    where: { id: currentPhaseId },
    include: { tournament: true },
  });

  if (!currentPhase) throw new Error("Fase actual no encontrada");

  // Find the next phase
  const nextPhase = await prisma.phase.findFirst({
    where: {
      tournamentId: currentPhase.tournamentId,
      phaseOrder: currentPhase.phaseOrder + 1,
    },
  });

  if (!nextPhase) throw new Error("No hay fase siguiente");

  // Mark current phase as completed
  await prisma.phase.update({
    where: { id: currentPhaseId },
    data: { status: "completed" },
  });

  // Activate next phase
  await prisma.phase.update({
    where: { id: nextPhase.id },
    data: { status: "active" },
  });

  // Create matches for the next phase (pair teams sequentially)
  const matches = [];
  const tournament = currentPhase.tournament;
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);

  for (let i = 0; i < teamIds.length; i += 2) {
    if (i + 1 < teamIds.length) {
      const matchDate = new Date(baseDate);
      matchDate.setDate(matchDate.getDate() + Math.floor(i / 2));
      matchDate.setHours(16, 0, 0, 0);

      matches.push({
        tournamentId: currentPhase.tournamentId,
        phaseId: nextPhase.id,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[i + 1],
        dateTime: matchDate,
        status: "scheduled" as const,
      });
    }
  }

  if (matches.length > 0) {
    await prisma.match.createMany({ data: matches });
  }

  // Initialize standings for next phase
  for (const teamId of teamIds) {
    await prisma.standing.create({
      data: {
        tournamentId: currentPhase.tournamentId,
        phaseId: nextPhase.id,
        teamId,
      },
    });
  }

  return {
    phase: nextPhase,
    matchesCreated: matches.length,
    teamsAdvanced: teamIds.length,
  };
}
