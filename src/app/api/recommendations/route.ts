import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireTeamAccess, handleAuthError } from "@/lib/auth";
import { getRecommendations, PlayStyle } from "@/lib/services/recommendation.service";

const VALID_STYLES: PlayStyle[] = ["offensive", "defensive", "balanced"];

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

    const style = req.nextUrl.searchParams.get("style") as PlayStyle | null;

    if (style && !VALID_STYLES.includes(style)) {
      return NextResponse.json(
        { error: "Estilo de juego inválido. Valores permitidos: offensive, defensive, balanced" },
        { status: 400 }
      );
    }

    const data = await getRecommendations(teamId, style ?? undefined);
    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}
