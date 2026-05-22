import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import { updateTacticSchema } from "@/lib/validators/tactic.schema";
import {
  getTacticById,
  updateTactic,
  deleteTactic,
  validateFormation,
  validatePlayerPositionsCount,
} from "@/lib/services/tactic.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tactic = await getTacticById(id);

    if (!tactic) {
      return NextResponse.json(
        { error: "Táctica no encontrada" },
        { status: 404 }
      );
    }

    await requireTeamAccess(tactic.teamId);
    return NextResponse.json(tactic);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await getTacticById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Táctica no encontrada" },
        { status: 404 }
      );
    }

    const user = await requireTeamAccess(existing.teamId);
    const body = await req.json();
    const parsed = updateTacticSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const formation = parsed.data.formation ?? existing.formation;
    const playerPositions = parsed.data.playerPositions ?? (existing.playerPositions as Record<string, string>);

    if (parsed.data.formation && !validateFormation(parsed.data.formation)) {
      return NextResponse.json(
        { error: "Formación inválida: la suma de posiciones + 1 portero debe ser 11" },
        { status: 400 }
      );
    }

    if (
      (parsed.data.formation || parsed.data.playerPositions) &&
      !validatePlayerPositionsCount(formation, playerPositions)
    ) {
      return NextResponse.json(
        { error: "El número de jugadores asignados no corresponde con la formación" },
        { status: 400 }
      );
    }

    const tactic = await updateTactic(id, parsed.data);
    await logAudit(user.id, "UPDATE_TACTIC", "tactic", id, parsed.data);

    return NextResponse.json(tactic);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await getTacticById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Táctica no encontrada" },
        { status: 404 }
      );
    }

    const user = await requireTeamAccess(existing.teamId);
    await deleteTactic(id);
    await logAudit(user.id, "DELETE_TACTIC", "tactic", id, {
      name: existing.name,
    });

    return NextResponse.json({ message: "Táctica eliminada" });
  } catch (error) {
    return handleAuthError(error);
  }
}
