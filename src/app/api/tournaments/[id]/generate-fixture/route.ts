import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { generateFixture } from "@/lib/services/fixture-generator.service";
import { notifyParentsOfMatch } from "@/lib/services/notification.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;

    const matches = await generateFixture(id);

    await logAudit(user.id, "GENERATE_FIXTURE", "tournament", id, {
      matchCount: matches.length,
    });

    // Notification: send WhatsApp to parents of infantile category teams for each match
    for (const match of matches) {
      notifyParentsOfMatch(match.id).catch(console.error);
    }

    return NextResponse.json({
      message: "Fixture generado exitosamente",
      matchCount: matches.length,
      matches,
    });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("no encontrado")) {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      if (
        msg.includes("solo se puede") ||
        msg.includes("Se necesitan") ||
        msg.includes("fixture")
      ) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
    return handleAuthError(error);
  }
}
