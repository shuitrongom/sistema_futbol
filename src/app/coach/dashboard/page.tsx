"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  CalendarDays,
  ListTodo,
  AlertTriangle,
  TrendingDown,
  Dumbbell,
  Trophy,
  Clock,
  UserX,
  Target,
  CalendarCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───

interface DimensionMetrics {
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
  overall: number;
}

interface WeakPoint {
  key: string;
  label: string;
  average: number;
  playerCount: number;
}

interface ExerciseSuggestion {
  exerciseId: string;
  title: string;
  category: string;
  difficulty: string | null;
  methodologySource: string | null;
  durationMinutes: number | null;
  weaknessKey: string;
  weaknessLabel: string;
}

interface PlayerComparison {
  playerId: string;
  fullName: string;
  position: string;
  dimensions: DimensionMetrics;
  latestEvaluationDate: string;
}

interface TemporalTrend {
  period: string;
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
  overall: number;
  evaluationCount: number;
}

interface DashboardData {
  metrics: DimensionMetrics;
  weakPoints: WeakPoint[];
  exerciseSuggestions: ExerciseSuggestion[];
  playerComparisons: PlayerComparison[];
  trends: TemporalTrend[];
}

interface MatchRecord {
  id: string;
  dateTime: string;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  homeScore: number | null;
  awayScore: number | null;
}

interface TaskAssignment {
  id: string;
  status: string;
  player: { id: string; fullName: string };
}

interface TaskRecord {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  assignments: TaskAssignment[];
}

interface ObjectiveRecord {
  id: string;
  title: string;
  targetDate: string | null;
  status: string;
  player: { id: string; fullName: string };
}

interface AlertItem {
  type: "overdue" | "unevaluated" | "objective";
  icon: React.ReactNode;
  message: string;
  color: string;
}

// ─── Helpers ───

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

const DIMENSION_COLORS: Record<string, string> = {
  technical: "#C1D82F",
  tactical: "#d4af37",
  physical: "#e63946",
  mental: "#2563eb",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysDiff(dateStr: string) {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Component ───

export default function CoachDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [nextMatch, setNextMatch] = useState<MatchRecord | null>(null);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // 1. Get session to find teamId
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const tid = session?.user?.teamId;
        if (!tid) {
          setLoading(false);
          return;
        }
        setTeamId(tid);

        // 2. Fetch data independently (don't let one failure block others)
        const alertItems: AlertItem[] = [];

        // Dashboard analytics
        try {
          const dashRes = await fetch(`/api/analytics/dashboard?teamId=${tid}`);
          if (dashRes.ok) {
            setDashboard(await dashRes.json());
          }
        } catch { /* ignore */ }

        // Player count
        try {
          const teamRes = await fetch(`/api/teams/${tid}`);
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            setPlayerCount(teamData.teamPlayers?.length ?? 0);
          }
        } catch { /* ignore */ }

        // Next match
        try {
          const matchesRes = await fetch(`/api/matches?teamId=${tid}`);
          if (matchesRes.ok) {
            const matches: MatchRecord[] = await matchesRes.json();
            const upcoming = (Array.isArray(matches) ? matches : [])
              .filter((m) => m.status === "scheduled" && new Date(m.dateTime) > new Date())
              .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
            if (upcoming.length > 0) setNextMatch(upcoming[0]);
          }
        } catch { /* ignore */ }

        // Tasks
        try {
          const tasksRes = await fetch(`/api/tasks?teamId=${tid}`);
          if (tasksRes.ok) {
            const tasks: TaskRecord[] = await tasksRes.json();
            const pending = (Array.isArray(tasks) ? tasks : []).filter(
              (t) => t.status === "pending" || t.status === "in_progress"
            );
            setPendingTaskCount(pending.length);

            // Overdue tasks
            const overdue = (Array.isArray(tasks) ? tasks : []).filter(
              (t) => t.status === "overdue" || (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
            );
            for (const t of overdue.slice(0, 5)) {
              alertItems.push({
                type: "overdue",
                icon: <Clock className="size-4" />,
                message: `Tarea vencida: "${t.title}"`,
                color: "text-red-500",
              });
            }
          }
        } catch { /* ignore */ }

        // Objectives
        try {
          const objectivesRes = await fetch(`/api/objectives?teamId=${tid}`);
          if (objectivesRes.ok) {
            const objectives: ObjectiveRecord[] = await objectivesRes.json();
            const expiring = (Array.isArray(objectives) ? objectives : []).filter(
              (o) =>
                o.status === "active" &&
                o.targetDate &&
                daysDiff(o.targetDate) <= 7 &&
                daysDiff(o.targetDate) >= 0
            );
            for (const o of expiring.slice(0, 5)) {
              alertItems.push({
                type: "objective",
                icon: <Target className="size-4" />,
                message: `Objetivo próximo a vencer: "${o.title}" (${o.player.fullName}) - ${daysDiff(o.targetDate!)} días`,
                color: "text-yellow-600",
              });
            }
          }
        } catch { /* ignore */ }

        // Development plan evaluation reminders
        try {
          const devRes = await fetch(`/api/development-plans?teamId=${tid}`);
          if (devRes.ok) {
            const devPlans = await devRes.json();
            for (const plan of Array.isArray(devPlans) ? devPlans : []) {
              const schedule = (plan.evaluationSchedule ?? []) as { date: string; completed: boolean }[];
              for (const evalItem of schedule) {
                if (evalItem.completed) continue;
                const daysLeft = daysDiff(evalItem.date);
                if (daysLeft >= 0 && daysLeft <= 7) {
                  alertItems.push({
                    type: "evaluation_reminder",
                    icon: <CalendarCheck className="size-4" />,
                    message: daysLeft === 0
                      ? `Evaluación de desarrollo HOY: ${plan.player?.fullName}`
                      : `Evaluación de desarrollo en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}: ${plan.player?.fullName} (${new Date(evalItem.date).toLocaleDateString("es")})`,
                    color: daysLeft <= 2 ? "text-red-500" : "text-yellow-500",
                  });
                  break; // Only show the next upcoming evaluation per plan
                }
              }
            }
          }
        } catch { /* ignore */ }

        setAlerts(alertItems);
      } catch {
        // ignore top-level errors
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build unevaluated player alerts after dashboard data is set
  useEffect(() => {
    if (!dashboard) return;
    const unevaluatedAlerts: AlertItem[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const p of dashboard.playerComparisons) {
      if (new Date(p.latestEvaluationDate) < thirtyDaysAgo) {
        unevaluatedAlerts.push({
          type: "unevaluated",
          icon: <UserX className="size-4" />,
          message: `${p.fullName} sin evaluar hace más de 30 días (última: ${formatDate(p.latestEvaluationDate)})`,
          color: "text-orange-500",
        });
      }
    }

    if (unevaluatedAlerts.length > 0) {
      setAlerts((prev) => [...prev, ...unevaluatedAlerts.slice(0, 5)]);
    }
  }, [dashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No tienes un equipo asignado.</p>
      </div>
    );
  }

  // Group exercise suggestions by weakness
  const exercisesByWeakness = new Map<string, ExerciseSuggestion[]>();
  if (dashboard?.exerciseSuggestions) {
    for (const ex of dashboard.exerciseSuggestions) {
      const group = exercisesByWeakness.get(ex.weaknessKey) ?? [];
      group.push(ex);
      exercisesByWeakness.set(ex.weaknessKey, group);
    }
  }

  // Top 10 players by overall score
  const topPlayers = (dashboard?.playerComparisons ?? [])
    .filter((p) => p.dimensions.overall > 0)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* ─── 1. Summary Section ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#C1D82F]/10 flex items-center justify-center shrink-0">
              <Users className="size-6 text-[#C1D82F]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{playerCount}</p>
              <p className="text-sm text-muted-foreground">Jugadores</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center shrink-0">
              <CalendarDays className="size-6 text-[#d4af37]" />
            </div>
            <div>
              {nextMatch ? (
                <>
                  <p className="text-sm font-semibold">
                    {nextMatch.homeTeam.name} vs {nextMatch.awayTeam.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(nextMatch.dateTime)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">Sin partidos</p>
                  <p className="text-xs text-muted-foreground">No hay partidos programados</p>
                </>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">Próximo partido</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#e63946]/10 flex items-center justify-center shrink-0">
              <ListTodo className="size-6 text-[#e63946]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{pendingTaskCount}</p>
              <p className="text-sm text-muted-foreground">Tareas pendientes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. Weak Points + Suggested Exercises ─── */}
      {dashboard && dashboard.weakPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="size-5 text-[#e63946]" />
              Puntos Débiles del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.weakPoints.map((wp) => (
              <div key={wp.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{wp.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#e63946]"
                        style={{ width: `${(wp.average / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">
                      {wp.average}
                    </span>
                  </div>
                </div>
                {/* Suggested exercises for this weakness */}
                {exercisesByWeakness.get(wp.key) && (
                  <div className="flex flex-wrap gap-2 pl-2">
                    {exercisesByWeakness.get(wp.key)!.map((ex) => (
                      <div
                        key={ex.exerciseId}
                        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
                      >
                        <Dumbbell className="size-3 text-[#C1D82F]" />
                        <span>{ex.title}</span>
                        {ex.methodologySource && (
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {ex.methodologySource}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── 3. Alerts ─── */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-[#d4af37]" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alerts.map((alert, i) => (
                <li key={i} className={`flex items-start gap-2 text-sm ${alert.color}`}>
                  <span className="mt-0.5 shrink-0">{alert.icon}</span>
                  <span>{alert.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ─── 4. Progress Chart by Dimension ─── */}
      {dashboard && dashboard.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progreso del Equipo por Dimensión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="technical"
                    name="Técnica"
                    stroke={DIMENSION_COLORS.technical}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tactical"
                    name="Táctica"
                    stroke={DIMENSION_COLORS.tactical}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="physical"
                    name="Física"
                    stroke={DIMENSION_COLORS.physical}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mental"
                    name="Mental"
                    stroke={DIMENSION_COLORS.mental}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 5. Player Rankings ─── */}
      {topPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-5 text-[#d4af37]" />
              Ranking de Jugadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead className="text-center">Técnica</TableHead>
                  <TableHead className="text-center">Táctica</TableHead>
                  <TableHead className="text-center">Física</TableHead>
                  <TableHead className="text-center">Mental</TableHead>
                  <TableHead className="text-center">General</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPlayers.map((player, idx) => (
                  <TableRow key={player.playerId}>
                    <TableCell className="font-bold text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{player.fullName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {POSITION_LABELS[player.position] ?? player.position}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{player.dimensions.technical}</TableCell>
                    <TableCell className="text-center">{player.dimensions.tactical}</TableCell>
                    <TableCell className="text-center">{player.dimensions.physical}</TableCell>
                    <TableCell className="text-center">{player.dimensions.mental}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-[#C1D82F]">
                        {player.dimensions.overall}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!dashboard && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No hay datos de evaluaciones disponibles. Comienza evaluando a tus jugadores para ver métricas aquí.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
