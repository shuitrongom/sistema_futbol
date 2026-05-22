import prisma from "@/lib/prisma";

// ─── Types ───

export type CreateObjectiveInput = {
  playerId: string;
  teamId: string;
  title: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  metricName?: string;
  startDate?: string;
  targetDate?: string;
};

export type UpdateObjectiveInput = {
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  metricName?: string;
  targetDate?: string;
  status?: string;
};

// ─── CRUD ───

export async function createObjective(data: CreateObjectiveInput, coachId: string) {
  return prisma.developmentObjective.create({
    data: {
      playerId: data.playerId,
      coachId,
      teamId: data.teamId,
      title: data.title,
      description: data.description ?? null,
      targetValue: data.targetValue ?? null,
      currentValue: data.currentValue ?? 0,
      metricName: data.metricName ?? null,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      status: "active",
    },
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      coach: { select: { id: true, fullName: true } },
    },
  });
}

export async function getObjectives(filters: {
  teamId?: string;
  playerId?: string;
  status?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.teamId) where.teamId = filters.teamId;
  if (filters.playerId) where.playerId = filters.playerId;
  if (filters.status) where.status = filters.status;

  return prisma.developmentObjective.findMany({
    where,
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      coach: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getObjectiveById(id: string) {
  return prisma.developmentObjective.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });
}

export async function updateObjective(id: string, data: UpdateObjectiveInput) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.targetValue !== undefined) updateData.targetValue = data.targetValue;
  if (data.currentValue !== undefined) updateData.currentValue = data.currentValue;
  if (data.metricName !== undefined) updateData.metricName = data.metricName;
  if (data.targetDate !== undefined) updateData.targetDate = new Date(data.targetDate);
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.developmentObjective.update({
    where: { id },
    data: updateData,
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      coach: { select: { id: true, fullName: true } },
    },
  });
}

// ─── Auto-complete check ───

export async function checkAndCompleteObjectives() {
  // Find active objectives where currentValue >= targetValue
  const objectives = await prisma.developmentObjective.findMany({
    where: {
      status: "active",
      targetValue: { not: null },
      currentValue: { not: null },
    },
  });

  for (const obj of objectives) {
    if (
      obj.currentValue !== null &&
      obj.targetValue !== null &&
      Number(obj.currentValue) >= Number(obj.targetValue)
    ) {
      await prisma.developmentObjective.update({
        where: { id: obj.id },
        data: { status: "completed" },
      });
    }
  }
}

// ─── Progress tracking ───

export async function getObjectiveProgress(playerId: string) {
  const objectives = await prisma.developmentObjective.findMany({
    where: { playerId },
    orderBy: { createdAt: "desc" },
  });

  return objectives.map((obj) => {
    const target = Number(obj.targetValue) || 0;
    const current = Number(obj.currentValue) || 0;
    const progress = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

    return {
      id: obj.id,
      title: obj.title,
      description: obj.description,
      metricName: obj.metricName,
      targetValue: target,
      currentValue: current,
      progress,
      startDate: obj.startDate,
      targetDate: obj.targetDate,
      status: obj.status,
    };
  });
}
