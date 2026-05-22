import prisma from "@/lib/prisma";

export interface StandingRow {
  id: string;
  tournamentId: string;
  phaseId: string | null;
  teamId: string;
  team: { id: string; name: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/**
 * Get standings for a tournament, optionally filtered by phase.
 * Ordered by: points → goal_difference → goals_for → alphabetical.
 */
export async function getStandings(
  tournamentId: string,
  phaseId?: string
): Promise<StandingRow[]> {
  const where: Record<string, unknown> = { tournamentId };
  if (phaseId) {
    where.phaseId = phaseId;
  } else {
    // Get standings for the main phase (first phase or null phase)
    where.phaseId = null;
  }

  const standings = await prisma.standing.findMany({
    where,
    include: {
      team: { select: { id: true, name: true } },
    },
  });

  // Sort: points desc → goalDifference desc → goalsFor desc → alphabetical
  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name);
  }) as StandingRow[];
}


/**
 * Recalculate standings for a tournament (and optionally a specific phase).
 * Iterates over all completed matches and rebuilds standings from scratch.
 * Points: 3 for win, 1 for draw, 0 for loss.
 */
export async function recalculateStandings(
  tournamentId: string,
  phaseId?: string
) {
  const matchWhere: Record<string, unknown> = {
    tournamentId,
    status: "completed",
    homeScore: { not: null },
    awayScore: { not: null },
  };

  if (phaseId) {
    matchWhere.phaseId = phaseId;
  } else {
    matchWhere.phaseId = null;
  }

  const matches = await prisma.match.findMany({
    where: matchWhere,
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  // Build stats map
  const stats = new Map<string, {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  }>();

  const initTeam = (teamId: string) => {
    if (!stats.has(teamId)) {
      stats.set(teamId, { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 });
    }
  };

  for (const match of matches) {
    const hs = match.homeScore!;
    const as_ = match.awayScore!;

    initTeam(match.homeTeamId);
    initTeam(match.awayTeamId);

    const home = stats.get(match.homeTeamId)!;
    const away = stats.get(match.awayTeamId)!;

    home.played++;
    away.played++;
    home.goalsFor += hs;
    home.goalsAgainst += as_;
    away.goalsFor += as_;
    away.goalsAgainst += hs;

    if (hs > as_) {
      home.won++;
      away.lost++;
    } else if (hs < as_) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }

  // Also include teams with no matches yet (from tournament_teams)
  const tournamentTeams = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    select: { teamId: true },
  });

  for (const tt of tournamentTeams) {
    initTeam(tt.teamId);
  }

  // Upsert standings
  for (const [teamId, s] of Array.from(stats)) {
    const goalDifference = s.goalsFor - s.goalsAgainst;
    const points = s.won * 3 + s.drawn;

    await prisma.standing.upsert({
      where: {
        tournamentId_phaseId_teamId: {
          tournamentId,
          phaseId: phaseId ?? null as unknown as string,
          teamId,
        },
      },
      update: {
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference,
        points,
      },
      create: {
        tournamentId,
        phaseId: phaseId ?? null,
        teamId,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference,
        points,
      },
    });
  }
}

/**
 * Initialize standings for all teams in a tournament.
 */
export async function initializeStandings(
  tournamentId: string,
  phaseId?: string
) {
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    select: { teamId: true },
  });

  for (const { teamId } of teams) {
    await prisma.standing.upsert({
      where: {
        tournamentId_phaseId_teamId: {
          tournamentId,
          phaseId: phaseId ?? null as unknown as string,
          teamId,
        },
      },
      update: {},
      create: {
        tournamentId,
        phaseId: phaseId ?? null,
        teamId,
      },
    });
  }
}
