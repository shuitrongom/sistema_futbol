import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { updateLocationSchema } from "@/lib/validators/location.schema";
import {
  getLocationById,
  updateLocation,
  deleteLocation,
  locationHasScheduledMatches,
} from "@/lib/services/location.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const location = await getLocationById(id);

    if (!location) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener ubicación" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;
    const body = await req.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await getLocationById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    const location = await updateLocation(id, parsed.data);

    await logAudit(user.id, "UPDATE_LOCATION", "location", id, parsed.data);

    return NextResponse.json(location);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;

    const existing = await getLocationById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    if (await locationHasScheduledMatches(id)) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la ubicación porque tiene partidos programados",
        },
        { status: 409 }
      );
    }

    await deleteLocation(id);

    await logAudit(user.id, "DELETE_LOCATION", "location", id, {
      name: existing.name,
    });

    return NextResponse.json({ message: "Ubicación eliminada" });
  } catch (error) {
    return handleAuthError(error);
  }
}
