import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { canAccessExerciseLibrary } from "@/lib/utils/permissions";
import { addFavorite, removeFavorite } from "@/lib/services/exercise.service";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    if (!canAccessExerciseLibrary(user)) {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    await addFavorite(user.id, params.id);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Ejercicio no encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleAuthError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    if (!canAccessExerciseLibrary(user)) {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    await removeFavorite(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
