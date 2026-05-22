import prisma from "@/lib/prisma";
import type { CreateEvaluationSchema } from "@/lib/validators/evaluation.schema";

// ─── Criteria labels for strengths/weaknesses ───

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

// ─── Helpers ───

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function toDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function computeStrengthsWeaknesses(criteria: Record<string, number>) {
  const sorted = Object.entries(criteria).sort(([, a], [, b]) => b - a);
  const topStrengths = sorted.slice(0, 3).map(([key, value]) => ({
    key,
    label: CRITERIA_LABELS[key] || key,
    value,
  }));
  const topWeaknesses = sorted.slice(-3).reverse().map(([key, value]) => ({
    key,
    label: CRITERIA_LABELS[key] || key,
    value,
  }));
  // Reverse weaknesses so worst is first
  topWeaknesses.reverse();
  return { topStrengths, topWeaknesses };
}

// ─── CRUD ───

export async function createEvaluation(
  data: CreateEvaluationSchema,
  evaluatorId: string
) {
  // Calculate dimension averages
  const technicalValues = [data.ballControl, data.passing, data.dribbling, data.shooting, data.heading, data.weakFoot];
  const tacticalValues = [data.positioning, data.gameVision, data.decisionMaking, data.systemUnderstanding];
  const physicalValues = [data.speed, data.endurance, data.strength, data.agility, data.coordination];
  const mentalValues = [data.concentration, data.attitude, data.leadership, data.teamwork, data.resilience];

  const technicalAvg = avg(technicalValues);
  const tacticalAvg = avg(tacticalValues);
  const physicalAvg = avg(physicalValues);
  const mentalAvg = avg(mentalValues);
  const overallAvg = avg([technicalAvg, tacticalAvg, physicalAvg, mentalAvg]);

  // Compute strengths and weaknesses
  const allCriteria: Record<string, number> = {
    ballControl: data.ballControl,
    passing: data.passing,
    dribbling: data.dribbling,
    shooting: data.shooting,
    heading: data.heading,
    weakFoot: data.weakFoot,
    positioning: data.positioning,
    gameVision: data.gameVision,
    decisionMaking: data.decisionMaking,
    systemUnderstanding: data.systemUnderstanding,
    speed: data.speed,
    endurance: data.endurance,
    strength: data.strength,
    agility: data.agility,
    coordination: data.coordination,
    concentration: data.concentration,
    attitude: data.attitude,
    leadership: data.leadership,
    teamwork: data.teamwork,
    resilience: data.resilience,
  };

  const { topStrengths, topWeaknesses } = computeStrengthsWeaknesses(allCriteria);

  return prisma.playerEvaluation.create({
    data: {
      playerId: data.playerId,
      evaluatorId,
      teamId: data.teamId,
      context: data.context,
      evaluationDate: new Date(data.evaluationDate),
      // Technical
      ballControl: data.ballControl,
      passing: data.passing,
      dribbling: data.dribbling,
      shooting: data.shooting,
      heading: data.heading,
      weakFoot: data.weakFoot,
      technicalAvg: toDecimal(technicalAvg),
      technicalComments: data.technicalComments ?? null,
      // Tactical
      positioning: data.positioning,
      gameVision: data.gameVision,
      decisionMaking: data.decisionMaking,
      systemUnderstanding: data.systemUnderstanding,
      tacticalAvg: toDecimal(tacticalAvg),
      tacticalComments: data.tacticalComments ?? null,
      // Physical
      speed: data.speed,
      endurance: data.endurance,
      strength: data.strength,
      agility: data.agility,
      coordination: data.coordination,
      physicalAvg: toDecimal(physicalAvg),
      physicalComments: data.physicalComments ?? null,
      // Mental
      concentration: data.concentration,
      attitude: data.attitude,
      leadership: data.leadership,
      teamwork: data.teamwork,
      resilience: data.resilience,
      mentalAvg: toDecimal(mentalAvg),
      mentalComments: data.mentalComments ?? null,
      // Position metrics
      positionMetrics: data.positionMetrics ?? undefined,
      // Overall
      overallAvg: toDecimal(overallAvg),
      topStrengths: topStrengths,
      topWeaknesses: topWeaknesses,
    },
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      evaluator: { select: { id: true, fullName: true } },
    },
  });
}

export async function getEvaluations(filters: {
  teamId?: string;
  playerId?: string;
  context?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.teamId) where.teamId = filters.teamId;
  if (filters.playerId) where.playerId = filters.playerId;
  if (filters.context) where.context = filters.context;
  if (filters.dateFrom || filters.dateTo) {
    where.evaluationDate = {
      ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
      ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
    };
  }

  return prisma.playerEvaluation.findMany({
    where,
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      evaluator: { select: { id: true, fullName: true } },
    },
    orderBy: { evaluationDate: "desc" },
  });
}

export async function getEvaluationById(id: string) {
  return prisma.playerEvaluation.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      evaluator: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });
}

export async function getPlayerProgress(playerId: string) {
  const evaluations = await prisma.playerEvaluation.findMany({
    where: { playerId },
    orderBy: { evaluationDate: "asc" },
    select: {
      id: true,
      evaluationDate: true,
      context: true,
      technicalAvg: true,
      tacticalAvg: true,
      physicalAvg: true,
      mentalAvg: true,
      overallAvg: true,
      topStrengths: true,
      topWeaknesses: true,
    },
  });

  return evaluations;
}

export async function getPreviousEvaluation(playerId: string, currentEvalId: string) {
  const current = await prisma.playerEvaluation.findUnique({
    where: { id: currentEvalId },
    select: { evaluationDate: true },
  });
  if (!current) return null;

  return prisma.playerEvaluation.findFirst({
    where: {
      playerId,
      id: { not: currentEvalId },
      evaluationDate: { lt: current.evaluationDate },
    },
    orderBy: { evaluationDate: "desc" },
    include: {
      player: { select: { id: true, fullName: true, position: true } },
    },
  });
}
