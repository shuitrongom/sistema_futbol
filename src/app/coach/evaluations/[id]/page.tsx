"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RadarChart from "@/components/charts/RadarChart";
import type { RadarDataPoint } from "@/components/charts/RadarChart";
import {
  ArrowLeft,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Calendar,
  User,
  Trash2,
} from "lucide-react";

type Evaluation = {
  id: string;
  playerId: string;
  context: string;
  evaluationDate: string;
  ballControl: number | null;
  passing: number | null;
  dribbling: number | null;
  shooting: number | null;
  heading: number | null;
  weakFoot: number | null;
  technicalAvg: number | null;
  technicalComments: string | null;
  positioning: number | null;
  gameVision: number | null;
  decisionMaking: number | null;
  systemUnderstanding: number | null;
  tacticalAvg: number | null;
  tacticalComments: string | null;
  speed: number | null;
  endurance: number | null;
  strength: number | null;
  agility: number | null;
  coordination: number | null;
  physicalAvg: number | null;
  physicalComments: string | null;
  concentration: number | null;
  attitude: number | null;
  leadership: number | null;
  teamwork: number | null;
  resilience: number | null;
  mentalAvg: number | null;
  mentalComments: string | null;
  overallAvg: number | null;
  topStrengths: { key: string; label: string; value: number }[] | null;
  topWeaknesses: { key: string; label: string; value: number }[] | null;
  positionMetrics: { position: string; metrics: Record<string, number> } | null;
  player: { id: string; fullName: string; position: string; photoUrl: string | null };
  evaluator: { id: string; fullName: string } | null;
  team: { id: string; name: string } | null;
};

const CONTEXT_LABELS: Record<string, string> = {
  match: "Partido",
  training: "Entrenamiento",
  formal: "Evaluación formal",
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

const POS_METRIC_LABELS: Record<string, string> = {
  reflexes: "Reflejos",
  distribution: "Distribución",
  aerialCommand: "Dominio aéreo",
  oneOnOne: "Mano a mano",
  tackling: "Entrada",
  aerial: "Juego aéreo",
  marking: "Marcaje",
  coverageRange: "Rango de cobertura",
  passingRange: "Rango de pase",
  vision: "Visión",
  workRate: "Ritmo de trabajo",
  ballRetention: "Retención de balón",
  finishing: "Definición",
  movement: "Movimiento",
  holdUpPlay: "Juego de espaldas",
  composure: "Compostura",
};

function RatingBar({ label, value, prevValue }: { label: string; value: number; prevValue?: number | null }) {
  const diff = prevValue != null ? value - prevValue : null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-40 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-[#C1D82F] rounded-full transition-all"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="text-sm font-mono tabular-nums w-6 text-right">{value}</span>
      {diff !== null && diff !== 0 && (
        <span className={`text-xs font-medium ${diff > 0 ? "text-green-600" : "text-red-500"}`}>
          {diff > 0 ? "+" : ""}{diff}
        </span>
      )}
    </div>
  );
}

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [previous, setPrevious] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchEvaluation = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluations/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.evaluation);
        setPrevious(data.previous || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Evaluación no encontrada</p>
        <Link href="/coach/evaluations">
          <Button variant="outline" className="mt-4">Volver</Button>
        </Link>
      </div>
    );
  }

  const radarData: RadarDataPoint[] = [
    {
      dimension: "Técnica",
      value: Number(evaluation.technicalAvg) || 0,
      previous: previous ? Number(previous.technicalAvg) || 0 : undefined,
      fullMark: 10,
    },
    {
      dimension: "Táctica",
      value: Number(evaluation.tacticalAvg) || 0,
      previous: previous ? Number(previous.tacticalAvg) || 0 : undefined,
      fullMark: 10,
    },
    {
      dimension: "Física",
      value: Number(evaluation.physicalAvg) || 0,
      previous: previous ? Number(previous.physicalAvg) || 0 : undefined,
      fullMark: 10,
    },
    {
      dimension: "Mental",
      value: Number(evaluation.mentalAvg) || 0,
      previous: previous ? Number(previous.mentalAvg) || 0 : undefined,
      fullMark: 10,
    },
  ];

  const technicalCriteria = [
    { label: "Control de balón", key: "ballControl" },
    { label: "Pase", key: "passing" },
    { label: "Regate", key: "dribbling" },
    { label: "Tiro", key: "shooting" },
    { label: "Juego aéreo", key: "heading" },
    { label: "Pie débil", key: "weakFoot" },
  ];
  const tacticalCriteria = [
    { label: "Posicionamiento", key: "positioning" },
    { label: "Visión de juego", key: "gameVision" },
    { label: "Toma de decisiones", key: "decisionMaking" },
    { label: "Comprensión del sistema", key: "systemUnderstanding" },
  ];
  const physicalCriteria = [
    { label: "Velocidad", key: "speed" },
    { label: "Resistencia", key: "endurance" },
    { label: "Fuerza", key: "strength" },
    { label: "Agilidad", key: "agility" },
    { label: "Coordinación", key: "coordination" },
  ];
  const mentalCriteria = [
    { label: "Concentración", key: "concentration" },
    { label: "Actitud", key: "attitude" },
    { label: "Liderazgo", key: "leadership" },
    { label: "Trabajo en equipo", key: "teamwork" },
    { label: "Resiliencia", key: "resilience" },
  ];

  const ev = evaluation as unknown as Record<string, unknown>;
  const prev = previous as unknown as Record<string, unknown> | null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/coach/evaluations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="size-6 text-[#C1D82F]" />
            Evaluación de {evaluation.player.fullName}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Calendar className="size-3.5" />
            {new Date(evaluation.evaluationDate).toLocaleDateString("es")}
            <Badge variant="outline" className="text-xs">
              {CONTEXT_LABELS[evaluation.context] || evaluation.context}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {POSITION_LABELS[evaluation.player.position] || evaluation.player.position}
            </Badge>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <div className="text-3xl font-bold text-[#C1D82F]">
              {Number(evaluation.overallAvg).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Promedio General</div>
          </div>
          <button
            onClick={async () => {
              if (!confirm("¿Estás seguro de eliminar esta evaluación? No se puede deshacer.")) return;
              setDeleting(true);
              try {
                const res = await fetch(`/api/evaluations/${evaluation.id}`, { method: "DELETE" });
                if (res.ok) router.push("/coach/evaluations");
              } catch { /* ignore */ }
              finally { setDeleting(false); }
            }}
            disabled={deleting}
            title="Eliminar evaluación"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Radar Chart + Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Perfil Multidimensional</h3>
          <RadarChart data={radarData} showPrevious={!!previous} />
          {previous && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Comparación con evaluación del{" "}
              {new Date(previous.evaluationDate).toLocaleDateString("es")}
            </p>
          )}
        </Card>

        <div className="space-y-4">
          {/* Strengths */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Star className="size-4 text-[#d4af37]" />
              Top 3 Fortalezas
            </h3>
            <div className="space-y-2">
              {(evaluation.topStrengths || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-3.5 text-green-600" />
                    <span className="text-sm">{s.label}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xs">{s.value}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Weaknesses */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-orange-500" />
              Top 3 Debilidades
            </h3>
            <div className="space-y-2">
              {(evaluation.topWeaknesses || []).map((w, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="size-3.5 text-red-500" />
                    <span className="text-sm">{w.label}</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800 text-xs">{w.value}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Dimension Averages */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Promedios por Dimensión</h3>
            <div className="space-y-2">
              {[
                { label: "Técnica", value: evaluation.technicalAvg, prev: previous?.technicalAvg, color: "bg-blue-500" },
                { label: "Táctica", value: evaluation.tacticalAvg, prev: previous?.tacticalAvg, color: "bg-green-500" },
                { label: "Física", value: evaluation.physicalAvg, prev: previous?.physicalAvg, color: "bg-orange-500" },
                { label: "Mental", value: evaluation.mentalAvg, prev: previous?.mentalAvg, color: "bg-purple-500" },
              ].map((d) => {
                const val = Number(d.value) || 0;
                const prevVal = d.prev ? Number(d.prev) : null;
                const diff = prevVal != null ? val - prevVal : null;
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className={`size-2.5 rounded-full ${d.color}`} />
                    <span className="text-sm w-20">{d.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${d.color}`}
                        style={{ width: `${(val / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono tabular-nums w-8 text-right">
                      {val.toFixed(1)}
                    </span>
                    {diff !== null && diff !== 0 && (
                      <span className={`text-xs ${diff > 0 ? "text-green-600" : "text-red-500"}`}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Detailed Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "Técnica", color: "bg-blue-500", criteria: technicalCriteria, comments: evaluation.technicalComments },
          { title: "Táctica", color: "bg-green-500", criteria: tacticalCriteria, comments: evaluation.tacticalComments },
          { title: "Física", color: "bg-orange-500", criteria: physicalCriteria, comments: evaluation.physicalComments },
          { title: "Mental", color: "bg-purple-500", criteria: mentalCriteria, comments: evaluation.mentalComments },
        ].map((section) => (
          <Card key={section.title} className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`size-3 rounded-full ${section.color}`} />
              <h3 className="font-semibold">{section.title}</h3>
            </div>
            <div className="space-y-2.5">
              {section.criteria.map((c) => (
                <RatingBar
                  key={c.key}
                  label={c.label}
                  value={(ev[c.key] as number) || 0}
                  prevValue={prev ? (prev[c.key] as number) : null}
                />
              ))}
            </div>
            {section.comments && (
              <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                {section.comments}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Position Metrics */}
      {evaluation.positionMetrics && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-[#d4af37]" />
            <h3 className="font-semibold">
              Métricas de Posición ({POSITION_LABELS[evaluation.positionMetrics.position] || evaluation.positionMetrics.position})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {Object.entries(evaluation.positionMetrics.metrics).map(([key, value]) => (
              <RatingBar
                key={key}
                label={POS_METRIC_LABELS[key] || key}
                value={value as number}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Evaluator info */}
      {evaluation.evaluator && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <User className="size-3" />
          Evaluado por {evaluation.evaluator.fullName}
          {evaluation.team && <> · {evaluation.team.name}</>}
        </div>
      )}
    </div>
  );
}
