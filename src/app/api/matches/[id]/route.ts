import { NextRequest, NextResponse } from "next/server";
import { getMatchById } from "@/lib/services/match.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const match = await getMatchById(id);

    if (!match) {
      return NextResponse.json(
        { error: "Partido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener partido" },
      { status: 500 }
    );
  }
}
