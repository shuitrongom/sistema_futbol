import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { getTrainingEffectiveness } from "@/lib/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const teamId = req.nextUrl.searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "El parámetro teamId es requerido" },
        { status: 400 }
      );
    }

    await requireTeamAccess(teamId);

    const data = await getTrainingEffectiveness(teamId);
    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}
