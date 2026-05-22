import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { createTeamSchema } from "@/lib/validators/team.schema";
import {
  getAllTeams,
  createTeam,
  teamNameExists,
} from "@/lib/services/team.service";
import { logAudit } from "@/lib/utils/audit";

export async function GET(req: NextRequest) {
  try {
    const categoryId = req.nextUrl.searchParams.get("categoryId") ?? undefined;
    const teams = await getAllTeams(categoryId);
    return NextResponse.json(teams);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener equipos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (await teamNameExists(parsed.data.name)) {
      return NextResponse.json(
        { error: "Ya existe un equipo con ese nombre" },
        { status: 409 }
      );
    }

    const team = await createTeam(parsed.data);
    await logAudit(user.id, "CREATE_TEAM", "team", team.id, {
      name: parsed.data.name,
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
