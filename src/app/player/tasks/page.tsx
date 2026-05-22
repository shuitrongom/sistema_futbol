"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2, ListTodo, CheckCircle2, AlertCircle, XCircle,
  Clock, Calendar,
} from "lucide-react";

/* ---------- types ---------- */

interface TaskAssignment {
  id: string;
  status: string;
  playerComments: string | null;
  coachFeedback: string | null;
  completedAt: string | null;
  playerId?: string;
  player?: { id: string };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  taskType: string | null;
  deadline: string | null;
  status: string;
  completionCriteria: string | null;
  assignments: TaskAssignment[];
}

/* ---------- helpers ---------- */

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

function taskStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return { label: "Completada", icon: CheckCircle2, cls: "text-[#2B8B41] bg-[#2B8B41]/10 border-[#2B8B41]/20" };
    case "overdue":
      return { label: "Vencida", icon: XCircle, cls: "text-[#EB3525] bg-[#EB3525]/10 border-[#EB3525]/20" };
    case "in_progress":
      return { label: "En progreso", icon: Clock, cls: "text-[#C1D82F] bg-[#C1D82F]/10 border-[#C1D82F]/20" };
    case "rejected":
      return { label: "Rechazada", icon: XCircle, cls: "text-[#EB3525] bg-[#EB3525]/10 border-[#EB3525]/20" };
    default:
      return { label: "Pendiente", icon: AlertCircle, cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" };
  }
}

/* ---------- component ---------- */

export default function PlayerTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(taskId: string, assignmentId: string) {
    setCompleting(assignmentId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/assignments/${assignmentId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerComments: commentText[assignmentId] || undefined }),
      });
      if (res.ok) {
        await loadTasks();
        setCommentText((prev) => ({ ...prev, [assignmentId]: "" }));
      }
    } catch {
      // silent
    } finally {
      setCompleting(null);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    const assignment = t.assignments[0];
    const status = assignment?.status ?? t.status;
    if (filter === "pending") return status === "pending" || status === "in_progress";
    if (filter === "completed") return status === "completed";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#C1D82F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Tareas</h1>
          <p className="text-white/40 text-sm mt-1">Tareas asignadas por tu entrenador</p>
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-[#C1D82F]/10 text-[#C1D82F] border border-[#C1D82F]/20"
                  : "text-white/40 hover:text-white/60 border border-transparent"
              }`}
            >
              {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Completadas"}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-12 text-center">
          <ListTodo className="size-10 mx-auto text-white/10 mb-3" />
          <p className="text-white/40">
            {filter === "all" ? "No tienes tareas asignadas" : filter === "pending" ? "No tienes tareas pendientes" : "No tienes tareas completadas"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task, idx) => {
            const assignment = task.assignments[0];
            const status = assignment?.status ?? task.status;
            const badge = taskStatusBadge(status);
            const BadgeIcon = badge.icon;
            const canComplete = assignment && (status === "pending" || status === "in_progress");

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl bg-[#1a1f36]/60 border border-white/10 p-5 space-y-3"
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
                      <p className="text-xs text-white/40 mt-1.5">{task.description}</p>
                    )}
                    {task.completionCriteria && (
                      <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-[#C1D82F] mb-0.5">Criterio de completado</p>
                        <p className="text-xs text-white/50">{task.completionCriteria}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-white/30">
                      {task.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> Fecha límite: {formatDate(task.deadline)}
                        </span>
                      )}
                      {assignment?.completedAt && (
                        <span className="flex items-center gap-1 text-[#2B8B41]">
                          <CheckCircle2 className="size-3" /> {formatDate(assignment.completedAt)}
                        </span>
                      )}
                    </div>

                    {/* Coach feedback */}
                    {assignment?.coachFeedback && (
                      <div className="mt-2 p-2 rounded-lg bg-[#2B8B41]/5 border border-[#2B8B41]/10">
                        <p className="text-[10px] text-[#2B8B41] mb-0.5">Feedback del entrenador</p>
                        <p className="text-xs text-white/50">{assignment.coachFeedback}</p>
                      </div>
                    )}

                    {/* Complete action */}
                    {canComplete && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Comentario opcional..."
                            value={commentText[assignment.id] || ""}
                            onChange={(e) => setCommentText((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                            className="flex-1 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C1D82F]/30"
                          />
                          <button
                            onClick={() => handleComplete(task.id, assignment.id)}
                            disabled={completing === assignment.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C1D82F] text-[#0d1117] font-semibold text-sm hover:bg-[#d4e84a] transition-colors disabled:opacity-50"
                          >
                            {completing === assignment.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="size-4" />
                                Completar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
