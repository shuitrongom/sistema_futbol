import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { createTask, getTasks, PREDEFINED_TASKS } from "@/lib/services/task.service";
import { notifyTaskAssigned } from "@/lib/services/notification.service";
import { logAudit } from "@/lib/utils/audit";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const createTaskSchema = z.object({
  teamId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  taskType: z.enum(["technical", "tactical", "physical", "mental"]).optional(),
  deadline: z.string().optional(),
  completionCriteria: z.string().optional(),
  playerIds: z.array(z.string().uuid()).min(1, "Debe asignar al menos un jugador"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const params = req.nextUrl.searchParams;
    const teamId = params.get("teamId");
    const playerId = params.get("playerId");
    const status = params.get("status");
    const taskType = params.get("taskType");
    const predefined = params.get("predefined");

    // Return predefined templates
    if (predefined === "true") {
      return NextResponse.json(PREDEFINED_TASKS);
    }

    if (user.role === "coach") {
      if (teamId) {
        await requireTeamAccess(teamId);
      } else if (!playerId && user.teamId) {
        // Default to coach's team
      }
    }

    // Player: can only see their own tasks
    if (user.role === "player") {
      const playerRecord = await prisma.player.findFirst({
        where: { userId: user.id },
        select: { id: true, teamPlayers: { where: { leftAt: null }, select: { teamId: true }, take: 1 } },
      });
      if (!playerRecord) return NextResponse.json([]);
      const pTeamId = playerRecord.teamPlayers[0]?.teamId;
      const tasks = await getTasks({
        teamId: pTeamId ?? undefined,
        playerId: playerRecord.id,
        status: status ?? undefined,
        taskType: taskType ?? undefined,
      });
      return NextResponse.json(tasks);
    }

    const tasks = await getTasks({
      teamId: teamId ?? (user.role === "coach" && !playerId ? user.teamId ?? undefined : undefined),
      playerId: playerId ?? undefined,
      status: status ?? undefined,
      taskType: taskType ?? undefined,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(parsed.data.teamId);

    // Verify all players belong to the team
    for (const playerId of parsed.data.playerIds) {
      const tp = await prisma.teamPlayer.findFirst({
        where: { teamId: parsed.data.teamId, playerId, leftAt: null },
      });
      if (!tp) {
        return NextResponse.json(
          { error: `Jugador ${playerId} no pertenece al equipo` },
          { status: 400 }
        );
      }
    }

    const task = await createTask(parsed.data, user.id);

    await logAudit(user.id, "CREATE_TASK", "individual_task", task.id, {
      title: parsed.data.title,
      playerCount: parsed.data.playerIds.length,
    });

    // Notification: notify assigned players and their parents
    notifyTaskAssigned(task.id).catch(console.error);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
