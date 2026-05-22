import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { createCategorySchema } from "@/lib/validators/category.schema";
import {
  getAllCategories,
  createCategory,
  categoryNameExists,
} from "@/lib/services/category.service";
import { logAudit } from "@/lib/utils/audit";

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;

    if (await categoryNameExists(name)) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 }
      );
    }

    const category = await createCategory({ name, description });

    await logAudit(user.id, "CREATE_CATEGORY", "category", category.id, {
      name,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
