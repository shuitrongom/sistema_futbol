import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { markAssignmentComplete } from "@/lib/services/task.service";
import { logAudit } from "@/lib/utils/audit";
import { z } from "zod/v4";

const completeSchema = z.object({
  playerComments: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string; aid: string }> };

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id, aid } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = completeSchema.safeParse(body);

    const assignment = await markAssignmentComplete(
      id,
      aid,
      parsed.success ? parsed.data.playerComments : undefined
    );

    await logAudit(user.id, "COMPLETE_TASK_ASSIGNMENT", "task_assignment", aid, {
      taskId: id,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
