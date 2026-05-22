import { NextRequest, NextResponse } from "next/server";
import { getPlayerStats } from "@/lib/services/statistics.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const stats = await getPlayerStats(id);
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener estadísticas del jugador";
    const status = message === "Jugador no encontrado" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
