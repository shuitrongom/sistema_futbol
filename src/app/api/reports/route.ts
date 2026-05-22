import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { getReports } from "@/lib/services/report.service";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const params = req.nextUrl.searchParams;
    const teamId = params.get("teamId");
    const playerId = params.get("playerId");
    const reportType = params.get("reportType");

    if (user.role === "coach") {
      if (teamId) {
        await requireTeamAccess(teamId);
      }
    }

    // Player: can only see their own reports
    if (user.role === "player") {
      const playerRecord = await prisma.player.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!playerRecord) return NextResponse.json([]);
      const reps = await getReports({
        playerId: playerRecord.id,
        reportType: reportType ?? undefined,
      });
      return NextResponse.json(reps);
    }

    // Parent: can only see reports of their children
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
        const allReports = [];
        for (const child of children) {
          const reps = await getReports({ playerId: child.playerId, reportType: reportType ?? undefined });
          allReports.push(...reps);
        }
        return NextResponse.json(allReports);
      }
    }

    const reports = await getReports({
      teamId: teamId ?? (user.role === "coach" && !playerId ? user.teamId ?? undefined : undefined),
      playerId: playerId ?? undefined,
      reportType: reportType ?? undefined,
    });

    return NextResponse.json(reports);
  } catch (error) {
    return handleAuthError(error);
  }
}
