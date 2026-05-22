"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle, Trophy, Loader2, ArrowLeft, Clock, Star,
  TrendingUp, FileText, ListTodo, ChevronRight,
  CheckCircle2, AlertCircle, XCircle, Calendar, Dumbbell,
  MessageSquare, BarChart3, Shirt,
} from "lucide-react";

/* ---------- types ---------- */

interface PlayerProfile {
  id: string;
  fullName: string;
  birthDate: string;
  position: string;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  teamPlayers: {
    jerseyNumber: number;
    team: { id: string; name: string; badgeUrl: string | null };
  }[];
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
  technicalComments: string | null;
  tacticalComments: string | null;
  physicalComments: string | null;
  mentalComments: string | null;
  player?: PlayerProfile;
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

interface RecommendedExercise {
  exerciseId: string;
  title: string;
  category: string;
  focusAreaKey: string;
}

interface DevelopmentPlan {
  id: string;
  status: string;
  focusAreas: FocusArea[] | null;
  evaluationSchedule: EvalScheduleItem[] | null;
  recommendedExercises: RecommendedExercise[] | null;
  parentComments: string | null;
  playerComments: string | null;
  createdAt: string;
  updatedAt: string;
  player?: { fullName: string };
}

interface Report {
  id: string;
  periodStart: string;
  periodEnd: string;
  reportType: string | null;
  content: Record<string, unknown>;
  createdAt: string;
  coach?: { fullName: string };
}

interface TaskAssignment {
  id: string;
  status: string;
  playerComments: string | null;
  completedAt: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  taskType: string | null;
  deadline: string | null;
  status: string;
  assignments: TaskAssignment[];
}

interface MatchEvent {
  eventType: string;
  playerId: string;
  minute: number | null;
}

interface MatchRecord {
  id: string;
  dateTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  matchEvents: MatchEvent[];
}

/* ---------- helpers ---------- */

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

const CONTEXT_LABELS: Record<string, string> = {
  match: "Partido",
  training: "Entrenamiento",
  formal: "Formal",
};

const TASK_TYPE_LABELS: Record<string, string> = {
  technical: "Técnica",
  tactical: "Táctica",
  physical: "Física",
  mental: "Mental",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function calculateAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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

function taskStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return { label: "Completada", icon: CheckCircle2, cls: "text-[#2B8B41] bg-[#2B8B41]/10 border-[#2B8B41]/20" };
    case "overdue":
      return { label: "Vencida", icon: XCircle, cls: "text-[#EB3525] bg-[#EB3525]/10 border-[#EB3525]/20" };
    case "in_progress":
      return { label: "En progreso", icon: Clock, cls: "text-[#C1D82F] bg-[#C1D82F]/10 border-[#C1D82F]/20" };
    default:
      return { label: "Pendiente", icon: AlertCircle, cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" };
  }
}

/* ---------- sub-components ---------- */

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

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full bg-[#C1D82F]"
      />
    </div>
  );
}

/* ---------- tabs ---------- */

type TabKey = "overview" | "evaluations" | "development" | "reports" | "tasks";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Resumen", icon: BarChart3 },
  { key: "evaluations", label: "Evaluaciones", icon: Star },
  { key: "development", label: "Desarrollo", icon: TrendingUp },
  { key: "reports", label: "Reportes", icon: FileText },
  { key: "tasks", label: "Tareas", icon: ListTodo },
];

/* ---------- main component ---------- */

export default function ChildProfilePage() {
  const params = useParams();
  const playerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [devPlans, setDevPlans] = useState<DevelopmentPlan[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [stats, setStats] = useState({ goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 });
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [evalsRes, plansRes, reportsRes, matchesRes] = await Promise.all([
          fetch(`/api/evaluations?playerId=${playerId}`),
          fetch(`/api/development-plans?playerId=${playerId}`),
          fetch(`/api/reports?playerId=${playerId}`),
          fetch("/api/matches"),
        ]);

        const evals: Evaluation[] = evalsRes.ok ? await evalsRes.json() : [];
        const plans: DevelopmentPlan[] = plansRes.ok ? await plansRes.json() : [];
        const reps: Report[] = reportsRes.ok ? await reportsRes.json() : [];
        const allMatches: MatchRecord[] = matchesRes.ok ? await matchesRes.json() : [];

        setEvaluations(evals);
        setDevPlans(plans);
        setReports(reps);

        // Get player info from evaluations
        if (evals.length > 0 && evals[0].player) {
          setPlayer(evals[0].player);
        }

        // Process matches
        const teamId = evals[0]?.player?.teamPlayers?.[0]?.team?.id;
        if (teamId) {
          // Fetch tasks for the team
          const tasksRes = await fetch(`/api/tasks?teamId=${teamId}`);
          const allTasks: Task[] = tasksRes.ok ? await tasksRes.json() : [];
          // Filter tasks that have assignments for this player
          const playerTasks = allTasks
            .map((t) => ({
              ...t,
              assignments: t.assignments?.filter((a: TaskAssignment & { playerId?: string; player?: { id: string } }) =>
                a.playerId === playerId || (a as unknown as { player?: { id: string } }).player?.id === playerId
              ) ?? [],
            }))
            .filter((t) => t.assignments.length > 0);
          setTasks(playerTasks);

          const playerMatches = allMatches.filter(
            (m) => m.status === "completed" && (m.homeTeam?.id === teamId || m.awayTeam?.id === teamId)
          );
          setMatches(playerMatches.slice(0, 10));

          let goals = 0, assists = 0, yellowCards = 0, redCards = 0;
          for (const match of playerMatches) {
            if (match.matchEvents) {
              for (const event of match.matchEvents) {
                if (event.playerId === playerId) {
                  if (event.eventType === "goal") goals++;
                  if (event.eventType === "assist") assists++;
                  if (event.eventType === "yellow_card") yellowCards++;
                  if (event.eventType === "red_card") redCards++;
                }
              }
            }
          }
          setStats({ goals, assists, yellowCards, redCards, matchesPlayed: playerMatches.length });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#C1D82F]" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40">No se encontró información del jugador.</p>
        <Link href="/parent/dashboard" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#1a1f36]/60 border border-white/10 text-white/60 hover:text-[#C1D82F] transition-colors">
          <ArrowLeft className="size-4" /> Volver al Dashboard
        </Link>
      </div>
    );
  }

  const team = player.teamPlayers?.[0]?.team;
  const jerseyNumber = player.teamPlayers?.[0]?.jerseyNumber;
  const activePlan = devPlans.find((p) => p.status === "active");
  const recentEvals = evaluations.slice(0, 3);
  const latestEval = evaluations[0] ?? null;

  // Next evaluation date from active plan
  const nextEvalDate = activePlan?.evaluationSchedule
    ?.filter((s) => !s.completed)
    ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())?.[0]?.date ?? null;

  const pendingTasks = tasks.filter((t) => t.assignments.some((a) => a.status === "pending" || a.status === "in_progress"));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-[#C1D82F] transition-colors text-sm">
        <ArrowLeft className="size-4" /> Volver al Dashboard
      </Link>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-6"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.fullName}
              className="size-24 rounded-2xl object-cover ring-2 ring-[#C1D82F]/20" />
          ) : (
            <div className="size-24 rounded-2xl bg-gradient-to-br from-[#2B8B41] to-[#C1D82F] flex items-center justify-center">
              <UserCircle className="size-12 text-white" />
            </div>
          )}
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-2xl font-bold text-white">{player.fullName}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#C1D82F]/10 text-[#C1D82F] text-xs font-semibold border border-[#C1D82F]/20">
                {POSITION_LABELS[player.position] || player.position}
              </span>
              {jerseyNumber && (
                <span className="px-3 py-1 rounded-lg bg-white/5 text-white/80 text-xs font-semibold border border-white/10">
                  <Shirt className="size-3 inline mr-1" />#{jerseyNumber}
                </span>
              )}
              {team && (
                <span className="px-3 py-1 rounded-lg bg-white/5 text-white/60 text-xs border border-white/10">
                  <Trophy className="size-3 inline mr-1" /> {team.name}
                </span>
              )}
            </div>
            <p className="text-sm text-white/40">
              {player.birthDate && !isNaN(new Date(player.birthDate).getTime())
                ? `${calculateAge(player.birthDate)} años · Nacido el ${formatDate(player.birthDate)}`
                : ""}
            </p>
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { val: stats.matchesPlayed, label: "Partidos", color: "text-white" },
              { val: stats.goals, label: "Goles", color: "text-[#C1D82F]" },
              { val: stats.assists, label: "Asist.", color: "text-[#2B8B41]" },
              { val: latestEval?.overallAvg ? Number(latestEval.overallAvg).toFixed(1) : "—", label: "Promedio", color: scoreTextColor(latestEval?.overallAvg ?? null) },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#C1D82F]/10 text-[#C1D82F] border border-[#C1D82F]/20"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              evaluations={recentEvals}
              latestEval={latestEval}
              activePlan={activePlan}
              nextEvalDate={nextEvalDate}
              pendingTasks={pendingTasks}
              reports={reports.slice(0, 3)}
              matches={matches}
              stats={stats}
              team={team}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === "evaluations" && (
            <EvaluationsTab evaluations={evaluations} />
          )}
          {activeTab === "development" && (
            <DevelopmentTab plans={devPlans} />
          )}
          {activeTab === "reports" && (
            <ReportsTab reports={reports} selectedReport={selectedReport} onSelect={setSelectedReport} />
          )}
          {activeTab === "tasks" && (
            <TasksTab tasks={tasks} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


/* ============================================================
   OVERVIEW TAB
   ============================================================ */

function OverviewTab({
  evaluations, latestEval, activePlan, nextEvalDate, pendingTasks, reports, matches, stats, team, onTabChange,
}: {
  evaluations: Evaluation[];
  latestEval: Evaluation | null;
  activePlan: DevelopmentPlan | undefined;
  nextEvalDate: string | null;
  pendingTasks: Task[];
  reports: Report[];
  matches: MatchRecord[];
  stats: { goals: number; assists: number; yellowCards: number; redCards: number; matchesPlayed: number };
  team: { id: string; name: string; badgeUrl: string | null } | undefined;
  onTabChange: (tab: TabKey) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Latest Evaluation */}
      <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Star className="size-4 text-[#C1D82F]" /> Última Evaluación
          </h3>
          {evaluations.length > 0 && (
            <button onClick={() => onTabChange("evaluations")} className="text-xs text-[#C1D82F] hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="size-3" />
            </button>
          )}
        </div>
        {latestEval ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>{CONTEXT_LABELS[latestEval.context] || latestEval.context}</span>
              <span>{formatDate(latestEval.evaluationDate)}</span>
            </div>
            <div className="text-center py-2">
              <span className={`text-3xl font-bold ${scoreTextColor(latestEval.overallAvg)}`}>
                {latestEval.overallAvg ? Number(latestEval.overallAvg).toFixed(1) : "—"}
              </span>
              <p className="text-[10px] text-white/30 mt-1">Promedio General</p>
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
      </div>

      {/* Development Plan */}
      <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="size-4 text-[#2B8B41]" /> Plan de Desarrollo
          </h3>
          {activePlan && (
            <button onClick={() => onTabChange("development")} className="text-xs text-[#C1D82F] hover:underline flex items-center gap-1">
              Ver detalle <ChevronRight className="size-3" />
            </button>
          )}
        </div>
        {activePlan ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="px-2 py-0.5 rounded bg-[#2B8B41]/10 text-[#2B8B41] border border-[#2B8B41]/20">Activo</span>
            </div>
            {activePlan.focusAreas && activePlan.focusAreas.length > 0 && (
              <div className="space-y-2">
                {activePlan.focusAreas.slice(0, 4).map((area) => (
                  <div key={area.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{area.label}</span>
                      <span className="text-white/40">{area.currentValue}/{area.targetValue}</span>
                    </div>
                    <ProgressBar current={area.currentValue} target={area.targetValue} />
                  </div>
                ))}
              </div>
            )}
            {nextEvalDate && (
              <div className="flex items-center gap-2 text-xs text-white/40 pt-2 border-t border-white/5">
                <Calendar className="size-3" />
                <span>Próxima evaluación: {formatDate(nextEvalDate)}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/30 text-sm text-center py-6">Sin plan de desarrollo activo</p>
        )}
      </div>

      {/* Pending Tasks */}
      <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ListTodo className="size-4 text-yellow-500" /> Tareas Pendientes
          </h3>
          <button onClick={() => onTabChange("tasks")} className="text-xs text-[#C1D82F] hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="size-3" />
          </button>
        </div>
        {pendingTasks.length > 0 ? (
          <div className="space-y-2">
            {pendingTasks.slice(0, 4).map((task) => {
              const assignment = task.assignments[0];
              const badge = taskStatusBadge(assignment?.status ?? task.status);
              const BadgeIcon = badge.icon;
              return (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <BadgeIcon className={`size-4 shrink-0 ${badge.cls.split(" ")[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{task.title}</p>
                    {task.deadline && (
                      <p className="text-[10px] text-white/30">Fecha límite: {formatDate(task.deadline)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-white/30 text-sm text-center py-6">Sin tareas pendientes</p>
        )}
      </div>

      {/* Recent Reports */}
      <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="size-4 text-[#EB3525]" /> Reportes Recientes
          </h3>
          {reports.length > 0 && (
            <button onClick={() => onTabChange("reports")} className="text-xs text-[#C1D82F] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="size-3" />
            </button>
          )}
        </div>
        {reports.length > 0 ? (
          <div className="space-y-2">
            {reports.map((rep) => (
              <div key={rep.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <FileText className="size-4 text-white/20 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {rep.reportType === "monthly" ? "Reporte Mensual" : rep.reportType === "quarterly" ? "Reporte Trimestral" : rep.reportType === "semester" ? "Reporte Semestral" : "Reporte de Progreso"}
                  </p>
                  <p className="text-[10px] text-white/30">
                    {formatDate(rep.periodStart)} — {formatDate(rep.periodEnd)}
                  </p>
                </div>
                <ChevronRight className="size-4 text-white/20" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm text-center py-6">Sin reportes aún</p>
        )}
      </div>

      {/* Recent Matches */}
      {matches.length > 0 && (
        <div className="md:col-span-2 rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="size-4 text-white/40" /> Partidos Recientes
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {matches.slice(0, 6).map((match) => {
              const isHome = team && match.homeTeam.id === team.id;
              return (
                <div key={match.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      {match.homeTeam.name} <span className="text-white/40">vs</span> {match.awayTeam.name}
                    </p>
                    <p className="text-[10px] text-white/30">{formatDate(match.dateTime)}</p>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    {match.homeScore ?? "-"} - {match.awayScore ?? "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


/* ============================================================
   EVALUATIONS TAB
   ============================================================ */

function EvaluationsTab({ evaluations }: { evaluations: Evaluation[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (evaluations.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-12 text-center">
        <Star className="size-10 mx-auto text-white/10 mb-3" />
        <p className="text-white/40">No hay evaluaciones registradas</p>
      </div>
    );
  }

  return (
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
              <div className={`size-12 rounded-xl flex items-center justify-center ${scoreColor(ev.overallAvg ? Number(ev.overallAvg) : null)}/20`}>
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
  );
}

/* ============================================================
   DEVELOPMENT TAB
   ============================================================ */

function DevelopmentTab({ plans }: { plans: DevelopmentPlan[] }) {
  if (plans.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-12 text-center">
        <TrendingUp className="size-10 mx-auto text-white/10 mb-3" />
        <p className="text-white/40">No hay planes de desarrollo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const focusAreas = (plan.focusAreas ?? []) as FocusArea[];
        const exercises = (plan.recommendedExercises ?? []) as RecommendedExercise[];
        const schedule = (plan.evaluationSchedule ?? []) as EvalScheduleItem[];
        const nextEval = schedule.filter((s) => !s.completed).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Plan de Desarrollo</h3>
              <span className={`px-2 py-0.5 rounded text-xs border ${
                plan.status === "active"
                  ? "text-[#2B8B41] bg-[#2B8B41]/10 border-[#2B8B41]/20"
                  : plan.status === "completed"
                  ? "text-[#C1D82F] bg-[#C1D82F]/10 border-[#C1D82F]/20"
                  : "text-white/40 bg-white/5 border-white/10"
              }`}>
                {plan.status === "active" ? "Activo" : plan.status === "completed" ? "Completado" : "Pausado"}
              </span>
            </div>

            {/* Focus Areas */}
            {focusAreas.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">Áreas de Enfoque</h4>
                {focusAreas.map((area) => (
                  <div key={area.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{area.label}</span>
                      <span className="text-white/40">
                        {area.currentValue} <span className="text-white/20">→</span> {area.targetValue}
                      </span>
                    </div>
                    <ProgressBar current={area.currentValue} target={area.targetValue} />
                  </div>
                ))}
              </div>
            )}

            {/* Recommended Exercises */}
            {exercises.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">Ejercicios Recomendados</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <Dumbbell className="size-3.5 text-[#C1D82F] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{ex.title}</p>
                        <p className="text-[10px] text-white/30">{ex.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluation Schedule */}
            {schedule.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">Calendario de Evaluaciones</h4>
                <div className="flex flex-wrap gap-2">
                  {schedule.map((s, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                      s.completed
                        ? "text-[#2B8B41] bg-[#2B8B41]/10 border-[#2B8B41]/20"
                        : "text-white/40 bg-white/[0.02] border-white/5"
                    }`}>
                      {s.completed ? <CheckCircle2 className="size-3" /> : <Calendar className="size-3" />}
                      {formatDate(s.date)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {(plan.parentComments || plan.playerComments) && (
              <div className="space-y-2 pt-3 border-t border-white/5">
                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="size-3" /> Comentarios
                </h4>
                {plan.parentComments && (
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] text-[#C1D82F] mb-1">Padre/Madre</p>
                    <p className="text-xs text-white/60">{plan.parentComments}</p>
                  </div>
                )}
                {plan.playerComments && (
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] text-[#2B8B41] mb-1">Jugador</p>
                    <p className="text-xs text-white/60">{plan.playerComments}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}


/* ============================================================
   REPORTS TAB
   ============================================================ */

function ReportsTab({ reports, selectedReport, onSelect }: {
  reports: Report[];
  selectedReport: Report | null;
  onSelect: (r: Report | null) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-12 text-center">
        <FileText className="size-10 mx-auto text-white/10 mb-3" />
        <p className="text-white/40">No hay reportes disponibles</p>
      </div>
    );
  }

  if (selectedReport) {
    const content = selectedReport.content as Record<string, unknown>;
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-4"
      >
        <button
          onClick={() => onSelect(null)}
          className="flex items-center gap-2 text-xs text-[#C1D82F] hover:underline"
        >
          <ArrowLeft className="size-3" /> Volver a reportes
        </button>
        <div>
          <h3 className="text-lg font-semibold text-white">
            {selectedReport.reportType === "monthly" ? "Reporte Mensual" : selectedReport.reportType === "quarterly" ? "Reporte Trimestral" : selectedReport.reportType === "semester" ? "Reporte Semestral" : "Reporte de Progreso"}
          </h3>
          <p className="text-xs text-white/40 mt-1">
            Período: {formatDate(selectedReport.periodStart)} — {formatDate(selectedReport.periodEnd)}
          </p>
          {selectedReport.coach && (
            <p className="text-xs text-white/30 mt-0.5">Por: {selectedReport.coach.fullName}</p>
          )}
        </div>
        <div className="space-y-3">
          {Object.entries(content).map(([key, value]) => {
            // Skip internal/technical keys
            if (["sections", "playerInfo", "generatedAt", "coachName", "latestEvaluation"].includes(key)) return null;
            const KEY_LABELS: Record<string, string> = {
              coachComments: "Comentarios del Entrenador",
              evaluations: "Evaluaciones",
              tasks: "Tareas",
              objectives: "Objetivos",
              feedback: "Feedback",
            };
            const displayKey = KEY_LABELS[key] || key.replace(/_/g, " ");
            if (typeof value === "string") {
              return (
                <div key={key} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-[#C1D82F] uppercase tracking-wider mb-1">{displayKey}</p>
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{value}</p>
                </div>
              );
            }
            if (typeof value === "number") {
              return (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-white/60">{displayKey}</span>
                  <span className="text-sm font-bold text-white">{value}</span>
                </div>
              );
            }
            if (Array.isArray(value) && value.length > 0) {
              return (
                <div key={key} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-[#C1D82F] uppercase tracking-wider mb-2">{displayKey}</p>
                  <ul className="space-y-1">
                    {value.map((item, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="text-[#C1D82F] mt-0.5">•</span>
                        {typeof item === "string" ? item : typeof item === "object" && item !== null && "title" in item ? String((item as Record<string, unknown>).title) : JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((rep, idx) => (
        <motion.button
          key={rep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(rep)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#1a1f36]/60 border border-white/10 hover:bg-white/[0.04] transition-colors text-left"
        >
          <div className="size-10 rounded-xl bg-[#EB3525]/10 flex items-center justify-center">
            <FileText className="size-5 text-[#EB3525]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {rep.reportType === "monthly" ? "Reporte Mensual" : rep.reportType === "quarterly" ? "Reporte Trimestral" : rep.reportType === "semester" ? "Reporte Semestral" : "Reporte de Progreso"}
            </p>
            <p className="text-xs text-white/40">
              {formatDate(rep.periodStart)} — {formatDate(rep.periodEnd)}
            </p>
          </div>
          <ChevronRight className="size-4 text-white/20" />
        </motion.button>
      ))}
    </div>
  );
}

/* ============================================================
   TASKS TAB
   ============================================================ */

function TasksTab({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-12 text-center">
        <ListTodo className="size-10 mx-auto text-white/10 mb-3" />
        <p className="text-white/40">No hay tareas asignadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, idx) => {
        const assignment = task.assignments[0];
        const status = assignment?.status ?? task.status;
        const badge = taskStatusBadge(status);
        const BadgeIcon = badge.icon;

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <BadgeIcon className={`size-5 shrink-0 mt-0.5 ${badge.cls.split(" ")[0]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {task.taskType && (
                    <span className="px-2 py-0.5 rounded text-[10px] text-white/40 bg-white/5 border border-white/10">
                      {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-white/40 mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-[10px] text-white/30">
                  {task.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" /> {formatDate(task.deadline)}
                    </span>
                  )}
                  {assignment?.completedAt && (
                    <span className="flex items-center gap-1 text-[#2B8B41]">
                      <CheckCircle2 className="size-3" /> Completada: {formatDate(assignment.completedAt)}
                    </span>
                  )}
                </div>
                {assignment?.playerComments && (
                  <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] text-[#C1D82F] mb-0.5">Comentario del jugador</p>
                    <p className="text-xs text-white/50">{assignment.playerComments}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
