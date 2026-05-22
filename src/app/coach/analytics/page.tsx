"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Activity,
  Dumbbell,
  Star,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

// ─── Types ───

interface TrainingCorrelation {
  period: string;
  sessionsExecuted: number;
  avgEffectiveness: number;
  avgEvaluationScore: number;
  improvement: number;
}

interface TemporalTrend {
  period: string;
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
  overall: number;
  evaluationCount: number;
}

interface ExerciseEffectiveness {
  exerciseId: string;
  title: string;
  category: string;
  timesExecuted: number;
  avgRating: number;
  ratings: { period: string; rating: number }[];
}

interface AnalyticsData {
  correlation: TrainingCorrelation[];
  trends: TemporalTrend[];
  exerciseEffectiveness: ExerciseEffectiveness[];
}

// ─── Helpers ───

const CATEGORY_LABELS: Record<string, string> = {
  ball_control: "Control de balón",
  passing: "Pases",
  shooting: "Tiros",
  agility: "Agilidad",
  tactics: "Tácticas",
  physical: "Físico",
  individual: "Individual",
};

const CATEGORY_TYPE: Record<string, "technical" | "tactical"> = {
  ball_control: "technical",
  passing: "technical",
  shooting: "technical",
  agility: "technical",
  individual: "technical",
  tactics: "tactical",
  physical: "tactical",
};

function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

function ratingStars(rating: number): string {
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}

function generateCSV(data: AnalyticsData): string {
  const lines: string[] = [];

  // Exercise effectiveness section
  lines.push("=== Efectividad de Ejercicios ===");
  lines.push("Ejercicio,Categoría,Veces Ejecutado,Calificación Promedio");
  for (const ex of data.exerciseEffectiveness) {
    lines.push(
      `"${ex.title}","${getCategoryLabel(ex.category)}",${ex.timesExecuted},${ex.avgRating}`
    );
  }

  lines.push("");
  lines.push("=== Correlación Entrenamiento-Mejoras ===");
  lines.push("Período,Sesiones Ejecutadas,Efectividad Promedio,Puntuación Evaluación,Mejora");
  for (const c of data.correlation) {
    lines.push(
      `${c.period},${c.sessionsExecuted},${c.avgEffectiveness},${c.avgEvaluationScore},${c.improvement}`
    );
  }

  lines.push("");
  lines.push("=== Tendencia Temporal ===");
  lines.push("Período,Técnica,Táctica,Física,Mental,General,Evaluaciones");
  for (const t of data.trends) {
    lines.push(
      `${t.period},${t.technical},${t.tactical},${t.physical},${t.mental},${t.overall},${t.evaluationCount}`
    );
  }

  return lines.join("\n");
}

function downloadCSV(data: AnalyticsData) {
  const csv = generateCSV(data);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `analisis-entrenamiento-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  window.print();
}

// ─── Component ───

export default function CoachAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const tid = session?.user?.teamId;
        if (!tid) {
          setLoading(false);
          return;
        }
        setTeamId(tid);

        const res = await fetch(`/api/analytics/training-effectiveness?teamId=${tid}`);
        if (res.ok) {
          const result: AnalyticsData = await res.json();
          setData(result);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Approach comparison: group exercises by technical vs tactical
  const approachComparison = useMemo(() => {
    if (!data?.exerciseEffectiveness.length) return [];

    const groups: Record<string, { count: number; totalRating: number }> = {
      technical: { count: 0, totalRating: 0 },
      tactical: { count: 0, totalRating: 0 },
    };

    for (const ex of data.exerciseEffectiveness) {
      const type = CATEGORY_TYPE[ex.category] ?? "technical";
      groups[type].count += ex.timesExecuted;
      groups[type].totalRating += ex.avgRating * ex.timesExecuted;
    }

    return [
      {
        name: "Técnico",
        efectividad:
          groups.technical.count > 0
            ? Math.round((groups.technical.totalRating / groups.technical.count) * 10) / 10
            : 0,
        ejecuciones: groups.technical.count,
      },
      {
        name: "Táctico",
        efectividad:
          groups.tactical.count > 0
            ? Math.round((groups.tactical.totalRating / groups.tactical.count) * 10) / 10
            : 0,
        ejecuciones: groups.tactical.count,
      },
    ];
  }, [data]);

  // Temporal effectiveness trend from exercise ratings grouped by period
  const effectivenessTrend = useMemo(() => {
    if (!data?.exerciseEffectiveness.length) return [];

    const byPeriod = new Map<string, number[]>();
    for (const ex of data.exerciseEffectiveness) {
      for (const r of ex.ratings) {
        const arr = byPeriod.get(r.period) ?? [];
        arr.push(r.rating);
        byPeriod.set(r.period, arr);
      }
    }

    return Array.from(byPeriod.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, ratings]) => ({
        period,
        efectividad:
          Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
        ejercicios: ratings.length,
      }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando análisis...</p>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No tienes un equipo asignado.</p>
      </div>
    );
  }

  const hasData =
    data &&
    (data.exerciseEffectiveness.length > 0 ||
      data.correlation.length > 0 ||
      data.trends.length > 0);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#C1D82F]/10 flex items-center justify-center">
            <BarChart3 className="size-5 text-[#C1D82F]" />
          </div>
          <h1 className="text-2xl font-bold">Análisis de Efectividad</h1>
        </div>
        {hasData && (
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(data!)}
            >
              <Download className="size-4 mr-1.5" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
            >
              <FileText className="size-4 mr-1.5" />
              Exportar PDF
            </Button>
          </div>
        )}
      </div>

      {!hasData && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No hay datos de entrenamiento disponibles. Ejecuta sesiones de entrenamiento y califica la efectividad de los ejercicios para ver análisis aquí.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 1. Exercise Effectiveness Table */}
      {data && data.exerciseEffectiveness.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="size-5 text-[#C1D82F]" />
              Efectividad de Ejercicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ejercicio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Veces Ejecutado</TableHead>
                  <TableHead className="text-center">Calificación Promedio</TableHead>
                  <TableHead className="text-center">Valoración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.exerciseEffectiveness.map((ex) => (
                  <TableRow key={ex.exerciseId}>
                    <TableCell className="font-medium">{ex.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(ex.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{ex.timesExecuted}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-[#C1D82F]">{ex.avgRating}</span>
                      <span className="text-muted-foreground text-xs"> / 5</span>
                    </TableCell>
                    <TableCell className="text-center text-[#d4af37] text-sm tracking-wider">
                      {ratingStars(ex.avgRating)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 2. Training-Improvement Correlation */}
      {data && data.correlation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-5 text-[#d4af37]" />
              Correlación Entrenamiento - Mejoras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.correlation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="sessionsExecuted"
                    name="Sesiones Ejecutadas"
                    fill="#C1D82F"
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgEvaluationScore"
                    name="Puntuación Evaluación"
                    stroke="#d4af37"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="improvement"
                    name="Mejora"
                    stroke="#e63946"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Approach Comparison: Technical vs Tactical */}
      {approachComparison.length > 0 && approachComparison.some((a) => a.ejecuciones > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-5 text-[#e63946]" />
              Comparación de Enfoques: Técnico vs Táctico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={approachComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="efectividad"
                      name="Efectividad Promedio"
                      radius={[4, 4, 0, 0]}
                    >
                      {approachComparison.map((_, index) => (
                        <Cell
                          key={index}
                          fill={index === 0 ? "#C1D82F" : "#d4af37"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-4">
                {approachComparison.map((approach) => (
                  <div
                    key={approach.name}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-semibold">{approach.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {approach.ejecuciones} ejecuciones
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#C1D82F]">
                        {approach.efectividad}
                      </p>
                      <p className="text-xs text-muted-foreground">/ 5 efectividad</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Temporal Effectiveness Trend */}
      {effectivenessTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="size-5 text-[#d4af37]" />
              Tendencia Temporal de Efectividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={effectivenessTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "12px",
                    }}
                    formatter={(value: number | string | undefined, name: string) => {
                      if (name === "Efectividad") return [value, name];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="efectividad"
                    name="Efectividad"
                    stroke="#C1D82F"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#C1D82F" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ejercicios"
                    name="Ejercicios Evaluados"
                    stroke="#d4af37"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
