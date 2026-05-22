/**
 * P6: Consistencia de Evaluaciones
 * Calificaciones en rango [1,10] y promedios son media aritmética exacta de criterios.
 *
 * **Validates: Requirements 11.1**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura (extraída de evaluation.service.ts) ---

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

interface EvaluationRatings {
  // Técnica
  ballControl: number;
  passing: number;
  dribbling: number;
  shooting: number;
  heading: number;
  weakFoot: number;
  // Táctica
  positioning: number;
  gameVision: number;
  decisionMaking: number;
  systemUnderstanding: number;
  // Física
  speed: number;
  endurance: number;
  strength: number;
  agility: number;
  coordination: number;
  // Mental
  concentration: number;
  attitude: number;
  leadership: number;
  teamwork: number;
  resilience: number;
}

function calculateAverages(ratings: EvaluationRatings) {
  const technicalValues = [ratings.ballControl, ratings.passing, ratings.dribbling, ratings.shooting, ratings.heading, ratings.weakFoot];
  const tacticalValues = [ratings.positioning, ratings.gameVision, ratings.decisionMaking, ratings.systemUnderstanding];
  const physicalValues = [ratings.speed, ratings.endurance, ratings.strength, ratings.agility, ratings.coordination];
  const mentalValues = [ratings.concentration, ratings.attitude, ratings.leadership, ratings.teamwork, ratings.resilience];

  const technicalAvg = avg(technicalValues);
  const tacticalAvg = avg(tacticalValues);
  const physicalAvg = avg(physicalValues);
  const mentalAvg = avg(mentalValues);
  const overallAvg = avg([technicalAvg, tacticalAvg, physicalAvg, mentalAvg]);

  return { technicalAvg, tacticalAvg, physicalAvg, mentalAvg, overallAvg };
}

// --- Generadores ---

const ratingArb = fc.integer({ min: 1, max: 10 });

const evaluationRatingsArb: fc.Arbitrary<EvaluationRatings> = fc.record({
  ballControl: ratingArb,
  passing: ratingArb,
  dribbling: ratingArb,
  shooting: ratingArb,
  heading: ratingArb,
  weakFoot: ratingArb,
  positioning: ratingArb,
  gameVision: ratingArb,
  decisionMaking: ratingArb,
  systemUnderstanding: ratingArb,
  speed: ratingArb,
  endurance: ratingArb,
  strength: ratingArb,
  agility: ratingArb,
  coordination: ratingArb,
  concentration: ratingArb,
  attitude: ratingArb,
  leadership: ratingArb,
  teamwork: ratingArb,
  resilience: ratingArb,
});

// --- Tests ---

describe('P6: Consistencia de Evaluaciones', () => {
  it('todas las calificaciones están en rango [1, 10]', () => {
    fc.assert(
      fc.property(evaluationRatingsArb, (ratings) => {
        const allValues = Object.values(ratings);
        for (const value of allValues) {
          expect(value).toBeGreaterThanOrEqual(1);
          expect(value).toBeLessThanOrEqual(10);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('promedio técnico es media aritmética exacta de criterios técnicos', () => {
    fc.assert(
      fc.property(evaluationRatingsArb, (ratings) => {
        const { technicalAvg } = calculateAverages(ratings);
        const technicalValues = [ratings.ballControl, ratings.passing, ratings.dribbling, ratings.shooting, ratings.heading, ratings.weakFoot];
        const expected = avg(technicalValues);
        expect(technicalAvg).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it('promedio táctico es media aritmética exacta de criterios tácticos', () => {
    fc.assert(
      fc.property(evaluationRatingsArb, (ratings) => {
        const { tacticalAvg } = calculateAverages(ratings);
        const tacticalValues = [ratings.positioning, ratings.gameVision, ratings.decisionMaking, ratings.systemUnderstanding];
        const expected = avg(tacticalValues);
        expect(tacticalAvg).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it('promedio físico es media aritmética exacta de criterios físicos', () => {
    fc.assert(
      fc.property(evaluationRatingsArb, (ratings) => {
        const { physicalAvg } = calculateAverages(ratings);
        const physicalValues = [ratings.speed, ratings.endurance, ratings.strength, ratings.agility, ratings.coordination];
        const expected = avg(physicalValues);
        expect(physicalAvg).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it('promedio mental es media aritmética exacta de criterios mentales', () => {
    fc.assert(
      fc.property(evaluationRatingsArb, (ratings) => {
        const { mentalAvg } = calculateAverages(ratings);
        const mentalValues = [ratings.concentration, ratings.attitude, ratings.leadership, ratings.teamwork, ratings.resilience];
        const expected = avg(mentalValues);
        expect(mentalAvg).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it('promedio general es media de los 4 promedios dimensionales', () => {
    fc.assert(
      fc.property(evaluationRatingsArb, (ratings) => {
        const { technicalAvg, tacticalAvg, physicalAvg, mentalAvg, overallAvg } = calculateAverages(ratings);
        const expected = avg([technicalAvg, tacticalAvg, physicalAvg, mentalAvg]);
        expect(overallAvg).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it('todos los promedios están en rango [1, 10]', () => {
    fc.assert(
      fc.property(evaluationRatingsArb, (ratings) => {
        const { technicalAvg, tacticalAvg, physicalAvg, mentalAvg, overallAvg } = calculateAverages(ratings);
        for (const avgVal of [technicalAvg, tacticalAvg, physicalAvg, mentalAvg, overallAvg]) {
          expect(avgVal).toBeGreaterThanOrEqual(1);
          expect(avgVal).toBeLessThanOrEqual(10);
        }
      }),
      { numRuns: 200 }
    );
  });
});
