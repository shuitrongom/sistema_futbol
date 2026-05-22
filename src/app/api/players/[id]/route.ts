import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { updatePlayerSchema } from "@/lib/validators/player.schema";
import { getPlayerById, updatePlayer } from "@/lib/services/player.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const player = await getPlayerById(id);

    if (!player) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener jugador" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin", "coach"]);
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await getPlayerById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    const player = await updatePlayer(id, parsed.data);
    await logAudit(user.id, "UPDATE_PLAYER", "player", id, parsed.data);

    return NextResponse.json(player);
  } catch (error) {
    return handleAuthError(error);
  }
}
