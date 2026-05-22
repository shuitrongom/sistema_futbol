import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const CACHE_PREFIX = "stats";
const CACHE_TTL = 60 * 30; // 30 minutes

// ─── Cache helpers ───

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    // Redis unavailable
  }
  return null;
}

async function setCache(key: string, data: unknown, ttl = CACHE_TTL): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch {
    // Redis unavailable
  }
}

// ─── Types ───

export interface TopScorer {
  playerId: string;
  playerName: string;
  teamId: string | null;
  teamName: string | null;
  goals: number;
}

export interface TopAssist {
  playerId: string;
  playerName: string;
  teamId: string | null;
  teamName: string | null;
  assists: number;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface TournamentStats {
  topScorers: TopScorer[];
  topAssists: TopAssist[];
  teamMostWins: TeamStanding | null;
  teamMostGoals: TeamStanding | null;
  teamLeastConceded: TeamStanding | null;
  avgGoalsPerMatch: number;
  totalMatches: number;
  totalGoals: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  matchHistory: {
    matchId: string;
    date: string;
    opponent: string;
    homeScore: number | null;
    awayScore: number | null;
    isHome: boolean;
    result: "win" | "draw" | "loss" | "pending";
    tournament: string;
  }[];
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  position: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

// ─── Tournament Statistics ───

export async function getTournamentStats(tournamentId: string): Promise<TournamentStats> {
  const cacheKey = `${CACHE_PREFIX}:tournament:${tournamentId}`;
  const cached = await getCached<TournamentStats>(cacheKey);
  if (cached) return cached;

  // Get completed matches for this tournament
  const matches = await prisma.match.findMany({
    where: { tournamentId, status: "completed" },
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
      homeTeamId: true,
      awayTeamId: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  });

  // Get all events for completed matches
  const matchIds = matches.map((m) => m.id);
  const events = await prisma.matchEvent.findMany({
    where: { matchId: { in: matchIds } },
    select: {
      eventType: true,
      playerId: true,
      teamId: true,
      player: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });

  // Top scorers
  const goalMap = new Map<string, TopScorer>();
  for (const ev of events) {
    if (ev.eventType === "goal" && ev.playerId) {
      const existing = goalMap.get(ev.playerId);
      if (existing) {
        existing.goals++;
      } else {
        goalMap.set(ev.playerId, {
          playerId: ev.playerId,
          playerName: ev.player?.fullName || "Desconocido",
          teamId: ev.teamId,
          teamName: ev.team?.name || null,
          goals: 1,
        });
      }
    }
  }
  const topScorers = Array.from(goalMap.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 20);

  // Top assists
  const assistMap = new Map<string, TopAssist>();
  for (const ev of events) {
    if (ev.eventType === "assist" && ev.playerId) {
      const existing = assistMap.get(ev.playerId);
      if (existing) {
        existing.assists++;
      } else {
        assistMap.set(ev.playerId, {
          playerId: ev.playerId,
          playerName: ev.player?.fullName || "Desconocido",
          teamId: ev.teamId,
          teamName: ev.team?.name || null,
          assists: 1,
        });
      }
    }
  }
  const topAssists = Array.from(assistMap.values())
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 20);

  // Team standings aggregation
  const teamMap = new Map<string, TeamStanding>();
  for (const m of matches) {
    const homeId = m.homeTeamId;
    const awayId = m.awayTeamId;
    const hs = m.homeScore ?? 0;
    const as_ = m.awayScore ?? 0;

    if (!teamMap.has(homeId)) {
      teamMap.set(homeId, { teamId: homeId, teamName: m.homeTeam.name, wins: 0, goalsFor: 0, goalsAgainst: 0 });
    }
    if (!teamMap.has(awayId)) {
      teamMap.set(awayId, { teamId: awayId, teamName: m.awayTeam.name, wins: 0, goalsFor: 0, goalsAgainst: 0 });
    }

    const home = teamMap.get(homeId)!;
    const away = teamMap.get(awayId)!;

    home.goalsFor += hs;
    home.goalsAgainst += as_;
    away.goalsFor += as_;
    away.goalsAgainst += hs;

    if (hs > as_) home.wins++;
    else if (as_ > hs) away.wins++;
  }

  const teams = Array.from(teamMap.values());
  const teamMostWins = teams.length > 0
    ? teams.reduce((a, b) => (b.wins > a.wins ? b : a))
    : null;
  const teamMostGoals = teams.length > 0
    ? teams.reduce((a, b) => (b.goalsFor > a.goalsFor ? b : a))
    : null;
  const teamLeastConceded = teams.length > 0
    ? teams.reduce((a, b) => (a.goalsAgainst < b.goalsAgainst ? a : b))
    : null;

  const totalGoals = matches.reduce((sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const avgGoalsPerMatch = matches.length > 0 ? Math.round((totalGoals / matches.length) * 100) / 100 : 0;

  const result: TournamentStats = {
    topScorers,
    topAssists,
    teamMostWins,
    teamMostGoals,
    teamLeastConceded,
    avgGoalsPerMatch,
    totalMatches: matches.length,
    totalGoals,
  };

  await setCache(cacheKey, result);
  return result;
}


// ─── Team Statistics ───

export async function getTeamStats(teamId: string): Promise<TeamStats> {
  const cacheKey = `${CACHE_PREFIX}:team:${teamId}`;
  const cached = await getCached<TeamStats>(cacheKey);
  if (cached) return cached;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true },
  });

  if (!team) throw new Error("Equipo no encontrado");

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    orderBy: { dateTime: "desc" },
    select: {
      id: true,
      dateTime: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeamId: true,
      awayTeamId: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      tournament: { select: { name: true } },
    },
  });

  const matchHistory = matches.map((m) => {
    const isHome = m.homeTeamId === teamId;
    const opponent = isHome ? m.awayTeam.name : m.homeTeam.name;
    let result: "win" | "draw" | "loss" | "pending" = "pending";
    if (m.status === "completed" && m.homeScore !== null && m.awayScore !== null) {
      const teamGoals = isHome ? m.homeScore : m.awayScore;
      const oppGoals = isHome ? m.awayScore : m.homeScore;
      result = teamGoals > oppGoals ? "win" : teamGoals < oppGoals ? "loss" : "draw";
    }
    return {
      matchId: m.id,
      date: m.dateTime.toISOString(),
      opponent,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      isHome,
      result,
      tournament: m.tournament?.name || "",
    };
  });

  const completed = matchHistory.filter((m) => m.result !== "pending");
  const wins = completed.filter((m) => m.result === "win").length;
  const draws = completed.filter((m) => m.result === "draw").length;
  const losses = completed.filter((m) => m.result === "loss").length;

  const goalsFor = matches
    .filter((m) => m.status === "completed")
    .reduce((sum, m) => {
      const isHome = m.homeTeamId === teamId;
      return sum + (isHome ? m.homeScore ?? 0 : m.awayScore ?? 0);
    }, 0);

  const goalsAgainst = matches
    .filter((m) => m.status === "completed")
    .reduce((sum, m) => {
      const isHome = m.homeTeamId === teamId;
      return sum + (isHome ? m.awayScore ?? 0 : m.homeScore ?? 0);
    }, 0);

  const played = completed.length;

  const result: TeamStats = {
    teamId: team.id,
    teamName: team.name,
    matchHistory,
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    avgGoalsFor: played > 0 ? Math.round((goalsFor / played) * 100) / 100 : 0,
    avgGoalsAgainst: played > 0 ? Math.round((goalsAgainst / played) * 100) / 100 : 0,
  };

  await setCache(cacheKey, result);
  return result;
}

// ─── Player Statistics ───

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const cacheKey = `${CACHE_PREFIX}:player:${playerId}`;
  const cached = await getCached<PlayerStats>(cacheKey);
  if (cached) return cached;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, fullName: true, position: true },
  });

  if (!player) throw new Error("Jugador no encontrado");

  const events = await prisma.matchEvent.findMany({
    where: { playerId },
    select: {
      eventType: true,
      matchId: true,
    },
  });

  const goals = events.filter((e) => e.eventType === "goal").length;
  const assists = events.filter((e) => e.eventType === "assist").length;
  const yellowCards = events.filter((e) => e.eventType === "yellow_card").length;
  const redCards = events.filter((e) => e.eventType === "red_card").length;

  // Count unique matches where the player had events
  const matchIds = new Set(events.map((e) => e.matchId));
  const matchesPlayed = matchIds.size;

  const result: PlayerStats = {
    playerId: player.id,
    playerName: player.fullName,
    position: player.position,
    goals,
    assists,
    yellowCards,
    redCards,
    matchesPlayed,
  };

  await setCache(cacheKey, result);
  return result;
}
