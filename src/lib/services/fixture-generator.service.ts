import prisma from "@/lib/prisma";
import type { TournamentFormat } from "@prisma/client";

export interface GeneratedMatch {
  homeTeamId: string;
  awayTeamId: string;
  phaseId?: string;
  dateTime: Date;
}

/**
 * Generate fixture for a tournament based on its format.
 * - league: round-robin ida y vuelta (n*(n-1) matches)
 * - knockout: single-elimination bracket
 * - group_knockout: group stage + elimination rounds
 */
export async function generateFixture(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      tournamentTeams: { select: { teamId: true } },
      phases: true,
    },
  });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.status !== "registration" && tournament.status !== "draft") {
    throw new Error("El fixture solo se puede generar antes de que inicie el torneo");
  }

  const teamIds = tournament.tournamentTeams.map((tt) => tt.teamId);
  if (teamIds.length < tournament.minTeams) {
    throw new Error(
      `Se necesitan al menos ${tournament.minTeams} equipos (hay ${teamIds.length})`
    );
  }

  // Delete existing matches and phases for regeneration
  await prisma.match.deleteMany({ where: { tournamentId } });
  await prisma.phase.deleteMany({ where: { tournamentId } });

  let matches: GeneratedMatch[];

  switch (tournament.format) {
    case "league":
      matches = await generateLeagueFixture(tournamentId, teamIds, tournament.startDate, tournament.endDate);
      break;
    case "knockout":
      matches = await generateKnockoutFixture(tournamentId, teamIds, tournament.startDate, tournament.endDate);
      break;
    case "group_knockout":
      matches = await generateGroupKnockoutFixture(tournamentId, teamIds, tournament.startDate, tournament.endDate);
      break;
    default:
      throw new Error(`Formato no soportado: ${tournament.format}`);
  }

  // Bulk create matches
  if (matches.length > 0) {
    await prisma.match.createMany({
      data: matches.map((m) => ({
        tournamentId,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        phaseId: m.phaseId ?? null,
        dateTime: m.dateTime,
        status: "scheduled",
      })),
    });
  }

  // Update tournament status to registration if draft
  if (tournament.status === "draft") {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "registration" },
    });
  }

  return prisma.match.findMany({
    where: { tournamentId },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      phase: { select: { id: true, name: true, type: true } },
    },
    orderBy: { dateTime: "asc" },
  });
}

/**
 * Round-robin league: ida y vuelta = n*(n-1) matches.
 * Uses circle method for scheduling, max 1 match per team per day.
 */
async function generateLeagueFixture(
  tournamentId: string,
  teamIds: string[],
  startDate: Date,
  endDate: Date
): Promise<GeneratedMatch[]> {
  const phase = await prisma.phase.create({
    data: {
      tournamentId,
      name: "Liga",
      type: "group",
      status: "pending",
      phaseOrder: 1,
    },
  });

  const pairings = generateRoundRobinPairings(teamIds);
  // ida y vuelta: duplicate with swapped home/away
  const allPairings = [
    ...pairings,
    ...pairings.map(([a, b]) => [b, a] as [string, string]),
  ];

  return assignDates(allPairings, startDate, endDate, phase.id, teamIds.length);
}

/**
 * Single-elimination bracket.
 */
async function generateKnockoutFixture(
  tournamentId: string,
  teamIds: string[],
  startDate: Date,
  endDate: Date
): Promise<GeneratedMatch[]> {
  const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
  const matches: GeneratedMatch[] = [];

  // Determine rounds needed
  const n = shuffled.length;
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(n)));
  const byes = nextPow2 - n;

  const phaseTypes = getKnockoutPhaseTypes(nextPow2);
  const firstPhaseType = phaseTypes[0];

  const phase = await prisma.phase.create({
    data: {
      tournamentId,
      name: getPhaseLabel(firstPhaseType),
      type: firstPhaseType,
      status: "pending",
      phaseOrder: 1,
    },
  });

  // First round: pair teams, some get byes
  const firstRoundTeams = shuffled.slice(0, n - byes);
  const pairings: [string, string][] = [];
  for (let i = 0; i < firstRoundTeams.length; i += 2) {
    if (i + 1 < firstRoundTeams.length) {
      pairings.push([firstRoundTeams[i], firstRoundTeams[i + 1]]);
    }
  }

  const dated = assignDates(pairings, startDate, endDate, phase.id, n);
  matches.push(...dated);

  // Create placeholder phases for subsequent rounds
  for (let i = 1; i < phaseTypes.length; i++) {
    await prisma.phase.create({
      data: {
        tournamentId,
        name: getPhaseLabel(phaseTypes[i]),
        type: phaseTypes[i],
        status: "pending",
        phaseOrder: i + 1,
      },
    });
  }

  return matches;
}

/**
 * Group stage + knockout rounds.
 */
async function generateGroupKnockoutFixture(
  tournamentId: string,
  teamIds: string[],
  startDate: Date,
  endDate: Date
): Promise<GeneratedMatch[]> {
  const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
  const numGroups = Math.max(2, Math.floor(shuffled.length / 4));
  const groups: string[][] = Array.from({ length: numGroups }, () => []);

  // Distribute teams into groups
  shuffled.forEach((teamId, i) => {
    groups[i % numGroups].push(teamId);
  });

  const matches: GeneratedMatch[] = [];
  const totalDays = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const groupEndDate = new Date(startDate);
  groupEndDate.setDate(groupEndDate.getDate() + Math.floor(totalDays * 0.6));

  // Create group phases
  for (let g = 0; g < groups.length; g++) {
    const phase = await prisma.phase.create({
      data: {
        tournamentId,
        name: `Grupo ${String.fromCharCode(65 + g)}`,
        type: "group",
        status: "pending",
        phaseOrder: g + 1,
        classificationCriteria: { topN: 2 },
      },
    });

    const pairings = generateRoundRobinPairings(groups[g]);
    const allPairings = [
      ...pairings,
      ...pairings.map(([a, b]) => [b, a] as [string, string]),
    ];

    const dated = assignDates(allPairings, startDate, groupEndDate, phase.id, groups[g].length);
    matches.push(...dated);
  }

  // Create knockout phase placeholders
  const knockoutStart = new Date(groupEndDate);
  knockoutStart.setDate(knockoutStart.getDate() + 1);

  const qualifyingTeams = numGroups * 2;
  const knockoutPhaseTypes = getKnockoutPhaseTypes(
    Math.pow(2, Math.ceil(Math.log2(qualifyingTeams)))
  );

  for (let i = 0; i < knockoutPhaseTypes.length; i++) {
    await prisma.phase.create({
      data: {
        tournamentId,
        name: getPhaseLabel(knockoutPhaseTypes[i]),
        type: knockoutPhaseTypes[i],
        status: "pending",
        phaseOrder: groups.length + i + 1,
      },
    });
  }

  return matches;
}

// ─── Helper Functions ───

/**
 * Circle method for round-robin scheduling.
 * Returns n*(n-1)/2 unique pairings (one leg).
 */
function generateRoundRobinPairings(teamIds: string[]): [string, string][] {
  const teams = [...teamIds];
  // If odd number of teams, add a "bye" placeholder
  if (teams.length % 2 !== 0) {
    teams.push("BYE");
  }

  const n = teams.length;
  const rounds = n - 1;
  const halfSize = n / 2;
  const pairings: [string, string][] = [];

  const fixed = teams[0];
  const rotating = teams.slice(1);

  for (let round = 0; round < rounds; round++) {
    const currentRotating = [
      ...rotating.slice(rotating.length - round),
      ...rotating.slice(0, rotating.length - round),
    ];

    // First pairing: fixed vs first of rotating
    if (currentRotating[0] !== "BYE" && fixed !== "BYE") {
      pairings.push([fixed, currentRotating[0]]);
    }

    // Remaining pairings
    for (let i = 1; i < halfSize; i++) {
      const home = currentRotating[i];
      const away = currentRotating[n - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        pairings.push([home, away]);
      }
    }
  }

  return pairings;
}

/**
 * Assign dates to pairings ensuring max 1 match per team per day.
 */
function assignDates(
  pairings: [string, string][],
  startDate: Date,
  endDate: Date,
  phaseId: string,
  _teamCount: number
): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  const currentDate = new Date(startDate);
  // Start matches at 10:00 AM, increment by 2.5 hours
  const baseHour = 10;
  const hourIncrement = 2.5;

  let pairingIndex = 0;

  while (pairingIndex < pairings.length && currentDate <= endDate) {
    const teamsPlayingToday = new Set<string>();
    let matchesThisDay = 0;

    while (pairingIndex < pairings.length) {
      const [home, away] = pairings[pairingIndex];

      if (teamsPlayingToday.has(home) || teamsPlayingToday.has(away)) {
        // This pairing can't be scheduled today, try next pairings
        // Look ahead for a pairing that fits
        let found = false;
        for (let j = pairingIndex + 1; j < pairings.length; j++) {
          const [h, a] = pairings[j];
          if (!teamsPlayingToday.has(h) && !teamsPlayingToday.has(a)) {
            // Swap
            [pairings[pairingIndex], pairings[j]] = [pairings[j], pairings[pairingIndex]];
            found = true;
            break;
          }
        }
        if (!found) break; // No more pairings fit today
        continue;
      }

      const matchTime = new Date(currentDate);
      matchTime.setHours(baseHour + matchesThisDay * hourIncrement, 0, 0, 0);

      matches.push({
        homeTeamId: home,
        awayTeamId: away,
        phaseId,
        dateTime: new Date(matchTime),
      });

      teamsPlayingToday.add(home);
      teamsPlayingToday.add(away);
      matchesThisDay++;
      pairingIndex++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return matches;
}

type PhaseTypeValue = "group" | "round_of_16" | "quarter_final" | "semi_final" | "final";

function getKnockoutPhaseTypes(bracketSize: number): PhaseTypeValue[] {
  const types: PhaseTypeValue[] = [];
  if (bracketSize >= 16) types.push("round_of_16");
  if (bracketSize >= 8) types.push("quarter_final");
  if (bracketSize >= 4) types.push("semi_final");
  types.push("final");
  return types;
}

function getPhaseLabel(type: PhaseTypeValue): string {
  const labels: Record<string, string> = {
    round_of_16: "Octavos de Final",
    quarter_final: "Cuartos de Final",
    semi_final: "Semifinal",
    final: "Final",
    group: "Fase de Grupos",
  };
  return labels[type] ?? type;
}
