import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { getPlayerProgress } from "@/lib/services/evaluation.service";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const playerId = params.id;

    // Authorization
    if (user.role === "coach") {
      // Verify player belongs to coach's team
      const teamPlayer = await prisma.teamPlayer.findFirst({
        where: {
          playerId,
          leftAt: null,
          team: { coachId: user.id },
        },
      });
      if (!teamPlayer) {
        return NextResponse.json({ error: "Sin acceso a este jugador" }, { status: 403 });
      }
    } else if (user.role === "parent") {
      const link = await prisma.parentPlayer.findFirst({
        where: { parentId: user.id, playerId },
      });
      if (!link) {
        return NextResponse.json({ error: "Sin acceso a este jugador" }, { status: 403 });
      }
    } else if (user.role !== "admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const progress = await getPlayerProgress(playerId);
    return NextResponse.json(progress);
  } catch (error) {
    return handleAuthError(error);
  }
}
