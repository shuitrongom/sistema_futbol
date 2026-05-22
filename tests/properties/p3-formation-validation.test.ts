/**
 * P3: Validación de Formación
 * Para toda táctica, cantidad de jugadores = suma de números en formación + 1 portero = 11.
 *
 * **Validates: Requirements 13.3**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura (extraída de tactic.service.ts para evitar importar Prisma) ---

/**
 * Validates that a formation string sums to 10 (+ 1 goalkeeper = 11).
 * E.g. "4-4-2" → 4+4+2 = 10, + 1 GK = 11
 */
function validateFormation(formation: string): boolean {
  const parts = formation.split('-').map(Number);
  if (parts.some((n) => isNaN(n) || n <= 0)) return false;
  const sum = parts.reduce((a, b) => a + b, 0);
  return sum + 1 === 11; // +1 for goalkeeper
}

/**
 * Validates that the number of player positions matches the formation.
 */
function validatePlayerPositionsCount(
  formation: string,
  playerPositions: Record<string, string>
): boolean {
  const positionCount = Object.keys(playerPositions).length;
  const parts = formation.split('-').map(Number);
  const expectedCount = parts.reduce((a, b) => a + b, 0) + 1; // +1 GK
  return positionCount === expectedCount;
}

// --- Generadores ---

/** Genera una formación válida donde la suma de partes = 10 (+ 1 GK = 11) */
const validFormationArb: fc.Arbitrary<string> = fc
  .integer({ min: 2, max: 4 })
  .chain(numParts => {
    // Generar numParts números positivos que sumen 10
    return fc.array(fc.integer({ min: 1, max: 6 }), { minLength: numParts, maxLength: numParts })
      .map(parts => {
        const sum = parts.reduce((a, b) => a + b, 0);
        // Ajustar el último para que sume 10
        const adjusted = [...parts];
        adjusted[adjusted.length - 1] += (10 - sum);
        return adjusted;
      })
      .filter(parts => parts.every(n => n >= 1 && n <= 6))
      .map(parts => parts.join('-'));
  });

/** Genera una formación inválida donde la suma != 10 */
const invalidFormationArb: fc.Arbitrary<string> = fc
  .array(fc.integer({ min: 1, max: 6 }), { minLength: 2, maxLength: 4 })
  .filter(parts => parts.reduce((a, b) => a + b, 0) !== 10)
  .map(parts => parts.join('-'));

/** Genera posiciones de jugadores para una formación dada */
const playerPositionsForFormation = (formation: string): fc.Arbitrary<Record<string, string>> => {
  const parts = formation.split('-').map(Number);
  const totalPlayers = parts.reduce((a, b) => a + b, 0) + 1; // +1 GK
  return fc.array(fc.uuid(), { minLength: totalPlayers, maxLength: totalPlayers })
    .map(ids => {
      const positions: Record<string, string> = {};
      ids.forEach((id, i) => {
        positions[`pos_${i}`] = id;
      });
      return positions;
    });
};

// --- Tests ---

describe('P3: Validación de Formación', () => {
  it('formaciones válidas (suma = 10) pasan la validación', () => {
    fc.assert(
      fc.property(validFormationArb, (formation) => {
        expect(validateFormation(formation)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('formaciones inválidas (suma != 10) no pasan la validación', () => {
    fc.assert(
      fc.property(invalidFormationArb, (formation) => {
        expect(validateFormation(formation)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('formaciones conocidas (4-4-2, 4-3-3, 3-5-2, 5-3-2, 4-2-3-1) son válidas', () => {
    const knownFormations = ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1'];
    for (const formation of knownFormations) {
      expect(validateFormation(formation)).toBe(true);
    }
  });

  it('cantidad de posiciones de jugadores coincide con la formación', () => {
    fc.assert(
      fc.property(
        validFormationArb.chain(formation =>
          playerPositionsForFormation(formation).map(positions => ({ formation, positions }))
        ),
        ({ formation, positions }) => {
          expect(validatePlayerPositionsCount(formation, positions)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('cantidad incorrecta de posiciones falla la validación', () => {
    fc.assert(
      fc.property(
        validFormationArb,
        fc.integer({ min: 1, max: 5 }),
        (formation, extraPlayers) => {
          const parts = formation.split('-').map(Number);
          const correctCount = parts.reduce((a, b) => a + b, 0) + 1;
          // Crear posiciones con cantidad incorrecta (más o menos)
          const wrongCount = correctCount + extraPlayers;
          const positions: Record<string, string> = {};
          for (let i = 0; i < wrongCount; i++) {
            positions[`pos_${i}`] = `player-${i}`;
          }
          expect(validatePlayerPositionsCount(formation, positions)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('formación con partes no numéricas es inválida', () => {
    const invalidFormations = ['a-b-c', '4-x-2', '', '---', 'abc'];
    for (const formation of invalidFormations) {
      expect(validateFormation(formation)).toBe(false);
    }
  });
});
