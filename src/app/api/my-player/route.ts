import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Returns the player record linked to the authenticated player user
export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== "player") {
      return NextResponse.json({ error: "Solo jugadores pueden acceder" }, { status: 403 });
    }

    const player = await prisma.player.findFirst({
      where: { userId: user.id },
      include: {
        teamPlayers: {
          where: { leftAt: null },
          include: {
            team: {
              select: { id: true, name: true, badgeUrl: true, coachId: true },
            },
          },
          take: 1,
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "No se encontró registro de jugador" }, { status: 404 });
    }

    const tp = player.teamPlayers[0];
    return NextResponse.json({
      id: player.id,
      fullName: player.fullName,
      birthDate: player.birthDate,
      position: player.position,
      photoUrl: player.photoUrl,
      email: player.email,
      phone: player.phone,
      teamId: tp?.team.id ?? null,
      teamName: tp?.team.name ?? "Sin equipo",
      teamBadge: tp?.team.badgeUrl ?? null,
      jerseyNumber: tp?.jerseyNumber ?? null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
