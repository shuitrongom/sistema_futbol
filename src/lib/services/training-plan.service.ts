import prisma from "@/lib/prisma";
import type {
  CreateTrainingPlanSchema,
  UpdateTrainingPlanSchema,
  CreateSessionSchema,
  ExecuteSessionSchema,
} from "@/lib/validators/training-plan.schema";

// ─── CRUD Plans ───

export async function getTrainingPlans(teamId: string) {
  const plans = await prisma.trainingPlan.findMany({
    where: { teamId },
    include: {
      sessions: {
        include: { exercises: { include: { exercise: true } } },
        orderBy: { sessionOrder: "asc" },
      },
      coach: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return plans.map((plan) => ({
    ...plan,
    totalDuration: calculateTotalDuration(plan.sessions),
    status: getPlanStatus(plan),
  }));
}

export async function getTrainingPlanById(id: string) {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id },
    include: {
      sessions: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { exerciseOrder: "asc" },
          },
        },
        orderBy: { sessionOrder: "asc" },
      },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!plan) return null;

  return {
    ...plan,
    totalDuration: calculateTotalDuration(plan.sessions),
    status: getPlanStatus(plan),
  };
}

export async function createTrainingPlan(
  data: CreateTrainingPlanSchema,
  coachId: string
) {
  return prisma.trainingPlan.create({
    data: {
      teamId: data.teamId,
      coachId,
      name: data.name,
      targetAgeMin: data.targetAgeMin ?? null,
      targetAgeMax: data.targetAgeMax ?? null,
      level: data.level ?? null,
      objectives: data.objectives ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isShared: data.isShared ?? false,
    },
    include: {
      sessions: true,
      coach: { select: { id: true, fullName: true } },
    },
  });
}

export async function updateTrainingPlan(
  id: string,
  data: UpdateTrainingPlanSchema
) {
  return prisma.trainingPlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.targetAgeMin !== undefined && { targetAgeMin: data.targetAgeMin }),
      ...(data.targetAgeMax !== undefined && { targetAgeMax: data.targetAgeMax }),
      ...(data.level !== undefined && { level: data.level }),
      ...(data.objectives !== undefined && { objectives: data.objectives }),
      ...(data.startDate !== undefined && {
        startDate: data.startDate ? new Date(data.startDate) : null,
      }),
      ...(data.endDate !== undefined && {
        endDate: data.endDate ? new Date(data.endDate) : null,
      }),
      ...(data.isShared !== undefined && { isShared: data.isShared }),
      ...(data.effectivenessNotes !== undefined && {
        effectivenessNotes: data.effectivenessNotes,
      }),
    },
    include: {
      sessions: {
        include: { exercises: { include: { exercise: true } } },
        orderBy: { sessionOrder: "asc" },
      },
      coach: { select: { id: true, fullName: true } },
    },
  });
}


// ─── Sessions ───

export async function addSession(planId: string, data: CreateSessionSchema) {
  // Validate exercises exist and are age-appropriate
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { targetAgeMin: true, targetAgeMax: true },
  });

  if (!plan) throw new Error("Plan no encontrado");

  if (data.exercises.length > 0) {
    const exerciseIds = data.exercises.map((e) => e.exerciseId);
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
    });

    if (exercises.length !== exerciseIds.length) {
      throw new Error("Uno o más ejercicios no encontrados");
    }

    // Validate age appropriateness
    const ageIssues = validateExercisesForAge(
      exercises,
      plan.targetAgeMin,
      plan.targetAgeMax
    );
    if (ageIssues.length > 0) {
      throw new Error(
        `Ejercicios no apropiados para la edad objetivo: ${ageIssues.join(", ")}`
      );
    }
  }

  return prisma.trainingSession.create({
    data: {
      planId,
      sessionDate: data.sessionDate ? new Date(data.sessionDate) : null,
      durationMinutes: data.durationMinutes ?? null,
      phase: data.phase ?? null,
      sessionOrder: data.sessionOrder,
      exercises: {
        create: data.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseOrder: e.exerciseOrder,
        })),
      },
    },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { exerciseOrder: "asc" },
      },
    },
  });
}

// ─── Execution ───

export async function executeSession(
  sessionId: string,
  data: ExecuteSessionSchema
) {
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: { exercises: true },
  });

  if (!session) throw new Error("Sesión no encontrada");

  // Update session execution data
  await prisma.trainingSession.update({
    where: { id: sessionId },
    data: {
      executedAt: data.executedAt ? new Date(data.executedAt) : new Date(),
      attendance: data.attendance,
    },
  });

  // Update exercise ratings
  for (const rating of data.exerciseRatings) {
    await prisma.sessionExercise.update({
      where: { id: rating.sessionExerciseId },
      data: {
        effectivenessRating: rating.effectivenessRating,
        coachNotes: rating.coachNotes ?? null,
      },
    });
  }

  return prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { exerciseOrder: "asc" },
      },
    },
  });
}

// ─── Duplicate ───

export async function deleteTrainingPlan(id: string) {
  // Delete in order: session exercises → sessions → plan
  const plan = await prisma.trainingPlan.findUnique({
    where: { id },
    include: { sessions: { select: { id: true } } },
  });
  if (!plan) throw new Error("Plan no encontrado");

  const sessionIds = plan.sessions.map((s) => s.id);

  if (sessionIds.length > 0) {
    await prisma.sessionExercise.deleteMany({
      where: { sessionId: { in: sessionIds } },
    });
    await prisma.trainingSession.deleteMany({
      where: { planId: id },
    });
  }

  await prisma.trainingPlan.delete({ where: { id } });
}

export async function duplicateTrainingPlan(planId: string, coachId: string) {
  const original = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    include: {
      sessions: {
        include: {
          exercises: { orderBy: { exerciseOrder: "asc" } },
        },
        orderBy: { sessionOrder: "asc" },
      },
    },
  });

  if (!original) throw new Error("Plan no encontrado");

  const newPlan = await prisma.trainingPlan.create({
    data: {
      teamId: original.teamId,
      coachId,
      name: `${original.name} (copia)`,
      targetAgeMin: original.targetAgeMin,
      targetAgeMax: original.targetAgeMax,
      level: original.level,
      objectives: original.objectives,
      startDate: original.startDate,
      endDate: original.endDate,
      isShared: false,
      sessions: {
        create: original.sessions.map((session) => ({
          sessionDate: session.sessionDate,
          durationMinutes: session.durationMinutes,
          phase: session.phase,
          sessionOrder: session.sessionOrder,
          exercises: {
            create: session.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              exerciseOrder: ex.exerciseOrder,
            })),
          },
        })),
      },
    },
    include: {
      sessions: {
        include: {
          exercises: { include: { exercise: true } },
        },
        orderBy: { sessionOrder: "asc" },
      },
      coach: { select: { id: true, fullName: true } },
    },
  });

  return newPlan;
}

// ─── Helpers ───

function calculateTotalDuration(
  sessions: { durationMinutes: number | null; exercises: { exercise: { durationMinutes: number | null } }[] }[]
): number {
  return sessions.reduce((total, session) => {
    if (session.durationMinutes) return total + session.durationMinutes;
    // Fallback: sum exercise durations
    const exerciseDuration = session.exercises.reduce(
      (sum, se) => sum + (se.exercise.durationMinutes ?? 0),
      0
    );
    return total + exerciseDuration;
  }, 0);
}

function getPlanStatus(plan: {
  startDate: Date | null;
  endDate: Date | null;
  sessions: { executedAt: Date | null }[];
}): "draft" | "active" | "completed" {
  const now = new Date();
  const allExecuted =
    plan.sessions.length > 0 &&
    plan.sessions.every((s) => s.executedAt !== null);

  if (allExecuted && plan.sessions.length > 0) return "completed";
  if (plan.endDate && new Date(plan.endDate) < now && allExecuted) return "completed";
  if (plan.startDate && new Date(plan.startDate) <= now) return "active";
  return "draft";
}

function validateExercisesForAge(
  exercises: { id: string; title: string; minAge: number | null; maxAge: number | null }[],
  targetAgeMin: number | null,
  targetAgeMax: number | null
): string[] {
  if (targetAgeMin == null && targetAgeMax == null) return [];

  const issues: string[] = [];
  for (const ex of exercises) {
    if (ex.minAge != null && targetAgeMax != null && ex.minAge > targetAgeMax) {
      issues.push(ex.title);
    }
    if (ex.maxAge != null && targetAgeMin != null && ex.maxAge < targetAgeMin) {
      issues.push(ex.title);
    }
  }
  return issues;
}

export async function getSharedPlans(excludeTeamId?: string) {
  const where: Record<string, unknown> = { isShared: true };
  if (excludeTeamId) {
    where.teamId = { not: excludeTeamId };
  }

  return prisma.trainingPlan.findMany({
    where,
    include: {
      sessions: {
        include: { exercises: { include: { exercise: true } } },
        orderBy: { sessionOrder: "asc" },
      },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
