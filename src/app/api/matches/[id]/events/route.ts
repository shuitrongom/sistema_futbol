import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { matchEventSchema } from "@/lib/validators/match.schema";
import { addMatchEvent, getMatchEvents } from "@/lib/services/match.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const events = await getMatchEvents(id);
    return NextResponse.json(events);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;
    const body = await req.json();
    const parsed = matchEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const event = await addMatchEvent(id, parsed.data);

    await logAudit(user.id, "ADD_MATCH_EVENT", "match_event", event.id, {
      matchId: id,
      eventType: parsed.data.eventType,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
