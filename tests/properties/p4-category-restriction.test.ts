/**
 * P4: Restricción de Inscripción por Categoría
 * Para todo equipo inscrito en torneo, al menos una categoría del equipo
 * está en las categorías permitidas del torneo.
 *
 * **Validates: Requirements 14.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura ---

interface TeamEnrollment {
  teamCategories: string[];
  tournamentCategories: string[];
}

/**
 * Verifica si un equipo puede inscribirse en un torneo basado en categorías.
 * Al menos una categoría del equipo debe estar en las categorías permitidas del torneo.
 */
function canEnrollTeam(teamCategories: string[], tournamentCategories: string[]): boolean {
  if (tournamentCategories.length === 0) return true; // Sin restricción
  return teamCategories.some(tc => tournamentCategories.includes(tc));
}

/**
 * Valida que todas las inscripciones cumplan la restricción de categoría.
 */
function validateAllEnrollments(enrollments: TeamEnrollment[]): boolean {
  return enrollments.every(e => canEnrollTeam(e.teamCategories, e.tournamentCategories));
}

// --- Generadores ---

const categoryArb = fc.constantFrom(
  'infantil', 'juvenil', 'amateur', 'profesional', 'veteranos', 'femenino', 'masculino'
);

const categoriesArb = fc.uniqueArray(categoryArb, { minLength: 1, maxLength: 4 });

/** Genera una inscripción válida (equipo tiene al menos una categoría del torneo) */
const validEnrollmentArb: fc.Arbitrary<TeamEnrollment> = categoriesArb.chain(tournamentCats => {
  // El equipo debe tener al menos una categoría del torneo
  const requiredCat = fc.constantFrom(...tournamentCats);
  const extraCats = fc.uniqueArray(categoryArb, { minLength: 0, maxLength: 3 });

  return fc.tuple(requiredCat, extraCats).map(([required, extras]) => ({
    teamCategories: [...new Set([required, ...extras])],
    tournamentCategories: tournamentCats,
  }));
});

/** Genera una inscripción inválida (equipo no tiene ninguna categoría del torneo) */
const invalidEnrollmentArb: fc.Arbitrary<TeamEnrollment> = fc.tuple(
  categoriesArb,
  categoriesArb
).filter(([teamCats, tournCats]) => {
  // Ninguna categoría del equipo está en las del torneo
  return !teamCats.some(tc => tournCats.includes(tc));
}).map(([teamCats, tournCats]) => ({
  teamCategories: teamCats,
  tournamentCategories: tournCats,
}));

// --- Tests ---

describe('P4: Restricción de Categoría en Inscripción', () => {
  it('equipo con categoría compartida puede inscribirse', () => {
    fc.assert(
      fc.property(validEnrollmentArb, (enrollment) => {
        expect(canEnrollTeam(enrollment.teamCategories, enrollment.tournamentCategories)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('equipo sin categoría compartida no puede inscribirse', () => {
    fc.assert(
      fc.property(invalidEnrollmentArb, (enrollment) => {
        expect(canEnrollTeam(enrollment.teamCategories, enrollment.tournamentCategories)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('torneo sin restricción de categoría acepta cualquier equipo', () => {
    fc.assert(
      fc.property(categoriesArb, (teamCategories) => {
        expect(canEnrollTeam(teamCategories, [])).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('todas las inscripciones válidas pasan la validación conjunta', () => {
    fc.assert(
      fc.property(
        fc.array(validEnrollmentArb, { minLength: 1, maxLength: 10 }),
        (enrollments) => {
          expect(validateAllEnrollments(enrollments)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('una inscripción inválida hace fallar la validación conjunta', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(validEnrollmentArb, { minLength: 0, maxLength: 5 }),
          invalidEnrollmentArb
        ),
        ([validOnes, invalidOne]) => {
          const all = [...validOnes, invalidOne];
          expect(validateAllEnrollments(all)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
