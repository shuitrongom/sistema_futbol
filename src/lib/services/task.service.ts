import prisma from "@/lib/prisma";
import type { TaskStatus } from "@prisma/client";

// ─── Predefined task templates ───

export const PREDEFINED_TASKS = [
  {
    title: "Practicar pie débil 30 min diarios",
    description: "Realizar ejercicios de control, pase y tiro con el pie no dominante durante 30 minutos cada día.",
    taskType: "technical",
    completionCriteria: "Completar al menos 5 sesiones de 30 minutos durante la semana.",
  },
  {
    title: "Ver video de análisis de partido",
    description: "Revisar el video del último partido y anotar 3 situaciones de mejora personal.",
    taskType: "tactical",
    completionCriteria: "Entregar resumen escrito con las 3 situaciones identificadas.",
  },
  {
    title: "Rutina de velocidad y agilidad",
    description: "Completar circuito de sprints cortos, cambios de dirección y escalera de coordinación.",
    taskType: "physical",
    completionCriteria: "Realizar la rutina completa 3 veces por semana.",
  },
  {
    title: "Ejercicio de visualización pre-partido",
    description: "Practicar técnica de visualización mental 10 minutos antes de cada entrenamiento.",
    taskType: "mental",
    completionCriteria: "Registrar en diario personal cada sesión de visualización.",
  },
  {
    title: "Práctica de centros y remates de cabeza",
    description: "Trabajar centros desde banda y remates de cabeza con un compañero.",
    taskType: "technical",
    completionCriteria: "Completar 50 centros y 30 remates de cabeza en la semana.",
  },
  {
    title: "Estudio de posicionamiento defensivo",
    description: "Analizar videos de línea defensiva y practicar movimientos de cobertura.",
    taskType: "tactical",
    completionCriteria: "Presentar diagrama de posicionamiento al entrenador.",
  },
  {
    title: "Plan de resistencia cardiovascular",
    description: "Realizar carrera continua de 20-30 minutos a ritmo moderado.",
    taskType: "physical",
    completionCriteria: "Completar 4 sesiones de carrera durante la semana.",
  },
  {
    title: "Ejercicio de concentración bajo presión",
    description: "Practicar tiros libres y penales simulando presión de partido.",
    taskType: "mental",
    completionCriteria: "Anotar al menos 7 de 10 penales en 3 sesiones diferentes.",
  },
] as const;

// ─── Types ───

export type CreateTaskInput = {
  teamId: string;
  title: string;
  description?: string;
  taskType?: string;
  deadline?: string;
  completionCriteria?: string;
  playerIds: string[];
};

export type ReviewInput = {
  status: "completed" | "rejected";
  coachFeedback?: string;
};

// ─── CRUD ───

export async function createTask(data: CreateTaskInput, coachId: string) {
  const task = await prisma.individualTask.create({
    data: {
      coachId,
      teamId: data.teamId,
      title: data.title,
      description: data.description ?? null,
      taskType: data.taskType ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      completionCriteria: data.completionCriteria ?? null,
      status: "pending",
      assignments: {
        create: data.playerIds.map((playerId) => ({
          playerId,
          status: "pending",
        })),
      },
    },
    include: {
      assignments: {
        include: {
          player: { select: { id: true, fullName: true, position: true } },
        },
      },
    },
  });

  return task;
}

export async function getTasks(filters: {
  teamId?: string;
  playerId?: string;
  status?: string;
  taskType?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.teamId) where.teamId = filters.teamId;
  if (filters.status) where.status = filters.status as TaskStatus;
  if (filters.taskType) where.taskType = filters.taskType;

  // If filtering by player, find tasks that have assignments for that player
  if (filters.playerId) {
    where.assignments = { some: { playerId: filters.playerId } };
  }

  return prisma.individualTask.findMany({
    where,
    include: {
      assignments: {
        include: {
          player: { select: { id: true, fullName: true, position: true } },
        },
      },
      coach: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTaskById(id: string) {
  return prisma.individualTask.findUnique({
    where: { id },
    include: {
      assignments: {
        include: {
          player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
        },
      },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
    },
  });
}

// ─── Assignment actions ───

export async function markAssignmentComplete(
  taskId: string,
  assignmentId: string,
  playerComments?: string
) {
  const assignment = await prisma.taskAssignment.findFirst({
    where: { id: assignmentId, taskId },
  });
  if (!assignment) throw new Error("Asignación no encontrada");
  if (assignment.status === "completed" || assignment.status === "rejected") {
    throw new Error("Esta asignación ya fue revisada");
  }

  return prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "completed",
      playerComments: playerComments ?? null,
      completedAt: new Date(),
    },
    include: {
      player: { select: { id: true, fullName: true } },
    },
  });
}

export async function reviewAssignment(
  taskId: string,
  assignmentId: string,
  review: ReviewInput
) {
  const assignment = await prisma.taskAssignment.findFirst({
    where: { id: assignmentId, taskId },
  });
  if (!assignment) throw new Error("Asignación no encontrada");

  const updated = await prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: {
      status: review.status as TaskStatus,
      coachFeedback: review.coachFeedback ?? null,
      reviewedAt: new Date(),
    },
    include: {
      player: { select: { id: true, fullName: true } },
    },
  });

  // Check if all assignments are completed/rejected → update task status
  await updateTaskStatusFromAssignments(taskId);

  return updated;
}

// ─── Status management ───

async function updateTaskStatusFromAssignments(taskId: string) {
  const assignments = await prisma.taskAssignment.findMany({
    where: { taskId },
    select: { status: true },
  });

  if (assignments.length === 0) return;

  const allCompleted = assignments.every((a) => a.status === "completed");
  const allReviewed = assignments.every(
    (a) => a.status === "completed" || a.status === "rejected"
  );

  if (allCompleted) {
    await prisma.individualTask.update({
      where: { id: taskId },
      data: { status: "completed" },
    });
  } else if (allReviewed) {
    // Some rejected, some completed - keep as pending or mark based on majority
    const completedCount = assignments.filter((a) => a.status === "completed").length;
    await prisma.individualTask.update({
      where: { id: taskId },
      data: { status: completedCount > 0 ? "completed" : "rejected" },
    });
  }
}

// ─── Compliance calculation ───

export async function getComplianceByPlayer(teamId: string) {
  const players = await prisma.teamPlayer.findMany({
    where: { teamId, leftAt: null },
    include: {
      player: {
        select: {
          id: true,
          fullName: true,
          position: true,
          taskAssignments: {
            select: { status: true },
          },
        },
      },
    },
  });

  return players.map((tp) => {
    const assignments = tp.player.taskAssignments;
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      playerId: tp.player.id,
      playerName: tp.player.fullName,
      position: tp.player.position,
      totalTasks: total,
      completedTasks: completed,
      compliancePercentage: percentage,
    };
  });
}

// ─── Overdue check ───

export async function markOverdueTasks() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Update tasks past deadline that are still pending/in_progress
  await prisma.individualTask.updateMany({
    where: {
      deadline: { lt: now },
      status: { in: ["pending", "in_progress"] },
    },
    data: { status: "overdue" },
  });

  // Also update their assignments
  const overdueTasks = await prisma.individualTask.findMany({
    where: { status: "overdue" },
    select: { id: true },
  });

  if (overdueTasks.length > 0) {
    await prisma.taskAssignment.updateMany({
      where: {
        taskId: { in: overdueTasks.map((t) => t.id) },
        status: { in: ["pending", "in_progress"] },
      },
      data: { status: "overdue" },
    });
  }
}

// ─── Reminders (48h before deadline) ───

export async function getTasksNeedingReminders() {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  return prisma.individualTask.findMany({
    where: {
      deadline: { gte: now, lte: in48h },
      status: { in: ["pending", "in_progress"] },
    },
    include: {
      assignments: {
        where: { status: { in: ["pending", "in_progress"] } },
        include: {
          player: { select: { id: true, fullName: true, email: true } },
        },
      },
      team: { select: { id: true, name: true } },
    },
  });
}
