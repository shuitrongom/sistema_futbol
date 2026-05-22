import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { registerResultSchema } from "@/lib/validators/match.schema";
import { registerResult, updateResult, getMatchById } from "@/lib/services/match.service";
import { notifyMatchResult } from "@/lib/services/notification.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;
    const body = await req.json();
    const parsed = registerResultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await getMatchById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Partido no encontrado" },
        { status: 404 }
      );
    }

    // Use registerResult for scheduled/in_progress, updateResult for completed
    const match = existing.status === "completed"
      ? await updateResult(id, parsed.data)
      : await registerResult(id, parsed.data);

    await logAudit(user.id, "REGISTER_RESULT", "match", id, {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
    });

    // Notification: send email to parents with match result and player stats
    notifyMatchResult(id).catch(console.error);

    return NextResponse.json(match);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Solo se pueden")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
