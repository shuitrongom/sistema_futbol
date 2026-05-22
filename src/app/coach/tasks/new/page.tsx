"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  ArrowLeft,
  Zap,
  Users,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";

type TeamPlayerEntry = {
  id: string;
  leftAt?: string | null;
  player: {
    id: string;
    fullName: string;
    position: string;
  };
  jerseyNumber: number;
};

type PredefinedTask = {
  title: string;
  description: string;
  taskType: string;
  completionCriteria: string;
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

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "POR",
  defender: "DEF",
  midfielder: "MED",
  forward: "DEL",
};

export default function NewTaskPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<TeamPlayerEntry[]>([]);
  const [predefined, setPredefined] = useState<PredefinedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [completionCriteria, setCompletionCriteria] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const tid = session?.user?.teamId;
      if (!tid) return;
      setTeamId(tid);

      const [teamRes, predefinedRes] = await Promise.all([
        fetch(`/api/teams/${tid}`),
        fetch("/api/tasks?predefined=true"),
      ]);

      if (teamRes.ok) {
        const data = await teamRes.json();
        setPlayers((data.teamPlayers || []).filter((p: TeamPlayerEntry) => !p.leftAt));
      }
      if (predefinedRes.ok) {
        setPredefined(await predefinedRes.json());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map((p) => p.player.id)));
    }
  };

  const applyPredefined = (task: PredefinedTask) => {
    setTitle(task.title);
    setDescription(task.description);
    setTaskType(task.taskType);
    setCompletionCriteria(task.completionCriteria);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || selectedPlayers.size === 0) {
      setError("Debe seleccionar al menos un jugador");
      return;
    }
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          title: title.trim(),
          description: description.trim() || undefined,
          taskType: taskType || undefined,
          deadline: deadline || undefined,
          completionCriteria: completionCriteria.trim() || undefined,
          playerIds: Array.from(selectedPlayers),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear la tarea");
        return;
      }

      router.push("/coach/tasks");
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="size-6 text-[#C1D82F]" />
            Nueva Tarea
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Asigna una tarea individual a uno o más jugadores
          </p>
        </div>
      </div>

      {/* Predefined quick tasks */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
          <Zap className="size-4 text-[#d4af37]" />
          Tareas Predefinidas Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {predefined.map((pt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPredefined(pt)}
              className="text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[pt.taskType] || ""}`}>
                  {TYPE_LABELS[pt.taskType] || pt.taskType}
                </Badge>
                <span className="text-sm font-medium truncate">{pt.title}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="size-4" />
            Detalles de la Tarea
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium">Título *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Practicar pie débil 30 min diarios" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la tarea en detalle..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={taskType} onValueChange={(v) => setTaskType(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Técnica</SelectItem>
                  <SelectItem value="tactical">Táctica</SelectItem>
                  <SelectItem value="physical">Física</SelectItem>
                  <SelectItem value="mental">Mental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="size-3.5" />
                Fecha Límite
              </label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Criterios de Completitud</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all resize-y"
              value={completionCriteria}
              onChange={(e) => setCompletionCriteria(e.target.value)}
              placeholder="¿Cómo se determina que la tarea está completa?"
            />
          </div>
        </Card>

        {/* Player selection */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="size-4" />
              Asignar Jugadores *
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={selectAll} className="text-xs">
              {selectedPlayers.size === players.length ? "Deseleccionar todos" : "Seleccionar todos"}
            </Button>
          </div>

          {selectedPlayers.size > 0 && (
            <p className="text-xs text-muted-foreground">{selectedPlayers.size} jugador{selectedPlayers.size !== 1 ? "es" : ""} seleccionado{selectedPlayers.size !== 1 ? "s" : ""}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {players.map((tp) => {
              const isSelected = selectedPlayers.has(tp.player.id);
              return (
                <button
                  key={tp.player.id}
                  type="button"
                  onClick={() => togglePlayer(tp.player.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    isSelected ? "border-[#C1D82F] bg-[#C1D82F]/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSelected ? "bg-[#C1D82F] text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {tp.jerseyNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{tp.player.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {POSITION_LABELS[tp.player.position] || tp.player.position}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="size-5 rounded-full bg-[#C1D82F] flex items-center justify-center shrink-0">
                      <CheckSquare className="size-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 font-semibold shadow-lg shadow-[#C1D82F]/20">
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckSquare className="size-4 mr-2" />}
            Crear Tarea
          </Button>
        </div>
      </form>
    </div>
  );
}
