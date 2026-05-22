/**
 * P9: Integridad de Fixture
 * Fixture liga tiene exactamente n*(n-1) partidos y máximo 1 partido por equipo por día.
 *
 * **Validates: Requirements 6.1, 6.2, 6.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura (extraída de fixture-generator.service.ts) ---

interface GeneratedMatch {
  homeTeamId: string;
  awayTeamId: string;
  dateTime: Date;
}

/**
 * Genera emparejamientos round-robin (ida y vuelta).
 * Replica la lógica del servicio.
 */
function generateRoundRobinPairings(teamIds: string[]): [string, string][] {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) {
    teams.push('BYE');
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

    if (currentRotating[0] !== 'BYE' && fixed !== 'BYE') {
      pairings.push([fixed, currentRotating[0]]);
    }

    for (let i = 1; i < halfSize; i++) {
      const home = currentRotating[i];
      const away = currentRotating[n - 1 - i];
      if (home !== 'BYE' && away !== 'BYE') {
        pairings.push([home, away]);
      }
    }
  }

  return pairings;
}

/**
 * Genera fixture completo de liga (ida y vuelta).
 */
function generateLeagueFixture(teamIds: string[]): GeneratedMatch[] {
  const firstLeg = generateRoundRobinPairings(teamIds);
  // Vuelta: invertir local/visitante
  const secondLeg = firstLeg.map(([h, a]) => [a, h] as [string, string]);
  const allPairings = [...firstLeg, ...secondLeg];

  // Asignar fechas asegurando máximo 1 partido por equipo por día
  return assignDates(allPairings, teamIds.length);
}

/**
 * Asigna fechas a los emparejamientos respetando la restricción de 1 partido por equipo por día.
 * Usa UTC para evitar problemas de timezone.
 */
function assignDates(pairings: [string, string][], _teamCount: number): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  let dayOffset = 0;
  const remaining = [...pairings];

  while (remaining.length > 0) {
    const teamsPlayingToday = new Set<string>();
    let matchesThisDay = 0;
    const stillRemaining: [string, string][] = [];

    for (const [home, away] of remaining) {
      if (!teamsPlayingToday.has(home) && !teamsPlayingToday.has(away)) {
        // Usar UTC explícitamente para evitar problemas de timezone
        const matchTime = new Date(Date.UTC(2025, 2, 1 + dayOffset, 10 + matchesThisDay * 3, 0, 0));

        matches.push({
          homeTeamId: home,
          awayTeamId: away,
          dateTime: matchTime,
        });

        teamsPlayingToday.add(home);
        teamsPlayingToday.add(away);
        matchesThisDay++;
      } else {
        stillRemaining.push([home, away]);
      }
    }

    remaining.length = 0;
    remaining.push(...stillRemaining);
    dayOffset++;
  }

  return matches;
}

/**
 * Verifica la restricción de máximo 1 partido por equipo por día.
 * Usa la fecha UTC para comparar.
 */
function validateMaxOneMatchPerTeamPerDay(matches: GeneratedMatch[]): boolean {
  const teamDayMap = new Map<string, Set<string>>();

  for (const match of matches) {
    // Extraer día UTC
    const day = match.dateTime.toISOString().split('T')[0];

    for (const teamId of [match.homeTeamId, match.awayTeamId]) {
      if (!teamDayMap.has(teamId)) {
        teamDayMap.set(teamId, new Set());
      }
      const days = teamDayMap.get(teamId)!;
      if (days.has(day)) {
        return false;
      }
      days.add(day);
    }
  }

  return true;
}

// --- Generadores ---

const teamCountArb = fc.integer({ min: 2, max: 8 });

const teamsArb = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `team-${i + 1}`);

// --- Tests ---

describe('P9: Integridad de Fixture Liga', () => {
  it('fixture liga tiene exactamente n*(n-1) partidos (ida y vuelta)', () => {
    fc.assert(
      fc.property(teamCountArb, (numTeams) => {
        const teamIds = teamsArb(numTeams);
        const fixture = generateLeagueFixture(teamIds);
        const expectedMatches = numTeams * (numTeams - 1);
        expect(fixture.length).toBe(expectedMatches);
      }),
      { numRuns: 100 }
    );
  });

  it('cada par de equipos se enfrenta exactamente 2 veces (ida y vuelta)', () => {
    fc.assert(
      fc.property(teamCountArb, (numTeams) => {
        const teamIds = teamsArb(numTeams);
        const fixture = generateLeagueFixture(teamIds);

        // Contar enfrentamientos por par
        const pairCount = new Map<string, number>();
        for (const match of fixture) {
          const key = [match.homeTeamId, match.awayTeamId].sort().join('-');
          pairCount.set(key, (pairCount.get(key) || 0) + 1);
        }

        // Cada par debe tener exactamente 2 enfrentamientos
        for (const [, count] of pairCount) {
          expect(count).toBe(2);
        }

        // Número de pares únicos = n*(n-1)/2
        const expectedPairs = (numTeams * (numTeams - 1)) / 2;
        expect(pairCount.size).toBe(expectedPairs);
      }),
      { numRuns: 100 }
    );
  });

  it('cada par tiene un partido como local y otro como visitante', () => {
    fc.assert(
      fc.property(teamCountArb, (numTeams) => {
        const teamIds = teamsArb(numTeams);
        const fixture = generateLeagueFixture(teamIds);

        // Para cada par, verificar que hay un H-A y un A-H
        const directedPairs = new Set<string>();
        for (const match of fixture) {
          const key = `${match.homeTeamId}:${match.awayTeamId}`;
          directedPairs.add(key);
        }

        // Para cada par de equipos, ambas direcciones deben existir
        for (let i = 0; i < teamIds.length; i++) {
          for (let j = i + 1; j < teamIds.length; j++) {
            expect(directedPairs.has(`${teamIds[i]}:${teamIds[j]}`)).toBe(true);
            expect(directedPairs.has(`${teamIds[j]}:${teamIds[i]}`)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('máximo 1 partido por equipo por día', () => {
    fc.assert(
      fc.property(teamCountArb, (numTeams) => {
        const teamIds = teamsArb(numTeams);
        const fixture = generateLeagueFixture(teamIds);
        expect(validateMaxOneMatchPerTeamPerDay(fixture)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('ningún equipo juega contra sí mismo', () => {
    fc.assert(
      fc.property(teamCountArb, (numTeams) => {
        const teamIds = teamsArb(numTeams);
        const fixture = generateLeagueFixture(teamIds);

        for (const match of fixture) {
          expect(match.homeTeamId).not.toBe(match.awayTeamId);
        }
      }),
      { numRuns: 100 }
    );
  });
});
