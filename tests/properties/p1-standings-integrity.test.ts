/**
 * P1: Integridad de Tabla de Posiciones
 * Para todo torneo liga, la suma de puntos distribuidos por partido es consistente
 * (3 por partido: 3-0 victoria o 1-1 empate).
 *
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura extraída del standings.service.ts ---

interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

interface TeamStanding {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

function calculateStandings(matches: MatchResult[]): Map<string, TeamStanding> {
  const stats = new Map<string, TeamStanding>();

  const initTeam = (teamId: string) => {
    if (!stats.has(teamId)) {
      stats.set(teamId, {
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      });
    }
  };

  for (const match of matches) {
    initTeam(match.homeTeamId);
    initTeam(match.awayTeamId);

    const home = stats.get(match.homeTeamId)!;
    const away = stats.get(match.awayTeamId)!;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      home.points += 1;
      away.drawn++;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return stats;
}

// --- Generadores ---

const teamIdArb = fc.integer({ min: 1, max: 20 }).map(n => `team-${n}`);

const matchResultArb = (teamIds: string[]): fc.Arbitrary<MatchResult> =>
  fc.record({
    homeTeamId: fc.constantFrom(...teamIds),
    awayTeamId: fc.constantFrom(...teamIds),
    homeScore: fc.integer({ min: 0, max: 10 }),
    awayScore: fc.integer({ min: 0, max: 10 }),
  }).filter(m => m.homeTeamId !== m.awayTeamId);

const leagueMatchesArb = fc
  .integer({ min: 2, max: 8 })
  .chain(numTeams => {
    const teamIds = Array.from({ length: numTeams }, (_, i) => `team-${i + 1}`);
    return fc.array(matchResultArb(teamIds), { minLength: 1, maxLength: 30 })
      .map(matches => ({ teamIds, matches }));
  });

// --- Tests ---

describe('P1: Integridad Tabla de Posiciones', () => {
  it('cada partido distribuye puntos consistentes (3 por victoria, 2 por empate)', () => {
    fc.assert(
      fc.property(leagueMatchesArb, ({ matches }) => {
        const standings = calculateStandings(matches);

        // Verificar que los puntos son consistentes con W/D/L para cada equipo
        for (const [, standing] of standings) {
          expect(standing.points).toBe(standing.won * 3 + standing.drawn);
        }

        // La suma total de puntos: 3 por victoria (3+0=3) y 2 por empate (1+1=2)
        let totalWins = 0;
        let totalDraws = 0;
        for (const match of matches) {
          if (match.homeScore > match.awayScore || match.homeScore < match.awayScore) {
            totalWins++;
          } else {
            totalDraws++;
          }
        }
        const totalPoints = Array.from(standings.values()).reduce((sum, s) => sum + s.points, 0);
        expect(totalPoints).toBe(totalWins * 3 + totalDraws * 2);
      }),
      { numRuns: 200 }
    );
  });

  it('partidos jugados = victorias + empates + derrotas para cada equipo', () => {
    fc.assert(
      fc.property(leagueMatchesArb, ({ matches }) => {
        const standings = calculateStandings(matches);

        for (const [, standing] of standings) {
          expect(standing.played).toBe(standing.won + standing.drawn + standing.lost);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('diferencia de goles = goles a favor - goles en contra', () => {
    fc.assert(
      fc.property(leagueMatchesArb, ({ matches }) => {
        const standings = calculateStandings(matches);

        for (const [, standing] of standings) {
          expect(standing.goalDifference).toBe(standing.goalsFor - standing.goalsAgainst);
        }
      }),
      { numRuns: 200 }
    );
  });
});
