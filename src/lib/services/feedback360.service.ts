import prisma from "@/lib/prisma";
import { createEvaluation } from "@/lib/services/evaluation.service";
import type { CreateEvaluationSchema } from "@/lib/validators/evaluation.schema";

// ─── Types ───

export type Feedback360CreateInput = {
  playerId: string;
  coachId: string;
  teamId: string;
  evaluatorIds: string[];
};

export type ConsolidatedCriterion = {
  key: string;
  label: string;
  average: number;
  scores: { evaluatorId: string; evaluatorName: string; value: number }[];
  hasDiscrepancy: boolean;
  min: number;
  max: number;
};

export type ConsolidatedReport = {
  session: Awaited<ReturnType<typeof getSessionById>>;
  criteria: ConsolidatedCriterion[];
  dimensionAverages: {
    technical: number;
    tactical: number;
    physical: number;
    mental: number;
    overall: number;
  };
  completedCount: number;
  totalEvaluators: number;
  discrepancies: ConsolidatedCriterion[];
};

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

const ALL_CRITERIA_KEYS = Object.keys(CRITERIA_LABELS);

// ─── Helpers ───

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

// ─── Session CRUD ───

export async function createFeedback360Session(input: Feedback360CreateInput) {
  const session = await prisma.feedback360Session.create({
    data: {
      playerId: input.playerId,
      coachId: input.coachId,
      teamId: input.teamId,
      status: "pending",
      evaluators: {
        create: input.evaluatorIds.map((evaluatorId) => ({
          evaluatorId,
          status: "pending",
        })),
      },
    },
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
      evaluators: {
        include: {
          evaluator: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  return session;
}

export async function getSessionById(id: string) {
  return prisma.feedback360Session.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
      evaluators: {
        include: {
          evaluator: { select: { id: true, fullName: true, email: true } },
          evaluation: true,
        },
      },
    },
  });
}

export async function getSessionsByTeam(teamId: string) {
  return prisma.feedback360Session.findMany({
    where: { teamId },
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      coach: { select: { id: true, fullName: true } },
      evaluators: {
        include: {
          evaluator: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Evaluator Management ───

export async function notifyEvaluators(sessionId: string) {
  const now = new Date();
  const evaluators = await prisma.feedback360Evaluator.findMany({
    where: { sessionId, status: "pending" },
  });

  // Mark all as notified and update session status
  await prisma.$transaction([
    ...evaluators.map((ev) =>
      prisma.feedback360Evaluator.update({
        where: { id: ev.id },
        data: { notifiedAt: now },
      })
    ),
    prisma.feedback360Session.update({
      where: { id: sessionId },
      data: { status: "in_progress" },
    }),
  ]);

  return evaluators.length;
}

export async function submitEvaluatorEvaluation(
  sessionId: string,
  evaluatorRecordId: string,
  evaluationData: CreateEvaluationSchema,
  evaluatorUserId: string
) {
  // Verify the evaluator record exists and belongs to this session
  const evaluatorRecord = await prisma.feedback360Evaluator.findUnique({
    where: { id: evaluatorRecordId },
    include: { session: true },
  });

  if (!evaluatorRecord || evaluatorRecord.sessionId !== sessionId) {
    throw new Error("Evaluador no encontrado en esta sesión");
  }

  if (evaluatorRecord.evaluatorId !== evaluatorUserId) {
    throw new Error("No autorizado para enviar esta evaluación");
  }

  if (evaluatorRecord.status === "completed") {
    throw new Error("Esta evaluación ya fue enviada");
  }

  // Create the evaluation using existing service, marking it as feedback 360
  const evaluation = await createEvaluation(
    { ...evaluationData },
    evaluatorUserId
  );

  // Mark as feedback 360 and link
  await prisma.playerEvaluation.update({
    where: { id: evaluation.id },
    data: { isFeedback360: true, feedback360Id: sessionId },
  });

  // Update evaluator record
  await prisma.feedback360Evaluator.update({
    where: { id: evaluatorRecordId },
    data: {
      evaluationId: evaluation.id,
      status: "completed",
    },
  });

  // Check if all evaluators have completed
  const pending = await prisma.feedback360Evaluator.count({
    where: { sessionId, status: { not: "completed" } },
  });

  if (pending === 0) {
    await prisma.feedback360Session.update({
      where: { id: sessionId },
      data: { status: "completed" },
    });
  }

  return evaluation;
}

// ─── Aggregation & Discrepancy Detection ───

export async function generateConsolidatedReport(
  sessionId: string
): Promise<ConsolidatedReport | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const completedEvaluators = session.evaluators.filter(
    (ev) => ev.status === "completed" && ev.evaluation
  );

  if (completedEvaluators.length === 0) {
    return {
      session,
      criteria: [],
      dimensionAverages: { technical: 0, tactical: 0, physical: 0, mental: 0, overall: 0 },
      completedCount: 0,
      totalEvaluators: session.evaluators.length,
      discrepancies: [],
    };
  }

  // Aggregate per criterion
  const criteria: ConsolidatedCriterion[] = ALL_CRITERIA_KEYS.map((key) => {
    const scores = completedEvaluators
      .filter((ev) => {
        const val = ev.evaluation?.[key as keyof typeof ev.evaluation];
        return val !== null && val !== undefined;
      })
      .map((ev) => ({
        evaluatorId: ev.evaluatorId,
        evaluatorName: ev.evaluator.fullName,
        value: Number(ev.evaluation![key as keyof typeof ev.evaluation]) || 0,
      }));

    const values = scores.map((s) => s.value);
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const hasDiscrepancy = max - min > 3;

    return {
      key,
      label: CRITERIA_LABELS[key] || key,
      average: avg(values),
      scores,
      hasDiscrepancy,
      min,
      max,
    };
  });

  // Dimension averages
  const technicalKeys = ["ballControl", "passing", "dribbling", "shooting", "heading", "weakFoot"];
  const tacticalKeys = ["positioning", "gameVision", "decisionMaking", "systemUnderstanding"];
  const physicalKeys = ["speed", "endurance", "strength", "agility", "coordination"];
  const mentalKeys = ["concentration", "attitude", "leadership", "teamwork", "resilience"];

  const dimAvg = (keys: string[]) =>
    avg(criteria.filter((c) => keys.includes(c.key)).map((c) => c.average));

  const technical = dimAvg(technicalKeys);
  const tactical = dimAvg(tacticalKeys);
  const physical = dimAvg(physicalKeys);
  const mental = dimAvg(mentalKeys);
  const overall = avg([technical, tactical, physical, mental]);

  const discrepancies = criteria.filter((c) => c.hasDiscrepancy);

  return {
    session,
    criteria,
    dimensionAverages: { technical, tactical, physical, mental, overall },
    completedCount: completedEvaluators.length,
    totalEvaluators: session.evaluators.length,
    discrepancies,
  };
}
