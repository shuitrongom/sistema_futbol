// ─── Professional HTML Email Templates ───
// System branding: primary #1a472a, secondary #d4af37, accent #e63946, dark #0f1923

const COLORS = {
  primary: "#1a472a",
  secondary: "#d4af37",
  accent: "#e63946",
  dark: "#0f1923",
  lightBg: "#f7f7f7",
  white: "#ffffff",
  textMuted: "#6b7280",
  border: "#e5e7eb",
} as const;

const SYSTEM_NAME = "Sistema de Gestión de Fútbol";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${COLORS.lightBg};font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.lightBg};">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<!-- Header -->
<tr><td style="background-color:${COLORS.primary};padding:24px 32px;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="text-align:center;">
<span style="font-size:28px;color:${COLORS.white};">&#9917;</span>
<h1 style="margin:8px 0 0;font-size:20px;color:${COLORS.white};font-weight:700;letter-spacing:0.5px;">${SYSTEM_NAME}</h1>
</td></tr>
</table>
</td></tr>
<!-- Gold accent bar -->
<tr><td style="background-color:${COLORS.secondary};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
<!-- Body -->
<tr><td style="padding:32px;">
${content}
</td></tr>
<!-- Footer -->
<tr><td style="background-color:${COLORS.dark};padding:20px 32px;text-align:center;">
<p style="margin:0 0 4px;font-size:13px;color:${COLORS.secondary};font-weight:600;">${SYSTEM_NAME}</p>
<p style="margin:0;font-size:11px;color:#9ca3af;">Este es un mensaje automático. Por favor, no responda a este correo.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:22px;color:${COLORS.primary};font-weight:700;">${text}</h2>`;
}

function greeting(playerName: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#374151;">Estimado/a padre/madre de <strong>${playerName}</strong>,</p>`;
}

function infoCard(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
<tr><td style="background-color:${COLORS.lightBg};border-left:4px solid ${COLORS.secondary};border-radius:4px;padding:16px 20px;">
${content}
</td></tr>
</table>`;
}

function infoRow(label: string, value: string, icon?: string): string {
  const iconHtml = icon ? `<span style="margin-right:6px;">${icon}</span>` : "";
  return `<p style="margin:0 0 8px;font-size:14px;color:#374151;">${iconHtml}<strong>${label}:</strong> ${value}</p>`;
}

// ─── Template: Match Reminder ───

export interface MatchReminderParams {
  playerName: string;
  date: string;
  time: string;
  location: string;
  opponent: string;
  teamName: string;
}

export function matchReminderTemplate(params: MatchReminderParams): { subject: string; html: string } {
  const content = `
${heading("⚽ Recordatorio de Partido")}
${greeting(params.playerName)}
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Le recordamos que se acerca un partido del equipo <strong>${params.teamName}</strong>.</p>
${infoCard(`
${infoRow("Fecha", params.date, "📅")}
${infoRow("Hora", params.time, "🕐")}
${infoRow("Lugar", params.location, "📍")}
${infoRow("Rival", params.opponent, "🆚")}
`)}
<p style="margin:16px 0 0;font-size:14px;color:${COLORS.textMuted};">¡No olviden llegar con tiempo de anticipación!</p>`;

  return {
    subject: `Recordatorio: ${params.teamName} vs ${params.opponent} - ${params.date}`,
    html: baseLayout(content),
  };
}

// ─── Template: Match Result ───

export interface MatchResultParams {
  playerName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  playerStats?: { goals?: number; assists?: number; cards?: number; minutesPlayed?: number };
}

export function matchResultTemplate(params: MatchResultParams): { subject: string; html: string } {
  const statsRows: string[] = [];
  if (params.playerStats) {
    const s = params.playerStats;
    if (s.goals !== undefined) statsRows.push(infoRow("Goles", String(s.goals), "⚽"));
    if (s.assists !== undefined) statsRows.push(infoRow("Asistencias", String(s.assists), "🅰️"));
    if (s.cards !== undefined) statsRows.push(infoRow("Tarjetas", String(s.cards), "🟨"));
    if (s.minutesPlayed !== undefined) statsRows.push(infoRow("Minutos jugados", String(s.minutesPlayed), "⏱️"));
  }

  const content = `
${heading("⚽ Resultado del Partido")}
${greeting(params.playerName)}
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Le informamos el resultado del partido:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
<tr><td style="background-color:${COLORS.dark};border-radius:8px;padding:20px;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="40%" style="text-align:right;padding-right:12px;">
<span style="font-size:16px;color:${COLORS.white};font-weight:600;">${params.homeTeam}</span>
</td>
<td width="20%" style="text-align:center;">
<span style="font-size:28px;color:${COLORS.secondary};font-weight:700;">${params.homeScore} - ${params.awayScore}</span>
</td>
<td width="40%" style="text-align:left;padding-left:12px;">
<span style="font-size:16px;color:${COLORS.white};font-weight:600;">${params.awayTeam}</span>
</td>
</tr>
</table>
</td></tr>
</table>
${statsRows.length > 0 ? `<p style="margin:0 0 8px;font-size:16px;color:${COLORS.primary};font-weight:600;">Estadísticas de ${params.playerName}:</p>${infoCard(statsRows.join(""))}` : ""}`;

  return {
    subject: `Resultado: ${params.homeTeam} ${params.homeScore} - ${params.awayScore} ${params.awayTeam}`,
    html: baseLayout(content),
  };
}

// ─── Template: Progress Report ───

export interface ProgressReportParams {
  playerName: string;
  period: string;
  summary: string;
  reportUrl?: string;
}

export function progressReportTemplate(params: ProgressReportParams): { subject: string; html: string } {
  const downloadButton = params.reportUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
<tr><td style="background-color:${COLORS.primary};border-radius:6px;text-align:center;">
<a href="${params.reportUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;color:${COLORS.white};text-decoration:none;font-weight:600;">📄 Descargar Reporte PDF</a>
</td></tr>
</table>`
    : "";

  const content = `
${heading("📊 Reporte de Progreso")}
${greeting(params.playerName)}
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Se ha generado un nuevo reporte de progreso para el período <strong>${params.period}</strong>.</p>
${infoCard(`<p style="margin:0;font-size:14px;color:#374151;">${params.summary}</p>`)}
${downloadButton}
<p style="margin:16px 0 0;font-size:14px;color:${COLORS.textMuted};">Puede consultar más detalles en el portal de padres.</p>`;

  return {
    subject: `Reporte de progreso: ${params.playerName} - ${params.period}`,
    html: baseLayout(content),
  };
}

// ─── Template: Task Assigned ───

export interface TaskAssignedParams {
  playerName: string;
  taskTitle: string;
  deadline: string;
  description: string;
  coachName: string;
}

export function taskAssignedTemplate(params: TaskAssignedParams): { subject: string; html: string } {
  const content = `
${heading("📋 Nueva Tarea Asignada")}
${greeting(params.playerName)}
<p style="margin:0 0 16px;font-size:15px;color:#374151;">El entrenador <strong>${params.coachName}</strong> ha asignado una nueva tarea:</p>
${infoCard(`
${infoRow("Tarea", params.taskTitle, "📝")}
${infoRow("Fecha límite", params.deadline, "📅")}
${infoRow("Descripción", params.description, "📖")}
`)}
<p style="margin:16px 0 0;font-size:14px;color:${COLORS.textMuted};">¡A trabajar para mejorar!</p>`;

  return {
    subject: `Nueva tarea asignada: ${params.taskTitle}`,
    html: baseLayout(content),
  };
}

// ─── Template: Coach Feedback ───

export interface FeedbackParams {
  playerName: string;
  coachName: string;
  feedbackType: string;
  message: string;
}

const FEEDBACK_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  positive: { label: "Positivo", icon: "👍", color: "#16a34a" },
  improvement: { label: "Área de mejora", icon: "📈", color: COLORS.secondary },
  technical: { label: "Técnico", icon: "⚙️", color: "#2563eb" },
};

export function feedbackTemplate(params: FeedbackParams): { subject: string; html: string } {
  const fb = FEEDBACK_LABELS[params.feedbackType] ?? { label: params.feedbackType, icon: "💬", color: COLORS.primary };

  const content = `
${heading("💬 Feedback del Entrenador")}
${greeting(params.playerName)}
<p style="margin:0 0 16px;font-size:15px;color:#374151;">El entrenador <strong>${params.coachName}</strong> ha enviado el siguiente feedback:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
<tr><td style="padding:4px 12px;background-color:${fb.color};border-radius:20px;display:inline-block;">
<span style="font-size:13px;color:${COLORS.white};font-weight:600;">${fb.icon} ${fb.label}</span>
</td></tr>
</table>
${infoCard(`<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${params.message}</p>`)}
<p style="margin:16px 0 0;font-size:14px;color:${COLORS.textMuted};">Puede consultar más detalles en el portal de padres.</p>`;

  return {
    subject: `Feedback del entrenador para ${params.playerName}`,
    html: baseLayout(content),
  };
}
