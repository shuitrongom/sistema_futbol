"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";

type Player = {
  id: string;
  fullName: string;
  position: string;
  jerseyNumber: number;
};

const DIMENSIONS = {
  technical: {
    label: "Técnica",
    color: "bg-blue-500",
    criteria: [
      { key: "ballControl", label: "Control de balón" },
      { key: "passing", label: "Pase" },
      { key: "dribbling", label: "Regate" },
      { key: "shooting", label: "Tiro" },
      { key: "heading", label: "Juego aéreo" },
      { key: "weakFoot", label: "Pie débil" },
    ],
  },
  tactical: {
    label: "Táctica",
    color: "bg-green-500",
    criteria: [
      { key: "positioning", label: "Posicionamiento" },
      { key: "gameVision", label: "Visión de juego" },
      { key: "decisionMaking", label: "Toma de decisiones" },
      { key: "systemUnderstanding", label: "Comprensión del sistema" },
    ],
  },
  physical: {
    label: "Física",
    color: "bg-orange-500",
    criteria: [
      { key: "speed", label: "Velocidad" },
      { key: "endurance", label: "Resistencia" },
      { key: "strength", label: "Fuerza" },
      { key: "agility", label: "Agilidad" },
      { key: "coordination", label: "Coordinación" },
    ],
  },
  mental: {
    label: "Mental",
    color: "bg-purple-500",
    criteria: [
      { key: "concentration", label: "Concentración" },
      { key: "attitude", label: "Actitud" },
      { key: "leadership", label: "Liderazgo" },
      { key: "teamwork", label: "Trabajo en equipo" },
      { key: "resilience", label: "Resiliencia" },
    ],
  },
};

const POSITION_METRICS: Record<string, { key: string; label: string }[]> = {
  goalkeeper: [
    { key: "reflexes", label: "Reflejos" },
    { key: "distribution", label: "Distribución" },
    { key: "aerialCommand", label: "Dominio aéreo" },
    { key: "oneOnOne", label: "Mano a mano" },
  ],
  defender: [
    { key: "tackling", label: "Entrada" },
    { key: "aerial", label: "Juego aéreo" },
    { key: "marking", label: "Marcaje" },
    { key: "coverageRange", label: "Rango de cobertura" },
  ],
  midfielder: [
    { key: "passingRange", label: "Rango de pase" },
    { key: "vision", label: "Visión" },
    { key: "workRate", label: "Ritmo de trabajo" },
    { key: "ballRetention", label: "Retención de balón" },
  ],
  forward: [
    { key: "finishing", label: "Definición" },
    { key: "movement", label: "Movimiento" },
    { key: "holdUpPlay", label: "Juego de espaldas" },
    { key: "composure", label: "Compostura" },
  ],
};

const CONTEXT_OPTIONS = [
  { value: "match", label: "Partido" },
  { value: "training", label: "Entrenamiento" },
  { value: "formal", label: "Evaluación formal" },
];

function Slider({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const getColor = (v: number) => {
    if (v < 5) return { bg: "bg-red-500", text: "text-red-400", shadow: "shadow-red-500/30", track: "#ef4444" };
    if (v === 5) return { bg: "bg-yellow-500", text: "text-yellow-400", shadow: "shadow-yellow-500/30", track: "#eab308" };
    return { bg: "bg-green-500", text: "text-green-400", shadow: "shadow-green-500/30", track: "#22c55e" };
  };
  const color = getColor(value);
  const pct = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <span className={`text-lg font-bold tabular-nums ${color.text} transition-colors duration-200`}>
          {value}
        </span>
      </div>
      <div className="relative h-8 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-white/5" />
        {/* Filled track */}
        <div
          className="absolute left-0 h-2 rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, backgroundColor: color.track }}
        />
        {/* Thumb */}
        <div
          className={`absolute w-5 h-5 rounded-full ${color.bg} shadow-lg ${color.shadow} border-2 border-white/20 transition-all duration-200 z-10`}
          style={{ left: `calc(${pct}% - 10px)` }}
        />
        {/* Invisible range input */}
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
      </div>
      {/* Tick labels aligned to actual slider positions */}
      <div className="relative h-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const pos = ((n - 1) / 9) * 100;
          return (
            <span
              key={n}
              className={`absolute text-[10px] -translate-x-1/2 ${
                n === value ? `${color.text} font-bold` : "text-white/20"
              } transition-colors duration-200`}
              style={{ left: `${pos}%` }}
            >
              {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [context, setContext] = useState("training");
  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [posMetrics, setPosMetrics] = useState<Record<string, number>>({});
  const [teamId, setTeamId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize all ratings to 5
  useEffect(() => {
    const initial: Record<string, number> = {};
    Object.values(DIMENSIONS).forEach((dim) => {
      dim.criteria.forEach((c) => {
        initial[c.key] = 5;
      });
    });
    setRatings(initial);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const tid = session?.user?.teamId;
      if (!tid) return;
      setTeamId(tid);

      const playersRes = await fetch(`/api/teams/${tid}/players`);
      if (playersRes.ok) {
        const data = await playersRes.json();
        const activePlayers = (data.players || data || [])
          .filter((p: { leftAt: string | null }) => !p.leftAt)
          .map((p: { playerId?: string; player?: Player; jerseyNumber: number }) => ({
            id: p.player?.id || p.playerId,
            fullName: p.player?.fullName || "",
            position: p.player?.position || "",
            jerseyNumber: p.jerseyNumber,
          }));
        setPlayers(activePlayers);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize position metrics when player changes
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  useEffect(() => {
    if (selectedPlayer?.position) {
      const metrics = POSITION_METRICS[selectedPlayer.position] || [];
      const initial: Record<string, number> = {};
      metrics.forEach((m) => {
        initial[m.key] = 5;
      });
      setPosMetrics(initial);
    }
  }, [selectedPlayer?.position, selectedPlayerId]);

  const handleSave = async () => {
    if (!selectedPlayerId || !teamId) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        playerId: selectedPlayerId,
        teamId,
        context,
        evaluationDate,
        ...ratings,
        technicalComments: comments.technical || null,
        tacticalComments: comments.tactical || null,
        physicalComments: comments.physical || null,
        mentalComments: comments.mental || null,
      };

      if (selectedPlayer?.position && Object.keys(posMetrics).length > 0) {
        body.positionMetrics = {
          position: selectedPlayer.position,
          metrics: posMetrics,
        };
      }

      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/coach/evaluations/${data.id}`);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const positionLabel = (pos: string) => {
    const labels: Record<string, string> = {
      goalkeeper: "Portero",
      defender: "Defensa",
      midfielder: "Mediocampista",
      forward: "Delantero",
    };
    return labels[pos] || pos;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/coach/evaluations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="size-6 text-[#C1D82F]" />
            Nueva Evaluación
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Evaluación multidimensional del jugador
          </p>
        </div>
      </div>

      {/* Player & Context Selection */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="size-4" />
          Información General
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Jugador</Label>
            <Select value={selectedPlayerId} onValueChange={(v) => setSelectedPlayerId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar jugador" />
              </SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    #{p.jerseyNumber} {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Contexto</Label>
            <Select value={context} onValueChange={(v) => setContext(v ?? "training")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEXT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
            />
          </div>
        </div>
        {selectedPlayer && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{positionLabel(selectedPlayer.position)}</Badge>
            <span>#{selectedPlayer.jerseyNumber}</span>
          </div>
        )}
      </Card>

      {/* Dimension Ratings */}
      {Object.entries(DIMENSIONS).map(([dimKey, dim]) => (
        <Card key={dimKey} className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className={`size-3 rounded-full ${dim.color}`} />
            <h2 className="font-semibold">{dim.label}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {dim.criteria.map((c) => (
              <Slider
                key={c.key}
                label={c.label}
                value={ratings[c.key] ?? 5}
                onChange={(v) => setRatings((prev) => ({ ...prev, [c.key]: v }))}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Comentarios ({dim.label})
            </Label>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white placeholder:text-white/30 min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all"
              placeholder={`Comentarios sobre ${dim.label.toLowerCase()}...`}
              value={comments[dimKey] || ""}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, [dimKey]: e.target.value }))
              }
            />
          </div>
        </Card>
      ))}

      {/* Position-specific metrics */}
      {selectedPlayer?.position && POSITION_METRICS[selectedPlayer.position] && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-[#d4af37]" />
            <h2 className="font-semibold">
              Métricas de Posición ({positionLabel(selectedPlayer.position)})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {POSITION_METRICS[selectedPlayer.position].map((m) => (
              <Slider
                key={m.key}
                label={m.label}
                value={posMetrics[m.key] ?? 5}
                onChange={(v) =>
                  setPosMetrics((prev) => ({ ...prev, [m.key]: v }))
                }
              />
            ))}
          </div>
        </Card>
      )}

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Link href="/coach/evaluations">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button
          className="gap-1.5 bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 font-semibold shadow-lg shadow-[#C1D82F]/20"
          onClick={handleSave}
          disabled={!selectedPlayerId || saving}
        >
          <Save className="size-4" />
          {saving ? "Guardando..." : "Guardar Evaluación"}
        </Button>
      </div>
    </div>
  );
}
