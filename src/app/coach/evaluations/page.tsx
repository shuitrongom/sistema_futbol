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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  TrendingUp,
  User,
  Star,
  AlertTriangle,
  Trash2,
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

type EvaluationSummary = {
  id: string;
  evaluationDate: string;
  context: string;
  technicalAvg: number | null;
  tacticalAvg: number | null;
  physicalAvg: number | null;
  mentalAvg: number | null;
  overallAvg: number | null;
  topStrengths: { key: string; label: string; value: number }[] | null;
  topWeaknesses: { key: string; label: string; value: number }[] | null;
  player: {
    id: string;
    fullName: string;
    position: string;
    photoUrl: string | null;
  };
  evaluator: { id: string; fullName: string } | null;
};

type ProgressPoint = {
  id: string;
  evaluationDate: string;
  context: string;
  technicalAvg: number | null;
  tacticalAvg: number | null;
  physicalAvg: number | null;
  mentalAvg: number | null;
  overallAvg: number | null;
};

const CONTEXT_LABELS: Record<string, string> = {
  match: "Partido",
  training: "Entrenamiento",
  formal: "Formal",
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

const CONTEXT_COLORS: Record<string, string> = {
  match: "bg-blue-100 text-blue-800",
  training: "bg-green-100 text-green-800",
  formal: "bg-purple-100 text-purple-800",
};

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [progressPlayerId, setProgressPlayerId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressPoint[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const fetchTeamId = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.user?.teamId) setTeamId(session.user.teamId);
    } catch {
      // ignore
    }
  }, []);

  const fetchEvaluations = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ teamId });
      if (filterPlayer !== "all") params.set("playerId", filterPlayer);
      if (filterDate) params.set("dateFrom", filterDate);

      const res = await fetch(`/api/evaluations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [teamId, filterPlayer, filterDate]);

  const fetchProgress = useCallback(async (playerId: string) => {
    setLoadingProgress(true);
    try {
      const res = await fetch(`/api/evaluations/player/${playerId}/progress`);
      if (res.ok) {
        const data = await res.json();
        setProgressData(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  const handleDeleteEvaluation = async (evalId: string) => {
    if (!confirm("¿Eliminar esta evaluación? No se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/evaluations/${evalId}`, { method: "DELETE" });
      if (res.ok) fetchEvaluations();
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchTeamId();
  }, [fetchTeamId]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  useEffect(() => {
    if (progressPlayerId) {
      fetchProgress(progressPlayerId);
    }
  }, [progressPlayerId, fetchProgress]);

  // Unique players for filter
  const uniquePlayers = Array.from(
    new Map(evaluations.map((e) => [e.player.id, e.player])).values()
  );

  // Filtered evaluations
  const filtered = evaluations.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.player.fullName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Progress chart data
  const chartData = progressData.map((p) => ({
    date: new Date(p.evaluationDate).toLocaleDateString("es", {
      month: "short",
      day: "numeric",
    }),
    Técnica: Number(p.technicalAvg) || 0,
    Táctica: Number(p.tacticalAvg) || 0,
    Física: Number(p.physicalAvg) || 0,
    Mental: Number(p.mentalAvg) || 0,
    General: Number(p.overallAvg) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="size-6 text-[#C1D82F]" />
            Evaluaciones
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {evaluations.length} evaluación{evaluations.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Link href="/coach/evaluations/new">
          <Button className="gap-1.5 bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 font-semibold shadow-lg shadow-[#C1D82F]/20">
            <Plus className="size-4" />
            Nueva Evaluación
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por jugador..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterPlayer} onValueChange={(v) => setFilterPlayer(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos los jugadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los jugadores</SelectItem>
                {uniquePlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-full sm:w-44"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Desde fecha"
            />
          </div>

          {/* Evaluation Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardCheck className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground mb-4">No hay evaluaciones</p>
              <Link href="/coach/evaluations/new">
                <Button variant="outline">Crear primera evaluación</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((ev) => (
                <Card
                  key={ev.id}
                  className="p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link href={`/coach/evaluations/${ev.id}`}>
                        <h3 className="font-semibold leading-tight hover:text-[#C1D82F] transition-colors">
                          {ev.player.fullName}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {POSITION_LABELS[ev.player.position] || ev.player.position}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${CONTEXT_COLORS[ev.context] || ""}`}
                        >
                          {CONTEXT_LABELS[ev.context] || ev.context}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-[#C1D82F]">
                        {Number(ev.overallAvg).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Mini dimension bars */}
                  <div className="space-y-1.5">
                    {[
                      { label: "TEC", value: ev.technicalAvg, color: "bg-blue-500" },
                      { label: "TAC", value: ev.tacticalAvg, color: "bg-green-500" },
                      { label: "FIS", value: ev.physicalAvg, color: "bg-orange-500" },
                      { label: "MEN", value: ev.mentalAvg, color: "bg-purple-500" },
                    ].map((d) => (
                      <div key={d.label} className="flex items-center gap-2">
                        <span className="text-[10px] font-medium w-7">{d.label}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${d.color}`}
                            style={{ width: `${((Number(d.value) || 0) / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono w-5 text-right">
                          {Number(d.value).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Strengths/Weaknesses preview */}
                  <div className="flex gap-3 text-[10px]">
                    {ev.topStrengths && ev.topStrengths.length > 0 && (
                      <div className="flex items-center gap-1 text-green-700">
                        <Star className="size-3" />
                        {ev.topStrengths[0].label}
                      </div>
                    )}
                    {ev.topWeaknesses && ev.topWeaknesses.length > 0 && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="size-3" />
                        {ev.topWeaknesses[0].label}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(ev.evaluationDate).toLocaleDateString("es")}
                    </span>
                    {ev.evaluator && (
                      <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {ev.evaluator.fullName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link href={`/coach/evaluations/${ev.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Ver detalle
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDeleteEvaluation(ev.id)}
                      title="Eliminar evaluación"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4 mt-4">
          {/* Player selector for progress */}
          <div className="flex gap-3">
            <Select
              value={progressPlayerId || ""}
              onValueChange={(v) => setProgressPlayerId(v || null)}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Seleccionar jugador" />
              </SelectTrigger>
              <SelectContent>
                {uniquePlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!progressPlayerId ? (
            <div className="text-center py-16">
              <TrendingUp className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Selecciona un jugador para ver su progreso
              </p>
            </div>
          ) : loadingProgress ? (
            <Card className="p-5 h-80 animate-pulse">
              <div className="h-full bg-muted rounded" />
            </Card>
          ) : chartData.length < 2 ? (
            <div className="text-center py-16">
              <TrendingUp className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Se necesitan al menos 2 evaluaciones para mostrar el progreso
              </p>
            </div>
          ) : (
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="size-4 text-[#C1D82F]" />
                Tracking de Progreso
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a2332",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="Técnica" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Táctica" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Física" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Mental" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="General" stroke="#C1D82F" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
