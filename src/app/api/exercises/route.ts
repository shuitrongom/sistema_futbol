import { NextRequest, NextResponse } from "next/server";
import { getExercises, type ExerciseFilters } from "@/lib/services/exercise.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const filters: ExerciseFilters = {};

    const category = searchParams.get("category");
    if (category) filters.category = category;

    const difficulty = searchParams.get("difficulty");
    if (difficulty) filters.difficulty = difficulty;

    const minAge = searchParams.get("minAge");
    if (minAge) filters.minAge = parseInt(minAge, 10);

    const maxAge = searchParams.get("maxAge");
    if (maxAge) filters.maxAge = parseInt(maxAge, 10);

    const keyword = searchParams.get("keyword");
    if (keyword) filters.keyword = keyword;

    const methodologySource = searchParams.get("methodologySource");
    if (methodologySource) filters.methodologySource = methodologySource;

    const isSmallSidedGame = searchParams.get("isSmallSidedGame");
    if (isSmallSidedGame) filters.isSmallSidedGame = isSmallSidedGame === "true";

    const gameFormat = searchParams.get("gameFormat");
    if (gameFormat) filters.gameFormat = gameFormat;

    const page = searchParams.get("page");
    if (page) filters.page = parseInt(page, 10);

    const pageSize = searchParams.get("pageSize");
    if (pageSize) filters.pageSize = parseInt(pageSize, 10);

    const result = await getExercises(filters);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener ejercicios" },
      { status: 500 }
    );
  }
}
