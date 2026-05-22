// PDF Generator utility for progress reports
// Uses @react-pdf/renderer for server-side PDF generation
//
// NOTE: This module exports a React component (ReportDocument) that can be
// rendered to PDF using @react-pdf/renderer's renderToBuffer/renderToStream.
// The actual rendering should happen in API routes or server actions.

import type { ReportContent } from "@/lib/services/report.service";

// ─── Helper: format date ───
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("es", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Helper: position label ───
const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

export function getPositionLabel(position: string): string {
  return POSITION_LABELS[position] || position;
}

// ─── Helper: feedback type label ───
const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  positive: "Positivo",
  improvement: "Mejora",
  technical: "Técnico",
};

export function getFeedbackTypeLabel(type: string): string {
  return FEEDBACK_TYPE_LABELS[type] || type;
}

// ─── Helper: task status label ───
const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  completed: "Completada",
  overdue: "Vencida",
  rejected: "Rechazada",
};

export function getTaskStatusLabel(status: string): string {
  return TASK_STATUS_LABELS[status] || status;
}

// ─── Helper: report type label ───
const REPORT_TYPE_LABELS: Record<string, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  semester: "Semestral",
};

export function getReportTypeLabel(type: string): string {
  return REPORT_TYPE_LABELS[type] || type;
}

// ─── Dimension labels for radar chart data ───
export const DIMENSION_LABELS: Record<string, string> = {
  technicalAvg: "Técnica",
  tacticalAvg: "Táctica",
  physicalAvg: "Física",
  mentalAvg: "Mental",
};

// ─── Criteria labels ───
export const CRITERIA_LABELS: Record<string, string> = {
  ballControl: "Control de balón",
  passing: "Pase",
  dribbling: "Regate",
  shooting: "Tiro",
  heading: "Juego aéreo",
  weakFoot: "Pie débil",
  positioning: "Posicionamiento",
  gameVision: "Visión de juego",
  decisionMaking: "Toma de decisiones",
  systemUnderstanding: "Comprensión del sistema",
  speed: "Velocidad",
  endurance: "Resistencia",
  strength: "Fuerza",
  agility: "Agilidad",
  coordination: "Coordinación",
  concentration: "Concentración",
  attitude: "Actitud",
  leadership: "Liderazgo",
  teamwork: "Trabajo en equipo",
  resilience: "Resiliencia",
};

// ─── Build PDF-ready data structure from ReportContent ───

export type PDFReportData = {
  title: string;
  subtitle: string;
  playerName: string;
  playerPosition: string;
  teamName: string;
  periodLabel: string;
  coachName: string;
  generatedAt: string;
  sections: {
    evaluationSummary?: {
      count: number;
      latestOverall: number | null;
      dimensions: Array<{ label: string; value: number | null }>;
    };
    criteriaDetails?: Array<{ label: string; value: number | null }>;
    progressTracking?: Array<{
      date: string;
      overall: number | null;
      technical: number | null;
      tactical: number | null;
      physical: number | null;
      mental: number | null;
    }>;
    tasks?: {
      total: number;
      completed: number;
      items: Array<{ title: string; status: string; type: string | null }>;
    };
    objectives?: {
      total: number;
      items: Array<{ title: string; progress: number; status: string }>;
    };
    feedback?: Array<{ type: string; message: string; date: string }>;
    coachComments?: string;
  };
  strengths?: Array<{ label: string; value: number }>;
  weaknesses?: Array<{ label: string; value: number }>;
};

export function buildPDFData(content: ReportContent, reportType: string): PDFReportData {
  const data: PDFReportData = {
    title: `Reporte de Progreso ${getReportTypeLabel(reportType)}`,
    subtitle: `${content.playerInfo.fullName} - ${content.playerInfo.teamName}`,
    playerName: content.playerInfo.fullName,
    playerPosition: getPositionLabel(content.playerInfo.position),
    teamName: content.playerInfo.teamName,
    periodLabel: `${formatDate(content.generatedAt)}`,
    coachName: content.coachName,
    generatedAt: formatDate(content.generatedAt),
    sections: {},
  };

  // Evaluation summary
  if (content.evaluations && content.evaluations.length > 0) {
    const latest = content.evaluations[content.evaluations.length - 1];
    data.sections.evaluationSummary = {
      count: content.evaluations.length,
      latestOverall: latest.overallAvg,
      dimensions: [
        { label: "Técnica", value: latest.technicalAvg },
        { label: "Táctica", value: latest.tacticalAvg },
        { label: "Física", value: latest.physicalAvg },
        { label: "Mental", value: latest.mentalAvg },
      ],
    };

    // Progress tracking
    data.sections.progressTracking = content.evaluations.map((e) => ({
      date: formatDate(e.date),
      overall: e.overallAvg,
      technical: e.technicalAvg,
      tactical: e.tacticalAvg,
      physical: e.physicalAvg,
      mental: e.mentalAvg,
    }));
  }

  // Criteria details from latest evaluation
  if (content.latestEvaluation) {
    const le = content.latestEvaluation;
    data.sections.criteriaDetails = Object.entries(CRITERIA_LABELS).map(([key, label]) => ({
      label,
      value: (le as Record<string, number | null>)[key] ?? null,
    }));

    // Strengths and weaknesses
    if (le.topStrengths && Array.isArray(le.topStrengths)) {
      data.strengths = (le.topStrengths as Array<{ label: string; value: number }>).map((s) => ({
        label: s.label,
        value: s.value,
      }));
    }
    if (le.topWeaknesses && Array.isArray(le.topWeaknesses)) {
      data.weaknesses = (le.topWeaknesses as Array<{ label: string; value: number }>).map((w) => ({
        label: w.label,
        value: w.value,
      }));
    }
  }

  // Tasks
  if (content.tasks) {
    const completed = content.tasks.filter((t) => t.status === "completed").length;
    data.sections.tasks = {
      total: content.tasks.length,
      completed,
      items: content.tasks.map((t) => ({
        title: t.title,
        status: getTaskStatusLabel(t.status),
        type: t.taskType,
      })),
    };
  }

  // Objectives
  if (content.objectives) {
    data.sections.objectives = {
      total: content.objectives.length,
      items: content.objectives.map((o) => ({
        title: o.title,
        progress: o.progress,
        status: o.status,
      })),
    };
  }

  // Feedback
  if (content.feedback) {
    data.sections.feedback = content.feedback.map((f) => ({
      type: getFeedbackTypeLabel(f.feedbackType),
      message: f.message,
      date: formatDate(f.createdAt),
    }));
  }

  // Coach comments
  if (content.coachComments) {
    data.sections.coachComments = content.coachComments;
  }

  return data;
}
