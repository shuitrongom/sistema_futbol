import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Returns the children (players) linked to the authenticated parent
export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== "parent") {
      return NextResponse.json({ error: "Solo padres pueden acceder" }, { status: 403 });
    }

    const links = await prisma.parentPlayer.findMany({
      where: { parentId: user.id },
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            position: true,
            photoUrl: true,
            teamPlayers: {
              where: { leftAt: null },
              select: {
                jerseyNumber: true,
                team: {
                  select: { id: true, name: true, badgeUrl: true },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    const children = links.map((link) => {
      const tp = link.player.teamPlayers[0];
      return {
        id: link.player.id,
        fullName: link.player.fullName,
        birthDate: link.player.birthDate,
        position: link.player.position,
        photoUrl: link.player.photoUrl,
        relationship: link.relationship,
        teamId: tp?.team.id ?? null,
        teamName: tp?.team.name ?? "Sin equipo",
        teamBadge: tp?.team.badgeUrl ?? null,
        jerseyNumber: tp?.jerseyNumber ?? null,
      };
    });

    return NextResponse.json(children);
  } catch (error) {
    return handleAuthError(error);
  }
}
