import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import {
  getDevelopmentPlanById,
  updateDevelopmentPlan,
  checkProgressAlerts,
} from "@/lib/services/development-plan.service";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils/audit";
import { z } from "zod/v4";

const updatePlanSchema = z.object({
  focusAreas: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        currentValue: z.number().min(1).max(10),
        targetValue: z.number().min(1).max(10),
      })
    )
    .optional(),
  recommendedExercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        title: z.string(),
        category: z.string(),
        focusAreaKey: z.string(),
      })
    )
    .optional(),
  evaluationSchedule: z
    .array(z.object({ date: z.string(), completed: z.boolean() }))
    .optional(),
  status: z.enum(["active", "completed", "paused"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const plan = await getDevelopmentPlanById(id);

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    if (user.role === "coach" && plan.teamId) {
      await requireTeamAccess(plan.teamId);
    } else if (user.role === "parent") {
      const link = await prisma.parentPlayer.findFirst({
        where: { parentId: user.id, playerId: plan.playerId },
      });
      if (!link) {
        return NextResponse.json({ error: "Sin acceso a este plan" }, { status: 403 });
      }
    } else if (user.role === "player") {
      const playerRecord = await prisma.player.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!playerRecord || playerRecord.id !== plan.playerId) {
        return NextResponse.json({ error: "Sin acceso a este plan" }, { status: 403 });
      }
    }

    const alert = await checkProgressAlerts(plan.id);

    return NextResponse.json({ plan, alert });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const plan = await getDevelopmentPlanById(id);
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const user = await requireTeamAccess(plan.teamId!);

    const updated = await updateDevelopmentPlan(id, parsed.data);

    await logAudit(user.id, "UPDATE_DEVELOPMENT_PLAN", "development_plan", id, {
      playerId: plan.playerId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const plan = await getDevelopmentPlanById(id);

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    if (plan.teamId) {
      await requireTeamAccess(plan.teamId);
    }

    await prisma.developmentPlan.delete({ where: { id } });

    await logAudit(user.id, "DELETE_DEVELOPMENT_PLAN", "development_plan", id, {
      playerId: plan.playerId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
