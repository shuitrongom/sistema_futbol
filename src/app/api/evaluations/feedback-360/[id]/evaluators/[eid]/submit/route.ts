import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { submitEvaluatorEvaluation } from "@/lib/services/feedback360.service";
import { createEvaluationSchema } from "@/lib/validators/evaluation.schema";
import { logAudit } from "@/lib/utils/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; eid: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = createEvaluationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const evaluation = await submitEvaluatorEvaluation(
      params.id,
      params.eid,
      parsed.data,
      user.id
    );

    await logAudit(user.id, "SUBMIT_FEEDBACK_360_EVALUATION", "feedback_360_evaluator", params.eid, {
      sessionId: params.id,
      evaluationId: evaluation.id,
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
