import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import {
  getSessionById,
  generateConsolidatedReport,
} from "@/lib/services/feedback360.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const session = await getSessionById(params.id);

    if (!session) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    await requireTeamAccess(session.teamId);

    // Generate consolidated report if there are completed evaluations
    const report = await generateConsolidatedReport(params.id);

    return NextResponse.json({ session, report });
  } catch (error) {
    return handleAuthError(error);
  }
}
