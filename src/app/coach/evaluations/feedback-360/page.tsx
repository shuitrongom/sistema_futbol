"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Users,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  UserPlus,
} from "lucide-react";

type Player = {
  id: string;
  fullName: string;
  position: string;
  photoUrl: string | null;
};

type Evaluator = {
  id: string;
  evaluatorId: string;
  status: string;
  evaluator: { id: string; fullName: string };
};

type Session = {
  id: string;
  status: string;
  createdAt: string;
  player: Player;
  coach: { id: string; fullName: string };
  evaluators: Evaluator[];
};

type ConsolidatedCriterion = {
  key: string;
  label: string;
  average: number;
  hasDiscrepancy: boolean;
  min: number;
  max: number;
  scores: { evaluatorId: string; evaluatorName: string; value: number }[];
};

type ConsolidatedReport = {
  criteria: ConsolidatedCriterion[];
  dimensionAverages: {
    technical: number;
    tactical: number;
    physical: number;
    mental: number;
    overall: number;
  };
  completedCount: number;
  totalEvaluators: number;
  discrepancies: ConsolidatedCriterion[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-800", icon: Users },
  completed: { label: "Completada", color: "bg-green-100 text-green-800", icon: CheckCircle },
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

export default function Feedback360Page() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<string | null>(null);
  const [report, setReport] = useState<ConsolidatedReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Create form state
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedEvaluators, setSelectedEvaluators] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.user?.teamId) setTeamId(session.user.teamId);
    } catch { /* ignore */ }
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluations/feedback-360?teamId=${teamId}`);
      if (res.ok) setSessions(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [teamId]);

  const fetchPlayers = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/players`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.players || data || []).map(
          (tp: { player?: Player } & Player) => (tp.player ? tp.player : tp)
        );
        setPlayers(list);
      }
    } catch { /* ignore */ }
  }, [teamId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { fetchSessions(); fetchPlayers(); }, [fetchSessions, fetchPlayers]);

  const handleCreate = async () => {
    if (!selectedPlayer || selectedEvaluators.length === 0 || !teamId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/evaluations/feedback-360", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: selectedPlayer,
          teamId,
          evaluatorIds: selectedEvaluators,
        }),
      });
      if (res.ok) {
        setCreateOpen(false);
        setSelectedPlayer("");
        setSelectedEvaluators([]);
        fetchSessions();
      }
    } catch { /* ignore */ }
    finally { setCreating(false); }
  };

  const viewReport = async (sessionId: string) => {
    setDetailSession(sessionId);
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/evaluations/feedback-360/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch { /* ignore */ }
    finally { setLoadingReport(false); }
  };

  const toggleEvaluator = (id: string) => {
    setSelectedEvaluators((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const filtered = sessions.filter((s) => {
    if (!searchQuery) return true;
    return s.player.fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const detailData = sessions.find((s) => s.id === detailSession);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="size-6 text-[#C1D82F]" />
            Feedback 360°
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Evaluaciones multi-perspectiva de jugadores
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 font-semibold shadow-lg shadow-[#C1D82F]/20">
              <Plus className="size-4" />
              Nueva Sesión 360
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Sesión Feedback 360°</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Jugador</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar jugador" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName} - {POSITION_LABELS[p.position] || p.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Evaluadores ({selectedEvaluators.length} seleccionados)
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Ingrese IDs de evaluadores (asistentes, preparadores, etc.)
                </p>
                <div className="flex gap-2">
                  <Input
                    id="evaluator-input"
                    placeholder="ID del evaluador (UUID)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const input = e.currentTarget;
                        const val = input.value.trim();
                        if (val && !selectedEvaluators.includes(val)) {
                          setSelectedEvaluators((prev) => [...prev, val]);
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const input = document.getElementById("evaluator-input") as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val && !selectedEvaluators.includes(val)) {
                        setSelectedEvaluators((prev) => [...prev, val]);
                        input.value = "";
                      }
                    }}
                  >
                    <UserPlus className="size-4" />
                  </Button>
                </div>
                {selectedEvaluators.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedEvaluators.map((id) => (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => toggleEvaluator(id)}
                      >
                        {id.slice(0, 8)}... ✕
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                className="w-full bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 font-semibold shadow-lg shadow-[#C1D82F]/20"
                disabled={!selectedPlayer || selectedEvaluators.length === 0 || creating}
                onClick={handleCreate}
              >
                {creating ? "Creando..." : "Crear Sesión y Notificar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por jugador..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">No hay sesiones de Feedback 360</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const completed = s.evaluators.filter((e) => e.status === "completed").length;
            return (
              <Card key={s.id} className="p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{s.player.fullName}</h3>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {POSITION_LABELS[s.player.position] || s.player.position}
                    </Badge>
                  </div>
                  <Badge className={`text-[10px] ${statusCfg.color}`}>
                    <StatusIcon className="size-3 mr-1" />
                    {statusCfg.label}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {completed}/{s.evaluators.length} evaluadores completados
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#C1D82F] rounded-full transition-all"
                      style={{
                        width: `${s.evaluators.length > 0 ? (completed / s.evaluators.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Creada: {new Date(s.createdAt).toLocaleDateString("es")}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => viewReport(s.id)}
                >
                  <Eye className="size-3.5" />
                  Ver Resultados
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={!!detailSession} onOpenChange={(open) => { if (!open) setDetailSession(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-[#C1D82F]" />
              Reporte Consolidado - {detailData?.player.fullName}
            </DialogTitle>
          </DialogHeader>

          {loadingReport ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-40 bg-muted rounded" />
            </div>
          ) : !report ? (
            <p className="text-muted-foreground py-8 text-center">No hay datos disponibles</p>
          ) : (
            <div className="space-y-6 mt-2">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Evaluadores</p>
                  <p className="text-lg font-bold">{report.completedCount}/{report.totalEvaluators}</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Promedio General</p>
                  <p className="text-lg font-bold text-[#C1D82F]">
                    {report.dimensionAverages.overall.toFixed(1)}
                  </p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Discrepancias</p>
                  <p className={`text-lg font-bold ${report.discrepancies.length > 0 ? "text-red-600" : "text-green-600"}`}>
                    {report.discrepancies.length}
                  </p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Consenso</p>
                  <p className="text-lg font-bold text-green-600">
                    {report.criteria.length > 0
                      ? Math.round(((report.criteria.length - report.discrepancies.length) / report.criteria.length) * 100)
                      : 0}%
                  </p>
                </Card>
              </div>

              {/* Dimension Averages */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Promedios por Dimensión</h4>
                <div className="space-y-2">
                  {[
                    { label: "Técnica", value: report.dimensionAverages.technical, color: "bg-blue-500" },
                    { label: "Táctica", value: report.dimensionAverages.tactical, color: "bg-green-500" },
                    { label: "Física", value: report.dimensionAverages.physical, color: "bg-orange-500" },
                    { label: "Mental", value: report.dimensionAverages.mental, color: "bg-purple-500" },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-20">{d.label}</span>
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.color}`}
                          style={{ width: `${(d.value / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-8 text-right">{d.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discrepancies Section */}
              {report.discrepancies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-red-700">
                    <AlertTriangle className="size-4" />
                    Discrepancias Detectadas ({report.discrepancies.length})
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Criterios donde los evaluadores difieren en más de 3 puntos
                  </p>
                  <div className="space-y-3">
                    {report.discrepancies.map((disc) => (
                      <Card key={disc.key} className="p-3 border-red-200 bg-red-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{disc.label}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Rango: {disc.min} - {disc.max}
                            </span>
                            <Badge variant="destructive" className="text-[10px]">
                              Δ {disc.max - disc.min}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {disc.scores.map((score) => (
                            <div
                              key={score.evaluatorId}
                              className="text-xs bg-white rounded px-2 py-1 border"
                            >
                              <span className="text-muted-foreground">{score.evaluatorName}:</span>{" "}
                              <span className="font-mono font-semibold">{score.value}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* All Criteria with Consensus Indicators */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Detalle por Criterio</h4>
                <div className="space-y-1.5">
                  {report.criteria.map((c) => (
                    <div
                      key={c.key}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${
                        c.hasDiscrepancy ? "bg-red-50 border border-red-200" : "bg-muted/30"
                      }`}
                    >
                      <span className="w-44 truncate font-medium">{c.label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.hasDiscrepancy ? "bg-red-400" : "bg-[#C1D82F]"}`}
                          style={{ width: `${(c.average / 10) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono w-8 text-right">{c.average.toFixed(1)}</span>
                      {c.hasDiscrepancy ? (
                        <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
                      ) : (
                        <CheckCircle className="size-3.5 text-green-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
