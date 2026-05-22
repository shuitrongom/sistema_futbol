import { NextRequest, NextResponse } from "next/server";
import { getStandings } from "@/lib/services/standings.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const phaseId = req.nextUrl.searchParams.get("phaseId") ?? undefined;

    const standings = await getStandings(id, phaseId);
    return NextResponse.json(standings);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener tabla de posiciones" },
      { status: 500 }
    );
  }
}
