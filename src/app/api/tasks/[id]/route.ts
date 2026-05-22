import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireAuth();

    const task = await prisma.individualTask.findUnique({
      where: { id },
      include: { assignments: { select: { id: true } } },
    });

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    // Delete assignments first, then the task
    if (task.assignments.length > 0) {
      await prisma.taskAssignment.deleteMany({ where: { taskId: id } });
    }

    await prisma.individualTask.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
