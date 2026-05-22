"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ArrowLeft, Loader2, TrendingUp, Star, AlertTriangle } from "lucide-react";

interface Evaluation {
  id: string;
  evaluationDate: string;
  context: string;
  technicalAvg: number | null;
  tacticalAvg: number | null;
  physicalAvg: number | null;
  mentalAvg: number | null;
  overallAvg: number | null;
  topStrengths: string[] | null;
  topWeaknesses: string[] | null;
}

interface ProgressData {
  evaluations: Evaluation[];
  trends: {
    date: string;
    technical: number;
    tactical: number;
    physical: number;
    mental: number;
    overall: number;
  }[];
}


const SKILL_LABELS: Record<string, string> = {
  ball_control: "Control",
  passing: "Pases",
  dribbling: "Regate",
  shooting: "Tiro",
  heading: "Cabeceo",
  weak_foot: "Pie débil",
  positioning: "Posicionamiento",
  game_vision: "Visión",
  decision_making: "Decisión",
  system_understanding: "Comprensión",
  speed: "Velocidad",
  endurance: "Resistencia",
  strength: "Fuerza",
  agility: "Agilidad",
  coordination: "Coordinación",
  concentration: "Concentración",
  attitude: "Actitud",
  leadership: "Liderazgo",
  teamwork: "Trabajo equipo",
  resilience: "Resiliencia",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ChildStatsPage() {
  const params = useParams();
  const playerId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [evalsRes, progressRes] = await Promise.all([
          fetch(`/api/evaluations?playerId=${playerId}`),
          fetch(`/api/evaluations/player/${playerId}/progress`),
        ]);

        if (evalsRes.ok) {
          const data = await evalsRes.json();
          setEvaluations(data);
        }

        if (progressRes.ok) {
          const data = await progressRes.json();
          setProgress(data);
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

  const latestEval = evaluations[0];

  // Build radar data from latest evaluation
  const radarData = latestEval
    ? [
        { dimension: "Técnica", value: parseFloat(String(latestEval.technicalAvg)) || 0, fullMark: 10 },
        { dimension: "Táctica", value: parseFloat(String(latestEval.tacticalAvg)) || 0, fullMark: 10 },
        { dimension: "Física", value: parseFloat(String(latestEval.physicalAvg)) || 0, fullMark: 10 },
        { dimension: "Mental", value: parseFloat(String(latestEval.mentalAvg)) || 0, fullMark: 10 },
      ]
    : [];

  // Build progress line data
  const progressData = progress?.trends?.length
    ? progress.trends.map((t) => ({
        date: formatDate(t.date),
        Técnica: t.technical,
        Táctica: t.tactical,
        Física: t.physical,
        Mental: t.mental,
      }))
    : evaluations
        .slice()
        .reverse()
        .map((ev) => ({
          date: formatDate(ev.evaluationDate),
          Técnica: parseFloat(String(ev.technicalAvg)) || 0,
          Táctica: parseFloat(String(ev.tacticalAvg)) || 0,
          Física: parseFloat(String(ev.physicalAvg)) || 0,
          Mental: parseFloat(String(ev.mentalAvg)) || 0,
        }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/parent/children/${playerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#1a472a]">Estadísticas Detalladas</h1>
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay evaluaciones disponibles aún.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Radar Chart - Latest Evaluation */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="size-5 text-[#d4af37]" />
                  Perfil Multidimensional
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Última evaluación: {formatDate(latestEval.evaluationDate)}
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fill: "#374151", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 10]}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                    />
                    <Radar
                      name="Evaluación"
                      dataKey="value"
                      stroke="#1a472a"
                      fill="#1a472a"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fortalezas y Debilidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#1a472a] mb-2 flex items-center gap-1">
                    <TrendingUp className="size-4" /> Fortalezas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(latestEval.topStrengths || []).map((s) => (
                      <Badge key={s} className="bg-[#1a472a]/10 text-[#1a472a]">
                        {SKILL_LABELS[s] || s}
                      </Badge>
                    ))}
                    {(!latestEval.topStrengths || latestEval.topStrengths.length === 0) && (
                      <p className="text-sm text-muted-foreground">Sin datos</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e63946] mb-2 flex items-center gap-1">
                    <AlertTriangle className="size-4" /> Áreas de Mejora
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(latestEval.topWeaknesses || []).map((w) => (
                      <Badge key={w} variant="outline" className="border-[#e63946]/30 text-[#e63946]">
                        {SKILL_LABELS[w] || w}
                      </Badge>
                    ))}
                    {(!latestEval.topWeaknesses || latestEval.topWeaknesses.length === 0) && (
                      <p className="text-sm text-muted-foreground">Sin datos</p>
                    )}
                  </div>
                </div>

                {/* Dimension scores */}
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm font-medium mb-2">Promedios por Dimensión</p>
                  {radarData.map((d) => (
                    <div key={d.dimension} className="flex items-center gap-3">
                      <span className="text-sm w-20">{d.dimension}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1a472a]"
                          style={{ width: `${(d.value / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono font-bold w-8 text-right">
                        {d.value.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Tracking */}
          {progressData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="size-5 text-[#1a472a]" />
                  Progreso Temporal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Técnica" stroke="#1a472a" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Táctica" stroke="#d4af37" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Física" stroke="#e63946" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Mental" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Evaluation History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial de Evaluaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluations.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{formatDate(ev.evaluationDate)}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {ev.context === "match" ? "Partido" : ev.context === "training" ? "Entrenamiento" : "Formal"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#1a472a]">
                        {parseFloat(String(ev.overallAvg))?.toFixed(1) || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">General</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
