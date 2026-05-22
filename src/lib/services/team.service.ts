import prisma from "@/lib/prisma";

export interface CreateTeamInput {
  name: string;
  badgeUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  city?: string | null;
  coachId?: string | null;
  homeUniformPrimary?: string | null;
  homeUniformSecondary?: string | null;
  homeUniformDescription?: string | null;
  homeUniformImageUrl?: string | null;
  awayUniformPrimary?: string | null;
  awayUniformSecondary?: string | null;
  awayUniformDescription?: string | null;
  awayUniformImageUrl?: string | null;
  categoryIds?: string[];
}

export interface UpdateTeamInput {
  name?: string;
  badgeUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  city?: string | null;
  coachId?: string | null;
  homeUniformPrimary?: string | null;
  homeUniformSecondary?: string | null;
  homeUniformDescription?: string | null;
  homeUniformImageUrl?: string | null;
  awayUniformPrimary?: string | null;
  awayUniformSecondary?: string | null;
  awayUniformDescription?: string | null;
  awayUniformImageUrl?: string | null;
  categoryIds?: string[];
}

const teamInclude = {
  coach: { select: { id: true, fullName: true, email: true } },
  teamCategories: {
    include: { category: { select: { id: true, name: true } } },
  },
  _count: { select: { teamPlayers: true, tournamentTeams: true } },
};

export async function getAllTeams(categoryId?: string) {
  return prisma.team.findMany({
    where: categoryId
      ? { teamCategories: { some: { categoryId } } }
      : undefined,
    orderBy: { name: "asc" },
    include: teamInclude,
  });
}

export async function getTeamById(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      ...teamInclude,
      teamPlayers: {
        where: { leftAt: null },
        include: { player: true },
        orderBy: { jerseyNumber: "asc" },
      },
    },
  });
}

export async function createTeam(data: CreateTeamInput) {
  const { categoryIds, ...teamData } = data;
  return prisma.team.create({
    data: {
      ...teamData,
      teamCategories: categoryIds?.length
        ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
        : undefined,
    },
    include: teamInclude,
  });
}

export async function updateTeam(id: string, data: UpdateTeamInput) {
  const { categoryIds, ...teamData } = data;

  if (categoryIds !== undefined) {
    await prisma.teamCategory.deleteMany({ where: { teamId: id } });
    if (categoryIds.length > 0) {
      await prisma.teamCategory.createMany({
        data: categoryIds.map((categoryId) => ({ teamId: id, categoryId })),
      });
    }
  }

  return prisma.team.update({
    where: { id },
    data: teamData,
    include: teamInclude,
  });
}

export async function deleteTeam(id: string) {
  return prisma.team.delete({ where: { id } });
}

export async function teamNameExists(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.team.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}

export async function teamHasActiveTournament(id: string): Promise<boolean> {
  const count = await prisma.tournamentTeam.count({
    where: {
      teamId: id,
      tournament: { status: { in: ["registration", "in_progress"] } },
    },
  });
  return count > 0;
}

export async function assignCoach(
  teamId: string,
  coachId: string | null
) {
  return prisma.team.update({
    where: { id: teamId },
    data: { coachId },
    include: teamInclude,
  });
}

export async function addPlayerToTeam(
  teamId: string,
  playerId: string,
  jerseyNumber: number
) {
  return prisma.teamPlayer.create({
    data: {
      teamId,
      playerId,
      jerseyNumber,
      joinedAt: new Date(),
    },
    include: { player: true },
  });
}

export async function removePlayerFromTeam(
  teamId: string,
  playerId: string
) {
  const teamPlayer = await prisma.teamPlayer.findFirst({
    where: { teamId, playerId, leftAt: null },
  });
  if (!teamPlayer) return null;

  return prisma.teamPlayer.update({
    where: { id: teamPlayer.id },
    data: { leftAt: new Date() },
  });
}

export async function jerseyNumberTaken(
  teamId: string,
  jerseyNumber: number,
  excludePlayerId?: string
): Promise<boolean> {
  const existing = await prisma.teamPlayer.findFirst({
    where: {
      teamId,
      jerseyNumber,
      leftAt: null,
      ...(excludePlayerId ? { playerId: { not: excludePlayerId } } : {}),
    },
    select: { id: true },
  });
  return !!existing;
}
