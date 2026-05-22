import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { createFeedback, getFeedback } from "@/lib/services/feedback.service";
import { notifyFeedback } from "@/lib/services/notification.service";
import { logAudit } from "@/lib/utils/audit";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const createFeedbackSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  feedbackType: z.enum(["positive", "improvement", "technical"]),
  message: z.string().min(1, "El mensaje es requerido"),
  relatedEvaluationId: z.string().uuid().optional(),
  relatedTaskId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const params = req.nextUrl.searchParams;
    const teamId = params.get("teamId");
    const playerId = params.get("playerId");
    const feedbackType = params.get("feedbackType");

    if (user.role === "coach") {
      if (teamId) {
        await requireTeamAccess(teamId);
      }
    }

    // Player: can only see their own feedback
    if (user.role === "player") {
      const playerRecord = await prisma.player.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!playerRecord) return NextResponse.json([]);
      const fb = await getFeedback({
        playerId: playerRecord.id,
        feedbackType: feedbackType ?? undefined,
      });
      return NextResponse.json(fb);
    }

    // Parent: can only see feedback of their children
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
        const allFeedback = [];
        for (const child of children) {
          const fb = await getFeedback({ playerId: child.playerId, feedbackType: feedbackType ?? undefined });
          allFeedback.push(...fb);
        }
        return NextResponse.json(allFeedback);
      }
    }

    const feedback = await getFeedback({
      teamId: teamId ?? (user.role === "coach" && !playerId ? user.teamId ?? undefined : undefined),
      playerId: playerId ?? undefined,
      feedbackType: feedbackType ?? undefined,
    });

    return NextResponse.json(feedback);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createFeedbackSchema.safeParse(body);

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

    // Verify related evaluation exists if provided
    if (parsed.data.relatedEvaluationId) {
      const eval_ = await prisma.playerEvaluation.findUnique({
        where: { id: parsed.data.relatedEvaluationId },
      });
      if (!eval_) {
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 400 });
      }
    }

    // Verify related task exists if provided
    if (parsed.data.relatedTaskId) {
      const task = await prisma.individualTask.findUnique({
        where: { id: parsed.data.relatedTaskId },
      });
      if (!task) {
        return NextResponse.json({ error: "Tarea no encontrada" }, { status: 400 });
      }
    }

    const feedback = await createFeedback(parsed.data, user.id);

    await logAudit(user.id, "CREATE_FEEDBACK", "personalized_feedback", feedback.id, {
      playerId: parsed.data.playerId,
      feedbackType: parsed.data.feedbackType,
    });

    // Notification: send feedback copy to parent if infantile category
    notifyFeedback(feedback.id).catch(console.error);

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
