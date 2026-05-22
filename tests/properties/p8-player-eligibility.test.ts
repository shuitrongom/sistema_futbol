/**
 * P8: Elegibilidad de Jugadores
 * Jugadores en alineación pertenecen al equipo y no tienen suspensiones activas.
 *
 * **Validates: Requirements 11.1, 11.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura ---

interface TeamRoster {
  teamId: string;
  playerIds: string[];
}

interface Suspension {
  playerId: string;
  tournamentId: string;
  isActive: boolean;
}

interface Lineup {
  teamId: string;
  tournamentId: string;
  playerIds: string[];
}

/**
 * Verifica si un jugador pertenece al equipo.
 */
function playerBelongsToTeam(playerId: string, roster: TeamRoster): boolean {
  return roster.playerIds.includes(playerId);
}

/**
 * Verifica si un jugador tiene suspensión activa en el torneo.
 */
function isPlayerSuspended(
  playerId: string,
  tournamentId: string,
  suspensions: Suspension[]
): boolean {
  return suspensions.some(
    s => s.playerId === playerId && s.tournamentId === tournamentId && s.isActive
  );
}

/**
 * Valida que toda la alineación sea elegible.
 */
function validateLineup(
  lineup: Lineup,
  roster: TeamRoster,
  suspensions: Suspension[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const playerId of lineup.playerIds) {
    if (!playerBelongsToTeam(playerId, roster)) {
      errors.push(`Jugador ${playerId} no pertenece al equipo ${lineup.teamId}`);
    }
    if (isPlayerSuspended(playerId, lineup.tournamentId, suspensions)) {
      errors.push(`Jugador ${playerId} tiene suspensión activa en torneo ${lineup.tournamentId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Generadores ---

const playerIdArb = fc.integer({ min: 1, max: 30 }).map(n => `player-${n}`);

const rosterArb: fc.Arbitrary<TeamRoster> = fc.record({
  teamId: fc.uuid(),
  playerIds: fc.uniqueArray(playerIdArb, { minLength: 11, maxLength: 25 }),
});

/** Genera una alineación válida (jugadores del roster, sin suspensiones) */
const validLineupArb = (roster: TeamRoster, tournamentId: string): fc.Arbitrary<Lineup> =>
  fc.shuffledSubarray(roster.playerIds, { minLength: 11, maxLength: 11 }).map(players => ({
    teamId: roster.teamId,
    tournamentId,
    playerIds: players,
  }));

/** Genera suspensiones que NO afectan a los jugadores de la alineación */
const nonConflictingSuspensionsArb = (
  lineupPlayerIds: string[],
  tournamentId: string
): fc.Arbitrary<Suspension[]> =>
  fc.array(
    fc.record({
      playerId: playerIdArb.filter(id => !lineupPlayerIds.includes(id)),
      tournamentId: fc.constant(tournamentId),
      isActive: fc.boolean(),
    }),
    { minLength: 0, maxLength: 5 }
  );

// --- Tests ---

describe('P8: Elegibilidad de Jugadores en Alineación', () => {
  it('alineación con jugadores del roster y sin suspensiones es válida', () => {
    fc.assert(
      fc.property(
        rosterArb,
        fc.uuid(),
        (roster, tournamentId) => {
          return fc.assert(
            fc.property(
              validLineupArb(roster, tournamentId),
              (lineup) => {
                const result = validateLineup(lineup, roster, []);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
              }
            ),
            { numRuns: 10 }
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it('jugador que no pertenece al equipo es rechazado', () => {
    fc.assert(
      fc.property(
        rosterArb,
        fc.uuid(),
        playerIdArb,
        (roster, tournamentId, outsidePlayer) => {
          fc.pre(!roster.playerIds.includes(outsidePlayer));

          const lineup: Lineup = {
            teamId: roster.teamId,
            tournamentId,
            playerIds: [outsidePlayer],
          };

          const result = validateLineup(lineup, roster, []);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('jugador con suspensión activa es rechazado', () => {
    fc.assert(
      fc.property(
        rosterArb,
        fc.uuid(),
        (roster, tournamentId) => {
          fc.pre(roster.playerIds.length >= 1);
          const suspendedPlayer = roster.playerIds[0];

          const suspensions: Suspension[] = [{
            playerId: suspendedPlayer,
            tournamentId,
            isActive: true,
          }];

          const lineup: Lineup = {
            teamId: roster.teamId,
            tournamentId,
            playerIds: [suspendedPlayer],
          };

          const result = validateLineup(lineup, roster, suspensions);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('suspensión inactiva no afecta elegibilidad', () => {
    fc.assert(
      fc.property(
        rosterArb,
        fc.uuid(),
        (roster, tournamentId) => {
          fc.pre(roster.playerIds.length >= 11);
          const player = roster.playerIds[0];

          const suspensions: Suspension[] = [{
            playerId: player,
            tournamentId,
            isActive: false, // Suspensión cumplida
          }];

          const lineup: Lineup = {
            teamId: roster.teamId,
            tournamentId,
            playerIds: [player],
          };

          const result = validateLineup(lineup, roster, suspensions);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('suspensión en otro torneo no afecta elegibilidad', () => {
    fc.assert(
      fc.property(
        rosterArb,
        fc.uuid(),
        fc.uuid(),
        (roster, tournamentId, otherTournamentId) => {
          fc.pre(tournamentId !== otherTournamentId);
          fc.pre(roster.playerIds.length >= 1);
          const player = roster.playerIds[0];

          const suspensions: Suspension[] = [{
            playerId: player,
            tournamentId: otherTournamentId, // Otro torneo
            isActive: true,
          }];

          const lineup: Lineup = {
            teamId: roster.teamId,
            tournamentId,
            playerIds: [player],
          };

          const result = validateLineup(lineup, roster, suspensions);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });
});
