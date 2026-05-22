import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { updateTournamentSchema } from "@/lib/validators/tournament.schema";
import {
  getTournamentById,
  updateTournament,
  deleteTournament,
} from "@/lib/services/tournament.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tournament = await getTournamentById(id);

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener torneo" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTournamentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await getTournamentById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    const tournament = await updateTournament(id, parsed.data);
    await logAudit(user.id, "UPDATE_TOURNAMENT", "tournament", id, parsed.data);

    return NextResponse.json(tournament);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Transición")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Solo se pueden")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;

    const existing = await getTournamentById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    await deleteTournament(id);
    await logAudit(user.id, "DELETE_TOURNAMENT", "tournament", id, {
      name: existing.name,
    });

    return NextResponse.json({ message: "Torneo eliminado" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Solo se pueden")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
