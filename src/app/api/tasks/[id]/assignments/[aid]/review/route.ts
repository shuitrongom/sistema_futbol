import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { reviewAssignment, getTaskById } from "@/lib/services/task.service";
import { logAudit } from "@/lib/utils/audit";
import { z } from "zod/v4";

const reviewSchema = z.object({
  status: z.enum(["completed", "rejected"]).optional(),
  decision: z.enum(["approved", "rejected"]).optional(),
  coachFeedback: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string; aid: string }> };

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id, aid } = await params;
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }
    if (task.teamId) {
      await requireTeamAccess(task.teamId);
    }

    // Support both "decision" and "status" field names
    const finalStatus = parsed.data.decision === "approved" ? "completed" 
      : parsed.data.decision === "rejected" ? "rejected"
      : parsed.data.status || "completed";

    const assignment = await reviewAssignment(id, aid, {
      status: finalStatus as "completed" | "rejected",
      coachFeedback: parsed.data.coachFeedback,
    });

    await logAudit(user.id, "REVIEW_TASK_ASSIGNMENT", "task_assignment", aid, {
      taskId: id,
      status: finalStatus,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof Error && !(error as { status?: number }).status) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
