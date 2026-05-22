import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { createLocationSchema } from "@/lib/validators/location.schema";
import { getAllLocations, createLocation } from "@/lib/services/location.service";
import { logAudit } from "@/lib/utils/audit";

export async function GET() {
  try {
    const locations = await getAllLocations();
    return NextResponse.json(locations);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener ubicaciones" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    const body = await req.json();
    console.log("[LOCATIONS] Body received:", JSON.stringify(body));
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      console.log("[LOCATIONS] Validation failed:", parsed.error.issues);
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    console.log("[LOCATIONS] Creating with:", JSON.stringify(parsed.data));
    const location = await createLocation(parsed.data);
    console.log("[LOCATIONS] Created:", location.id);

    await logAudit(user.id, "CREATE_LOCATION", "location", location.id, {
      name: parsed.data.name,
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("[LOCATIONS POST ERROR]", error);
    if (error instanceof Error && error.message.includes("auth")) {
      return handleAuthError(error);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
