import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import {
  getDevelopmentPlans,
  createDevelopmentPlan,
  suggestFocusAreas,
  recommendExercises,
  generateEvaluationSchedule,
} from "@/lib/services/development-plan.service";
import { logAudit } from "@/lib/utils/audit";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const createPlanSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
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

    // Player: can only see their own plans
    if (user.role === "player") {
      const playerRecord = await prisma.player.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!playerRecord) return NextResponse.json([]);
      const plans = await getDevelopmentPlans({
        playerId: playerRecord.id,
        status: status ?? undefined,
      });
      return NextResponse.json(plans);
    }

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
        const allPlans = [];
        for (const child of children) {
          const plans = await getDevelopmentPlans({
            playerId: child.playerId,
            status: status ?? undefined,
          });
          allPlans.push(...plans);
        }
        return NextResponse.json(allPlans);
      }
    }

    const plans = await getDevelopmentPlans({
      teamId: teamId ?? (user.role === "coach" && !playerId ? user.teamId ?? undefined : undefined),
      playerId: playerId ?? undefined,
      status: status ?? undefined,
    });

    return NextResponse.json(plans);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(parsed.data.teamId);

    // Verify player belongs to the team
    const tp = await prisma.teamPlayer.findFirst({
      where: {
        teamId: parsed.data.teamId,
        playerId: parsed.data.playerId,
        leftAt: null,
      },
    });
    if (!tp) {
      return NextResponse.json(
        { error: "El jugador no pertenece a este equipo" },
        { status: 400 }
      );
    }

    // Auto-suggest focus areas if not provided
    let focusAreas = parsed.data.focusAreas;
    if (!focusAreas || focusAreas.length === 0) {
      focusAreas = await suggestFocusAreas(parsed.data.playerId);
    }

    // Auto-recommend exercises if not provided
    let exercises = parsed.data.recommendedExercises;
    if (!exercises || exercises.length === 0) {
      exercises = await recommendExercises(focusAreas);
    }

    const schedule =
      parsed.data.evaluationSchedule ?? generateEvaluationSchedule();

    const plan = await createDevelopmentPlan({
      playerId: parsed.data.playerId,
      coachId: user.id,
      teamId: parsed.data.teamId,
      focusAreas,
      recommendedExercises: exercises,
      evaluationSchedule: schedule,
    });

    await logAudit(user.id, "CREATE_DEVELOPMENT_PLAN", "development_plan", plan.id, {
      playerId: parsed.data.playerId,
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
