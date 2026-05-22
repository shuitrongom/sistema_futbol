/**
 * P7: No Conflicto de Ubicación
 * No existen dos partidos en misma ubicación con horarios solapados (2h por partido).
 *
 * **Validates: Requirements 12.3**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura ---

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas en milisegundos

interface ScheduledMatch {
  id: string;
  locationId: string;
  dateTime: Date;
}

/**
 * Verifica si dos partidos en la misma ubicación tienen horarios solapados.
 */
function hasTimeConflict(match1: ScheduledMatch, match2: ScheduledMatch): boolean {
  if (match1.locationId !== match2.locationId) return false;
  if (match1.id === match2.id) return false;

  const start1 = match1.dateTime.getTime();
  const end1 = start1 + MATCH_DURATION_MS;
  const start2 = match2.dateTime.getTime();
  const end2 = start2 + MATCH_DURATION_MS;

  return start1 < end2 && start2 < end1;
}

/**
 * Verifica que no haya conflictos de ubicación en un conjunto de partidos.
 */
function validateNoLocationConflicts(matches: ScheduledMatch[]): boolean {
  for (let i = 0; i < matches.length; i++) {
    for (let j = i + 1; j < matches.length; j++) {
      if (hasTimeConflict(matches[i], matches[j])) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Verifica si un nuevo partido puede programarse sin conflictos.
 */
function canScheduleMatch(
  existingMatches: ScheduledMatch[],
  newMatch: ScheduledMatch
): boolean {
  return !existingMatches.some(m => hasTimeConflict(m, newMatch));
}

// --- Generadores ---

const locationIdArb = fc.constantFrom('loc-1', 'loc-2', 'loc-3', 'loc-4', 'loc-5');

/** Genera una fecha/hora de partido */
const matchDateTimeArb = fc.date({
  min: new Date('2025-01-01T08:00:00'),
  max: new Date('2025-12-31T22:00:00'),
});

const scheduledMatchArb: fc.Arbitrary<ScheduledMatch> = fc.record({
  id: fc.uuid(),
  locationId: locationIdArb,
  dateTime: matchDateTimeArb,
});

/** Genera partidos sin conflictos en la misma ubicación */
const nonConflictingMatchesArb: fc.Arbitrary<ScheduledMatch[]> = fc
  .integer({ min: 1, max: 5 })
  .chain(numLocations => {
    const locations = Array.from({ length: numLocations }, (_, i) => `loc-${i + 1}`);
    return fc.array(
      fc.tuple(
        fc.constantFrom(...locations),
        fc.integer({ min: 0, max: 20 }), // slot index (each slot = 3h apart to avoid overlap)
        fc.uuid()
      ),
      { minLength: 1, maxLength: 15 }
    ).map(entries => {
      // Deduplicar por (location, slot) para evitar conflictos
      const seen = new Set<string>();
      const unique = entries.filter(([locId, slotIndex]) => {
        const key = `${locId}-${slotIndex}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return unique.map(([locId, slotIndex, id]) => ({
        id,
        locationId: locId,
        dateTime: new Date(2025, 0, 1 + Math.floor(slotIndex / 4), 8 + (slotIndex % 4) * 3, 0, 0),
      }));
    }).filter(matches => matches.length > 0);
  });

// --- Tests ---

describe('P7: No Conflicto de Ubicación', () => {
  it('partidos en ubicaciones diferentes nunca tienen conflicto', () => {
    fc.assert(
      fc.property(
        matchDateTimeArb,
        matchDateTimeArb,
        fc.uuid(),
        fc.uuid(),
        (dt1, dt2, id1, id2) => {
          const match1: ScheduledMatch = { id: id1, locationId: 'loc-1', dateTime: dt1 };
          const match2: ScheduledMatch = { id: id2, locationId: 'loc-2', dateTime: dt2 };
          expect(hasTimeConflict(match1, match2)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('partidos en misma ubicación separados por más de 2h no tienen conflicto', () => {
    fc.assert(
      fc.property(
        matchDateTimeArb,
        fc.integer({ min: 121, max: 600 }), // minutos de separación > 2h
        fc.uuid(),
        fc.uuid(),
        locationIdArb,
        (dt1, separationMinutes, id1, id2, locId) => {
          const dt2 = new Date(dt1.getTime() + separationMinutes * 60 * 1000);
          const match1: ScheduledMatch = { id: id1, locationId: locId, dateTime: dt1 };
          const match2: ScheduledMatch = { id: id2, locationId: locId, dateTime: dt2 };
          expect(hasTimeConflict(match1, match2)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('partidos en misma ubicación con horarios solapados tienen conflicto', () => {
    fc.assert(
      fc.property(
        matchDateTimeArb,
        fc.integer({ min: 0, max: 119 }), // minutos de separación < 2h
        fc.uuid(),
        fc.uuid(),
        locationIdArb,
        (dt1, separationMinutes, id1, id2, locId) => {
          fc.pre(id1 !== id2);
          const dt2 = new Date(dt1.getTime() + separationMinutes * 60 * 1000);
          const match1: ScheduledMatch = { id: id1, locationId: locId, dateTime: dt1 };
          const match2: ScheduledMatch = { id: id2, locationId: locId, dateTime: dt2 };
          expect(hasTimeConflict(match1, match2)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('conjunto de partidos bien espaciados no tiene conflictos', () => {
    fc.assert(
      fc.property(nonConflictingMatchesArb, (matches) => {
        expect(validateNoLocationConflicts(matches)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('canScheduleMatch rechaza partido con conflicto de horario', () => {
    fc.assert(
      fc.property(
        matchDateTimeArb,
        fc.integer({ min: 0, max: 60 }),
        fc.uuid(),
        fc.uuid(),
        locationIdArb,
        (dt1, offsetMinutes, id1, id2, locId) => {
          fc.pre(id1 !== id2);
          const existing: ScheduledMatch = { id: id1, locationId: locId, dateTime: dt1 };
          const newMatch: ScheduledMatch = {
            id: id2,
            locationId: locId,
            dateTime: new Date(dt1.getTime() + offsetMinutes * 60 * 1000),
          };
          expect(canScheduleMatch([existing], newMatch)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
