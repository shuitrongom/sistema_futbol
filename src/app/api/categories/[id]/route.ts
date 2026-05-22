import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import { updateCategorySchema } from "@/lib/validators/category.schema";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
  categoryNameExists,
} from "@/lib/services/category.service";
import { logAudit } from "@/lib/utils/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const category = await getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener categoría" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    if (parsed.data.name && (await categoryNameExists(parsed.data.name, id))) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 }
      );
    }

    const category = await updateCategory(id, parsed.data);

    await logAudit(user.id, "UPDATE_CATEGORY", "category", id, parsed.data);

    return NextResponse.json(category);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;

    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    await deleteCategory(id);

    await logAudit(user.id, "DELETE_CATEGORY", "category", id, {
      name: existing.name,
    });

    return NextResponse.json({ message: "Categoría eliminada" });
  } catch (error) {
    return handleAuthError(error);
  }
}
