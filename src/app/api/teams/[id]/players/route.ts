import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import { addPlayerToTeamSchema } from "@/lib/validators/team.schema";
import {
  addPlayerToTeam,
  removePlayerFromTeam,
  jerseyNumberTaken,
  getTeamById,
} from "@/lib/services/team.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
    }
    // Return teamPlayers array directly
    return NextResponse.json(team.teamPlayers || []);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const user = await requireTeamAccess(teamId);
    const body = await req.json();
    const parsed = addPlayerToTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { playerId, jerseyNumber } = parsed.data;

    if (await jerseyNumberTaken(teamId, jerseyNumber)) {
      return NextResponse.json(
        { error: "El número de camiseta ya está en uso en este equipo" },
        { status: 409 }
      );
    }

    const teamPlayer = await addPlayerToTeam(teamId, playerId, jerseyNumber);
    await logAudit(user.id, "ADD_PLAYER_TO_TEAM", "team_player", teamPlayer.id, {
      teamId,
      playerId,
      jerseyNumber,
    });

    return NextResponse.json(teamPlayer, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const user = await requireTeamAccess(teamId);
    const { playerId } = await req.json();

    if (!playerId) {
      return NextResponse.json(
        { error: "playerId es requerido" },
        { status: 400 }
      );
    }

    const result = await removePlayerFromTeam(teamId, playerId);
    if (!result) {
      return NextResponse.json(
        { error: "El jugador no pertenece a este equipo" },
        { status: 404 }
      );
    }

    await logAudit(user.id, "REMOVE_PLAYER_FROM_TEAM", "team_player", result.id, {
      teamId,
      playerId,
    });

    return NextResponse.json({ message: "Jugador removido del equipo" });
  } catch (error) {
    return handleAuthError(error);
  }
}
