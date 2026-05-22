import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { canAccessExerciseLibrary } from "@/lib/utils/permissions";
import { getFavorites } from "@/lib/services/exercise.service";

export async function GET() {
  try {
    const user = await requireAuth();

    if (!canAccessExerciseLibrary(user)) {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const favorites = await getFavorites(user.id);
    return NextResponse.json(favorites);
  } catch (error) {
    return handleAuthError(error);
  }
}
