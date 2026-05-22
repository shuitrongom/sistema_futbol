"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Target,
} from "lucide-react";

interface TaskAssignment {
  id: string;
  status: string;
  playerComments: string | null;
  coachFeedback: string | null;
  completedAt: string | null;
  task: {
    id: string;
    title: string;
    description: string | null;
    taskType: string | null;
    deadline: string | null;
    completionCriteria: string | null;
    status: string;
  };
}

interface Objective {
  id: string;
  title: string;
  description: string | null;
  targetValue: number | null;
  currentValue: number | null;
  metricName: string | null;
  startDate: string | null;
  targetDate: string | null;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="size-4" /> },
  in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-800", icon: <ListTodo className="size-4" /> },
  completed: { label: "Completada", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="size-4" /> },
  overdue: { label: "Vencida", color: "bg-red-100 text-red-800", icon: <AlertCircle className="size-4" /> },
  rejected: { label: "Rechazada", color: "bg-gray-100 text-gray-800", icon: <XCircle className="size-4" /> },
};

const TYPE_LABELS: Record<string, string> = {
  technical: "Técnica",
  tactical: "Táctica",
  physical: "Física",
  mental: "Mental",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ChildTasksPage() {
  const params = useParams();
  const playerId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, objectivesRes] = await Promise.all([
          fetch(`/api/tasks?playerId=${playerId}`),
          fetch(`/api/objectives?playerId=${playerId}`),
        ]);

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          // Tasks API returns tasks with assignments - extract assignments for this player
          const playerTasks: TaskAssignment[] = [];
          for (const task of data) {
            if (task.taskAssignments) {
              for (const assignment of task.taskAssignments) {
                if (assignment.playerId === playerId) {
                  playerTasks.push({
                    ...assignment,
                    task: {
                      id: task.id,
                      title: task.title,
                      description: task.description,
                      taskType: task.taskType,
                      deadline: task.deadline,
                      completionCriteria: task.completionCriteria,
                      status: task.status,
                    },
                  });
                }
              }
            }
          }
          setTasks(playerTasks);
        }

        if (objectivesRes.ok) {
          setObjectives(await objectivesRes.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/parent/children/${playerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#1a472a]">Tareas y Objetivos</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#1a472a]">{tasks.length}</p>
            <p className="text-xs text-muted-foreground">Total Tareas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#d4af37]">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Cumplimiento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{objectives.length}</p>
            <p className="text-xs text-muted-foreground">Objetivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="size-5 text-[#1a472a]" />
            Tareas Asignadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No hay tareas asignadas.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((ta) => {
                const statusCfg = STATUS_CONFIG[ta.status] || STATUS_CONFIG.pending;
                return (
                  <div key={ta.id} className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{ta.task.title}</p>
                        {ta.task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{ta.task.description}</p>
                        )}
                      </div>
                      <Badge className={statusCfg.color}>
                        <span className="flex items-center gap-1">
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {ta.task.taskType && (
                        <Badge variant="outline">{TYPE_LABELS[ta.task.taskType] || ta.task.taskType}</Badge>
                      )}
                      {ta.task.deadline && (
                        <span className="text-muted-foreground">
                          Fecha límite: {formatDate(ta.task.deadline)}
                        </span>
                      )}
                    </div>
                    {ta.task.completionCriteria && (
                      <p className="text-xs text-muted-foreground border-t pt-2">
                        Criterio: {ta.task.completionCriteria}
                      </p>
                    )}
                    {ta.coachFeedback && (
                      <div className="text-xs bg-[#1a472a]/5 p-2 rounded">
                        <span className="font-medium text-[#1a472a]">Feedback del entrenador:</span>{" "}
                        {ta.coachFeedback}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Development Objectives */}
      {objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="size-5 text-[#d4af37]" />
              Objetivos de Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {objectives.map((obj) => {
                const progress =
                  obj.targetValue && obj.currentValue
                    ? Math.min(100, Math.round((obj.currentValue / obj.targetValue) * 100))
                    : 0;
                return (
                  <div key={obj.id} className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{obj.title}</p>
                        {obj.description && (
                          <p className="text-sm text-muted-foreground">{obj.description}</p>
                        )}
                      </div>
                      <Badge
                        className={
                          obj.status === "active"
                            ? "bg-blue-100 text-blue-800"
                            : obj.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {obj.status === "active" ? "Activo" : obj.status === "completed" ? "Completado" : obj.status}
                      </Badge>
                    </div>
                    {obj.targetValue != null && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{obj.metricName || "Progreso"}</span>
                          <span>
                            {obj.currentValue?.toFixed(1) || "0"} / {obj.targetValue.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#1a472a] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {obj.targetDate && (
                      <p className="text-xs text-muted-foreground">
                        Meta: {formatDate(obj.targetDate)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
