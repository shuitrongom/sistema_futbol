import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { getEvaluationById, getPreviousEvaluation } from "@/lib/services/evaluation.service";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const evaluation = await getEvaluationById(id);

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
    }

    if (user.role === "coach" && evaluation.teamId) {
      await requireTeamAccess(evaluation.teamId);
    } else if (user.role === "parent") {
      const link = await prisma.parentPlayer.findFirst({
        where: { parentId: user.id, playerId: evaluation.playerId },
      });
      if (!link) {
        return NextResponse.json({ error: "Sin acceso a esta evaluación" }, { status: 403 });
      }
    }

    const previous = await getPreviousEvaluation(evaluation.playerId, evaluation.id);

    return NextResponse.json({ evaluation, previous });
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
    const evaluation = await getEvaluationById(id);

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
    }

    if (user.role === "coach" && evaluation.teamId) {
      await requireTeamAccess(evaluation.teamId);
    }

    await prisma.playerEvaluation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
