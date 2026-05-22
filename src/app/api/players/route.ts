import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { createPlayerSchema } from "@/lib/validators/player.schema";
import {
  getAllPlayers,
  createPlayer,
  idNumberExists,
} from "@/lib/services/player.service";
import { logAudit } from "@/lib/utils/audit";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin", "coach"]);
    const teamId = req.nextUrl.searchParams.get("teamId") ?? undefined;
    const players = await getAllPlayers(teamId);
    return NextResponse.json(players);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["admin", "coach"]);
    const body = await req.json();
    const parsed = createPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (await idNumberExists(parsed.data.idNumber)) {
      return NextResponse.json(
        { error: "Ya existe un jugador con ese número de identificación" },
        { status: 409 }
      );
    }

    const player = await createPlayer(parsed.data);
    await logAudit(user.id, "CREATE_PLAYER", "player", player.id, {
      fullName: parsed.data.fullName,
      idNumber: parsed.data.idNumber,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
