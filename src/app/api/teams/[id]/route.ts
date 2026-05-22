import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { updateTeamSchema } from "@/lib/validators/team.schema";
import {
  getTeamById,
  updateTeam,
  deleteTeam,
  teamNameExists,
  teamHasActiveTournament,
} from "@/lib/services/team.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const team = await getTeamById(id);

    if (!team) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(team);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener equipo" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireTeamAccess(id);
    const body = await req.json();
    const parsed = updateTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await getTeamById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    if (parsed.data.name && (await teamNameExists(parsed.data.name, id))) {
      return NextResponse.json(
        { error: "Ya existe un equipo con ese nombre" },
        { status: 409 }
      );
    }

    const team = await updateTeam(id, parsed.data);
    await logAudit(user.id, "UPDATE_TEAM", "team", id, parsed.data);

    return NextResponse.json(team);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;

    const existing = await getTeamById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    if (await teamHasActiveTournament(id)) {
      return NextResponse.json(
        { error: "No se puede eliminar un equipo que participa en un torneo activo" },
        { status: 409 }
      );
    }

    await deleteTeam(id);
    await logAudit(user.id, "DELETE_TEAM", "team", id, {
      name: existing.name,
    });

    return NextResponse.json({ message: "Equipo eliminado" });
  } catch (error) {
    return handleAuthError(error);
  }
}
