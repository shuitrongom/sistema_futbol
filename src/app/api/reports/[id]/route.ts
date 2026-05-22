import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { getReportById } from "@/lib/services/report.service";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireAuth();
    const report = await getReportById(id);
    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }
    return NextResponse.json(report);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireAuth();
    const report = await getReportById(id);
    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }
    await prisma.progressReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
