"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Trophy,
  Target,
  Shield,
  ArrowLeft,
  Loader2,
  Download,
  Users,
  TrendingUp,
} from "lucide-react";
import { exportToCSV } from "@/lib/utils/export-csv";

interface TopScorer {
  playerId: string;
  playerName: string;
  teamName: string | null;
  goals: number;
}

interface TopAssist {
  playerId: string;
  playerName: string;
  teamName: string | null;
  assists: number;
}

interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface TournamentStats {
  topScorers: TopScorer[];
  topAssists: TopAssist[];
  teamMostWins: TeamStanding | null;
  teamMostGoals: TeamStanding | null;
  teamLeastConceded: TeamStanding | null;
  avgGoalsPerMatch: number;
  totalMatches: number;
  totalGoals: number;
}

const CHART_COLORS = ["#1a472a", "#d4af37", "#e63946", "#2563eb", "#059669", "#7c3aed", "#ea580c", "#0891b2"];

export default function TournamentStatsPage() {
  const params = useParams();
  const id = params.id as string;

  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [tournamentName, setTournamentName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, tournamentRes] = await Promise.all([
          fetch(`/api/tournaments/${id}/stats`),
          fetch(`/api/tournaments/${id}`),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (tournamentRes.ok) {
          const t = await tournamentRes.json();
          setTournamentName(t.name || "");
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas.</p>
        <Link href={`/tournaments/${id}`} className="text-[#1a472a] hover:underline text-sm mt-2 inline-block">
          ← Volver al torneo
        </Link>
      </div>
    );
  }

  const scorerChartData = stats.topScorers.slice(0, 10).map((s) => ({
    name: s.playerName.split(" ").slice(-1)[0],
    goles: s.goals,
    fullName: s.playerName,
  }));

  const assistChartData = stats.topAssists.slice(0, 10).map((a) => ({
    name: a.playerName.split(" ").slice(-1)[0],
    asistencias: a.assists,
    fullName: a.playerName,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href={`/tournaments/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-3" />
        Volver al torneo
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="size-6 text-[#d4af37]" />
            Estadísticas del Torneo
          </h1>
          {tournamentName && (
            <p className="text-muted-foreground mt-1">{tournamentName}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportAll(stats, tournamentName)}
        >
          <Download className="size-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Partidos Jugados" value={stats.totalMatches} icon={<Users className="size-4" />} />
        <SummaryCard label="Goles Totales" value={stats.totalGoals} icon={<Target className="size-4" />} />
        <SummaryCard label="Promedio Goles/Partido" value={stats.avgGoalsPerMatch} icon={<TrendingUp className="size-4" />} />
        <SummaryCard label="Goleadores" value={stats.topScorers.length} icon={<Trophy className="size-4" />} />
      </div>

      {/* Team highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.teamMostWins && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Equipo con más victorias</p>
            <p className="font-semibold">{stats.teamMostWins.teamName}</p>
            <Badge variant="secondary" className="mt-1">{stats.teamMostWins.wins} victorias</Badge>
          </Card>
        )}
        {stats.teamMostGoals && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Equipo más goleador</p>
            <p className="font-semibold">{stats.teamMostGoals.teamName}</p>
            <Badge variant="secondary" className="mt-1">{stats.teamMostGoals.goalsFor} goles</Badge>
          </Card>
        )}
        {stats.teamLeastConceded && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Equipo menos goleado</p>
            <p className="font-semibold">{stats.teamLeastConceded.teamName}</p>
            <Badge variant="secondary" className="mt-1">{stats.teamLeastConceded.goalsAgainst} goles en contra</Badge>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Scorers Chart */}
        {scorerChartData.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="size-4 text-[#d4af37]" />
                Goleadores - Gráfico
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    stats.topScorers.map((s) => ({
                      Jugador: s.playerName,
                      Equipo: s.teamName || "",
                      Goles: s.goals,
                    })),
                    `goleadores-${id}`
                  )
                }
              >
                <Download className="size-3" />
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scorerChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value} goles`, "Goles"]}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || String(_label);
                  }}
                />
                <Bar dataKey="goles" radius={[4, 4, 0, 0]}>
                  {scorerChartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top Assists Chart */}
        {assistChartData.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="size-4 text-[#1a472a]" />
                Asistencias - Gráfico
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    stats.topAssists.map((a) => ({
                      Jugador: a.playerName,
                      Equipo: a.teamName || "",
                      Asistencias: a.assists,
                    })),
                    `asistencias-${id}`
                  )
                }
              >
                <Download className="size-3" />
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assistChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value} asistencias`, "Asistencias"]}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || String(_label);
                  }}
                />
                <Bar dataKey="asistencias" radius={[4, 4, 0, 0]}>
                  {assistChartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Scorers Table */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="size-4 text-[#d4af37]" />
              Tabla de Goleadores
            </h3>
          </div>
          {stats.topScorers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-2 w-8">#</th>
                    <th className="pb-2 pr-2">Jugador</th>
                    <th className="pb-2 pr-2">Equipo</th>
                    <th className="pb-2 text-right">Goles</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topScorers.map((scorer, i) => (
                    <tr key={scorer.playerId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className={`py-2 pr-2 font-bold ${i < 3 ? "text-[#d4af37]" : "text-muted-foreground"}`}>
                        {i + 1}
                      </td>
                      <td className="py-2 pr-2">
                        <Link href={`/players/${scorer.playerId}`} className="hover:underline font-medium">
                          {scorer.playerName}
                        </Link>
                      </td>
                      <td className="py-2 pr-2 text-muted-foreground">{scorer.teamName || "-"}</td>
                      <td className="py-2 text-right">
                        <Badge variant="secondary" className="font-mono">{scorer.goals}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Sin datos de goleadores.</p>
          )}
        </Card>

        {/* Top Assists Table */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="size-4 text-[#1a472a]" />
              Tabla de Asistencias
            </h3>
          </div>
          {stats.topAssists.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-2 w-8">#</th>
                    <th className="pb-2 pr-2">Jugador</th>
                    <th className="pb-2 pr-2">Equipo</th>
                    <th className="pb-2 text-right">Asistencias</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topAssists.map((assist, i) => (
                    <tr key={assist.playerId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className={`py-2 pr-2 font-bold ${i < 3 ? "text-[#d4af37]" : "text-muted-foreground"}`}>
                        {i + 1}
                      </td>
                      <td className="py-2 pr-2">
                        <Link href={`/players/${assist.playerId}`} className="hover:underline font-medium">
                          {assist.playerName}
                        </Link>
                      </td>
                      <td className="py-2 pr-2 text-muted-foreground">{assist.teamName || "-"}</td>
                      <td className="py-2 text-right">
                        <Badge variant="secondary" className="font-mono">{assist.assists}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Sin datos de asistencias.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="p-4 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}

function handleExportAll(stats: TournamentStats, tournamentName: string) {
  // Export scorers
  if (stats.topScorers.length > 0) {
    exportToCSV(
      stats.topScorers.map((s, i) => ({
        Posición: i + 1,
        Jugador: s.playerName,
        Equipo: s.teamName || "",
        Goles: s.goals,
      })),
      `goleadores-${tournamentName || "torneo"}`
    );
  }
  // Export assists
  if (stats.topAssists.length > 0) {
    exportToCSV(
      stats.topAssists.map((a, i) => ({
        Posición: i + 1,
        Jugador: a.playerName,
        Equipo: a.teamName || "",
        Asistencias: a.assists,
      })),
      `asistencias-${tournamentName || "torneo"}`
    );
  }
}
