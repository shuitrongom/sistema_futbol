import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess, handleAuthError } from "@/lib/auth";
import { generateReport } from "@/lib/services/report.service";
import { sendEmail } from "@/lib/services/notification.service";
import { progressReportTemplate } from "@/lib/email-templates";
import { logAudit } from "@/lib/utils/audit";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const generateReportSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  reportType: z.enum(["monthly", "quarterly", "semester"]),
  sections: z
    .array(z.enum(["evaluations", "progress", "tasks", "objectives", "feedback", "coachComments"]))
    .min(1, "Debe seleccionar al menos una sección"),
  coachComments: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await requireTeamAccess(parsed.data.teamId);

    // Verify player belongs to the team
    const tp = await prisma.teamPlayer.findFirst({
      where: { teamId: parsed.data.teamId, playerId: parsed.data.playerId, leftAt: null },
    });
    if (!tp) {
      return NextResponse.json(
        { error: "El jugador no pertenece a este equipo" },
        { status: 400 }
      );
    }

    // Validate period dates
    const start = new Date(parsed.data.periodStart);
    const end = new Date(parsed.data.periodEnd);
    if (start >= end) {
      return NextResponse.json(
        { error: "La fecha de inicio debe ser anterior a la fecha de fin" },
        { status: 400 }
      );
    }

    const report = await generateReport(parsed.data, user.id);

    await logAudit(user.id, "GENERATE_REPORT", "progress_report", report.id, {
      playerId: parsed.data.playerId,
      reportType: parsed.data.reportType,
    });

    // Notification: send progress report email to parents
    (async () => {
      try {
        const parentLinks = await prisma.parentPlayer.findMany({
          where: { playerId: parsed.data.playerId },
          include: { parent: { select: { id: true, email: true } } },
        });
        // Fetch player name for the email template
        const player = await prisma.player.findUnique({
          where: { id: parsed.data.playerId },
          select: { fullName: true },
        });
        const period = `${parsed.data.periodStart} - ${parsed.data.periodEnd}`;
        const { subject, html } = progressReportTemplate({
          playerName: player?.fullName ?? "Jugador",
          period,
          summary: `Reporte ${parsed.data.reportType} generado`,
          reportUrl: report.pdfUrl ?? undefined,
        });
        for (const link of parentLinks) {
          if (link.parent.email) {
            sendEmail(link.parent.email, subject, html, link.parent.id).catch(console.error);
          }
        }
      } catch (err) {
        console.error("[Notification] Report email error:", err);
      }
    })();

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
