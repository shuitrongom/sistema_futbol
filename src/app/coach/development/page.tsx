"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  AlertTriangle,
  Plus,
  User,
  TrendingUp,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";

type PlanData = {
  id: string;
  playerId: string;
  status: string;
  focusAreas: { key: string; label: string; currentValue: number; targetValue: number }[];
  evaluationSchedule: { date: string; completed: boolean }[];
  createdAt: string;
  player: { id: string; fullName: string; position: string; photoUrl: string | null };
  coach: { id: string; fullName: string } | null;
  team: { id: string; name: string } | null;
  alert?: { hasAlert: boolean; message: string | null; staleFocusAreas: string[] };
};

type PlayerOption = {
  id: string;
  fullName: string;
  position: string;
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

export default function DevelopmentPlansPage() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const tid = session?.user?.teamId;
        if (!tid) { setLoading(false); return; }
        setTeamId(tid);

        const [plansRes, playersRes] = await Promise.all([
          fetch(`/api/development-plans?teamId=${tid}`),
          fetch(`/api/teams/${tid}/players`),
        ]);

        if (plansRes.ok) {
          const data = await plansRes.json();
          // Fetch alerts for each plan
          const plansWithAlerts = await Promise.all(
            data.map(async (p: PlanData) => {
              try {
                const alertRes = await fetch(`/api/development-plans/${p.id}`);
                if (alertRes.ok) {
                  const detail = await alertRes.json();
                  return { ...p, alert: detail.alert };
                }
              } catch { /* ignore */ }
              return p;
            })
          );
          setPlans(plansWithAlerts);
        }

        if (playersRes.ok) {
          const pData = await playersRes.json();
          const playerList = (pData.players ?? pData).map(
            (tp: { player?: PlayerOption } & PlayerOption) =>
              tp.player ?? tp
          );
          setPlayers(playerList);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate() {
    if (!selectedPlayer || !teamId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/development-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedPlayer, teamId }),
      });
      if (res.ok) {
        const plan = await res.json();
        setPlans((prev) => [plan, ...prev]);
        setDialogOpen(false);
        setSelectedPlayer("");
      }
    } catch { /* ignore */ } finally {
      setCreating(false);
    }
  }

  function getProgress(plan: PlanData) {
    const schedule = plan.evaluationSchedule ?? [];
    if (schedule.length === 0) return 0;
    const completed = schedule.filter((s) => s.completed).length;
    return Math.round((completed / schedule.length) * 100);
  }

  async function handleDeletePlan(e: React.MouseEvent, planId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar este plan de desarrollo? No se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/development-plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== planId));
      }
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando planes de desarrollo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planes de Desarrollo</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" />Nuevo Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Plan de Desarrollo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Jugador</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                  <SelectContent>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName} — {POSITION_LABELS[p.position] || p.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Las áreas de enfoque y ejercicios se sugerirán automáticamente basados en las evaluaciones del jugador.
              </p>
              <Button onClick={handleCreate} disabled={!selectedPlayer || creating} className="w-full">
                {creating ? "Creando..." : "Crear Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts section */}
      {plans.some((p) => p.alert?.hasAlert) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Alertas de Progreso</h3>
            </div>
            <div className="space-y-1">
              {plans
                .filter((p) => p.alert?.hasAlert)
                .map((p) => (
                  <p key={p.id} className="text-sm text-orange-700">
                    <span className="font-medium">{p.player.fullName}:</span>{" "}
                    {p.alert?.message}
                  </p>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No hay planes de desarrollo creados.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea un plan para comenzar a desarrollar a tus jugadores.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const progress = getProgress(plan);
            return (
              <Link key={plan.id} href={`/coach/development/${plan.playerId}`}>
                <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{plan.player.fullName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{POSITION_LABELS[plan.player.position] || plan.player.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={plan.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {plan.status === "active" ? "Activo" : plan.status === "completed" ? "Completado" : "Pausado"}
                        </Badge>
                        <button
                          onClick={(e) => handleDeletePlan(e, plan.id)}
                          title="Eliminar plan"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Focus areas */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Áreas de enfoque</p>
                      <div className="flex flex-wrap gap-1">
                        {(plan.focusAreas ?? []).slice(0, 3).map((area) => (
                          <Badge key={area.key} variant="outline" className="text-xs">
                            {area.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="size-3" /> Progreso evaluaciones
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Alert indicator */}
                    {plan.alert?.hasAlert && (
                      <div className="flex items-center gap-1.5 text-xs text-orange-600">
                        <AlertTriangle className="size-3" />
                        <span>Sin progreso detectado</span>
                      </div>
                    )}

                    {/* Schedule info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        {(plan.evaluationSchedule ?? []).filter((s) => s.completed).length}/
                        {(plan.evaluationSchedule ?? []).length} evaluaciones
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(plan.createdAt).toLocaleDateString("es")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
