"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Download,
  Trash2,
  User,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Star,
  Shield,
  Zap,
  Brain,
} from "lucide-react";

type ReportContent = {
  sections: string[];
  playerInfo: {
    fullName: string;
    position: string;
    birthDate: string;
    teamName: string;
  };
  evaluations?: Array<{
    id: string;
    date: string;
    context: string;
    technicalAvg: number | null;
    tacticalAvg: number | null;
    physicalAvg: number | null;
    mentalAvg: number | null;
    overallAvg: number | null;
  }>;
  latestEvaluation?: Record<string, unknown>;
  tasks?: Array<{
    title: string;
    status: string;
    taskType: string | null;
    completedAt: string | null;
  }>;
  objectives?: Array<{
    title: string;
    status: string;
    targetValue: number | null;
    currentValue: number | null;
    progress: number;
  }>;
  feedback?: Array<{
    feedbackType: string;
    message: string;
    createdAt: string;
  }>;
  coachComments?: string;
  coachName: string;
  generatedAt: string;
};

type Report = {
  id: string;
  periodStart: string;
  periodEnd: string;
  reportType: string | null;
  content: ReportContent;
  createdAt: string;
  player: { id: string; fullName: string; position: string; photoUrl: string | null; birthDate: string | null };
  coach: { id: string; fullName: string } | null;
  team: { id: string; name: string } | null;
};

const POS_LABELS: Record<string, string> = { goalkeeper: "Portero", defender: "Defensa", midfielder: "Mediocampista", forward: "Delantero" };
const TYPE_LABELS: Record<string, string> = { monthly: "Mensual", quarterly: "Trimestral", semester: "Semestral" };
const CTX_LABELS: Record<string, string> = { match: "Partido", training: "Entrenamiento", formal: "Evaluación formal" };
const TASK_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "text-yellow-400" },
  in_progress: { label: "En Progreso", color: "text-blue-400" },
  completed: { label: "Completada", color: "text-green-400" },
  overdue: { label: "Vencida", color: "text-red-400" },
  rejected: { label: "Rechazada", color: "text-white/40" },
};
const TASK_TYPE: Record<string, string> = { technical: "Técnica", tactical: "Táctica", physical: "Física", mental: "Mental" };
const FEEDBACK_TYPE: Record<string, string> = { positive: "Positivo", constructive: "Constructivo", motivational: "Motivacional" };

function DimBar({ label, value, icon, color }: { label: string; value: number | null; icon: React.ReactNode; color: string }) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-white/70">{label}</span>
          <span className="text-sm font-bold text-white">{v.toFixed(1)}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(v / 10) * 100}%`, backgroundColor: v >= 7 ? "#C1D82F" : v >= 5 ? "#eab308" : "#ef4444" }} />
        </div>
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        if (res.ok) setReport(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  const handleDelete = async () => {
    if (!report || !confirm("¿Eliminar este reporte? No se puede deshacer.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`, { method: "DELETE" });
      if (res.ok) router.push("/coach/reports");
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    // Use browser print as PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const content = reportRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Reporte - ${report?.player.fullName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0d1117; color: #e6edf3; padding: 0; }
        .report-pdf { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header-band { background: linear-gradient(135deg, #1a1f36, #0d1117); border: 1px solid rgba(193,216,47,0.2); border-radius: 16px; padding: 32px; margin-bottom: 24px; text-align: center; }
        .header-band h1 { font-size: 28px; color: #C1D82F; margin-bottom: 4px; }
        .header-band .team { font-size: 14px; color: rgba(255,255,255,0.5); }
        .header-band .meta { display: flex; justify-content: center; gap: 24px; margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.4); }
        .section { background: #1a1f36; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 16px; }
        .section h2 { font-size: 16px; color: #C1D82F; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
        .dim-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .dim-label { width: 100px; font-size: 12px; color: rgba(255,255,255,0.6); }
        .dim-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
        .dim-fill { height: 100%; border-radius: 4px; }
        .dim-val { width: 40px; text-align: right; font-size: 14px; font-weight: 700; }
        .task-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; }
        .obj-row { margin-bottom: 12px; }
        .obj-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; margin-top: 4px; overflow: hidden; }
        .obj-fill { height: 100%; background: #C1D82F; border-radius: 3px; }
        .comment-box { background: rgba(193,216,47,0.05); border: 1px solid rgba(193,216,47,0.15); border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.7); }
        .footer { text-align: center; font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
        .green { color: #C1D82F; } .yellow { color: #eab308; } .red { color: #ef4444; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      <div class="report-pdf">${content}</div>
      <script>setTimeout(()=>{ window.print(); window.close(); }, 500);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white/5 rounded-xl w-1/3" />
        <div className="h-60 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 mb-4">Reporte no encontrado</p>
        <button onClick={() => router.push("/coach/reports")} className="text-[#C1D82F] text-sm hover:underline">Volver</button>
      </div>
    );
  }

  const c = report.content;
  const lastEval = c.evaluations?.[c.evaluations.length - 1];

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/coach/reports")} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Reporte de {report.player.fullName}</h1>
            <p className="text-xs text-white/40">{TYPE_LABELS[report.reportType ?? ""] || "Reporte"} · {new Date(report.periodStart).toLocaleDateString("es")} - {new Date(report.periodEnd).toLocaleDateString("es")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C1D82F] text-[#0d1117] text-sm font-semibold shadow-lg shadow-[#C1D82F]/20 hover:shadow-[#C1D82F]/30 transition-all">
            <Download className="w-4 h-4" /> Descargar PDF
          </motion.button>
          <button onClick={handleDelete} disabled={deleting} title="Eliminar reporte"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Report content (also used for PDF) */}
      <div ref={reportRef}>
        {/* Header card */}
        <div className="header-band rounded-2xl bg-gradient-to-br from-[#1a1f36] to-[#0d1117] border border-[#C1D82F]/20 p-8 mb-6 text-center">
          {report.player.photoUrl && (
            <img src={report.player.photoUrl} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-[#C1D82F]/30 object-cover" />
          )}
          <h1 style={{ fontSize: 28, color: "#C1D82F", marginBottom: 4 }}>{report.player.fullName}</h1>
          <p className="team" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            {POS_LABELS[report.player.position] || report.player.position} · {report.team?.name}
          </p>
          <div className="meta" style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            <span>📅 {new Date(report.periodStart).toLocaleDateString("es")} - {new Date(report.periodEnd).toLocaleDateString("es")}</span>
            <span>📋 {TYPE_LABELS[report.reportType ?? ""] || "Reporte"}</span>
            <span>👤 {report.coach?.fullName}</span>
            <span>🕐 {new Date(report.createdAt).toLocaleDateString("es")}</span>
          </div>
        </div>

        {/* Evaluations section */}
        {c.sections.includes("evaluations") && c.evaluations && c.evaluations.length > 0 && (
          <div className="section rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-6 mb-4">
            <h2 style={{ fontSize: 16, color: "#C1D82F", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              📊 Evaluaciones del Período ({c.evaluations.length})
            </h2>
            {/* Latest eval dimensions */}
            {lastEval && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <DimBar label="Técnica" value={lastEval.technicalAvg} icon={<Star className="w-4 h-4 text-blue-400" />} color="bg-blue-500/10" />
                <DimBar label="Táctica" value={lastEval.tacticalAvg} icon={<Shield className="w-4 h-4 text-green-400" />} color="bg-green-500/10" />
                <DimBar label="Física" value={lastEval.physicalAvg} icon={<Zap className="w-4 h-4 text-orange-400" />} color="bg-orange-500/10" />
                <DimBar label="Mental" value={lastEval.mentalAvg} icon={<Brain className="w-4 h-4 text-purple-400" />} color="bg-purple-500/10" />
              </div>
            )}
            {/* Evaluation history table */}
            <div style={{ fontSize: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr repeat(4, 60px) 60px", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                <span>Fecha</span><span>Contexto</span><span>Téc</span><span>Tác</span><span>Fís</span><span>Men</span><span>Prom</span>
              </div>
              {c.evaluations.map((ev) => (
                <div key={ev.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr repeat(4, 60px) 60px", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.7)" }}>
                  <span>{new Date(ev.date).toLocaleDateString("es")}</span>
                  <span>{CTX_LABELS[ev.context] || ev.context}</span>
                  <span>{ev.technicalAvg?.toFixed(1) ?? "—"}</span>
                  <span>{ev.tacticalAvg?.toFixed(1) ?? "—"}</span>
                  <span>{ev.physicalAvg?.toFixed(1) ?? "—"}</span>
                  <span>{ev.mentalAvg?.toFixed(1) ?? "—"}</span>
                  <span style={{ fontWeight: 700, color: (ev.overallAvg ?? 0) >= 7 ? "#C1D82F" : (ev.overallAvg ?? 0) >= 5 ? "#eab308" : "#ef4444" }}>
                    {ev.overallAvg?.toFixed(1) ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks section */}
        {c.sections.includes("tasks") && c.tasks && c.tasks.length > 0 && (
          <div className="section rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-6 mb-4">
            <h2 style={{ fontSize: 16, color: "#C1D82F", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              ✅ Tareas ({c.tasks.filter((t) => t.status === "completed").length}/{c.tasks.length} completadas)
            </h2>
            {c.tasks.map((t, i) => {
              const st = TASK_STATUS[t.status] || TASK_STATUS.pending;
              return (
                <div key={i} className="task-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {t.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-white/20" />}
                    <span style={{ color: "rgba(255,255,255,0.8)" }}>{t.title}</span>
                    {t.taskType && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>{TASK_TYPE[t.taskType] || t.taskType}</span>}
                  </div>
                  <span className={st.color} style={{ fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Objectives section */}
        {c.sections.includes("objectives") && c.objectives && c.objectives.length > 0 && (
          <div className="section rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-6 mb-4">
            <h2 style={{ fontSize: 16, color: "#C1D82F", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              🎯 Objetivos de Desarrollo
            </h2>
            {c.objectives.map((o, i) => (
              <div key={i} className="obj-row" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>{o.title}</span>
                  <span style={{ fontWeight: 700, color: o.progress >= 75 ? "#C1D82F" : o.progress >= 50 ? "#eab308" : "#ef4444" }}>{o.progress}%</span>
                </div>
                <div className="obj-bar" style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div className="obj-fill" style={{ height: "100%", width: `${o.progress}%`, background: o.progress >= 75 ? "#C1D82F" : o.progress >= 50 ? "#eab308" : "#ef4444", borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback section */}
        {c.sections.includes("feedback") && c.feedback && c.feedback.length > 0 && (
          <div className="section rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-6 mb-4">
            <h2 style={{ fontSize: 16, color: "#C1D82F", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              💬 Feedback Personalizado
            </h2>
            {c.feedback.map((f, i) => (
              <div key={i} style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#C1D82F", fontWeight: 600 }}>{FEEDBACK_TYPE[f.feedbackType] || f.feedbackType}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{new Date(f.createdAt).toLocaleDateString("es")}</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{f.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Coach comments */}
        {c.sections.includes("coachComments") && c.coachComments && (
          <div className="section rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-6 mb-4">
            <h2 style={{ fontSize: 16, color: "#C1D82F", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              📝 Comentarios del Entrenador
            </h2>
            <div className="comment-box" style={{ background: "rgba(193,216,47,0.05)", border: "1px solid rgba(193,216,47,0.15)", borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
              {c.coachComments}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer" style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 32, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          Reporte generado por {report.coach?.fullName} · {report.team?.name} · {new Date(report.createdAt).toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>
    </div>
  );
}
