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
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  User,
  Calendar,
  Send,
  Eye,
} from "lucide-react";

type Player = {
  id: string;
  fullName: string;
  position: string;
};

type ReportSection = {
  key: string;
  label: string;
  description: string;
};

const SECTIONS: ReportSection[] = [
  { key: "evaluations", label: "Evaluaciones", description: "Resumen de evaluaciones del período" },
  { key: "progress", label: "Progreso", description: "Tracking de progreso temporal por dimensión" },
  { key: "tasks", label: "Tareas", description: "Tareas asignadas y su estado de cumplimiento" },
  { key: "objectives", label: "Objetivos", description: "Objetivos de desarrollo y progreso" },
  { key: "feedback", label: "Feedback", description: "Feedback personalizado enviado" },
  { key: "coachComments", label: "Comentarios del Entrenador", description: "Notas y observaciones adicionales" },
];

const REPORT_TYPES = [
  { value: "monthly", label: "Mensual" },
  { value: "quarterly", label: "Trimestral" },
  { value: "semester", label: "Semestral" },
];

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

export default function GenerateReportPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>(["evaluations", "progress", "tasks"]);
  const [coachComments, setCoachComments] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const fetchTeamAndPlayers = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const tid = session?.user?.teamId;
      if (!tid) return;
      setTeamId(tid);

      const playersRes = await fetch(`/api/teams/${tid}/players`);
      if (playersRes.ok) {
        const data = await playersRes.json();
        const playerList = (data.players || data || []).map(
          (tp: { player?: Player; id?: string; fullName?: string; position?: string }) =>
            tp.player || tp
        );
        setPlayers(playerList);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamAndPlayers();
  }, [fetchTeamAndPlayers]);

  // Auto-set period based on report type
  useEffect(() => {
    const now = new Date();
    let start: Date;
    const end = now;

    switch (reportType) {
      case "monthly":
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "quarterly":
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "semester":
        start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    setPeriodStart(start.toISOString().split("T")[0]);
    setPeriodEnd(end.toISOString().split("T")[0]);
  }, [reportType]);

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!teamId || !selectedPlayer || selectedSections.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: selectedPlayer,
          teamId,
          periodStart,
          periodEnd,
          reportType,
          sections: selectedSections,
          coachComments: coachComments || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/coach/reports"), 1500);
      }
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlayerData = players.find((p) => p.id === selectedPlayer);
  const isValid = selectedPlayer && periodStart && periodEnd && selectedSections.length > 0;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle2 className="size-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Reporte Generado</h2>
        <p className="text-muted-foreground">Redirigiendo al historial de reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="size-6 text-[#C1D82F]" />
            Generar Reporte de Progreso
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Selecciona jugador, período y secciones a incluir
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Player selection */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="size-4" />
              Jugador
            </h2>
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
          </Card>

          {/* Period and type */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="size-4" />
              Período y Tipo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Sections */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold">Secciones a Incluir</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SECTIONS.map((section) => {
                const isSelected = selectedSections.includes(section.key);
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? "border-[#C1D82F] bg-[#C1D82F]/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{section.label}</span>
                      {isSelected && <CheckCircle2 className="size-4 text-[#C1D82F]" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Coach comments */}
          {selectedSections.includes("coachComments") && (
            <Card className="p-5 space-y-3">
              <h2 className="font-semibold">Comentarios del Entrenador</h2>
              <textarea
                className="w-full min-h-[120px] p-3 rounded-xl border border-white/10 bg-[#1a1f36]/80 text-sm text-white placeholder:text-white/30 resize-y focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all"
                placeholder="Escribe tus observaciones y comentarios sobre el progreso del jugador..."
                value={coachComments}
                onChange={(e) => setCoachComments(e.target.value)}
              />
            </Card>
          )}

          {/* Preview */}
          {showPreview && selectedPlayerData && (
            <Card className="p-5 space-y-3 border-[#C1D82F]/20 bg-[#C1D82F]/5">
              <h2 className="font-semibold">Vista Previa del Reporte</h2>
              <div className="text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">Jugador:</span>{" "}
                  {selectedPlayerData.fullName}
                </p>
                <p>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  {REPORT_TYPES.find((t) => t.value === reportType)?.label}
                </p>
                <p>
                  <span className="text-muted-foreground">Período:</span>{" "}
                  {periodStart && new Date(periodStart).toLocaleDateString("es")} -{" "}
                  {periodEnd && new Date(periodEnd).toLocaleDateString("es")}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSections.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {SECTIONS.find((sec) => sec.key === s)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              disabled={!isValid}
              className="gap-1.5"
            >
              <Eye className="size-4" />
              {showPreview ? "Ocultar Preview" : "Vista Previa"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="gap-1.5 bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 font-semibold shadow-lg shadow-[#C1D82F]/20"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Generar Reporte
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
