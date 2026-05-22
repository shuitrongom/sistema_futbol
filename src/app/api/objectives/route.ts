import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { createObjective, getObjectives } from "@/lib/services/objective.service";
import { logAudit } from "@/lib/utils/audit";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const createObjectiveSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  targetValue: z.number().min(0).max(10).optional(),
  currentValue: z.number().min(0).max(10).optional(),
  metricName: z.string().max(100).optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const params = req.nextUrl.searchParams;
    const teamId = params.get("teamId");
    const playerId = params.get("playerId");
    const status = params.get("status");

    if (user.role === "coach") {
      if (teamId) {
        await requireTeamAccess(teamId);
      }
    }

    // Parent: can only see objectives of their children
    if (user.role === "parent") {
      if (playerId) {
        const link = await prisma.parentPlayer.findFirst({
          where: { parentId: user.id, playerId },
        });
        if (!link) {
          return NextResponse.json({ error: "Sin acceso a este jugador" }, { status: 403 });
        }
      } else {
        const children = await prisma.parentPlayer.findMany({
          where: { parentId: user.id },
          select: { playerId: true },
        });
        if (children.length === 0) return NextResponse.json([]);
        // Return objectives for all children
        const allObjectives = [];
        for (const child of children) {
          const objs = await getObjectives({ playerId: child.playerId, status: status ?? undefined });
          allObjectives.push(...objs);
        }
        return NextResponse.json(allObjectives);
      }
    }

    const objectives = await getObjectives({
      teamId: teamId ?? (user.role === "coach" && !playerId ? user.teamId ?? undefined : undefined),
      playerId: playerId ?? undefined,
      status: status ?? undefined,
    });

    return NextResponse.json(objectives);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createObjectiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(parsed.data.teamId);

    // Verify player belongs to the team
    const tp = await prisma.teamPlayer.findFirst({
      where: { teamId: parsed.data.teamId, playerId: parsed.data.playerId, leftAt: null },
    });
    if (!tp) {
      return NextResponse.json(
        { error: "El jugador no pertenece a este equipo" },
        { status: 400 }
      );
    }

    // Validate date range (1-6 months)
    if (parsed.data.startDate && parsed.data.targetDate) {
      const start = new Date(parsed.data.startDate);
      const target = new Date(parsed.data.targetDate);
      const diffMonths = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
      if (diffMonths < 1 || diffMonths > 6) {
        return NextResponse.json(
          { error: "El objetivo debe tener una duración entre 1 y 6 meses" },
          { status: 400 }
        );
      }
    }

    const objective = await createObjective(parsed.data, user.id);

    await logAudit(user.id, "CREATE_OBJECTIVE", "development_objective", objective.id, {
      playerId: parsed.data.playerId,
      title: parsed.data.title,
    });

    return NextResponse.json(objective, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
