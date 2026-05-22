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
  FileText,
  Download,
  MessageSquare,
  Send,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Report {
  id: string;
  periodStart: string;
  periodEnd: string;
  reportType: string | null;
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
  content: Record<string, unknown> | null;
  player?: { fullName: string };
  coach?: { fullName: string };
}

interface DevelopmentPlan {
  id: string;
  status: string;
  focusAreas: { key: string; label: string; currentValue: number; targetValue: number }[] | null;
  recommendedExercises: { title: string; category: string }[] | null;
  evaluationSchedule: { date: string; completed: boolean }[] | null;
  parentComments: string | null;
  playerComments: string | null;
  createdAt: string;
  updatedAt: string;
  player?: { fullName: string };
}

interface Comment {
  role: string;
  author: string;
  message: string;
  date: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  semester: "Semestral",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ChildReportsPage() {
  const params = useParams();
  const playerId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [plans, setPlans] = useState<DevelopmentPlan[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentingPlanId, setCommentingPlanId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [reportsRes, plansRes] = await Promise.all([
          fetch(`/api/reports?playerId=${playerId}`),
          fetch(`/api/development-plans?playerId=${playerId}`),
        ]);

        if (reportsRes.ok) setReports(await reportsRes.json());
        if (plansRes.ok) setPlans(await plansRes.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  async function handleAddComment(planId: string) {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/development-plans/${planId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newComment.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, ...updated } : p)));
        setNewComment("");
        setCommentingPlanId(null);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/parent/children/${playerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#1a472a]">Reportes y Planes</h1>
      </div>

      {/* Progress Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-[#1a472a]" />
            Reportes de Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No hay reportes disponibles.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">
                      {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {report.reportType && (
                        <Badge variant="outline" className="text-xs">
                          {REPORT_TYPE_LABELS[report.reportType] || report.reportType}
                        </Badge>
                      )}
                      {report.sentAt && (
                        <span className="text-xs text-muted-foreground">
                          Enviado: {formatDate(report.sentAt)}
                        </span>
                      )}
                    </div>
                    {report.coach && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Por: {report.coach.fullName}
                      </p>
                    )}
                  </div>
                  {report.pdfUrl && (
                    <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="size-4 mr-1" /> PDF
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Development Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="size-5 text-[#d4af37]" />
            Planes de Desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No hay planes de desarrollo.</p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => {
                // Parse comments from parentComments/playerComments fields
                const comments: Comment[] = [];
                try {
                  if (plan.parentComments) {
                    const parsed = JSON.parse(plan.parentComments);
                    if (Array.isArray(parsed)) comments.push(...parsed);
                  }
                } catch {
                  if (plan.parentComments) {
                    comments.push({ role: "parent", author: "Padre", message: plan.parentComments, date: plan.updatedAt });
                  }
                }
                try {
                  if (plan.playerComments) {
                    const parsed = JSON.parse(plan.playerComments);
                    if (Array.isArray(parsed)) comments.push(...parsed);
                  }
                } catch {
                  if (plan.playerComments) {
                    comments.push({ role: "player", author: "Jugador", message: plan.playerComments, date: plan.updatedAt });
                  }
                }

                return (
                  <div key={plan.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Plan de Desarrollo</p>
                      <Badge
                        className={
                          plan.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {plan.status === "active" ? "Activo" : plan.status}
                      </Badge>
                    </div>

                    {/* Focus Areas */}
                    {plan.focusAreas && plan.focusAreas.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Áreas de Enfoque</p>
                        <div className="space-y-2">
                          {plan.focusAreas.map((area) => {
                            const progress = area.targetValue
                              ? Math.round((area.currentValue / area.targetValue) * 100)
                              : 0;
                            return (
                              <div key={area.key} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>{area.label}</span>
                                  <span>{area.currentValue}/{area.targetValue}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#1a472a]"
                                    style={{ width: `${Math.min(100, progress)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommended Exercises */}
                    {plan.recommendedExercises && plan.recommendedExercises.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Ejercicios Recomendados</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.recommendedExercises.map((ex, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ex.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evaluation Schedule */}
                    {plan.evaluationSchedule && plan.evaluationSchedule.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Cronograma de Evaluaciones</p>
                        <div className="flex flex-wrap gap-2">
                          {plan.evaluationSchedule.map((ev, i) => (
                            <Badge
                              key={i}
                              className={
                                ev.completed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {formatDate(ev.date)} {ev.completed ? "✓" : "○"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <MessageSquare className="size-4" /> Comentarios
                      </p>
                      {comments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {comments.map((c, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded text-sm ${
                                c.role === "coach"
                                  ? "bg-[#1a472a]/5 border-l-2 border-l-[#1a472a]"
                                  : c.role === "parent"
                                  ? "bg-[#d4af37]/5 border-l-2 border-l-[#d4af37]"
                                  : "bg-blue-50 border-l-2 border-l-blue-400"
                              }`}
                            >
                              <p className="text-xs font-medium">
                                {c.author} ({c.role === "coach" ? "Entrenador" : c.role === "parent" ? "Padre" : "Jugador"})
                              </p>
                              <p className="mt-0.5">{c.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {commentingPlanId === plan.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment(plan.id);
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(plan.id)}
                            disabled={submitting || !newComment.trim()}
                            className="bg-[#1a472a] hover:bg-[#1a472a]/90"
                          >
                            <Send className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCommentingPlanId(plan.id)}
                        >
                          <MessageSquare className="size-4 mr-1" /> Agregar Comentario
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
