import { NextRequest, NextResponse } from "next/server";
import { getAllMatches } from "@/lib/services/match.service";
import type { MatchStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const tournamentId = req.nextUrl.searchParams.get("tournamentId") ?? undefined;
    const status = req.nextUrl.searchParams.get("status") as MatchStatus | undefined;
    const teamId = req.nextUrl.searchParams.get("teamId") ?? undefined;

    const matches = await getAllMatches({ tournamentId, status, teamId });
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 }
    );
  }
}
