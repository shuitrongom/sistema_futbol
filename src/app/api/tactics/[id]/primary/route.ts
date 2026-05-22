import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import { getTacticById, setTacticAsPrimary } from "@/lib/services/tactic.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(_req: NextRequest, { params }: RouteParams) {
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
    const tactic = await setTacticAsPrimary(id);

    await logAudit(user.id, "SET_PRIMARY_TACTIC", "tactic", id, {
      name: existing.name,
    });

    return NextResponse.json(tactic);
  } catch (error) {
    return handleAuthError(error);
  }
}
