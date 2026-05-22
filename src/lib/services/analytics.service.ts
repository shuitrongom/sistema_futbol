import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const CACHE_PREFIX = "analytics";
const CACHE_TTL = 60 * 60; // 1 hour

// ─── Types ───

export interface DimensionMetrics {
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
  overall: number;
}

export interface WeakPoint {
  key: string;
  label: string;
  average: number;
  playerCount: number;
}

export interface ExerciseSuggestion {
  exerciseId: string;
  title: string;
  category: string;
  difficulty: string | null;
  methodologySource: string | null;
  durationMinutes: number | null;
  weaknessKey: string;
  weaknessLabel: string;
}

export interface PlayerComparison {
  playerId: string;
  fullName: string;
  position: string;
  dimensions: DimensionMetrics;
  latestEvaluationDate: Date;
}

export interface PlayerRanking {
  playerId: string;
  fullName: string;
  position: string;
  score: number;
}

export interface TrainingCorrelation {
  period: string;
  sessionsExecuted: number;
  avgEffectiveness: number;
  avgEvaluationScore: number;
  improvement: number;
}

export interface TemporalTrend {
  period: string;
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
  overall: number;
  evaluationCount: number;
}

const CRITERIA_LABELS: Record<string, string> = {
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

// Maps weakness keys to exercise categories that address them
const WEAKNESS_TO_EXERCISE_CATEGORY: Record<string, string[]> = {
  ballControl: ["ball_control", "individual"],
  passing: ["passing", "tactics"],
  dribbling: ["ball_control", "individual"],
  shooting: ["shooting"],
  heading: ["physical", "individual"],
  weakFoot: ["ball_control", "individual"],
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
  leadership: ["tactics"],
  teamwork: ["tactics"],
  resilience: ["physical", "individual"],
};

// ─── Helpers ───

function safeAvg(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    // Redis unavailable
  }
  return null;
}

async function setCache(key: string, data: unknown, ttl = CACHE_TTL): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch {
    // Redis unavailable
  }
}

// ─── 1. Aggregated Team Metrics ───

export async function getTeamMetrics(teamId: string): Promise<DimensionMetrics> {
  const cacheKey = `${CACHE_PREFIX}:team-metrics:${teamId}`;
  const cached = await getCached<DimensionMetrics>(cacheKey);
  if (cached) return cached;

  // Get the latest evaluation per player for this team
  const evaluations = await prisma.playerEvaluation.findMany({
    where: { teamId },
    orderBy: { evaluationDate: "desc" },
    select: {
      playerId: true,
      technicalAvg: true,
      tacticalAvg: true,
      physicalAvg: true,
      mentalAvg: true,
      overallAvg: true,
    },
  });

  // Keep only the latest evaluation per player
  const latestByPlayer = new Map<string, typeof evaluations[0]>();
  for (const ev of evaluations) {
    if (!latestByPlayer.has(ev.playerId)) {
      latestByPlayer.set(ev.playerId, ev);
    }
  }

  const latest = Array.from(latestByPlayer.values());

  const metrics: DimensionMetrics = {
    technical: safeAvg(latest.map((e) => Number(e.technicalAvg ?? 0)).filter((v) => v > 0)),
    tactical: safeAvg(latest.map((e) => Number(e.tacticalAvg ?? 0)).filter((v) => v > 0)),
    physical: safeAvg(latest.map((e) => Number(e.physicalAvg ?? 0)).filter((v) => v > 0)),
    mental: safeAvg(latest.map((e) => Number(e.mentalAvg ?? 0)).filter((v) => v > 0)),
    overall: safeAvg(latest.map((e) => Number(e.overallAvg ?? 0)).filter((v) => v > 0)),
  };

  await setCache(cacheKey, metrics);
  return metrics;
}

// ─── 2. Identify 3 Most Common Weak Points ───

export async function getTeamWeakPoints(teamId: string): Promise<WeakPoint[]> {
  const cacheKey = `${CACHE_PREFIX}:weak-points:${teamId}`;
  const cached = await getCached<WeakPoint[]>(cacheKey);
  if (cached) return cached;

  const evaluations = await prisma.playerEvaluation.findMany({
    where: { teamId },
    orderBy: { evaluationDate: "desc" },
    select: {
      playerId: true,
      ballControl: true,
      passing: true,
      dribbling: true,
      shooting: true,
      heading: true,
      weakFoot: true,
      positioning: true,
      gameVision: true,
      decisionMaking: true,
      systemUnderstanding: true,
      speed: true,
      endurance: true,
      strength: true,
      agility: true,
      coordination: true,
      concentration: true,
      attitude: true,
      leadership: true,
      teamwork: true,
      resilience: true,
    },
  });

  // Keep only latest per player
  const latestByPlayer = new Map<string, typeof evaluations[0]>();
  for (const ev of evaluations) {
    if (!latestByPlayer.has(ev.playerId)) {
      latestByPlayer.set(ev.playerId, ev);
    }
  }

  const latest = Array.from(latestByPlayer.values());
  if (latest.length === 0) return [];

  const criteriaKeys = Object.keys(CRITERIA_LABELS);
  const criteriaAverages: { key: string; label: string; average: number; playerCount: number }[] = [];

  for (const key of criteriaKeys) {
    const values = latest
      .map((e) => (e as Record<string, unknown>)[key] as number | null)
      .filter((v): v is number => v != null && v > 0);

    if (values.length > 0) {
      criteriaAverages.push({
        key,
        label: CRITERIA_LABELS[key],
        average: safeAvg(values),
        playerCount: values.length,
      });
    }
  }

  // Sort ascending (lowest average = weakest) and take top 3
  criteriaAverages.sort((a, b) => a.average - b.average);
  const weakPoints = criteriaAverages.slice(0, 3);

  await setCache(cacheKey, weakPoints);
  return weakPoints;
}

// ─── 3. Suggest Exercises for Weaknesses ───

export async function getExerciseSuggestions(teamId: string): Promise<ExerciseSuggestion[]> {
  const cacheKey = `${CACHE_PREFIX}:exercise-suggestions:${teamId}`;
  const cached = await getCached<ExerciseSuggestion[]>(cacheKey);
  if (cached) return cached;

  const weakPoints = await getTeamWeakPoints(teamId);
  if (weakPoints.length === 0) return [];

  const suggestions: ExerciseSuggestion[] = [];

  for (const wp of weakPoints) {
    const categories = WEAKNESS_TO_EXERCISE_CATEGORY[wp.key] ?? [];
    if (categories.length === 0) continue;

    const exercises = await prisma.exercise.findMany({
      where: {
        category: { in: categories },
      },
      take: 3,
      orderBy: [{ methodologySource: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        methodologySource: true,
        durationMinutes: true,
      },
    });

    for (const ex of exercises) {
      suggestions.push({
        exerciseId: ex.id,
        title: ex.title,
        category: ex.category,
        difficulty: ex.difficulty,
        methodologySource: ex.methodologySource,
        durationMinutes: ex.durationMinutes,
        weaknessKey: wp.key,
        weaknessLabel: wp.label,
      });
    }
  }

  await setCache(cacheKey, suggestions);
  return suggestions;
}

// ─── 4. Compare Players Across Dimensions ───

export async function comparePlayersInTeam(teamId: string): Promise<PlayerComparison[]> {
  const cacheKey = `${CACHE_PREFIX}:player-comparison:${teamId}`;
  const cached = await getCached<PlayerComparison[]>(cacheKey);
  if (cached) return cached;

  const evaluations = await prisma.playerEvaluation.findMany({
    where: { teamId },
    orderBy: { evaluationDate: "desc" },
    select: {
      playerId: true,
      evaluationDate: true,
      technicalAvg: true,
      tacticalAvg: true,
      physicalAvg: true,
      mentalAvg: true,
      overallAvg: true,
      player: {
        select: { id: true, fullName: true, position: true },
      },
    },
  });

  // Latest evaluation per player
  const latestByPlayer = new Map<string, typeof evaluations[0]>();
  for (const ev of evaluations) {
    if (!latestByPlayer.has(ev.playerId)) {
      latestByPlayer.set(ev.playerId, ev);
    }
  }

  const comparisons: PlayerComparison[] = Array.from(latestByPlayer.values()).map((ev) => ({
    playerId: ev.playerId,
    fullName: ev.player.fullName,
    position: ev.player.position,
    dimensions: {
      technical: Number(ev.technicalAvg ?? 0),
      tactical: Number(ev.tacticalAvg ?? 0),
      physical: Number(ev.physicalAvg ?? 0),
      mental: Number(ev.mentalAvg ?? 0),
      overall: Number(ev.overallAvg ?? 0),
    },
    latestEvaluationDate: ev.evaluationDate,
  }));

  comparisons.sort((a, b) => b.dimensions.overall - a.dimensions.overall);

  await setCache(cacheKey, comparisons);
  return comparisons;
}

// ─── 5. Rankings by Dimension ───

export async function getPlayerRankings(
  teamId: string,
  dimension: "technical" | "tactical" | "physical" | "mental" | "overall"
): Promise<PlayerRanking[]> {
  const cacheKey = `${CACHE_PREFIX}:rankings:${teamId}:${dimension}`;
  const cached = await getCached<PlayerRanking[]>(cacheKey);
  if (cached) return cached;

  const dimFieldMap: Record<string, string> = {
    technical: "technicalAvg",
    tactical: "tacticalAvg",
    physical: "physicalAvg",
    mental: "mentalAvg",
    overall: "overallAvg",
  };

  const field = dimFieldMap[dimension];

  const evaluations = await prisma.playerEvaluation.findMany({
    where: { teamId },
    orderBy: { evaluationDate: "desc" },
    select: {
      playerId: true,
      [field]: true,
      player: {
        select: { id: true, fullName: true, position: true },
      },
    },
  });

  // Latest per player
  const latestByPlayer = new Map<string, { playerId: string; score: number; fullName: string; position: string }>();
  for (const ev of evaluations) {
    if (!latestByPlayer.has(ev.playerId)) {
      latestByPlayer.set(ev.playerId, {
        playerId: ev.playerId,
        score: Number((ev as Record<string, unknown>)[field] ?? 0),
        fullName: ev.player.fullName,
        position: ev.player.position,
      });
    }
  }

  const rankings: PlayerRanking[] = Array.from(latestByPlayer.values())
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  await setCache(cacheKey, rankings);
  return rankings;
}

// ─── 6. Correlate Training Sessions with Improvements ───

export async function getTrainingCorrelation(teamId: string): Promise<TrainingCorrelation[]> {
  const cacheKey = `${CACHE_PREFIX}:training-correlation:${teamId}`;
  const cached = await getCached<TrainingCorrelation[]>(cacheKey);
  if (cached) return cached;

  // Get executed training sessions for this team, grouped by month
  const sessions = await prisma.trainingSession.findMany({
    where: {
      plan: { teamId },
      executedAt: { not: null },
    },
    include: {
      exercises: {
        select: { effectivenessRating: true },
      },
    },
    orderBy: { executedAt: "asc" },
  });

  // Get evaluations for this team, grouped by month
  const evaluations = await prisma.playerEvaluation.findMany({
    where: { teamId },
    orderBy: { evaluationDate: "asc" },
    select: {
      evaluationDate: true,
      overallAvg: true,
    },
  });

  // Group sessions by month
  const sessionsByMonth = new Map<string, { count: number; ratings: number[] }>();
  for (const s of sessions) {
    const month = formatMonth(s.executedAt!);
    const entry = sessionsByMonth.get(month) ?? { count: 0, ratings: [] };
    entry.count++;
    for (const ex of s.exercises) {
      if (ex.effectivenessRating != null) {
        entry.ratings.push(ex.effectivenessRating);
      }
    }
    sessionsByMonth.set(month, entry);
  }

  // Group evaluations by month
  const evalsByMonth = new Map<string, number[]>();
  for (const ev of evaluations) {
    const month = formatMonth(ev.evaluationDate);
    const scores = evalsByMonth.get(month) ?? [];
    scores.push(Number(ev.overallAvg ?? 0));
    evalsByMonth.set(month, scores);
  }

  // Merge into correlation data
  const allMonths = new Set([...Array.from(sessionsByMonth.keys()), ...Array.from(evalsByMonth.keys())]);
  const sortedMonths = Array.from(allMonths).sort();

  let previousAvgScore = 0;
  const correlations: TrainingCorrelation[] = [];

  for (const month of sortedMonths) {
    const sessionData = sessionsByMonth.get(month);
    const evalScores = evalsByMonth.get(month);

    const avgEvalScore = evalScores ? safeAvg(evalScores.filter((v) => v > 0)) : 0;
    const improvement = previousAvgScore > 0 && avgEvalScore > 0
      ? Math.round((avgEvalScore - previousAvgScore) * 10) / 10
      : 0;

    correlations.push({
      period: month,
      sessionsExecuted: sessionData?.count ?? 0,
      avgEffectiveness: sessionData?.ratings.length
        ? safeAvg(sessionData.ratings)
        : 0,
      avgEvaluationScore: avgEvalScore,
      improvement,
    });

    if (avgEvalScore > 0) {
      previousAvgScore = avgEvalScore;
    }
  }

  await setCache(cacheKey, correlations);
  return correlations;
}

// ─── 7. Temporal Trends ───

export async function getTemporalTrends(teamId: string): Promise<TemporalTrend[]> {
  const cacheKey = `${CACHE_PREFIX}:temporal-trends:${teamId}`;
  const cached = await getCached<TemporalTrend[]>(cacheKey);
  if (cached) return cached;

  const evaluations = await prisma.playerEvaluation.findMany({
    where: { teamId },
    orderBy: { evaluationDate: "asc" },
    select: {
      evaluationDate: true,
      technicalAvg: true,
      tacticalAvg: true,
      physicalAvg: true,
      mentalAvg: true,
      overallAvg: true,
    },
  });

  // Group by month
  const byMonth = new Map<string, typeof evaluations>();
  for (const ev of evaluations) {
    const month = formatMonth(ev.evaluationDate);
    const group = byMonth.get(month) ?? [];
    group.push(ev);
    byMonth.set(month, group);
  }

  const trends: TemporalTrend[] = [];
  const sortedMonths = Array.from(byMonth.keys()).sort();

  for (const month of sortedMonths) {
    const group = byMonth.get(month)!;
    trends.push({
      period: month,
      technical: safeAvg(group.map((e) => Number(e.technicalAvg ?? 0)).filter((v) => v > 0)),
      tactical: safeAvg(group.map((e) => Number(e.tacticalAvg ?? 0)).filter((v) => v > 0)),
      physical: safeAvg(group.map((e) => Number(e.physicalAvg ?? 0)).filter((v) => v > 0)),
      mental: safeAvg(group.map((e) => Number(e.mentalAvg ?? 0)).filter((v) => v > 0)),
      overall: safeAvg(group.map((e) => Number(e.overallAvg ?? 0)).filter((v) => v > 0)),
      evaluationCount: group.length,
    });
  }

  await setCache(cacheKey, trends);
  return trends;
}

// ─── Dashboard Aggregate ───

export async function getDashboardAnalytics(teamId: string) {
  const [metrics, weakPoints, exerciseSuggestions, playerComparisons, trends] =
    await Promise.all([
      getTeamMetrics(teamId),
      getTeamWeakPoints(teamId),
      getExerciseSuggestions(teamId),
      comparePlayersInTeam(teamId),
      getTemporalTrends(teamId),
    ]);

  return {
    metrics,
    weakPoints,
    exerciseSuggestions,
    playerComparisons,
    trends,
  };
}

// ─── 8. Exercise Effectiveness ───

export interface ExerciseEffectiveness {
  exerciseId: string;
  title: string;
  category: string;
  timesExecuted: number;
  avgRating: number;
  ratings: { period: string; rating: number }[];
}

export async function getExerciseEffectiveness(teamId: string): Promise<ExerciseEffectiveness[]> {
  const cacheKey = `${CACHE_PREFIX}:exercise-effectiveness:${teamId}`;
  const cached = await getCached<ExerciseEffectiveness[]>(cacheKey);
  if (cached) return cached;

  const sessionExercises = await prisma.sessionExercise.findMany({
    where: {
      session: {
        plan: { teamId },
        executedAt: { not: null },
      },
      effectivenessRating: { not: null },
    },
    include: {
      exercise: {
        select: { id: true, title: true, category: true },
      },
      session: {
        select: { executedAt: true },
      },
    },
  });

  const byExercise = new Map<string, {
    title: string;
    category: string;
    ratings: number[];
    periods: { period: string; rating: number }[];
  }>();

  for (const se of sessionExercises) {
    const entry = byExercise.get(se.exerciseId) ?? {
      title: se.exercise.title,
      category: se.exercise.category,
      ratings: [],
      periods: [],
    };
    entry.ratings.push(se.effectivenessRating!);
    if (se.session.executedAt) {
      entry.periods.push({
        period: formatMonth(se.session.executedAt),
        rating: se.effectivenessRating!,
      });
    }
    byExercise.set(se.exerciseId, entry);
  }

  const result: ExerciseEffectiveness[] = Array.from(byExercise.entries()).map(
    ([exerciseId, data]) => ({
      exerciseId,
      title: data.title,
      category: data.category,
      timesExecuted: data.ratings.length,
      avgRating: safeAvg(data.ratings),
      ratings: data.periods,
    })
  );

  result.sort((a, b) => b.avgRating - a.avgRating);

  await setCache(cacheKey, result);
  return result;
}

export async function getTrainingEffectiveness(teamId: string) {
  const [correlation, trends, exerciseEffectiveness] = await Promise.all([
    getTrainingCorrelation(teamId),
    getTemporalTrends(teamId),
    getExerciseEffectiveness(teamId),
  ]);

  return { correlation, trends, exerciseEffectiveness };
}

// ─── Utility ───

function formatMonth(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
