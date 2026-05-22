import prisma from "@/lib/prisma";

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          teamCategories: true,
          tournamentCategories: true,
        },
      },
    },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          teamCategories: true,
          tournamentCategories: true,
        },
      },
    },
  });
}

export async function createCategory(data: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description ?? null,
    },
  });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({
    where: { id },
  });
}

export async function categoryNameExists(name: string, excludeId?: string) {
  const existing = await prisma.category.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}
