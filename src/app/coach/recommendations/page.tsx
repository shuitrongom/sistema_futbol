"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Shield,
  Swords,
  Scale,
  ListFilter,
  Trophy,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Users,
  Info,
} from "lucide-react";

// ─── Types (mirror recommendation service) ───

interface FormationRecommendation {
  formation: string;
  name: string;
  style: "offensive" | "defensive" | "balanced";
  description: string;
  strengths: string[];
  weaknesses: string[];
  effectiveness: number;
  clubReference: string;
  justification: string;
}

interface AgeGroupProfile {
  ageGroup: "under10" | "youth" | "advanced";
  label: string;
  avgAge: number;
  philosophy: string;
  formations: FormationRecommendation[];
  tactics: { name: string; description: string; focusAreas: string[]; drills: string[]; clubReference: string }[];
}

interface RecommendationResult {
  teamId: string;
  teamName: string;
  avgAge: number;
  categories: string[];
  ageGroup: "under10" | "youth" | "advanced";
  profile: AgeGroupProfile;
  filteredFormations: FormationRecommendation[];
  generatedAt: string;
  source: string;
}

type StyleFilter = "all" | "offensive" | "defensive" | "balanced";

// ─── Formation pitch position helpers ───

interface PitchPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
}

function getFormationPositions(formation: string): PitchPosition[] {
  const parts = formation.split("-").map(Number);
  const positions: PitchPosition[] = [];

  // Goalkeeper always at bottom
  positions.push({ x: 50, y: 90, label: "POR" });

  // Y positions for each line (from defense to attack)
  const lineCount = parts.length;
  const yPositions = parts.map((_, i) => 75 - i * (55 / Math.max(lineCount - 1, 1)));
  if (lineCount === 1) yPositions[0] = 50;

  const lineLabels = ["DEF", "MED", "DEL"];
  if (lineCount === 4) lineLabels.splice(1, 0, "MCD");
  if (lineCount === 2) {
    lineLabels[0] = "DEF";
    lineLabels[1] = "DEL";
  }

  parts.forEach((count, lineIdx) => {
    const y = yPositions[lineIdx];
    const label = lineLabels[lineIdx] || "JUG";
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? 50 : 15 + (i * 70) / (count - 1);
      positions.push({ x, y, label });
    }
  });

  return positions;
}

// ─── Style helpers ───

const STYLE_CONFIG: Record<StyleFilter, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: "Todos", icon: <ListFilter className="size-4" />, color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
  offensive: { label: "Ofensivo", icon: <Swords className="size-4" />, color: "bg-red-50 text-red-700 hover:bg-red-100" },
  defensive: { label: "Defensivo", icon: <Shield className="size-4" />, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  balanced: { label: "Balanceado", icon: <Scale className="size-4" />, color: "bg-green-50 text-green-700 hover:bg-green-100" },
};

const STYLE_BADGE: Record<string, string> = {
  offensive: "bg-red-100 text-red-800",
  defensive: "bg-blue-100 text-blue-800",
  balanced: "bg-green-100 text-green-800",
};

const STYLE_LABELS: Record<string, string> = {
  offensive: "Ofensivo",
  defensive: "Defensivo",
  balanced: "Balanceado",
};

// ─── Pitch Visualization Component ───

function FormationPitchView({ formation }: { formation: string }) {
  const positions = getFormationPositions(formation);

  return (
    <div className="relative w-full aspect-[68/105] bg-green-700 rounded-lg overflow-hidden border-2 border-green-900 max-w-[280px] mx-auto">
      {/* Pitch markings */}
      <div className="absolute inset-0">
        <div className="absolute inset-2 border border-white/30 rounded" />
        {/* Center line */}
        <div className="absolute top-1/2 left-2 right-2 h-px bg-white/30" />
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/30" />
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/40" />
        {/* Top penalty area */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[44%] h-[15%] border-b border-l border-r border-white/30" />
        {/* Top goal area */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[20%] h-[5%] border-b border-l border-r border-white/30" />
        {/* Bottom penalty area */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[44%] h-[15%] border-t border-l border-r border-white/30" />
        {/* Bottom goal area */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[20%] h-[5%] border-t border-l border-r border-white/30" />
      </div>

      {/* Player dots */}
      {positions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <div className="w-7 h-7 rounded-full bg-white text-green-900 border-2 border-yellow-400 flex items-center justify-center text-[10px] font-bold shadow-lg">
            {idx === 0 ? "POR" : idx}
          </div>
          <span className="text-[9px] text-white mt-0.5 drop-shadow font-medium">
            {pos.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page Component ───

export default function CoachRecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [selectedFormation, setSelectedFormation] = useState<FormationRecommendation | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const teamId = session?.user?.teamId;
        if (!teamId) {
          setError("No tienes un equipo asignado.");
          setLoading(false);
          return;
        }

        const styleParam = styleFilter !== "all" ? `&style=${styleFilter}` : "";
        const res = await fetch(`/api/recommendations?teamId=${teamId}${styleParam}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Error al obtener recomendaciones");
        }

        const result: RecommendationResult = await res.json();
        setData(result);

        // Auto-select first formation if none selected
        if (!selectedFormation && result.filteredFormations.length > 0) {
          setSelectedFormation(result.filteredFormations[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando recomendaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const formations = data.filteredFormations;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="size-6 text-[#d4af37]" />
        <h1 className="text-2xl font-bold">Recomendaciones Inteligentes</h1>
      </div>

      {/* Age group profile */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="size-12 rounded-xl bg-[#C1D82F]/10 flex items-center justify-center shrink-0">
              <Users className="size-6 text-[#C1D82F]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-lg">{data.teamName}</h2>
                <Badge variant="outline">{data.profile.label}</Badge>
                <Badge variant="secondary">Edad promedio: {data.avgAge} años</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{data.profile.philosophy}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Play style filter */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STYLE_CONFIG) as StyleFilter[]).map((style) => {
          const cfg = STYLE_CONFIG[style];
          const isActive = styleFilter === style;
          return (
            <Button
              key={style}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={isActive ? "" : cfg.color}
              onClick={() => {
                setStyleFilter(style);
                setSelectedFormation(null);
              }}
            >
              {cfg.icon}
              <span className="ml-1.5">{cfg.label}</span>
            </Button>
          );
        })}
      </div>

      {formations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No hay formaciones recomendadas para el estilo seleccionado.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Formation cards + pitch visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formation list */}
        <div className="lg:col-span-2 space-y-4">
          {formations.map((f) => {
            const isSelected = selectedFormation?.formation === f.formation && selectedFormation?.name === f.name;
            return (
              <Card
                key={`${f.formation}-${f.name}`}
                className={`cursor-pointer transition-shadow ${isSelected ? "ring-2 ring-[#C1D82F] shadow-lg" : "hover:shadow-md"}`}
                onClick={() => setSelectedFormation(f)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg font-bold text-[#C1D82F]">{f.formation}</span>
                        <span className="font-semibold">{f.name}</span>
                        <Badge className={STYLE_BADGE[f.style]}>{STYLE_LABELS[f.style]}</Badge>
                        <Badge variant="outline" className="text-xs">
                          <Trophy className="size-3 mr-1" />
                          {f.clubReference}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{f.description}</p>

                      {/* Effectiveness bar */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-medium text-muted-foreground w-20">Efectividad</span>
                        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#C1D82F] transition-all"
                            style={{ width: `${f.effectiveness}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-10 text-right">{f.effectiveness}%</span>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                            <ThumbsUp className="size-3" /> Fortalezas
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {f.strengths.map((s) => (
                              <Badge key={s} variant="secondary" className="text-[10px] bg-green-50 text-green-800">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs font-medium text-red-600">
                            <ThumbsDown className="size-3" /> Debilidades
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {f.weaknesses.map((w) => (
                              <Badge key={w} variant="secondary" className="text-[10px] bg-red-50 text-red-800">
                                {w}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Justification */}
                      <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
                        <Info className="size-4 text-[#d4af37] mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{f.justification}</p>
                      </div>
                    </div>

                    <ChevronRight className={`size-5 shrink-0 mt-1 transition-colors ${isSelected ? "text-[#C1D82F]" : "text-muted-foreground"}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pitch visualization (sticky sidebar) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {selectedFormation ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Formación {selectedFormation.formation}
                    <Badge className={STYLE_BADGE[selectedFormation.style]}>
                      {STYLE_LABELS[selectedFormation.style]}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{selectedFormation.name}</p>
                </CardHeader>
                <CardContent>
                  <FormationPitchView formation={selectedFormation.formation} />
                  <div className="mt-3 text-center">
                    <span className="text-xs text-muted-foreground">
                      Efectividad: <span className="font-bold text-[#C1D82F]">{selectedFormation.effectiveness}%</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Selecciona una formación para ver su visualización en cancha.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
