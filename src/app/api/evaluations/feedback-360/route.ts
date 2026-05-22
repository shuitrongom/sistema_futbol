import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import {
  createFeedback360Session,
  getSessionsByTeam,
  notifyEvaluators,
} from "@/lib/services/feedback360.service";
import { logAudit } from "@/lib/utils/audit";
import { z } from "zod/v4";

const createSessionSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  evaluatorIds: z.array(z.string().uuid()).min(1, "Se requiere al menos un evaluador"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const teamId = req.nextUrl.searchParams.get("teamId") || user.teamId;

    if (!teamId) {
      return NextResponse.json({ error: "No tiene equipo asignado" }, { status: 400 });
    }

    await requireTeamAccess(teamId);
    const sessions = await getSessionsByTeam(teamId);
    return NextResponse.json(sessions);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(parsed.data.teamId);

    const session = await createFeedback360Session({
      playerId: parsed.data.playerId,
      coachId: user.id,
      teamId: parsed.data.teamId,
      evaluatorIds: parsed.data.evaluatorIds,
    });

    // Notify evaluators
    await notifyEvaluators(session.id);

    await logAudit(user.id, "CREATE_FEEDBACK_360", "feedback_360_session", session.id, {
      playerId: parsed.data.playerId,
      evaluatorCount: parsed.data.evaluatorIds.length,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
