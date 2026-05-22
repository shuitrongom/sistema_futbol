/**
 * P2: Unicidad de Camiseta por Equipo
 * Para todo equipo, no existen dos jugadores activos con mismo jersey_number.
 *
 * **Validates: Requirements 5.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura ---

interface TeamPlayer {
  playerId: string;
  jerseyNumber: number;
  leftAt: Date | null;
}

function getActivePlayers(roster: TeamPlayer[]): TeamPlayer[] {
  return roster.filter(p => p.leftAt === null);
}

function hasJerseyConflict(roster: TeamPlayer[]): boolean {
  const active = getActivePlayers(roster);
  const jerseyNumbers = active.map(p => p.jerseyNumber);
  return new Set(jerseyNumbers).size !== jerseyNumbers.length;
}

function validateJerseyAssignment(
  roster: TeamPlayer[],
  newJersey: number
): boolean {
  const active = getActivePlayers(roster);
  return !active.some(p => p.jerseyNumber === newJersey);
}

// --- Generadores ---

const playerArb = (maxJersey: number): fc.Arbitrary<TeamPlayer> =>
  fc.record({
    playerId: fc.uuid(),
    jerseyNumber: fc.integer({ min: 1, max: maxJersey }),
    leftAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }), { nil: null }),
  });

const rosterWithUniqueJerseysArb = fc
  .integer({ min: 1, max: 25 })
  .chain(size => {
    // Generar jugadores con jerseys únicos entre activos
    return fc.array(fc.uuid(), { minLength: size, maxLength: size }).chain(playerIds => {
      // Asignar jerseys únicos a jugadores activos
      const jerseys = Array.from({ length: 99 }, (_, i) => i + 1);
      return fc.shuffledSubarray(jerseys, { minLength: size, maxLength: size }).map(shuffledJerseys => {
        return playerIds.map((id, i) => ({
          playerId: id,
          jerseyNumber: shuffledJerseys[i],
          leftAt: null as Date | null,
        }));
      });
    });
  });

// --- Tests ---

describe('P2: Unicidad de Camiseta por Equipo', () => {
  it('un roster con jerseys únicos entre activos no tiene conflictos', () => {
    fc.assert(
      fc.property(rosterWithUniqueJerseysArb, (roster) => {
        expect(hasJerseyConflict(roster)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('jugadores inactivos (con leftAt) no causan conflicto de jersey', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }),
        fc.uuid(),
        fc.uuid(),
        (jerseyNumber, player1Id, player2Id) => {
          const roster: TeamPlayer[] = [
            { playerId: player1Id, jerseyNumber, leftAt: new Date('2024-01-01') }, // inactivo
            { playerId: player2Id, jerseyNumber, leftAt: null }, // activo
          ];
          // No hay conflicto porque el primero está inactivo
          expect(hasJerseyConflict(roster)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('dos jugadores activos con mismo jersey causan conflicto', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }),
        fc.uuid(),
        fc.uuid(),
        (jerseyNumber, player1Id, player2Id) => {
          fc.pre(player1Id !== player2Id);
          const roster: TeamPlayer[] = [
            { playerId: player1Id, jerseyNumber, leftAt: null },
            { playerId: player2Id, jerseyNumber, leftAt: null },
          ];
          expect(hasJerseyConflict(roster)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('validación de asignación rechaza jersey ya en uso por jugador activo', () => {
    fc.assert(
      fc.property(rosterWithUniqueJerseysArb, (roster) => {
        if (roster.length === 0) return;
        // Intentar asignar un jersey que ya existe
        const existingJersey = roster[0].jerseyNumber;
        expect(validateJerseyAssignment(roster, existingJersey)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('validación de asignación acepta jersey no usado', () => {
    fc.assert(
      fc.property(rosterWithUniqueJerseysArb, (roster) => {
        const usedJerseys = new Set(roster.map(p => p.jerseyNumber));
        // Encontrar un jersey no usado
        let freeJersey = 1;
        while (usedJerseys.has(freeJersey) && freeJersey <= 99) freeJersey++;
        if (freeJersey <= 99) {
          expect(validateJerseyAssignment(roster, freeJersey)).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });
});
