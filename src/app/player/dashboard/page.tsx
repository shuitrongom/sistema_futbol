"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, Star, ListTodo, TrendingUp, Calendar,
  MessageSquare, ChevronRight, CheckCircle2, AlertCircle,
  Shirt, Trophy, UserCircle,
} from "lucide-react";

/* ---------- types ---------- */

interface PlayerInfo {
  id: string;
  fullName: string;
  birthDate: string;
  position: string;
  photoUrl: string | null;
  teamId: string | null;
  teamName: string;
  teamBadge: string | null;
  jerseyNumber: number | null;
}

interface Evaluation {
  id: string;
  evaluationDate: string;
  context: string;
  technicalAvg: number | null;
  tacticalAvg: number | null;
  physicalAvg: number | null;
  mentalAvg: number | null;
  overallAvg: number | null;
}

interface TaskAssignment {
  id: string;
  status: string;
  playerId?: string;
  player?: { id: string };
}

interface Task {
  id: string;
  title: string;
  deadline: string | null;
  status: string;
  assignments: TaskAssignment[];
}

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

interface DevelopmentPlan {
  id: string;
  status: string;
  focusAreas: FocusArea[] | null;
  evaluationSchedule: EvalScheduleItem[] | null;
}

interface Feedback {
  id: string;
  feedbackType: string;
  message: string;
  createdAt: string;
  coach?: { fullName: string };
}

/* ---------- helpers ---------- */

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
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

const FEEDBACK_LABELS: Record<string, { label: string; color: string }> = {
  positive: { label: "Positivo", color: "text-[#2B8B41] bg-[#2B8B41]/10 border-[#2B8B41]/20" },
  improvement: { label: "Mejora", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
  technical: { label: "Técnico", color: "text-[#C1D82F] bg-[#C1D82F]/10 border-[#C1D82F]/20" },
};

/* ---------- component ---------- */

export default function PlayerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [latestEval, setLatestEval] = useState<Evaluation | null>(null);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [nextEvalDate, setNextEvalDate] = useState<string | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // Fetch player info
        const playerRes = await fetch("/api/my-player");
        if (!playerRes.ok) { setLoading(false); return; }
        const player: PlayerInfo = await playerRes.json();
        setPlayerInfo(player);

        // Fetch data in parallel
        const [evalsRes, tasksRes, plansRes, feedbackRes] = await Promise.all([
          fetch(`/api/evaluations?playerId=${player.id}`),
          fetch("/api/tasks"),
          fetch(`/api/development-plans?playerId=${player.id}&status=active`),
          fetch(`/api/feedback?playerId=${player.id}`),
        ]);

        // Latest evaluation
        const evals: Evaluation[] = evalsRes.ok ? await evalsRes.json() : [];
        if (evals.length > 0) setLatestEval(evals[0]);

        // Pending tasks
        const tasks: Task[] = tasksRes.ok ? await tasksRes.json() : [];
        const pending = tasks.filter((t) =>
          t.assignments?.some((a) => a.status === "pending" || a.status === "in_progress")
        );
        setPendingTasksCount(pending.length);

        // Next evaluation date from active plan
        const plans: DevelopmentPlan[] = plansRes.ok ? await plansRes.json() : [];
        const activePlan = plans.find((p) => p.status === "active");
        if (activePlan?.evaluationSchedule) {
          const next = (activePlan.evaluationSchedule as EvalScheduleItem[])
            .filter((s) => !s.completed)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
          if (next) setNextEvalDate(next.date);
        }

        // Recent feedback
        const feedback: Feedback[] = feedbackRes.ok ? await feedbackRes.json() : [];
        setRecentFeedback(feedback.slice(0, 5));
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

  if (!playerInfo) {
    return (
      <div className="text-center py-12">
        <UserCircle className="size-12 mx-auto text-white/10 mb-3" />
        <p className="text-white/40">No se encontró tu perfil de jugador.</p>
        <p className="text-white/30 text-sm mt-1">Contacta al administrador para vincular tu cuenta.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-[#1a1f36] to-[#1a1f36]/80 border border-[#C1D82F]/10 p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C1D82F] rounded-full opacity-[0.03] blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-5">
          {playerInfo.photoUrl ? (
            <img src={playerInfo.photoUrl} alt={playerInfo.fullName}
              className="size-20 rounded-2xl object-cover ring-2 ring-[#C1D82F]/20" />
          ) : (
            <div className="size-20 rounded-2xl bg-gradient-to-br from-[#C1D82F] to-[#2B8B41] flex items-center justify-center">
              <Shirt className="size-10 text-[#0d1117]" />
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <p className="text-white/40 text-sm">Bienvenido,</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{playerInfo.fullName}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
              <span className="px-3 py-1 rounded-lg bg-[#C1D82F]/10 text-[#C1D82F] text-xs font-semibold border border-[#C1D82F]/20">
                {POSITION_LABELS[playerInfo.position] || playerInfo.position}
              </span>
              {playerInfo.jerseyNumber && (
                <span className="px-3 py-1 rounded-lg bg-white/5 text-white/80 text-xs font-semibold border border-white/10">
                  #{playerInfo.jerseyNumber}
                </span>
              )}
              {playerInfo.teamName && (
                <span className="px-3 py-1 rounded-lg bg-white/5 text-white/60 text-xs border border-white/10 flex items-center gap-1">
                  <Trophy className="size-3" /> {playerInfo.teamName}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-4 text-center">
          <Star className="size-5 mx-auto text-[#C1D82F] mb-2" />
          <p className={`text-2xl font-bold ${scoreTextColor(latestEval?.overallAvg ? Number(latestEval.overallAvg) : null)}`}>
            {latestEval?.overallAvg ? Number(latestEval.overallAvg).toFixed(1) : "—"}
          </p>
          <p className="text-[10px] text-white/30 mt-1">Última Evaluación</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link href="/player/tasks" className="block rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-4 text-center hover:bg-white/[0.04] transition-colors">
            <ListTodo className="size-5 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-white">{pendingTasksCount}</p>
            <p className="text-[10px] text-white/30 mt-1">Tareas Pendientes</p>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-4 text-center">
          <Calendar className="size-5 mx-auto text-[#2B8B41] mb-2" />
          <p className="text-sm font-bold text-white">{nextEvalDate ? formatDate(nextEvalDate) : "—"}</p>
          <p className="text-[10px] text-white/30 mt-1">Próxima Evaluación</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Link href="/player/development" className="block rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-4 text-center hover:bg-white/[0.04] transition-colors">
            <TrendingUp className="size-5 mx-auto text-[#C1D82F] mb-2" />
            <p className="text-sm font-bold text-[#C1D82F]">Ver Plan</p>
            <p className="text-[10px] text-white/30 mt-1">Plan de Desarrollo</p>
          </Link>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Latest Evaluation Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Star className="size-4 text-[#C1D82F]" /> Última Evaluación
            </h3>
            <Link href="/player/evaluations" className="text-xs text-[#C1D82F] hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="size-3" />
            </Link>
          </div>
          {latestEval ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>{latestEval.context === "match" ? "Partido" : latestEval.context === "training" ? "Entrenamiento" : "Formal"}</span>
                <span>{formatDate(latestEval.evaluationDate)}</span>
              </div>
              <div className="space-y-2">
                <DimensionBar label="Técnica" value={latestEval.technicalAvg ? Number(latestEval.technicalAvg) : null} />
                <DimensionBar label="Táctica" value={latestEval.tacticalAvg ? Number(latestEval.tacticalAvg) : null} />
                <DimensionBar label="Física" value={latestEval.physicalAvg ? Number(latestEval.physicalAvg) : null} />
                <DimensionBar label="Mental" value={latestEval.mentalAvg ? Number(latestEval.mentalAvg) : null} />
              </div>
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-6">Sin evaluaciones aún</p>
          )}
        </motion.div>

        {/* Recent Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare className="size-4 text-[#2B8B41]" /> Feedback del Entrenador
          </h3>
          {recentFeedback.length > 0 ? (
            <div className="space-y-2">
              {recentFeedback.map((fb) => {
                const fbStyle = FEEDBACK_LABELS[fb.feedbackType] || FEEDBACK_LABELS.technical;
                return (
                  <div key={fb.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${fbStyle.color}`}>
                        {fbStyle.label}
                      </span>
                      <span className="text-[10px] text-white/30">{formatDate(fb.createdAt)}</span>
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2">{fb.message}</p>
                    {fb.coach && (
                      <p className="text-[10px] text-white/20">— {fb.coach.fullName}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-6">Sin feedback reciente</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
