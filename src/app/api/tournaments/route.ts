import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { createTournamentSchema } from "@/lib/validators/tournament.schema";
import { getAllTournaments, createTournament } from "@/lib/services/tournament.service";
import { logAudit } from "@/lib/utils/audit";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const tournaments = await getAllTournaments(status);
    return NextResponse.json(tournaments);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener torneos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    const body = await req.json();
    const parsed = createTournamentSchema.safeParse(body);

    if (!parsed.success) {
      // Build a human-readable error message from Zod issues
      const messages = parsed.error.issues.map((issue) => {
        const field = issue.path.join(".");
        return field ? `${field}: ${issue.message}` : issue.message;
      });
      return NextResponse.json(
        { error: messages.join(". "), details: parsed.error.issues },
        { status: 400 }
      );
    }

    const tournament = await createTournament(parsed.data);
    await logAudit(user.id, "CREATE_TOURNAMENT", "tournament", tournament.id, {
      name: parsed.data.name,
      format: parsed.data.format,
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
