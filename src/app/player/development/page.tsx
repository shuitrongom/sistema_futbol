"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2, TrendingUp, Dumbbell, Calendar, CheckCircle2,
  MessageSquare, Send,
} from "lucide-react";

/* ---------- types ---------- */

interface FocusArea {
  key: string;
  label: string;
  currentValue: number;
  targetValue: number;
}

interface EvalScheduleItem {
  date: string;
  completed: boolean;
}

interface RecommendedExercise {
  exerciseId: string;
  title: string;
  category: string;
  focusAreaKey: string;
}

interface Comment {
  role: string;
  author: string;
  message: string;
  date: string;
}

interface DevelopmentPlan {
  id: string;
  status: string;
  focusAreas: FocusArea[] | null;
  recommendedExercises: RecommendedExercise[] | null;
  evaluationSchedule: EvalScheduleItem[] | null;
  parentComments: string | null;
  playerComments: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ---------- helpers ---------- */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-to-r from-[#C1D82F] to-[#2B8B41]"
      />
    </div>
  );
}

/* ---------- component ---------- */

export default function PlayerDevelopmentPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<DevelopmentPlan[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const res = await fetch("/api/development-plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);

        // Load comments for active plan
        const active = data.find((p: DevelopmentPlan) => p.status === "active");
        if (active) {
          loadComments(active.id);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function loadComments(planId: string) {
    try {
      const res = await fetch(`/api/development-plans/${planId}`);
      if (res.ok) {
        const data = await res.json();
        // Comments might be stored in parentComments/playerComments as JSON
        const plan = data.plan || data;
        const parsed: Comment[] = [];
        if (plan.parentComments) {
          try {
            const pc = JSON.parse(plan.parentComments);
            if (Array.isArray(pc)) parsed.push(...pc);
            else parsed.push({ role: "parent", author: "Padre/Madre", message: plan.parentComments, date: plan.updatedAt });
          } catch {
            parsed.push({ role: "parent", author: "Padre/Madre", message: plan.parentComments, date: plan.updatedAt });
          }
        }
        if (plan.playerComments) {
          try {
            const pc = JSON.parse(plan.playerComments);
            if (Array.isArray(pc)) parsed.push(...pc);
            else parsed.push({ role: "player", author: "Jugador", message: plan.playerComments, date: plan.updatedAt });
          } catch {
            parsed.push({ role: "player", author: "Jugador", message: plan.playerComments, date: plan.updatedAt });
          }
        }
        setComments(parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
    } catch {
      // silent
    }
  }

  async function handleAddComment() {
    const activePlan = plans.find((p) => p.status === "active");
    if (!activePlan || !commentText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/development-plans/${activePlan.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText("");
        await loadPlans();
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#C1D82F]" />
      </div>
    );
  }

  const activePlan = plans.find((p) => p.status === "active");
  const completedPlans = plans.filter((p) => p.status === "completed");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Plan de Desarrollo</h1>
        <p className="text-white/40 text-sm mt-1">Tu plan personalizado de mejora</p>
      </div>

      {!activePlan && completedPlans.length === 0 ? (
        <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-12 text-center">
          <TrendingUp className="size-10 mx-auto text-white/10 mb-3" />
          <p className="text-white/40">No tienes un plan de desarrollo asignado</p>
          <p className="text-white/30 text-xs mt-1">Tu entrenador creará uno para ti</p>
        </div>
      ) : (
        <>
          {/* Active Plan */}
          {activePlan && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Status */}
              <div className="rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="size-4 text-[#C1D82F]" /> Plan Activo
                  </h3>
                  <span className="px-2 py-0.5 rounded text-xs text-[#2B8B41] bg-[#2B8B41]/10 border border-[#2B8B41]/20">
                    Activo
                  </span>
                </div>

                {/* Focus Areas */}
                {activePlan.focusAreas && (activePlan.focusAreas as FocusArea[]).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">Áreas de Enfoque</h4>
                    {(activePlan.focusAreas as FocusArea[]).map((area) => {
                      const pct = area.targetValue > 0 ? Math.round((area.currentValue / area.targetValue) * 100) : 0;
                      return (
                        <div key={area.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white">{area.label}</span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-white/40">
                                {area.currentValue} <span className="text-white/20">→</span> {area.targetValue}
                              </span>
                              <span className="text-[#C1D82F] font-semibold">{pct}%</span>
                            </div>
                          </div>
                          <ProgressBar current={area.currentValue} target={area.targetValue} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recommended Exercises */}
              {activePlan.recommendedExercises && (activePlan.recommendedExercises as RecommendedExercise[]).length > 0 && (
                <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-3">
                  <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <Dumbbell className="size-3.5" /> Ejercicios Recomendados
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {(activePlan.recommendedExercises as RecommendedExercise[]).map((ex, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="size-8 rounded-lg bg-[#C1D82F]/10 flex items-center justify-center shrink-0">
                          <Dumbbell className="size-4 text-[#C1D82F]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{ex.title}</p>
                          <p className="text-[10px] text-white/30">{ex.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Schedule */}
              {activePlan.evaluationSchedule && (activePlan.evaluationSchedule as EvalScheduleItem[]).length > 0 && (
                <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-3">
                  <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="size-3.5" /> Calendario de Evaluaciones
                  </h4>
                  <div className="space-y-2">
                    {(activePlan.evaluationSchedule as EvalScheduleItem[]).map((s, i) => {
                      const isPast = new Date(s.date) < new Date();
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                          s.completed
                            ? "bg-[#2B8B41]/5 border-[#2B8B41]/10"
                            : isPast
                            ? "bg-[#EB3525]/5 border-[#EB3525]/10"
                            : "bg-white/[0.02] border-white/5"
                        }`}>
                          {s.completed ? (
                            <CheckCircle2 className="size-4 text-[#2B8B41]" />
                          ) : (
                            <Calendar className={`size-4 ${isPast ? "text-[#EB3525]" : "text-white/30"}`} />
                          )}
                          <span className={`text-sm ${s.completed ? "text-[#2B8B41]" : isPast ? "text-[#EB3525]" : "text-white/60"}`}>
                            {formatDate(s.date)}
                          </span>
                          {s.completed && <span className="text-[10px] text-[#2B8B41]/60 ml-auto">Completada</span>}
                          {!s.completed && isPast && <span className="text-[10px] text-[#EB3525]/60 ml-auto">Pendiente</span>}
                          {!s.completed && !isPast && <span className="text-[10px] text-white/20 ml-auto">Próxima</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4">
                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="size-3.5" /> Comentarios
                </h4>

                {comments.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {comments.map((c, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${
                        c.role === "coach"
                          ? "bg-[#2B8B41]/5 border-[#2B8B41]/10"
                          : c.role === "player"
                          ? "bg-[#C1D82F]/5 border-[#C1D82F]/10"
                          : "bg-white/[0.02] border-white/5"
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-medium ${
                            c.role === "coach" ? "text-[#2B8B41]" : c.role === "player" ? "text-[#C1D82F]" : "text-white/40"
                          }`}>
                            {c.author}
                          </span>
                          <span className="text-[10px] text-white/20">{formatDate(c.date)}</span>
                        </div>
                        <p className="text-xs text-white/60">{c.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un comentario..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    className="flex-1 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C1D82F]/30"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !commentText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C1D82F] text-[#0d1117] font-semibold text-sm hover:bg-[#d4e84a] transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Completed Plans */}
          {completedPlans.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/40">Planes Anteriores</h3>
              {completedPlans.map((plan) => (
                <div key={plan.id} className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Plan de Desarrollo</p>
                      <p className="text-[10px] text-white/30">Creado: {formatDate(plan.createdAt)}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs text-[#C1D82F] bg-[#C1D82F]/10 border border-[#C1D82F]/20">
                      Completado
                    </span>
                  </div>
                  {plan.focusAreas && (plan.focusAreas as FocusArea[]).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {(plan.focusAreas as FocusArea[]).map((area) => (
                        <div key={area.key} className="flex items-center justify-between text-xs">
                          <span className="text-white/40">{area.label}</span>
                          <span className="text-white/60">{area.currentValue}/{area.targetValue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
