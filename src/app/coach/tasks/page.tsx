"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  XCircle,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";

type TaskAssignment = {
  id: string;
  status: string;
  playerComments: string | null;
  coachFeedback: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  player: { id: string; fullName: string; position: string };
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  taskType: string | null;
  deadline: string | null;
  completionCriteria: string | null;
  status: string;
  createdAt: string;
  assignments: TaskAssignment[];
  coach: { id: string; fullName: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-800", icon: Loader2 },
  completed: { label: "Completada", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  overdue: { label: "Vencida", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  rejected: { label: "Rechazada", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  technical: "Técnica",
  tactical: "Táctica",
  physical: "Física",
  mental: "Mental",
};

const TYPE_COLORS: Record<string, string> = {
  technical: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  tactical: "bg-green-500/20 text-green-300 border-green-500/30",
  physical: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  mental: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTeamId = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.user?.teamId) setTeamId(session.user.teamId);
    } catch { /* ignore */ }
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ teamId });
      if (filterPlayer !== "all") params.set("playerId", filterPlayer);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all") params.set("taskType", filterType);

      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) setTasks(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [teamId, filterPlayer, filterStatus, filterType]);

  useEffect(() => { fetchTeamId(); }, [fetchTeamId]);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Unique players from assignments
  const uniquePlayers = Array.from(
    new Map(
      tasks.flatMap((t) => t.assignments.map((a) => [a.player.id, a.player]))
    ).values()
  );

  // Filter by search
  const filtered = tasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.assignments.some((a) => a.player.fullName.toLowerCase().includes(q))
    );
  });

  // Compliance stats
  const complianceMap = new Map<string, { total: number; completed: number; name: string }>();
  tasks.forEach((t) =>
    t.assignments.forEach((a) => {
      const entry = complianceMap.get(a.player.id) || { total: 0, completed: 0, name: a.player.fullName };
      entry.total++;
      if (a.status === "completed") entry.completed++;
      complianceMap.set(a.player.id, entry);
    })
  );

  const overdueTasks = filtered.filter((t) => t.status === "overdue");

  async function handleCompleteAssignment(taskId: string, assignmentId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/assignments/${assignmentId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerComments: "" }),
      });
      if (res.ok) fetchTasks();
    } catch { /* ignore */ }
  }

  async function handleReviewAssignment(taskId: string, assignmentId: string, decision: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/tasks/${taskId}/assignments/${assignmentId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, coachFeedback: decision === "approved" ? "Aprobado" : "Rechazado" }),
      });
      if (res.ok) fetchTasks();
    } catch { /* ignore */ }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("¿Eliminar esta tarea y todas sus asignaciones? No se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="size-6 text-[#C1D82F]" />
            Tareas Individuales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tasks.length} tarea{tasks.length !== 1 ? "s" : ""} · {overdueTasks.length} vencida{overdueTasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/coach/tasks/new">
          <Button className="gap-1.5 bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 font-semibold shadow-lg shadow-[#C1D82F]/20">
            <Plus className="size-4" />
            Nueva Tarea
          </Button>
        </Link>
      </div>

      {/* Compliance summary */}
      {complianceMap.size > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from(complianceMap.entries())
            .sort(([, a], [, b]) => {
              const pA = a.total > 0 ? (a.completed / a.total) * 100 : 0;
              const pB = b.total > 0 ? (b.completed / b.total) * 100 : 0;
              return pB - pA;
            })
            .slice(0, 6)
            .map(([id, data]) => {
              const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              return (
                <Card key={id} className="p-3 text-center">
                  <p className="text-xs font-medium truncate">{data.name}</p>
                  <p className={`text-lg font-bold ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                    {pct}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">{data.completed}/{data.total} tareas</p>
                </Card>
              );
            })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar tarea o jugador..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={filterPlayer} onValueChange={(v) => setFilterPlayer(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Todos los jugadores" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los jugadores</SelectItem>
            {uniquePlayers.map((p) => (<SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="overdue">Vencida</SelectItem>
            <SelectItem value="rejected">Rechazada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="technical">Técnica</SelectItem>
            <SelectItem value="tactical">Táctica</SelectItem>
            <SelectItem value="physical">Física</SelectItem>
            <SelectItem value="mental">Mental</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">No hay tareas</p>
          <Link href="/coach/tasks/new">
            <Button variant="outline">Crear primera tarea</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const isOverdue = task.status === "overdue";
            const completedCount = task.assignments.filter((a) => a.status === "completed").length;
            const totalCount = task.assignments.length;

            return (
              <Card key={task.id} className={`p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${isOverdue ? "border-red-300 bg-red-50/30" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-tight">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className={`shrink-0 text-[10px] ${statusCfg.color}`}>
                    <StatusIcon className="size-3 mr-1" />
                    {statusCfg.label}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {task.taskType && (
                    <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[task.taskType] || ""}`}>
                      {TYPE_LABELS[task.taskType] || task.taskType}
                    </Badge>
                  )}
                  {task.deadline && (
                    <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      <Calendar className="size-3" />
                      {new Date(task.deadline).toLocaleDateString("es")}
                    </span>
                  )}
                </div>

                {/* Assignment progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{completedCount}/{totalCount}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOverdue ? "bg-red-500" : "bg-[#C1D82F]"}`}
                      style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Assigned players with actions */}
                <div className="space-y-1.5">
                  {task.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`size-2 rounded-full shrink-0 ${a.status === "completed" ? "bg-green-500" : a.status === "rejected" ? "bg-red-500" : a.status === "overdue" ? "bg-orange-500" : "bg-yellow-500"}`} />
                        <span className="truncate">{a.player.fullName}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {STATUS_CONFIG[a.status]?.label || a.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {(a.status === "pending" || a.status === "in_progress") && (
                          <button
                            onClick={() => handleCompleteAssignment(task.id, a.id)}
                            className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-[10px] font-medium transition-colors"
                          >
                            ✓ Completar
                          </button>
                        )}
                        {a.status === "completed" && !a.reviewedAt && (
                          <>
                            <button
                              onClick={() => handleReviewAssignment(task.id, a.id, "approved")}
                              className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-[10px] font-medium transition-colors"
                            >
                              ✓ Aprobar
                            </button>
                            <button
                              onClick={() => handleReviewAssignment(task.id, a.id, "rejected")}
                              className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[10px] font-medium transition-colors"
                            >
                              ✗ Rechazar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t">
                  <span>{new Date(task.createdAt).toLocaleDateString("es")}</span>
                  <div className="flex items-center gap-2">
                    {task.coach && <span>{task.coach.fullName}</span>}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      title="Eliminar tarea"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
