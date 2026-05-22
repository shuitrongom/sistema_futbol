import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { createEvaluationSchema } from "@/lib/validators/evaluation.schema";
import {
  getEvaluations,
  createEvaluation,
} from "@/lib/services/evaluation.service";
import { logAudit } from "@/lib/utils/audit";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const params = req.nextUrl.searchParams;
    const teamId = params.get("teamId");
    const playerId = params.get("playerId");
    const context = params.get("context");
    const dateFrom = params.get("dateFrom");
    const dateTo = params.get("dateTo");

    // Coach: must have team access
    if (user.role === "coach") {
      if (teamId) {
        await requireTeamAccess(teamId);
      } else if (!playerId) {
        // Coach without teamId: use their own team
        if (!user.teamId) {
          return NextResponse.json({ error: "No tiene equipo asignado" }, { status: 400 });
        }
      }
    }

    // Player: can only see their own evaluations
    if (user.role === "player") {
      const playerRecord = await prisma.player.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!playerRecord) return NextResponse.json([]);
      const evals = await getEvaluations({
        playerId: playerRecord.id,
        context: context ?? undefined,
        dateFrom: dateFrom ?? undefined,
        dateTo: dateTo ?? undefined,
      });
      return NextResponse.json(evals);
    }

    // Parent: can only see evaluations of their children
    if (user.role === "parent") {
      if (!playerId) {
        // Get all children's evaluations
        const children = await prisma.parentPlayer.findMany({
          where: { parentId: user.id },
          select: { playerId: true },
        });
        const childIds = children.map((c) => c.playerId);
        if (childIds.length === 0) {
          return NextResponse.json([]);
        }
        // Fetch evaluations for all children
        const allEvals = [];
        for (const cid of childIds) {
          const evals = await getEvaluations({ playerId: cid, context: context ?? undefined, dateFrom: dateFrom ?? undefined, dateTo: dateTo ?? undefined });
          allEvals.push(...evals);
        }
        allEvals.sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
        return NextResponse.json(allEvals);
      } else {
        // Verify parent has access to this player
        const link = await prisma.parentPlayer.findFirst({
          where: { parentId: user.id, playerId },
        });
        if (!link) {
          return NextResponse.json({ error: "Sin acceso a este jugador" }, { status: 403 });
        }
      }
    }

    const evaluations = await getEvaluations({
      teamId: teamId ?? (user.role === "coach" && !playerId ? user.teamId ?? undefined : undefined),
      playerId: playerId ?? undefined,
      context: context ?? undefined,
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createEvaluationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(parsed.data.teamId);

    // Verify player belongs to the team
    const teamPlayer = await prisma.teamPlayer.findFirst({
      where: {
        teamId: parsed.data.teamId,
        playerId: parsed.data.playerId,
        leftAt: null,
      },
    });
    if (!teamPlayer) {
      return NextResponse.json(
        { error: "El jugador no pertenece a este equipo" },
        { status: 400 }
      );
    }

    const evaluation = await createEvaluation(parsed.data, user.id);

    await logAudit(user.id, "CREATE_EVALUATION", "player_evaluation", evaluation.id, {
      playerId: parsed.data.playerId,
      context: parsed.data.context,
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
