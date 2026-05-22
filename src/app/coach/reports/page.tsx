"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  FileText,
  Plus,
  Search,
  Calendar,
  User,
  Download,
  Loader2,
  Clock,
  Trash2,
} from "lucide-react";

type Report = {
  id: string;
  periodStart: string;
  periodEnd: string;
  reportType: string | null;
  content: {
    sections?: string[];
    coachComments?: string;
  };
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
  player: { id: string; fullName: string; position: string };
  coach: { id: string; fullName: string } | null;
  team: { id: string; name: string } | null;
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  semester: "Semestral",
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  monthly: "bg-blue-100 text-blue-800",
  quarterly: "bg-purple-100 text-purple-800",
  semester: "bg-amber-100 text-amber-800",
};

const SECTION_LABELS: Record<string, string> = {
  evaluations: "Evaluaciones",
  progress: "Progreso",
  tasks: "Tareas",
  objectives: "Objetivos",
  feedback: "Feedback",
  coachComments: "Comentarios",
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTeamId = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.user?.teamId) setTeamId(session.user.teamId);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchReports = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ teamId });
      if (filterPlayer !== "all") params.set("playerId", filterPlayer);
      if (filterType !== "all") params.set("reportType", filterType);

      const res = await fetch(`/api/reports?${params}`);
      if (res.ok) setReports(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [teamId, filterPlayer, filterType]);

  useEffect(() => {
    fetchTeamId();
  }, [fetchTeamId]);
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Unique players
  const uniquePlayers = Array.from(
    new Map(reports.map((r) => [r.player.id, r.player])).values()
  );

  // Delete report
  const handleDeleteReport = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este reporte? No se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (res.ok) fetchReports();
    } catch { /* ignore */ }
  };

  // Filter by search
  const filtered = reports.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.player.fullName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="size-6 text-[#C1D82F]" />
            Reportes de Progreso
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {reports.length} reporte{reports.length !== 1 ? "s" : ""} generado
            {reports.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/coach/reports/generate">
          <Button className="gap-1.5 bg-[#C1D82F] text-[#0d1117] hover:bg-[#C1D82F]/90 font-semibold shadow-lg shadow-[#C1D82F]/20">
            <Plus className="size-4" />
            Generar Reporte
          </Button>
        </Link>
      </div>

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
            <SelectValue placeholder="Jugador" />
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
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="quarterly">Trimestral</SelectItem>
            <SelectItem value="semester">Semestral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">No hay reportes generados</p>
          <Link href="/coach/reports/generate">
            <Button variant="outline">Generar primer reporte</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((report) => {
            const typeLabel = report.reportType
              ? REPORT_TYPE_LABELS[report.reportType] || report.reportType
              : "Reporte";
            const typeColor = report.reportType
              ? REPORT_TYPE_COLORS[report.reportType] || ""
              : "";
            const sections = (report.content?.sections || []) as string[];

            return (
              <Card
                key={report.id}
                className="p-5 flex flex-col gap-3 hover:shadow-md hover:border-[#C1D82F]/20 transition-all cursor-pointer"
                onClick={() => router.push(`/coach/reports/${report.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="size-4 text-muted-foreground" />
                      <h3 className="font-semibold leading-tight">
                        {report.player.fullName}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {POSITION_LABELS[report.player.position] || report.player.position}
                      {report.team && ` · ${report.team.name}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`shrink-0 text-[10px] ${typeColor}`}>
                    {typeLabel}
                  </Badge>
                </div>

                {/* Period */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {new Date(report.periodStart).toLocaleDateString("es")} -{" "}
                  {new Date(report.periodEnd).toLocaleDateString("es")}
                </div>

                {/* Sections included */}
                <div className="flex flex-wrap gap-1.5">
                  {sections.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px]">
                      {SECTION_LABELS[s] || s}
                    </Badge>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(report.createdAt).toLocaleDateString("es")}
                  </span>
                  <div className="flex items-center gap-2">
                    {report.pdfUrl && (
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#C1D82F] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="size-3" />
                        PDF
                      </a>
                    )}
                    {report.coach && <span>{report.coach.fullName}</span>}
                    <button
                      onClick={(e) => handleDeleteReport(e, report.id)}
                      title="Eliminar reporte"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
