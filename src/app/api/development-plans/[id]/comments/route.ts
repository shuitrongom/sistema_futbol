import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { getDevelopmentPlanById, addComment } from "@/lib/services/development-plan.service";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const commentSchema = z.object({
  message: z.string().min(1, "El comentario es requerido"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const plan = await getDevelopmentPlanById(params.id);
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    // Determine role for comment
    let commentRole: "coach" | "player" | "parent";

    if (user.role === "coach") {
      if (plan.teamId) await requireTeamAccess(plan.teamId);
      commentRole = "coach";
    } else if (user.role === "parent") {
      const link = await prisma.parentPlayer.findFirst({
        where: { parentId: user.id, playerId: plan.playerId },
      });
      if (!link) {
        return NextResponse.json({ error: "Sin acceso a este plan" }, { status: 403 });
      }
      commentRole = "parent";
    } else if (user.role === "player") {
      commentRole = "player";
    } else {
      return NextResponse.json({ error: "Rol no permitido" }, { status: 403 });
    }

    const updated = await addComment(
      params.id,
      commentRole,
      user.name ?? user.email,
      parsed.data.message
    );

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
