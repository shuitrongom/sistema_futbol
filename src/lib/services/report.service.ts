import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ─── Types ───

export type ReportSection =
  | "evaluations"
  | "progress"
  | "tasks"
  | "objectives"
  | "feedback"
  | "coachComments";

export type ReportType = "monthly" | "quarterly" | "semester";

export type GenerateReportInput = {
  playerId: string;
  teamId: string;
  periodStart: string;
  periodEnd: string;
  reportType: ReportType;
  sections: ReportSection[];
  coachComments?: string;
};

export type ReportContent = {
  sections: ReportSection[];
  playerInfo: {
    fullName: string;
    position: string;
    birthDate: string;
    teamName: string;
  };
  evaluations?: Array<{
    id: string;
    date: string;
    context: string;
    technicalAvg: number | null;
    tacticalAvg: number | null;
    physicalAvg: number | null;
    mentalAvg: number | null;
    overallAvg: number | null;
  }>;
  latestEvaluation?: {
    ballControl: number | null;
    passing: number | null;
    dribbling: number | null;
    shooting: number | null;
    heading: number | null;
    weakFoot: number | null;
    positioning: number | null;
    gameVision: number | null;
    decisionMaking: number | null;
    systemUnderstanding: number | null;
    speed: number | null;
    endurance: number | null;
    strength: number | null;
    agility: number | null;
    coordination: number | null;
    concentration: number | null;
    attitude: number | null;
    leadership: number | null;
    teamwork: number | null;
    resilience: number | null;
    topStrengths: unknown;
    topWeaknesses: unknown;
  } | null;
  tasks?: Array<{
    title: string;
    status: string;
    taskType: string | null;
    completedAt: string | null;
  }>;
  objectives?: Array<{
    title: string;
    status: string;
    targetValue: number | null;
    currentValue: number | null;
    progress: number;
  }>;
  feedback?: Array<{
    feedbackType: string;
    message: string;
    createdAt: string;
  }>;
  coachComments?: string;
  coachName: string;
  generatedAt: string;
};

// ─── Generate Report ───

export async function generateReport(data: GenerateReportInput, coachId: string) {
  const periodStart = new Date(data.periodStart);
  const periodEnd = new Date(data.periodEnd);

  // Gather report content
  const content = await gatherReportContent(
    data.playerId,
    data.teamId,
    periodStart,
    periodEnd,
    data.sections,
    data.coachComments,
    coachId
  );

  // Create report record
  const report = await prisma.progressReport.create({
    data: {
      playerId: data.playerId,
      coachId,
      teamId: data.teamId,
      periodStart,
      periodEnd,
      reportType: data.reportType,
      content: content as unknown as Prisma.InputJsonValue,
    },
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return report;
}

// ─── Gather content for all selected sections ───

async function gatherReportContent(
  playerId: string,
  teamId: string,
  periodStart: Date,
  periodEnd: Date,
  sections: ReportSection[],
  coachComments: string | undefined,
  coachId: string
): Promise<ReportContent> {
  // Player info
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { fullName: true, position: true, birthDate: true },
  });
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });
  const coach = await prisma.user.findUnique({
    where: { id: coachId },
    select: { fullName: true },
  });

  const content: ReportContent = {
    sections,
    playerInfo: {
      fullName: player?.fullName ?? "",
      position: player?.position ?? "",
      birthDate: player?.birthDate?.toISOString() ?? "",
      teamName: team?.name ?? "",
    },
    coachName: coach?.fullName ?? "",
    generatedAt: new Date().toISOString(),
  };

  if (sections.includes("evaluations") || sections.includes("progress")) {
    const evaluations = await prisma.playerEvaluation.findMany({
      where: {
        playerId,
        evaluationDate: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { evaluationDate: "asc" },
    });

    content.evaluations = evaluations.map((e) => ({
      id: e.id,
      date: e.evaluationDate.toISOString(),
      context: e.context,
      technicalAvg: e.technicalAvg ? Number(e.technicalAvg) : null,
      tacticalAvg: e.tacticalAvg ? Number(e.tacticalAvg) : null,
      physicalAvg: e.physicalAvg ? Number(e.physicalAvg) : null,
      mentalAvg: e.mentalAvg ? Number(e.mentalAvg) : null,
      overallAvg: e.overallAvg ? Number(e.overallAvg) : null,
    }));

    // Latest evaluation for radar chart data
    const latest = evaluations[evaluations.length - 1];
    if (latest) {
      content.latestEvaluation = {
        ballControl: latest.ballControl,
        passing: latest.passing,
        dribbling: latest.dribbling,
        shooting: latest.shooting,
        heading: latest.heading,
        weakFoot: latest.weakFoot,
        positioning: latest.positioning,
        gameVision: latest.gameVision,
        decisionMaking: latest.decisionMaking,
        systemUnderstanding: latest.systemUnderstanding,
        speed: latest.speed,
        endurance: latest.endurance,
        strength: latest.strength,
        agility: latest.agility,
        coordination: latest.coordination,
        concentration: latest.concentration,
        attitude: latest.attitude,
        leadership: latest.leadership,
        teamwork: latest.teamwork,
        resilience: latest.resilience,
        topStrengths: latest.topStrengths,
        topWeaknesses: latest.topWeaknesses,
      };
    }
  }

  if (sections.includes("tasks")) {
    const assignments = await prisma.taskAssignment.findMany({
      where: {
        playerId,
        task: {
          teamId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      },
      include: {
        task: { select: { title: true, taskType: true } },
      },
    });

    content.tasks = assignments.map((a) => ({
      title: a.task.title,
      status: a.status,
      taskType: a.task.taskType,
      completedAt: a.completedAt?.toISOString() ?? null,
    }));
  }

  if (sections.includes("objectives")) {
    const objectives = await prisma.developmentObjective.findMany({
      where: {
        playerId,
        teamId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    content.objectives = objectives.map((o) => {
      const target = Number(o.targetValue) || 0;
      const current = Number(o.currentValue) || 0;
      const progress = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
      return {
        title: o.title,
        status: o.status,
        targetValue: target,
        currentValue: current,
        progress,
      };
    });
  }

  if (sections.includes("feedback")) {
    const feedbackList = await prisma.personalizedFeedback.findMany({
      where: {
        playerId,
        teamId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { createdAt: "desc" },
    });

    content.feedback = feedbackList.map((f) => ({
      feedbackType: f.feedbackType,
      message: f.message,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  if (sections.includes("coachComments") && coachComments) {
    content.coachComments = coachComments;
  }

  return content;
}

// ─── Get Reports ───

export async function getReports(filters: {
  teamId?: string;
  playerId?: string;
  reportType?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.teamId) where.teamId = filters.teamId;
  if (filters.playerId) where.playerId = filters.playerId;
  if (filters.reportType) where.reportType = filters.reportType;

  return prisma.progressReport.findMany({
    where,
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReportById(id: string) {
  return prisma.progressReport.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true, birthDate: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });
}
