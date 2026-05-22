import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import { createTacticSchema } from "@/lib/validators/tactic.schema";
import {
  getTacticsByTeam,
  createTactic,
  validateFormation,
  validatePlayerPositionsCount,
  getTacticHistoryForTeam,
} from "@/lib/services/tactic.service";
import { logAudit } from "@/lib/utils/audit";

export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json(
        { error: "Se requiere teamId" },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(teamId);

    const history = req.nextUrl.searchParams.get("history");
    if (history === "true") {
      const historyData = await getTacticHistoryForTeam(teamId);
      return NextResponse.json(historyData);
    }

    const tactics = await getTacticsByTeam(teamId);
    return NextResponse.json(tactics);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTacticSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(parsed.data.teamId);

    if (!validateFormation(parsed.data.formation)) {
      return NextResponse.json(
        { error: "Formación inválida: la suma de posiciones + 1 portero debe ser 11" },
        { status: 400 }
      );
    }

    if (!validatePlayerPositionsCount(parsed.data.formation, parsed.data.playerPositions)) {
      return NextResponse.json(
        { error: "El número de jugadores asignados no corresponde con la formación" },
        { status: 400 }
      );
    }

    const tactic = await createTactic(parsed.data);
    await logAudit(user.id, "CREATE_TACTIC", "tactic", tactic.id, {
      name: parsed.data.name,
      formation: parsed.data.formation,
    });

    return NextResponse.json(tactic, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
