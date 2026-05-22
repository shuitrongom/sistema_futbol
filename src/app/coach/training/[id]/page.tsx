"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarCheck,
  ArrowLeft,
  Clock,
  Target,
  Share2,
  Copy,
  CheckCircle2,
  PlayCircle,
  FileEdit,
  Flame,
  Snowflake,
  Star,
  Users,
  Save,
  Play,
  Trash2,
} from "lucide-react";

type SessionExercise = {
  id: string;
  exerciseOrder: number;
  effectivenessRating: number | null;
  coachNotes: string | null;
  exercise: {
    id: string;
    title: string;
    category: string;
    durationMinutes: number | null;
    methodologySource: string | null;
  };
};

type Session = {
  id: string;
  sessionDate: string | null;
  durationMinutes: number | null;
  phase: string | null;
  sessionOrder: number;
  executedAt: string | null;
  attendance: string[] | null;
  exercises: SessionExercise[];
};

type Plan = {
  id: string;
  name: string;
  targetAgeMin: number | null;
  targetAgeMax: number | null;
  level: string | null;
  objectives: string | null;
  startDate: string | null;
  endDate: string | null;
  isShared: boolean;
  effectivenessNotes: string | null;
  totalDuration: number;
  status: "draft" | "active" | "completed";
  sessions: Session[];
  coach: { id: string; fullName: string } | null;
  team: { id: string; name: string } | null;
};

type TeamPlayer = {
  id: string;
  player: { id: string; fullName: string };
  jerseyNumber: number;
};

const PHASE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  warmup: { label: "Calentamiento", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  main: { label: "Parte Principal", icon: Target, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  cooldown: { label: "Enfriamiento", icon: Snowflake, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

function statusConfig(status: string) {
  switch (status) {
    case "active":
      return { label: "Activo", color: "bg-green-500/15 text-green-400 border-green-500/20", icon: PlayCircle };
    case "completed":
      return { label: "Completado", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: CheckCircle2 };
    default:
      return { label: "Borrador", color: "bg-white/5 text-white/50 border-white/10", icon: FileEdit };
  }
}

function levelLabel(level: string | null) {
  switch (level) {
    case "beginner": return "Principiante";
    case "intermediate": return "Intermedio";
    case "advanced": return "Avanzado";
    default: return null;
  }
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

export default function TrainingPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);

  // Execution dialog
  const [execSession, setExecSession] = useState<Session | null>(null);
  const [execDate, setExecDate] = useState("");
  const [execAttendance, setExecAttendance] = useState<Set<string>>(new Set());
  const [execRatings, setExecRatings] = useState<Record<string, { rating: number; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/training-plans/${planId}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        if (data.team?.id) {
          const pRes = await fetch(`/api/teams/${data.team.id}/players`);
          if (pRes.ok) {
            const pData = await pRes.json();
            setPlayers(pData);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const openExecDialog = (session: Session) => {
    setExecSession(session);
    setExecDate(new Date().toISOString().split("T")[0]);
    setExecAttendance(new Set(session.attendance ?? []));
    const ratings: Record<string, { rating: number; notes: string }> = {};
    session.exercises.forEach((se) => {
      ratings[se.id] = { rating: se.effectivenessRating ?? 3, notes: se.coachNotes ?? "" };
    });
    setExecRatings(ratings);
  };

  const handleExecute = async () => {
    if (!execSession || !plan) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/training-plans/${plan.id}/sessions/${execSession.id}/execute`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executedAt: execDate ? new Date(execDate).toISOString() : new Date().toISOString(),
          attendance: Array.from(execAttendance),
          exerciseRatings: Object.entries(execRatings).map(([sessionExerciseId, { rating, notes }]) => ({
            sessionExerciseId,
            effectivenessRating: rating,
            coachNotes: notes || null,
          })),
        }),
      });
      if (res.ok) {
        setExecSession(null);
        fetchPlan();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!plan) return;
    try {
      const res = await fetch(`/api/training-plans/${plan.id}/duplicate`, { method: "POST" });
      if (res.ok) {
        const dup = await res.json();
        router.push(`/coach/training/${dup.id}`);
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!plan) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/training-plans/${plan.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/coach/training");
      }
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white/5 rounded-xl w-1/3" />
        <div className="h-40 bg-white/5 rounded-2xl" />
        <div className="h-32 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 mb-4">Plan no encontrado</p>
        <button onClick={() => router.push("/coach/training")} className="text-[#C1D82F] text-sm hover:underline">
          Volver a planes
        </button>
      </div>
    );
  }

  const st = statusConfig(plan.status);
  const StIcon = st.icon;
  const executedCount = plan.sessions.filter((s) => s.executedAt).length;
  const progressPct = plan.sessions.length > 0 ? (executedCount / plan.sessions.length) * 100 : 0;

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
        <button
          onClick={() => router.push("/coach/training")}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0 mt-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${st.color}`}>
              <StIcon className="w-3 h-3" />
              {st.label}
            </span>
            {plan.isShared && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/20">
                <Share2 className="w-3 h-3" />
                Compartido
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-white/40 mt-1">
            {plan.coach && <span>Por {plan.coach.fullName}</span>}
            {plan.team && <span>• {plan.team.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-white/60 hover:text-[#C1D82F] hover:border-[#C1D82F]/30 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-500/20 text-sm font-medium text-red-400/70 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </motion.button>
        </div>
      </motion.div>

      {/* Plan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-6"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-white/30 text-xs mb-1">Período</p>
            <p className="font-medium text-white">{formatDate(plan.startDate)} — {formatDate(plan.endDate)}</p>
          </div>
          <div>
            <p className="text-white/30 text-xs mb-1">Edad objetivo</p>
            <p className="font-medium text-white">
              {plan.targetAgeMin && plan.targetAgeMax ? `${plan.targetAgeMin}-${plan.targetAgeMax} años` : "—"}
            </p>
          </div>
          <div>
            <p className="text-white/30 text-xs mb-1">Nivel</p>
            <p className="font-medium text-white">{levelLabel(plan.level) ?? "—"}</p>
          </div>
          <div>
            <p className="text-white/30 text-xs mb-1">Duración total</p>
            <p className="font-medium text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C1D82F]" />
              {plan.totalDuration > 0 ? `${Math.floor(plan.totalDuration / 60)}h ${plan.totalDuration % 60}m` : "—"}
            </p>
          </div>
        </div>
        {plan.objectives && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-white/30 mb-1">Objetivos</p>
            <p className="text-sm text-white/70">{plan.objectives}</p>
          </div>
        )}
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#C1D82F] to-[#2B8B41] rounded-full"
          />
        </div>
        <span className="text-sm text-white/40 shrink-0">
          {executedCount}/{plan.sessions.length} sesiones completadas
        </span>
      </motion.div>

      {/* Sessions */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-[#C1D82F]" />
          Sesiones Programadas
        </h2>
        {plan.sessions.length === 0 ? (
          <p className="text-sm text-white/30 py-8 text-center">No hay sesiones</p>
        ) : (
          <AnimatePresence>
            {plan.sessions.map((session, i) => {
              const phaseCfg = PHASE_CONFIG[session.phase ?? "main"] ?? PHASE_CONFIG.main;
              const PhaseIcon = phaseCfg.icon;
              const isExecuted = !!session.executedAt;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={`rounded-2xl border p-5 transition-all ${
                    isExecuted
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-[#1a1f36]/60 border-[#C1D82F]/10 hover:border-[#C1D82F]/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${phaseCfg.bg}`}>
                        <PhaseIcon className={`w-4 h-4 ${phaseCfg.color}`} />
                      </div>
                      <div>
                        <span className="font-medium text-sm text-white">
                          Sesión {session.sessionOrder} — {phaseCfg.label}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-white/30">
                          {session.sessionDate && <span>{formatDate(session.sessionDate)}</span>}
                          {session.durationMinutes && <span>• {session.durationMinutes} min</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExecuted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ejecutada {formatDate(session.executedAt)}
                        </span>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openExecDialog(session)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C1D82F] text-[#0d1117] text-xs font-semibold shadow-lg shadow-[#C1D82F]/20 hover:shadow-[#C1D82F]/30 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Registrar ejecución
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-1.5">
                    {session.exercises.map((se) => (
                      <div key={se.id} className="flex items-center gap-2 bg-[#0d1117]/40 rounded-xl px-3 py-2 text-xs">
                        <span className="text-white/20 font-mono w-5">{se.exerciseOrder}.</span>
                        <span className="flex-1 truncate font-medium text-white/70">{se.exercise.title}</span>
                        {se.exercise.durationMinutes && (
                          <span className="text-white/30 shrink-0">{se.exercise.durationMinutes}m</span>
                        )}
                        {se.exercise.methodologySource && (
                          <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] text-white/40">
                            {se.exercise.methodologySource}
                          </span>
                        )}
                        {se.effectivenessRating && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3 h-3 ${
                                  idx < se.effectivenessRating! ? "fill-yellow-400 text-yellow-400" : "text-white/10"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isExecuted && session.attendance && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs text-white/30">
                      <Users className="w-3 h-3" />
                      {(session.attendance as string[]).length} jugadores presentes
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Execution Dialog */}
      <Dialog open={!!execSession} onOpenChange={() => setExecSession(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Ejecución</DialogTitle>
          </DialogHeader>

          {execSession && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Fecha de ejecución</label>
                <input
                  type="date"
                  value={execDate}
                  onChange={(e) => setExecDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                />
              </div>

              {/* Attendance */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Asistencia ({execAttendance.size}/{players.length})
                </label>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-[#0d1117]/50 p-2 space-y-1">
                  {players.length === 0 ? (
                    <p className="text-xs text-white/30 py-2 text-center">No hay jugadores en el equipo</p>
                  ) : (
                    players.map((tp) => (
                      <label
                        key={tp.player.id}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={execAttendance.has(tp.player.id)}
                          onChange={(e) => {
                            setExecAttendance((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(tp.player.id);
                              else next.delete(tp.player.id);
                              return next;
                            });
                          }}
                          className="rounded accent-[#C1D82F]"
                        />
                        <span className="text-white/70">#{tp.jerseyNumber} {tp.player.fullName}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Exercise Ratings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/60">Calificación de ejercicios</label>
                {execSession.exercises.map((se) => (
                  <div key={se.id} className="rounded-xl border border-white/10 bg-[#0d1117]/30 p-3 space-y-2">
                    <p className="text-sm font-medium text-white">{se.exercise.title}</p>
                    <div className="space-y-1">
                      <label className="text-[11px] text-white/40">Efectividad</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() =>
                              setExecRatings((prev) => ({
                                ...prev,
                                [se.id]: { ...prev[se.id], rating: val },
                              }))
                            }
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                val <= (execRatings[se.id]?.rating ?? 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-white/10"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-white/40">Notas</label>
                      <input
                        className="w-full h-8 rounded-lg border border-white/10 bg-[#1a1f36]/80 px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#C1D82F]/40 transition-all"
                        placeholder="Observaciones..."
                        value={execRatings[se.id]?.notes ?? ""}
                        onChange={(e) =>
                          setExecRatings((prev) => ({
                            ...prev,
                            [se.id]: { ...prev[se.id], notes: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setExecSession(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-all"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExecute}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C1D82F] text-[#0d1117] font-semibold text-sm shadow-lg shadow-[#C1D82F]/20 hover:shadow-[#C1D82F]/30 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Guardando..." : "Guardar Ejecución"}
                </motion.button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              ¿Estás seguro de que quieres eliminar <span className="text-white font-medium">&quot;{plan.name}&quot;</span>? Esta acción eliminará todas las sesiones y datos asociados. No se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Eliminando..." : "Eliminar"}
              </motion.button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
