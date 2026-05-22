import prisma from "@/lib/prisma";

// ─── Mapping: evaluation weakness keys → exercise categories ───

const WEAKNESS_TO_EXERCISE_CATEGORY: Record<string, string[]> = {
  ballControl: ["ball_control"],
  passing: ["passing"],
  dribbling: ["ball_control", "individual"],
  shooting: ["shooting"],
  heading: ["physical", "shooting"],
  weakFoot: ["ball_control", "shooting"],
  positioning: ["tactics"],
  gameVision: ["tactics"],
  decisionMaking: ["tactics"],
  systemUnderstanding: ["tactics"],
  speed: ["agility", "physical"],
  endurance: ["physical"],
  strength: ["physical"],
  agility: ["agility", "physical"],
  coordination: ["agility", "physical"],
  concentration: ["individual", "tactics"],
  attitude: ["individual"],
  leadership: ["tactics", "individual"],
  teamwork: ["tactics"],
  resilience: ["physical", "individual"],
};

const WEAKNESS_LABELS: Record<string, string> = {
  ballControl: "Control de balón",
  passing: "Pase",
  dribbling: "Regate",
  shooting: "Tiro",
  heading: "Juego aéreo",
  weakFoot: "Pie débil",
  positioning: "Posicionamiento",
  gameVision: "Visión de juego",
  decisionMaking: "Toma de decisiones",
  systemUnderstanding: "Comprensión del sistema",
  speed: "Velocidad",
  endurance: "Resistencia",
  strength: "Fuerza",
  agility: "Agilidad",
  coordination: "Coordinación",
  concentration: "Concentración",
  attitude: "Actitud",
  leadership: "Liderazgo",
  teamwork: "Trabajo en equipo",
  resilience: "Resiliencia",
};

// ─── Types ───

export type FocusArea = {
  key: string;
  label: string;
  currentValue: number;
  targetValue: number;
};

export type RecommendedExercise = {
  exerciseId: string;
  title: string;
  category: string;
  focusAreaKey: string;
};

export type EvaluationScheduleItem = {
  date: string;
  completed: boolean;
};

export type Comment = {
  author: string;
  role: "coach" | "player" | "parent";
  message: string;
  createdAt: string;
};

// ─── Suggest focus areas from latest evaluation weaknesses ───

export async function suggestFocusAreas(playerId: string): Promise<FocusArea[]> {
  const latestEval = await prisma.playerEvaluation.findFirst({
    where: { playerId },
    orderBy: { evaluationDate: "desc" },
  });

  if (!latestEval) return [];

  const weaknesses = (latestEval.topWeaknesses as { key: string; label: string; value: number }[]) ?? [];

  return weaknesses.map((w) => ({
    key: w.key,
    label: w.label || WEAKNESS_LABELS[w.key] || w.key,
    currentValue: w.value,
    targetValue: Math.min(w.value + 2, 10),
  }));
}

// ─── Recommend exercises for focus areas (min 3 per area) ───

export async function recommendExercises(
  focusAreas: FocusArea[]
): Promise<RecommendedExercise[]> {
  const recommended: RecommendedExercise[] = [];

  for (const area of focusAreas) {
    const categories = WEAKNESS_TO_EXERCISE_CATEGORY[area.key] ?? ["individual"];

    const exercises = await prisma.exercise.findMany({
      where: { category: { in: categories } },
      take: 5,
      orderBy: { title: "asc" },
      select: { id: true, title: true, category: true },
    });

    // Ensure at least 3 — if not enough from mapped categories, fetch more
    if (exercises.length < 3) {
      const moreExercises = await prisma.exercise.findMany({
        where: {
          id: { notIn: exercises.map((e) => e.id) },
        },
        take: 3 - exercises.length,
        orderBy: { title: "asc" },
        select: { id: true, title: true, category: true },
      });
      exercises.push(...moreExercises);
    }

    for (const ex of exercises) {
      recommended.push({
        exerciseId: ex.id,
        title: ex.title,
        category: ex.category,
        focusAreaKey: area.key,
      });
    }
  }

  return recommended;
}

// ─── Generate evaluation schedule (every 3 weeks, 4 evaluations) ───

export function generateEvaluationSchedule(
  startDate: Date = new Date(),
  count: number = 4,
  intervalWeeks: number = 3
): EvaluationScheduleItem[] {
  const schedule: EvaluationScheduleItem[] = [];
  const current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    current.setDate(current.getDate() + intervalWeeks * 7);
    schedule.push({
      date: current.toISOString().split("T")[0],
      completed: false,
    });
  }

  return schedule;
}

// ─── CRUD ───

export async function createDevelopmentPlan(data: {
  playerId: string;
  coachId: string;
  teamId: string;
  focusAreas: FocusArea[];
  recommendedExercises: RecommendedExercise[];
  evaluationSchedule?: EvaluationScheduleItem[];
}) {
  const schedule =
    data.evaluationSchedule ?? generateEvaluationSchedule();

  return prisma.developmentPlan.create({
    data: {
      playerId: data.playerId,
      coachId: data.coachId,
      teamId: data.teamId,
      focusAreas: data.focusAreas as unknown as Record<string, unknown>[],
      recommendedExercises: data.recommendedExercises as unknown as Record<string, unknown>[],
      evaluationSchedule: schedule as unknown as Record<string, unknown>[],
      status: "active",
    },
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });
}

export async function getDevelopmentPlans(filters: {
  teamId?: string;
  playerId?: string;
  status?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (filters.teamId) where.teamId = filters.teamId;
  if (filters.playerId) where.playerId = filters.playerId;
  if (filters.status) where.status = filters.status;

  return prisma.developmentPlan.findMany({
    where,
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDevelopmentPlanById(id: string) {
  return prisma.developmentPlan.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });
}

export async function updateDevelopmentPlan(
  id: string,
  data: {
    focusAreas?: FocusArea[];
    recommendedExercises?: RecommendedExercise[];
    evaluationSchedule?: EvaluationScheduleItem[];
    status?: string;
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (data.focusAreas) updateData.focusAreas = data.focusAreas;
  if (data.recommendedExercises) updateData.recommendedExercises = data.recommendedExercises;
  if (data.evaluationSchedule) updateData.evaluationSchedule = data.evaluationSchedule;
  if (data.status) updateData.status = data.status;

  return prisma.developmentPlan.update({
    where: { id },
    data: updateData,
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });
}

// ─── Comments ───

export async function addComment(
  planId: string,
  role: "coach" | "player" | "parent",
  authorName: string,
  message: string
) {
  const plan = await prisma.developmentPlan.findUnique({
    where: { id: planId },
  });
  if (!plan) throw new Error("Plan no encontrado");

  // Comments are stored in parentComments / playerComments fields
  // We use a JSON array approach appended to the appropriate field
  if (role === "parent") {
    const existing: Comment[] = plan.parentComments
      ? JSON.parse(plan.parentComments)
      : [];
    existing.push({ author: authorName, role, message, createdAt: new Date().toISOString() });
    return prisma.developmentPlan.update({
      where: { id: planId },
      data: { parentComments: JSON.stringify(existing) },
    });
  } else if (role === "player") {
    const existing: Comment[] = plan.playerComments
      ? JSON.parse(plan.playerComments)
      : [];
    existing.push({ author: authorName, role, message, createdAt: new Date().toISOString() });
    return prisma.developmentPlan.update({
      where: { id: planId },
      data: { playerComments: JSON.stringify(existing) },
    });
  } else {
    // Coach comments go into parentComments as well (shared view)
    const existing: Comment[] = plan.parentComments
      ? JSON.parse(plan.parentComments)
      : [];
    existing.push({ author: authorName, role, message, createdAt: new Date().toISOString() });
    return prisma.developmentPlan.update({
      where: { id: planId },
      data: { parentComments: JSON.stringify(existing) },
    });
  }
}

// ─── Progress alerts: check if 2 consecutive evaluations show no improvement ───

export async function checkProgressAlerts(planId: string): Promise<{
  hasAlert: boolean;
  message: string | null;
  staleFocusAreas: string[];
}> {
  const plan = await prisma.developmentPlan.findUnique({ where: { id: planId } });
  if (!plan) return { hasAlert: false, message: null, staleFocusAreas: [] };

  const focusAreas = (plan.focusAreas as FocusArea[]) ?? [];
  if (focusAreas.length === 0) return { hasAlert: false, message: null, staleFocusAreas: [] };

  // Get last 3 evaluations for this player
  const evaluations = await prisma.playerEvaluation.findMany({
    where: { playerId: plan.playerId },
    orderBy: { evaluationDate: "desc" },
    take: 3,
  });

  if (evaluations.length < 3) {
    return { hasAlert: false, message: null, staleFocusAreas: [] };
  }

  const staleFocusAreas: string[] = [];

  for (const area of focusAreas) {
    const key = area.key;
    // Get the value from each evaluation
    const values = evaluations.map((ev) => {
      const record = ev as unknown as Record<string, unknown>;
      // Try camelCase field name directly
      return typeof record[key] === "number" ? (record[key] as number) : null;
    }).filter((v): v is number => v !== null);

    if (values.length >= 3) {
      // values[0] is most recent, values[2] is oldest
      // Alert if no improvement in last 2 evaluations compared to the one before
      if (values[0] <= values[2] && values[1] <= values[2]) {
        staleFocusAreas.push(area.label);
      }
    }
  }

  if (staleFocusAreas.length > 0) {
    return {
      hasAlert: true,
      message: `Sin progreso en: ${staleFocusAreas.join(", ")}. Considere ajustar el plan.`,
      staleFocusAreas,
    };
  }

  return { hasAlert: false, message: null, staleFocusAreas: [] };
}

// ─── Get all plans with alerts for a team ───

export async function getPlansWithAlerts(teamId: string) {
  const plans = await getDevelopmentPlans({ teamId, status: "active" });
  const results = [];

  for (const plan of plans) {
    const alert = await checkProgressAlerts(plan.id);
    results.push({ ...plan, alert });
  }

  return results;
}
