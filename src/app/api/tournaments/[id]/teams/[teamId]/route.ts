import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { inscribeTeam, removeTeam } from "@/lib/services/tournament.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string; teamId: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id, teamId } = await params;

    const result = await inscribeTeam(id, teamId);
    await logAudit(user.id, "INSCRIBE_TEAM", "tournament", id, { teamId });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("no encontrado")) {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      if (
        msg.includes("máximo") ||
        msg.includes("ya está inscrito") ||
        msg.includes("categorías permitidas") ||
        msg.includes("inscripción")
      ) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
    return handleAuthError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id, teamId } = await params;

    await removeTeam(id, teamId);
    await logAudit(user.id, "REMOVE_TEAM_FROM_TOURNAMENT", "tournament", id, {
      teamId,
    });

    return NextResponse.json({ message: "Equipo removido del torneo" });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("no encontrado") || msg.includes("no está inscrito")) {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      if (msg.includes("Solo se pueden")) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
    return handleAuthError(error);
  }
}
