"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Star, ChevronRight, TrendingUp, TrendingDown,
} from "lucide-react";

/* ---------- types ---------- */

interface Evaluation {
  id: string;
  evaluationDate: string;
  context: string;
  technicalAvg: number | null;
  tacticalAvg: number | null;
  physicalAvg: number | null;
  mentalAvg: number | null;
  overallAvg: number | null;
  technicalComments: string | null;
  tacticalComments: string | null;
  physicalComments: string | null;
  mentalComments: string | null;
}

/* ---------- helpers ---------- */

const CONTEXT_LABELS: Record<string, string> = {
  match: "Partido",
  training: "Entrenamiento",
  formal: "Formal",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function scoreColor(val: number | null): string {
  if (val === null) return "bg-white/10";
  if (val >= 7) return "bg-[#2B8B41]";
  if (val >= 5) return "bg-yellow-500";
  return "bg-[#EB3525]";
}

function scoreTextColor(val: number | null): string {
  if (val === null) return "text-white/40";
  if (val >= 7) return "text-[#2B8B41]";
  if (val >= 5) return "text-yellow-500";
  return "text-[#EB3525]";
}

function DimensionBar({ label, value, maxVal = 10 }: { label: string; value: number | null; maxVal?: number }) {
  const pct = value !== null ? (value / maxVal) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className={`font-bold ${scoreTextColor(value)}`}>
          {value !== null ? Number(value).toFixed(1) : "—"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${scoreColor(value)}`}
        />
      </div>
    </div>
  );
}

/* ---------- component ---------- */

export default function PlayerEvaluationsPage() {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/evaluations");
        if (res.ok) {
          const data = await res.json();
          setEvaluations(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#C1D82F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Mis Evaluaciones</h1>
        <p className="text-white/40 text-sm mt-1">Historial de evaluaciones y progreso</p>
      </div>

      {/* Progress comparison */}
      {evaluations.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="size-4 text-[#C1D82F]" /> Progreso (última vs anterior)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Técnica", curr: evaluations[0].technicalAvg, prev: evaluations[1].technicalAvg },
              { label: "Táctica", curr: evaluations[0].tacticalAvg, prev: evaluations[1].tacticalAvg },
              { label: "Física", curr: evaluations[0].physicalAvg, prev: evaluations[1].physicalAvg },
              { label: "Mental", curr: evaluations[0].mentalAvg, prev: evaluations[1].mentalAvg },
            ].map((dim) => {
              const curr = dim.curr ? Number(dim.curr) : null;
              const prev = dim.prev ? Number(dim.prev) : null;
              const diff = curr !== null && prev !== null ? curr - prev : null;
              return (
                <div key={dim.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <p className="text-[10px] text-white/40 mb-1">{dim.label}</p>
                  <p className={`text-xl font-bold ${scoreTextColor(curr)}`}>
                    {curr !== null ? curr.toFixed(1) : "—"}
                  </p>
                  {diff !== null && diff !== 0 && (
                    <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${diff > 0 ? "text-[#2B8B41]" : "text-[#EB3525]"}`}>
                      {diff > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Evaluations list */}
      {evaluations.length === 0 ? (
        <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-12 text-center">
          <Star className="size-10 mx-auto text-white/10 mb-3" />
          <p className="text-white/40">No tienes evaluaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((ev, idx) => {
            const isExpanded = expandedId === ev.id;
            const prevEval = evaluations[idx + 1] ?? null;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="size-12 rounded-xl bg-white/[0.03] flex items-center justify-center">
                    <span className={`text-lg font-bold ${scoreTextColor(ev.overallAvg ? Number(ev.overallAvg) : null)}`}>
                      {ev.overallAvg ? Number(ev.overallAvg).toFixed(1) : "—"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      Evaluación {CONTEXT_LABELS[ev.context] || ev.context}
                    </p>
                    <p className="text-xs text-white/40">{formatDate(ev.evaluationDate)}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-3">
                    {[
                      { label: "Téc", val: ev.technicalAvg },
                      { label: "Tác", val: ev.tacticalAvg },
                      { label: "Fís", val: ev.physicalAvg },
                      { label: "Men", val: ev.mentalAvg },
                    ].map((d) => (
                      <div key={d.label} className="text-center">
                        <p className={`text-sm font-bold ${scoreTextColor(d.val ? Number(d.val) : null)}`}>
                          {d.val ? Number(d.val).toFixed(1) : "—"}
                        </p>
                        <p className="text-[9px] text-white/30">{d.label}</p>
                      </div>
                    ))}
                  </div>
                  <ChevronRight className={`size-4 text-white/20 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          {[
                            { label: "Técnica", val: ev.technicalAvg, comment: ev.technicalComments, prev: prevEval?.technicalAvg },
                            { label: "Táctica", val: ev.tacticalAvg, comment: ev.tacticalComments, prev: prevEval?.tacticalAvg },
                            { label: "Física", val: ev.physicalAvg, comment: ev.physicalComments, prev: prevEval?.physicalAvg },
                            { label: "Mental", val: ev.mentalAvg, comment: ev.mentalComments, prev: prevEval?.mentalAvg },
                          ].map((dim) => {
                            const current = dim.val ? Number(dim.val) : null;
                            const prev = dim.prev ? Number(dim.prev) : null;
                            const diff = current !== null && prev !== null ? current - prev : null;
                            return (
                              <div key={dim.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-white/60">{dim.label}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${scoreTextColor(current)}`}>
                                      {current !== null ? current.toFixed(1) : "—"}
                                    </span>
                                    {diff !== null && diff !== 0 && (
                                      <span className={`text-[10px] ${diff > 0 ? "text-[#2B8B41]" : "text-[#EB3525]"}`}>
                                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <DimensionBar label="" value={current} />
                                {dim.comment && (
                                  <p className="text-xs text-white/40 italic mt-1">{dim.comment}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
