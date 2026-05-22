"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  Plus,
  Clock,
  Target,
  Copy,
  Share2,
  CheckCircle2,
  PlayCircle,
  FileEdit,
  Dumbbell,
  Trash2,
} from "lucide-react";

type TrainingPlan = {
  id: string;
  name: string;
  targetAgeMin: number | null;
  targetAgeMax: number | null;
  level: string | null;
  objectives: string | null;
  startDate: string | null;
  endDate: string | null;
  isShared: boolean;
  totalDuration: number;
  status: "draft" | "active" | "completed";
  sessions: { id: string; executedAt: string | null }[];
  coach: { id: string; fullName: string } | null;
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

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function TrainingPlansPage() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);

  const fetchTeamId = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.user?.teamId) {
        setTeamId(session.user.teamId);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/training-plans?teamId=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeamId();
  }, [fetchTeamId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDuplicate = async (planId: string) => {
    try {
      const res = await fetch(`/api/training-plans/${planId}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch {
      // ignore
    }
  };

  const handleToggleShare = async (plan: TrainingPlan) => {
    try {
      const res = await fetch(`/api/training-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: !plan.isShared }),
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("¿Estás seguro de eliminar este plan? Se eliminarán todas las sesiones asociadas.")) return;
    try {
      const res = await fetch(`/api/training-plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        fetchPlans();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C1D82F]/10 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6 text-[#C1D82F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Planes de Entrenamiento</h1>
            <p className="text-sm text-white/40">
              {plans.length} plan{plans.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
        <Link href="/coach/training/new">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C1D82F] text-[#0d1117] font-semibold text-sm shadow-lg shadow-[#C1D82F]/20 hover:shadow-[#C1D82F]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Plan
          </motion.button>
        </Link>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#1a1f36]/60 border border-white/5 p-5 animate-pulse">
              <div className="h-5 bg-white/5 rounded w-3/4 mb-3" />
              <div className="h-3 bg-white/5 rounded w-full mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-3xl bg-[#C1D82F]/5 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-10 h-10 text-[#C1D82F]/30" />
          </div>
          <p className="text-white/40 mb-6 text-lg">No hay planes de entrenamiento</p>
          <Link href="/coach/training/new">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#C1D82F]/30 text-[#C1D82F] font-medium text-sm hover:bg-[#C1D82F]/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              Crear primer plan
            </motion.button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {plans.map((plan, i) => {
              const st = statusConfig(plan.status);
              const StIcon = st.icon;
              const executedCount = plan.sessions.filter((s) => s.executedAt).length;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="group rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-5 flex flex-col gap-3 hover:border-[#C1D82F]/30 hover:bg-[#1a1f36]/80 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/coach/training/${plan.id}`} className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-tight line-clamp-2 text-white group-hover:text-[#C1D82F] transition-colors">
                        {plan.name}
                      </h3>
                    </Link>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border ${st.color}`}>
                      <StIcon className="w-3 h-3" />
                      {st.label}
                    </span>
                  </div>

                  {plan.objectives && (
                    <p className="text-xs text-white/40 line-clamp-2">{plan.objectives}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {plan.level && (
                      <span className="inline-flex items-center rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
                        {levelLabel(plan.level)}
                      </span>
                    )}
                    {plan.targetAgeMin != null && plan.targetAgeMax != null && (
                      <span className="inline-flex items-center rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
                        {plan.targetAgeMin}-{plan.targetAgeMax} años
                      </span>
                    )}
                    {plan.isShared && (
                      <span className="inline-flex items-center rounded-lg bg-purple-500/10 text-purple-400 px-2 py-0.5 text-[10px] font-medium gap-1">
                        <Share2 className="w-2.5 h-2.5" />
                        Compartido
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/30 mt-auto pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(plan.totalDuration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {executedCount}/{plan.sessions.length} sesiones
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link href={`/coach/training/${plan.id}`} className="flex-1">
                      <button className="w-full px-3 py-2 rounded-xl border border-white/10 text-xs font-medium text-white/70 hover:border-[#C1D82F]/30 hover:text-[#C1D82F] transition-all">
                        Ver detalle
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDuplicate(plan.id)}
                      title="Duplicar plan"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-[#C1D82F] hover:bg-[#C1D82F]/10 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleShare(plan)}
                      title={plan.isShared ? "Dejar de compartir" : "Compartir"}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        plan.isShared
                          ? "text-purple-400 bg-purple-500/10 hover:bg-purple-500/20"
                          : "text-white/30 hover:text-[#C1D82F] hover:bg-[#C1D82F]/10"
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      title="Eliminar plan"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
