import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const CACHE_PREFIX = "exercises";
const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export interface ExerciseFilters {
  category?: string;
  difficulty?: string;
  minAge?: number;
  maxAge?: number;
  keyword?: string;
  methodologySource?: string;
  isSmallSidedGame?: boolean;
  gameFormat?: string;
  page?: number;
  pageSize?: number;
}

function buildCacheKey(filters: ExerciseFilters): string {
  const parts = [CACHE_PREFIX];
  if (filters.category) parts.push(`cat:${filters.category}`);
  if (filters.difficulty) parts.push(`diff:${filters.difficulty}`);
  if (filters.minAge != null) parts.push(`minA:${filters.minAge}`);
  if (filters.maxAge != null) parts.push(`maxA:${filters.maxAge}`);
  if (filters.keyword) parts.push(`kw:${filters.keyword.toLowerCase()}`);
  if (filters.methodologySource) parts.push(`meth:${filters.methodologySource}`);
  if (filters.isSmallSidedGame != null) parts.push(`ssg:${filters.isSmallSidedGame}`);
  if (filters.gameFormat) parts.push(`gf:${filters.gameFormat}`);
  parts.push(`p:${filters.page ?? 1}`);
  parts.push(`ps:${filters.pageSize ?? 20}`);
  return parts.join(":");
}

export async function getExercises(filters: ExerciseFilters) {
  const cacheKey = buildCacheKey(filters);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Redis unavailable, continue without cache
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }
  if (filters.minAge != null) {
    where.maxAge = { gte: filters.minAge };
  }
  if (filters.maxAge != null) {
    where.minAge = { lte: filters.maxAge };
  }
  if (filters.keyword) {
    where.OR = [
      { title: { contains: filters.keyword, mode: "insensitive" } },
      { description: { contains: filters.keyword, mode: "insensitive" } },
    ];
  }
  if (filters.methodologySource) {
    where.methodologySource = filters.methodologySource;
  }
  if (filters.isSmallSidedGame != null) {
    where.isSmallSidedGame = filters.isSmallSidedGame;
  }
  if (filters.gameFormat) {
    where.gameFormat = filters.gameFormat;
  }

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ category: "asc" }, { difficulty: "asc" }, { title: "asc" }],
    }),
    prisma.exercise.count({ where }),
  ]);

  const result = {
    exercises,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };

  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
  } catch {
    // Redis unavailable, skip caching
  }

  return result;
}

export async function getExerciseById(id: string) {
  const cacheKey = `${CACHE_PREFIX}:id:${id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Redis unavailable
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id },
  });

  if (exercise) {
    try {
      await redis.set(cacheKey, JSON.stringify(exercise), "EX", CACHE_TTL);
    } catch {
      // Redis unavailable
    }
  }

  return exercise;
}

export async function addFavorite(coachId: string, exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true },
  });
  if (!exercise) {
    throw new Error("Ejercicio no encontrado");
  }

  return prisma.exerciseFavorite.upsert({
    where: {
      coachId_exerciseId: { coachId, exerciseId },
    },
    create: { coachId, exerciseId },
    update: {},
  });
}

export async function removeFavorite(coachId: string, exerciseId: string) {
  try {
    await prisma.exerciseFavorite.delete({
      where: {
        coachId_exerciseId: { coachId, exerciseId },
      },
    });
  } catch {
    // Already removed or doesn't exist
  }
}

export async function getFavorites(coachId: string) {
  const favorites = await prisma.exerciseFavorite.findMany({
    where: { coachId },
    include: {
      exercise: true,
    },
    orderBy: {
      exercise: { title: "asc" },
    },
  });

  return favorites.map((f) => f.exercise);
}

export async function isFavorite(coachId: string, exerciseId: string) {
  const fav = await prisma.exerciseFavorite.findUnique({
    where: {
      coachId_exerciseId: { coachId, exerciseId },
    },
  });
  return !!fav;
}

export async function getFavoriteIds(coachId: string): Promise<string[]> {
  const favorites = await prisma.exerciseFavorite.findMany({
    where: { coachId },
    select: { exerciseId: true },
  });
  return favorites.map((f) => f.exerciseId);
}
