"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  AlertTriangle,
  Dumbbell,
  CalendarCheck,
  MessageSquare,
  User,
  Send,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Trash2,
  Pencil,
  Plus,
  Save,
  X,
} from "lucide-react";

type FocusArea = {
  key: string;
  label: string;
  currentValue: number;
  targetValue: number;
};

type RecommendedExercise = {
  exerciseId: string;
  title: string;
  category: string;
  focusAreaKey: string;
};

type ScheduleItem = { date: string; completed: boolean };

type Comment = {
  author: string;
  role: "coach" | "player" | "parent";
  message: string;
  createdAt: string;
};

type PlanDetail = {
  id: string;
  playerId: string;
  status: string;
  focusAreas: FocusArea[];
  recommendedExercises: RecommendedExercise[];
  evaluationSchedule: ScheduleItem[];
  parentComments: string | null;
  playerComments: string | null;
  createdAt: string;
  updatedAt: string;
  player: { id: string; fullName: string; position: string; photoUrl: string | null };
  coach: { id: string; fullName: string } | null;
  team: { id: string; name: string } | null;
};

type AlertInfo = {
  hasAlert: boolean;
  message: string | null;
  staleFocusAreas: string[];
};

function parseComments(raw: string | null): Comment[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

const ROLE_COLORS: Record<string, string> = {
  coach: "bg-blue-100 text-blue-800",
  player: "bg-green-100 text-green-800",
  parent: "bg-purple-100 text-purple-800",
};

const ROLE_LABELS: Record<string, string> = {
  coach: "Entrenador",
  player: "Jugador",
  parent: "Padre/Tutor",
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

export default function PlayerDevelopmentPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleEdits, setScheduleEdits] = useState<{ date: string; completed: boolean }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // Get plans for this player
        const res = await fetch(`/api/development-plans?playerId=${playerId}`);
        if (!res.ok) { setLoading(false); return; }
        const plans = await res.json();
        // Get the active plan (or most recent)
        const activePlan = plans.find((p: PlanDetail) => p.status === "active") ?? plans[0];
        if (!activePlan) { setLoading(false); return; }

        // Get full detail with alert
        const detailRes = await fetch(`/api/development-plans/${activePlan.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setPlan(detail.plan);
          setAlert(detail.alert);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  async function handleSendComment() {
    if (!comment.trim() || !plan) return;
    setSending(true);
    try {
      const res = await fetch(`/api/development-plans/${plan.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: comment }),
      });
      if (res.ok) {
        const detailRes = await fetch(`/api/development-plans/${plan.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setPlan(detail.plan);
        }
        setComment("");
      }
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  async function handleSaveSchedule() {
    if (!plan) return;
    try {
      const res = await fetch(`/api/development-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationSchedule: scheduleEdits }),
      });
      if (res.ok) {
        const detailRes = await fetch(`/api/development-plans/${plan.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setPlan(detail.plan);
        }
        setEditingSchedule(false);
      }
    } catch { /* ignore */ }
  }

  function startEditSchedule() {
    setScheduleEdits((plan?.evaluationSchedule ?? []).map((s) => ({ ...s })));
    setEditingSchedule(true);
  }

  function addEvaluationDate() {
    setScheduleEdits((prev) => [...prev, { date: new Date().toISOString().split("T")[0], completed: false }]);
  }

  function removeEvaluationDate(idx: number) {
    setScheduleEdits((prev) => prev.filter((_, i) => i !== idx));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando plan de desarrollo...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Target className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay plan de desarrollo para este jugador.</p>
        </div>
      </div>
    );
  }

  const allComments = [
    ...parseComments(plan.parentComments),
    ...parseComments(plan.playerComments),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Group exercises by focus area
  const exercisesByArea: Record<string, RecommendedExercise[]> = {};
  for (const ex of plan.recommendedExercises ?? []) {
    if (!exercisesByArea[ex.focusAreaKey]) exercisesByArea[ex.focusAreaKey] = [];
    exercisesByArea[ex.focusAreaKey].push(ex);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/coach/development")}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="size-14 rounded-full bg-[#C1D82F]/10 flex items-center justify-center">
          <User className="size-7 text-[#C1D82F]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{plan.player.fullName}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {POSITION_LABELS[plan.player.position] || plan.player.position} — {plan.team?.name}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant={plan.status === "active" ? "default" : "secondary"}
          >
            {plan.status === "active" ? "Activo" : plan.status === "completed" ? "Completado" : "Pausado"}
          </Badge>
          <button
            onClick={async () => {
              if (!confirm("¿Eliminar este plan de desarrollo? No se puede deshacer.")) return;
              setDeleting(true);
              try {
                const res = await fetch(`/api/development-plans/${plan.id}`, { method: "DELETE" });
                if (res.ok) router.push("/coach/development");
              } catch { /* ignore */ }
              finally { setDeleting(false); }
            }}
            disabled={deleting}
            title="Eliminar plan"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert?.hasAlert && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-800 text-sm">Alerta de Progreso</p>
              <p className="text-sm text-orange-700">{alert.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Focus Areas with progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="size-5 text-primary" />
            <h2 className="font-semibold text-lg">Áreas de Enfoque</h2>
          </div>
          <div className="space-y-4">
            {(plan.focusAreas ?? []).map((area) => {
              const progress = Math.max(
                0,
                Math.round(
                  ((area.currentValue - 1) / (area.targetValue - 1)) * 100
                )
              );
              const isStale = alert?.staleFocusAreas.includes(area.label);
              return (
                <div key={area.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{area.label}</span>
                      {isStale && (
                        <AlertTriangle className="size-3.5 text-orange-500" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {area.currentValue} → {area.targetValue}
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isStale ? "bg-orange-400" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Exercises */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="size-5 text-primary" />
            <h2 className="font-semibold text-lg">Ejercicios Recomendados</h2>
          </div>
          {(plan.focusAreas ?? []).map((area) => {
            const areaExercises = exercisesByArea[area.key] ?? [];
            if (areaExercises.length === 0) return null;
            return (
              <div key={area.key} className="mb-4 last:mb-0">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {area.label}
                </p>
                <div className="space-y-2">
                  {areaExercises.map((ex) => (
                    <div
                      key={ex.exerciseId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="size-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <Dumbbell className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ex.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {ex.category.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(exercisesByArea).length === 0 && (
            <p className="text-sm text-muted-foreground">No hay ejercicios recomendados.</p>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Schedule */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-5 text-primary" />
              <h2 className="font-semibold text-lg">Cronograma de Evaluaciones</h2>
            </div>
            {!editingSchedule ? (
              <button
                onClick={startEditSchedule}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-[#C1D82F] hover:bg-[#C1D82F]/10 border border-white/10 hover:border-[#C1D82F]/30 transition-all"
              >
                <Pencil className="w-3 h-3" />
                Editar fechas
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={addEvaluationDate}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-[#C1D82F] hover:bg-[#C1D82F]/10 border border-white/10 hover:border-[#C1D82F]/30 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  Agregar
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 transition-all"
                >
                  <Save className="w-3 h-3" />
                  Guardar
                </button>
                <button
                  onClick={() => setEditingSchedule(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-3 h-3" />
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {editingSchedule ? (
            <div className="space-y-3">
              {scheduleEdits.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="size-5 text-white/20 shrink-0" />
                  )}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-white/60 w-24 shrink-0">Evaluación {idx + 1}</span>
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => {
                        setScheduleEdits((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], date: e.target.value };
                          return next;
                        });
                      }}
                      className="h-8 rounded-lg border border-white/10 bg-[#1a1f36]/80 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C1D82F]/40 transition-all [color-scheme:dark]"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => {
                          setScheduleEdits((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], completed: e.target.checked };
                            return next;
                          });
                        }}
                        className="rounded accent-[#C1D82F]"
                      />
                      Completada
                    </label>
                  </div>
                  <button
                    onClick={() => removeEvaluationDate(idx)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {scheduleEdits.length === 0 && (
                <p className="text-sm text-white/30 text-center py-4">No hay evaluaciones. Haz clic en &quot;Agregar&quot; para crear una.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(plan.evaluationSchedule ?? []).map((item, idx) => {
                const daysLeft = Math.ceil((new Date(item.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isUpcoming = !item.completed && daysLeft >= 0 && daysLeft <= 7;
                const isPast = !item.completed && daysLeft < 0;
                return (
                  <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${isUpcoming ? "bg-yellow-500/5 border border-yellow-500/20" : isPast ? "bg-red-500/5 border border-red-500/20" : ""}`}>
                    {item.completed ? (
                      <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                    ) : isPast ? (
                      <AlertTriangle className="size-5 text-red-400 shrink-0" />
                    ) : isUpcoming ? (
                      <CalendarCheck className="size-5 text-yellow-400 shrink-0" />
                    ) : (
                      <Circle className="size-5 text-white/20 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Evaluación {idx + 1}
                        {isUpcoming && <span className="ml-2 text-yellow-400 text-xs font-normal">({daysLeft === 0 ? "HOY" : `en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`})</span>}
                        {isPast && <span className="ml-2 text-red-400 text-xs font-normal">(vencida hace {Math.abs(daysLeft)} día{Math.abs(daysLeft) !== 1 ? "s" : ""})</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("es", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={item.completed ? "default" : isPast ? "destructive" : "outline"} className="text-xs">
                      {item.completed ? "Completada" : isPast ? "Vencida" : "Pendiente"}
                    </Badge>
                  </div>
                );
              })}
              {(plan.evaluationSchedule ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No hay evaluaciones programadas.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="size-5 text-primary" />
            <h2 className="font-semibold text-lg">Comentarios</h2>
          </div>

          {allComments.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-4">
              No hay comentarios aún. Sé el primero en comentar.
            </p>
          ) : (
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {allComments.map((c, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{c.author}</span>
                    <Badge className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[c.role] ?? ""}`}>
                      {ROLE_LABELS[c.role] ?? c.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(c.createdAt).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{c.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSendComment}
              disabled={!comment.trim() || sending}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
