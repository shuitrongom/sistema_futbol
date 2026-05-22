/**
 * P5: Aislamiento de Datos por Rol
 * Operaciones de escritura de coach solo afectan datos de su equipo asignado.
 *
 * **Validates: Requirements 20.9, 20.27**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Lógica pura ---

interface Coach {
  id: string;
  assignedTeamId: string;
}

interface WriteOperation {
  coachId: string;
  targetTeamId: string;
  operationType: string;
}

/**
 * Verifica si una operación de escritura del coach es válida.
 * El coach solo puede modificar datos de su equipo asignado.
 */
function isOperationAllowed(coach: Coach, targetTeamId: string): boolean {
  return coach.assignedTeamId === targetTeamId;
}

/**
 * Filtra operaciones permitidas para un coach.
 */
function filterAllowedOperations(
  coach: Coach,
  operations: WriteOperation[]
): WriteOperation[] {
  return operations.filter(op => op.coachId === coach.id && op.targetTeamId === coach.assignedTeamId);
}

/**
 * Verifica que ninguna operación de un coach afecte equipos ajenos.
 */
function validateCoachIsolation(
  coaches: Coach[],
  operations: WriteOperation[]
): boolean {
  const coachMap = new Map(coaches.map(c => [c.id, c]));

  for (const op of operations) {
    const coach = coachMap.get(op.coachId);
    if (!coach) continue;
    if (op.targetTeamId !== coach.assignedTeamId) {
      return false;
    }
  }
  return true;
}

// --- Generadores ---

const operationTypes = [
  'addPlayer', 'removePlayer', 'updatePlayer',
  'createTactic', 'updateTactic', 'deleteTactic',
  'createEvaluation', 'assignTask', 'sendFeedback',
  'createTrainingPlan', 'createDevelopmentPlan',
];

const coachArb: fc.Arbitrary<Coach> = fc.record({
  id: fc.uuid(),
  assignedTeamId: fc.uuid(),
});

/** Genera operaciones válidas (coach solo opera en su equipo) */
const validOperationsArb = (coach: Coach): fc.Arbitrary<WriteOperation[]> =>
  fc.array(
    fc.constantFrom(...operationTypes).map(opType => ({
      coachId: coach.id,
      targetTeamId: coach.assignedTeamId,
      operationType: opType,
    })),
    { minLength: 1, maxLength: 10 }
  );

/** Genera una operación inválida (coach opera en equipo ajeno) */
const invalidOperationArb = (coach: Coach): fc.Arbitrary<WriteOperation> =>
  fc.record({
    coachId: fc.constant(coach.id),
    targetTeamId: fc.uuid().filter(id => id !== coach.assignedTeamId),
    operationType: fc.constantFrom(...operationTypes),
  });

// --- Tests ---

describe('P5: Aislamiento por Rol de Entrenador', () => {
  it('operaciones del coach en su equipo asignado son permitidas', () => {
    fc.assert(
      fc.property(coachArb, (coach) => {
        expect(isOperationAllowed(coach, coach.assignedTeamId)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('operaciones del coach en equipo ajeno son denegadas', () => {
    fc.assert(
      fc.property(
        coachArb,
        fc.uuid(),
        (coach, otherTeamId) => {
          fc.pre(otherTeamId !== coach.assignedTeamId);
          expect(isOperationAllowed(coach, otherTeamId)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('filtrado de operaciones solo retorna las del equipo asignado', () => {
    fc.assert(
      fc.property(
        coachArb.chain(coach =>
          fc.tuple(
            fc.constant(coach),
            validOperationsArb(coach),
            fc.array(invalidOperationArb(coach), { minLength: 0, maxLength: 5 })
          )
        ),
        ([coach, validOps, invalidOps]) => {
          const allOps = [...validOps, ...invalidOps];
          const allowed = filterAllowedOperations(coach, allOps);

          // Todas las operaciones filtradas deben ser del equipo asignado
          for (const op of allowed) {
            expect(op.targetTeamId).toBe(coach.assignedTeamId);
          }
          // La cantidad debe ser igual a las operaciones válidas
          expect(allowed.length).toBe(validOps.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('validación de aislamiento pasa con operaciones correctas', () => {
    fc.assert(
      fc.property(
        fc.array(coachArb, { minLength: 1, maxLength: 5 }).chain(coaches =>
          fc.tuple(
            fc.constant(coaches),
            fc.array(
              fc.constantFrom(...coaches).chain(coach =>
                fc.constantFrom(...operationTypes).map(opType => ({
                  coachId: coach.id,
                  targetTeamId: coach.assignedTeamId,
                  operationType: opType,
                }))
              ),
              { minLength: 1, maxLength: 15 }
            )
          )
        ),
        ([coaches, operations]) => {
          expect(validateCoachIsolation(coaches, operations)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('validación de aislamiento falla con operación en equipo ajeno', () => {
    fc.assert(
      fc.property(
        coachArb.chain(coach =>
          fc.tuple(
            fc.constant([coach]),
            invalidOperationArb(coach).map(op => [op])
          )
        ),
        ([coaches, operations]) => {
          expect(validateCoachIsolation(coaches, operations)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
