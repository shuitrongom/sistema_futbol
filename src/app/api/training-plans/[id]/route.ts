import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import { updateTrainingPlanSchema } from "@/lib/validators/training-plan.schema";
import {
  getTrainingPlanById,
  updateTrainingPlan,
  deleteTrainingPlan,
} from "@/lib/services/training-plan.service";
import { logAudit } from "@/lib/utils/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const plan = await getTrainingPlanById(id);
    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    await requireTeamAccess(plan.teamId);
    return NextResponse.json(plan);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const plan = await getTrainingPlanById(id);
    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    const user = await requireTeamAccess(plan.teamId);

    const body = await req.json();
    const parsed = updateTrainingPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updated = await updateTrainingPlan(id, parsed.data);

    await logAudit(user.id, "UPDATE_TRAINING_PLAN", "training_plan", id);

    return NextResponse.json(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const plan = await getTrainingPlanById(id);
    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    const user = await requireTeamAccess(plan.teamId);

    await deleteTrainingPlan(id);
    await logAudit(user.id, "DELETE_TRAINING_PLAN", "training_plan", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
