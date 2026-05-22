import prisma from "@/lib/prisma";
import { Resend } from "resend";
import {
  matchResultTemplate,
  progressReportTemplate,
  taskAssignedTemplate,
  feedbackTemplate,
} from "@/lib/email-templates";

// ─── Clients (lazy-initialized) ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let twilioClient: any = null;
let resendClient: Resend | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTwilioClient(): any {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require("twilio");
  twilioClient = twilio(sid, token);
  return twilioClient;
}

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resendClient = new Resend(key);
  return resendClient;
}

// ─── WhatsApp Templates (Spanish) ───

type MatchReminderParams = { date: string; time: string; location: string; opponent: string };
type ResultNotificationParams = { score: string; stats: string };
type TaskAssignedWhatsAppParams = { taskTitle: string; deadline: string };

function whatsappTemplate(
  template: "match_reminder",
  params: MatchReminderParams
): string;
function whatsappTemplate(
  template: "result_notification",
  params: ResultNotificationParams
): string;
function whatsappTemplate(
  template: "task_assigned",
  params: TaskAssignedWhatsAppParams
): string;
function whatsappTemplate(
  template: string,
  params: Record<string, string>
): string {
  switch (template) {
    case "match_reminder":
      return (
        `⚽ *Recordatorio de Partido*\n\n` +
        `📅 Fecha: ${params.date}\n` +
        `🕐 Hora: ${params.time}\n` +
        `📍 Lugar: ${params.location}\n` +
        `🆚 Rival: ${params.opponent}\n\n` +
        `¡No olvides llegar con tiempo de anticipación!`
      );
    case "result_notification":
      return (
        `⚽ *Resultado del Partido*\n\n` +
        `📊 Marcador: ${params.score}\n` +
        `📈 Estadísticas: ${params.stats}\n\n` +
        `Gracias por su apoyo.`
      );
    case "task_assigned":
      return (
        `📋 *Nueva Tarea Asignada*\n\n` +
        `📝 Tarea: ${params.taskTitle}\n` +
        `📅 Fecha límite: ${params.deadline}\n\n` +
        `¡A trabajar para mejorar!`
      );
    default:
      return params.message ?? "";
  }
}

// ─── Email Templates (delegated to src/lib/email-templates.ts) ───

type MatchResultEmailParams = {
  playerName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  stats: string;
};
type ProgressReportEmailParams = { playerName: string; period: string; summary: string };
type TaskAssignedEmailParams = { playerName: string; taskTitle: string; deadline: string; description: string };
type FeedbackEmailParams = { playerName: string; coachName: string; feedbackType: string; message: string };

function emailTemplate(
  template: "match_result",
  params: MatchResultEmailParams
): { subject: string; html: string };
function emailTemplate(
  template: "progress_report",
  params: ProgressReportEmailParams
): { subject: string; html: string };
function emailTemplate(
  template: "task_assigned",
  params: TaskAssignedEmailParams
): { subject: string; html: string };
function emailTemplate(
  template: "feedback",
  params: FeedbackEmailParams
): { subject: string; html: string };
function emailTemplate(
  template: string,
  params: Record<string, unknown>
): { subject: string; html: string } {
  switch (template) {
    case "match_result":
      return matchResultTemplate({
        playerName: String(params.playerName),
        homeTeam: String(params.homeTeam),
        awayTeam: String(params.awayTeam),
        homeScore: Number(params.homeScore),
        awayScore: Number(params.awayScore),
        playerStats: params.stats
          ? parseStatsText(String(params.stats))
          : undefined,
      });
    case "progress_report":
      return progressReportTemplate({
        playerName: String(params.playerName),
        period: String(params.period),
        summary: String(params.summary),
      });
    case "task_assigned":
      return taskAssignedTemplate({
        playerName: String(params.playerName),
        taskTitle: String(params.taskTitle),
        deadline: String(params.deadline),
        description: String(params.description),
        coachName: "Entrenador",
      });
    case "feedback":
      return feedbackTemplate({
        playerName: String(params.playerName),
        coachName: String(params.coachName),
        feedbackType: String(params.feedbackType),
        message: String(params.message),
      });
    default:
      return { subject: "Notificación", html: `<p>${String(params.message ?? "")}</p>` };
  }
}

/** Parse "Goles: N, Asistencias: N, Tarjetas: N" into structured stats */
function parseStatsText(text: string): { goals?: number; assists?: number; cards?: number } {
  const stats: { goals?: number; assists?: number; cards?: number } = {};
  const golesMatch = text.match(/Goles:\s*(\d+)/i);
  const assistMatch = text.match(/Asistencias:\s*(\d+)/i);
  const cardsMatch = text.match(/Tarjetas:\s*(\d+)/i);
  if (golesMatch) stats.goals = parseInt(golesMatch[1], 10);
  if (assistMatch) stats.assists = parseInt(assistMatch[1], 10);
  if (cardsMatch) stats.cards = parseInt(cardsMatch[1], 10);
  return stats;
}


// ─── Core: Send WhatsApp ───

export async function sendWhatsApp(
  to: string,
  template: "match_reminder" | "result_notification" | "task_assigned",
  params: Record<string, string>,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const body = whatsappTemplate(template, params);
  const logId = await logNotification(userId ?? null, "whatsapp", template, body);

  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!client || !from) {
    await updateNotificationStatus(logId, "failed");
    console.error("[Notification] Twilio no configurado");
    return { success: false, error: "Twilio no configurado" };
  }

  try {
    await client.messages.create({
      body,
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
    });
    await updateNotificationStatus(logId, "sent");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[Notification] WhatsApp error:", message);
    await updateNotificationStatus(logId, "failed");
    return { success: false, error: message };
  }
}

// ─── Core: Send Email ───

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const logId = await logNotification(userId ?? null, "email", subject, html);

  const client = getResendClient();
  const from = process.env.EMAIL_FROM;
  if (!client || !from) {
    await updateNotificationStatus(logId, "failed");
    console.error("[Notification] Resend no configurado");
    return { success: false, error: "Resend no configurado" };
  }

  try {
    await client.emails.send({ from, to, subject, html });
    await updateNotificationStatus(logId, "sent");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[Notification] Email error:", message);
    await updateNotificationStatus(logId, "failed");
    return { success: false, error: message };
  }
}

// ─── Notification Logging ───

async function logNotification(
  userId: string | null,
  channel: string,
  subject: string,
  content: string
): Promise<string> {
  try {
    const log = await prisma.notificationLog.create({
      data: { userId, channel, subject, content, status: "pending" },
    });
    return log.id;
  } catch (err) {
    console.error("[Notification] Error logging notification:", err);
    return "";
  }
}

async function updateNotificationStatus(logId: string, status: "sent" | "failed") {
  if (!logId) return;
  try {
    await prisma.notificationLog.update({
      where: { id: logId },
      data: { status, sentAt: status === "sent" ? new Date() : undefined },
    });
  } catch (err) {
    console.error("[Notification] Error updating log status:", err);
  }
}

// ─── User Preference Checking ───

async function getUserPreferences(userId: string) {
  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    return prefs ?? { whatsappEnabled: true, emailEnabled: true };
  } catch {
    return { whatsappEnabled: true, emailEnabled: true };
  }
}

// ─── Infantile Category Check ───

const INFANTILE_KEYWORDS = [
  "infantil", "sub-8", "sub-10", "sub-12", "sub-14",
  "benjamín", "alevín", "prebenjamín",
];

async function isInfantileTeam(teamId: string): Promise<boolean> {
  const teamCategories = await prisma.teamCategory.findMany({
    where: { teamId },
    include: { category: { select: { name: true } } },
  });
  return teamCategories.some((tc) =>
    INFANTILE_KEYWORDS.some((kw) => tc.category.name.toLowerCase().includes(kw))
  );
}

// ─── Get parent contacts for players ───

async function getParentContactsForPlayer(playerId: string) {
  const links = await prisma.parentPlayer.findMany({
    where: { playerId },
    include: {
      parent: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });
  return links.map((l) => ({
    parentId: l.parent.id,
    name: l.parent.fullName,
    email: l.parent.email,
    phone: l.parent.phone,
  }));
}


// ─── Helper: Notify Parents of Match (match_reminder) ───

export async function notifyParentsOfMatch(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { include: { teamPlayers: { where: { leftAt: null }, include: { player: true } } } },
        awayTeam: { include: { teamPlayers: { where: { leftAt: null }, include: { player: true } } } },
        location: true,
      },
    });
    if (!match) return;

    const teams = [
      { team: match.homeTeam, opponent: match.awayTeam.name },
      { team: match.awayTeam, opponent: match.homeTeam.name },
    ];

    for (const { team, opponent } of teams) {
      if (!(await isInfantileTeam(team.id))) continue;

      const playerIds = team.teamPlayers.map((tp) => tp.player.id);
      for (const playerId of playerIds) {
        const parents = await getParentContactsForPlayer(playerId);
        for (const parent of parents) {
          const prefs = await getUserPreferences(parent.parentId);

          if (prefs.whatsappEnabled && parent.phone) {
            await sendWhatsApp(parent.phone, "match_reminder", {
              date: match.dateTime.toLocaleDateString("es-ES"),
              time: match.dateTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
              location: match.location?.name ?? "Por confirmar",
              opponent,
            }, parent.parentId);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Notification] notifyParentsOfMatch error:", err);
  }
}

// ─── Helper: Notify Match Result ───

export async function notifyMatchResult(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { include: { teamPlayers: { where: { leftAt: null }, include: { player: true } } } },
        awayTeam: { include: { teamPlayers: { where: { leftAt: null }, include: { player: true } } } },
        events: { include: { player: true } },
      },
    });
    if (!match) return;

    const score = `${match.homeTeam.name} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${match.awayTeam.name}`;

    const teams = [
      { team: match.homeTeam, _isHome: true },
      { team: match.awayTeam, _isHome: false },
    ];

    for (const { team } of teams) {
      if (!(await isInfantileTeam(team.id))) continue;

      for (const tp of team.teamPlayers) {
        const playerEvents = match.events.filter((e) => e.playerId === tp.player.id);
        const goals = playerEvents.filter((e) => e.eventType === "goal").length;
        const assists = playerEvents.filter((e) => e.eventType === "assist").length;
        const cards = playerEvents.filter((e) => e.eventType === "yellow_card" || e.eventType === "red_card").length;

        const statsText = `Goles: ${goals}, Asistencias: ${assists}, Tarjetas: ${cards}`;
        const parents = await getParentContactsForPlayer(tp.player.id);

        for (const parent of parents) {
          const prefs = await getUserPreferences(parent.parentId);

          if (prefs.emailEnabled && parent.email) {
            const { subject, html } = emailTemplate("match_result", {
              playerName: tp.player.fullName,
              homeTeam: match.homeTeam.name,
              awayTeam: match.awayTeam.name,
              homeScore: match.homeScore ?? 0,
              awayScore: match.awayScore ?? 0,
              stats: statsText,
            });
            await sendEmail(parent.email, subject, html, parent.parentId);
          }

          if (prefs.whatsappEnabled && parent.phone) {
            await sendWhatsApp(parent.phone, "result_notification", {
              score,
              stats: statsText,
            }, parent.parentId);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Notification] notifyMatchResult error:", err);
  }
}

// ─── Helper: Notify Task Assigned ───

export async function notifyTaskAssigned(taskId: string) {
  try {
    const task = await prisma.individualTask.findUnique({
      where: { id: taskId },
      include: {
        assignments: { include: { player: true } },
        team: true,
      },
    });
    if (!task) return;

    const deadlineStr = task.deadline
      ? task.deadline.toLocaleDateString("es-ES")
      : "Sin fecha límite";

    for (const assignment of task.assignments) {
      const player = assignment.player;

      // Notify player directly if they have contact info
      if (player.email) {
        const { subject, html } = emailTemplate("task_assigned", {
          playerName: player.fullName,
          taskTitle: task.title,
          deadline: deadlineStr,
          description: task.description ?? "Sin descripción",
        });
        // Player may not have a user account, so userId is optional
        await sendEmail(player.email, subject, html);
      }

      // Notify parents if infantile category
      if (task.teamId && (await isInfantileTeam(task.teamId))) {
        const parents = await getParentContactsForPlayer(player.id);
        for (const parent of parents) {
          const prefs = await getUserPreferences(parent.parentId);

          if (prefs.emailEnabled && parent.email) {
            const { subject, html } = emailTemplate("task_assigned", {
              playerName: player.fullName,
              taskTitle: task.title,
              deadline: deadlineStr,
              description: task.description ?? "Sin descripción",
            });
            await sendEmail(parent.email, subject, html, parent.parentId);
          }

          if (prefs.whatsappEnabled && parent.phone) {
            await sendWhatsApp(parent.phone, "task_assigned", {
              taskTitle: task.title,
              deadline: deadlineStr,
            }, parent.parentId);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Notification] notifyTaskAssigned error:", err);
  }
}

// ─── Helper: Notify Feedback ───

export async function notifyFeedback(feedbackId: string) {
  try {
    const feedback = await prisma.personalizedFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        player: true,
        coach: { select: { fullName: true } },
        team: true,
      },
    });
    if (!feedback || !feedback.teamId) return;

    if (!(await isInfantileTeam(feedback.teamId))) return;

    const parents = await getParentContactsForPlayer(feedback.playerId);
    for (const parent of parents) {
      const prefs = await getUserPreferences(parent.parentId);

      if (prefs.emailEnabled && parent.email) {
        const { subject, html } = emailTemplate("feedback", {
          playerName: feedback.player.fullName,
          coachName: feedback.coach?.fullName ?? "Entrenador",
          feedbackType: feedback.feedbackType,
          message: feedback.message,
        });
        await sendEmail(parent.email, subject, html, parent.parentId);
      }
    }
  } catch (err) {
    console.error("[Notification] notifyFeedback error:", err);
  }
}
