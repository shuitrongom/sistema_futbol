import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { createTrainingPlanSchema } from "@/lib/validators/training-plan.schema";
import {
  getTrainingPlans,
  createTrainingPlan,
  getSharedPlans,
} from "@/lib/services/training-plan.service";
import { logAudit } from "@/lib/utils/audit";

export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get("teamId");
    const shared = req.nextUrl.searchParams.get("shared");

    if (shared === "true") {
      const user = await requireAuth();
      const plans = await getSharedPlans(teamId ?? undefined);
      return NextResponse.json(plans);
    }

    if (!teamId) {
      return NextResponse.json(
        { error: "Se requiere teamId" },
        { status: 400 }
      );
    }

    await requireTeamAccess(teamId);
    const plans = await getTrainingPlans(teamId);
    return NextResponse.json(plans);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTrainingPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(parsed.data.teamId);
    const plan = await createTrainingPlan(parsed.data, user.id);

    await logAudit(user.id, "CREATE_TRAINING_PLAN", "training_plan", plan.id, {
      name: parsed.data.name,
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
