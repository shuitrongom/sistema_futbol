import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import {
  getTrainingPlanById,
  duplicateTrainingPlan,
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
    const duplicated = await duplicateTrainingPlan(params.id, user.id);

    await logAudit(
      user.id,
      "DUPLICATE_TRAINING_PLAN",
      "training_plan",
      duplicated.id,
      { originalId: params.id }
    );

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
