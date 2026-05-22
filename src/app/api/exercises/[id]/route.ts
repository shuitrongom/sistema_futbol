import { NextRequest, NextResponse } from "next/server";
import { getExerciseById } from "@/lib/services/exercise.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exercise = await getExerciseById(params.id);

    if (!exercise) {
      return NextResponse.json(
        { error: "Ejercicio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(exercise);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener ejercicio" },
      { status: 500 }
    );
  }
}
