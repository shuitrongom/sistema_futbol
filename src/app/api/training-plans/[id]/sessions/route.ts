import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import { createSessionSchema } from "@/lib/validators/training-plan.schema";
import {
  getTrainingPlanById,
  addSession,
} from "@/lib/services/training-plan.service";
import { logAudit } from "@/lib/utils/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await getTrainingPlanById(params.id);
    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    const user = await requireTeamAccess(plan.teamId);

    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const session = await addSession(params.id, parsed.data);

    await logAudit(
      user.id,
      "ADD_TRAINING_SESSION",
      "training_session",
      session.id,
      { planId: params.id }
    );

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("no apropiados")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("no encontrad")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleAuthError(error);
  }
}
