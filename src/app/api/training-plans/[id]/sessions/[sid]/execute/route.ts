import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import { executeSessionSchema } from "@/lib/validators/training-plan.schema";
import { executeSession } from "@/lib/services/training-plan.service";
import { logAudit } from "@/lib/utils/audit";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; sid: string } }
) {
  try {
    // Verify session belongs to plan and get team access
    const session = await prisma.trainingSession.findUnique({
      where: { id: params.sid },
      include: { plan: { select: { id: true, teamId: true } } },
    });

    if (!session || session.plan.id !== params.id) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    const user = await requireTeamAccess(session.plan.teamId);

    const body = await req.json();
    const parsed = executeSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const executed = await executeSession(params.sid, parsed.data);

    await logAudit(
      user.id,
      "EXECUTE_TRAINING_SESSION",
      "training_session",
      params.sid,
      { planId: params.id }
    );

    return NextResponse.json(executed);
  } catch (error) {
    if (error instanceof Error && error.message.includes("no encontrad")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleAuthError(error);
  }
}
