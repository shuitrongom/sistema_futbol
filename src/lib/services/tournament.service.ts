import prisma from "@/lib/prisma";
import type { TournamentStatus } from "@prisma/client";

export interface CreateTournamentInput {
  name: string;
  startDate: string;
  endDate: string;
  format: "league" | "knockout" | "group_knockout";
  minTeams?: number;
  maxTeams: number;
  categoryIds: string[];
}

export interface UpdateTournamentInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  format?: "league" | "knockout" | "group_knockout";
  minTeams?: number;
  maxTeams?: number;
  status?: TournamentStatus;
  categoryIds?: string[];
}

const tournamentInclude = {
  tournamentCategories: {
    include: { category: { select: { id: true, name: true } } },
  },
  _count: { select: { tournamentTeams: true, matches: true, phases: true } },
};

// Valid status transitions: draft→registration→in_progress→completed/cancelled
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["registration", "cancelled"],
  registration: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isValidStatusTransition(
  current: TournamentStatus,
  next: TournamentStatus
): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

export async function getAllTournaments(status?: string) {
  return prisma.tournament.findMany({
    where: status ? { status: status as TournamentStatus } : undefined,
    orderBy: { startDate: "desc" },
    include: tournamentInclude,
  });
}

export async function getTournamentById(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      ...tournamentInclude,
      tournamentTeams: {
        include: {
          team: {
            include: {
              teamCategories: {
                include: { category: { select: { id: true, name: true } } },
              },
              _count: { select: { teamPlayers: true } },
            },
          },
        },
        orderBy: { registeredAt: "asc" },
      },
      phases: { orderBy: { phaseOrder: "asc" } },
    },
  });
}

export async function createTournament(data: CreateTournamentInput) {
  const { categoryIds, ...tournamentData } = data;
  return prisma.tournament.create({
    data: {
      name: tournamentData.name,
      startDate: new Date(tournamentData.startDate),
      endDate: new Date(tournamentData.endDate),
      format: tournamentData.format,
      minTeams: tournamentData.minTeams ?? 2,
      maxTeams: tournamentData.maxTeams,
      status: "draft",
      tournamentCategories: {
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
    include: tournamentInclude,
  });
}

export async function updateTournament(id: string, data: UpdateTournamentInput) {
  const { categoryIds, status, ...rest } = data;

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return null;

  // Validate status transition if status is being changed
  if (status && status !== tournament.status) {
    if (!isValidStatusTransition(tournament.status, status)) {
      throw new Error(
        `Transición de estado inválida: ${tournament.status} → ${status}`
      );
    }
  }

  // Only allow edits to draft/registration tournaments (except status changes)
  const hasDataChanges = Object.keys(rest).length > 0 || categoryIds !== undefined;
  if (hasDataChanges && !["draft", "registration"].includes(tournament.status)) {
    throw new Error("Solo se pueden modificar torneos en estado borrador o inscripción");
  }

  // Update categories if provided
  if (categoryIds !== undefined) {
    await prisma.tournamentCategory.deleteMany({ where: { tournamentId: id } });
    if (categoryIds.length > 0) {
      await prisma.tournamentCategory.createMany({
        data: categoryIds.map((categoryId) => ({ tournamentId: id, categoryId })),
      });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (rest.name !== undefined) updateData.name = rest.name;
  if (rest.startDate !== undefined) updateData.startDate = new Date(rest.startDate);
  if (rest.endDate !== undefined) updateData.endDate = new Date(rest.endDate);
  if (rest.format !== undefined) updateData.format = rest.format;
  if (rest.minTeams !== undefined) updateData.minTeams = rest.minTeams;
  if (rest.maxTeams !== undefined) updateData.maxTeams = rest.maxTeams;
  if (status !== undefined) updateData.status = status;

  return prisma.tournament.update({
    where: { id },
    data: updateData,
    include: tournamentInclude,
  });
}

export async function deleteTournament(id: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return null;

  if (!["draft", "cancelled"].includes(tournament.status)) {
    throw new Error("Solo se pueden eliminar torneos en estado borrador o cancelado");
  }

  return prisma.tournament.delete({ where: { id } });
}

export async function inscribeTeam(tournamentId: string, teamId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      tournamentCategories: true,
      _count: { select: { tournamentTeams: true } },
    },
  });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.status !== "registration" && tournament.status !== "draft") {
    throw new Error("El torneo no está en período de inscripción");
  }

  // Check max teams
  if (tournament._count.tournamentTeams >= tournament.maxTeams) {
    throw new Error("El torneo ha alcanzado el número máximo de equipos");
  }

  // Check duplicate
  const existing = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId, teamId } },
  });
  if (existing) throw new Error("El equipo ya está inscrito en este torneo");

  // Verify team has at least one matching category
  const tournamentCategoryIds = tournament.tournamentCategories.map((tc) => tc.categoryId);
  const teamCategories = await prisma.teamCategory.findMany({
    where: { teamId },
    select: { categoryId: true },
  });
  const teamCategoryIds = teamCategories.map((tc) => tc.categoryId);
  const hasMatchingCategory = teamCategoryIds.some((id) =>
    tournamentCategoryIds.includes(id)
  );

  if (!hasMatchingCategory) {
    throw new Error(
      "El equipo no pertenece a ninguna de las categorías permitidas del torneo"
    );
  }

  return prisma.tournamentTeam.create({
    data: { tournamentId, teamId },
    include: {
      team: {
        include: {
          teamCategories: {
            include: { category: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
}

export async function removeTeam(tournamentId: string, teamId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (!["draft", "registration"].includes(tournament.status)) {
    throw new Error("Solo se pueden remover equipos antes de que inicie el torneo");
  }

  const existing = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId, teamId } },
  });
  if (!existing) throw new Error("El equipo no está inscrito en este torneo");

  return prisma.tournamentTeam.delete({
    where: { tournamentId_teamId: { tournamentId, teamId } },
  });
}

export async function getTournamentTeams(tournamentId: string) {
  return prisma.tournamentTeam.findMany({
    where: { tournamentId },
    include: {
      team: {
        include: {
          teamCategories: {
            include: { category: { select: { id: true, name: true } } },
          },
          _count: { select: { teamPlayers: true } },
        },
      },
    },
    orderBy: { registeredAt: "asc" },
  });
}
