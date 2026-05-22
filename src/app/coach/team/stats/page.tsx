"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Target,
  ShieldAlert,
  Percent,
  Swords,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type MatchRecord = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  dateTime: string;
  homeTacticId: string | null;
  awayTacticId: string | null;
  homeTeam: { id: string; name: string; badgeUrl?: string | null };
  awayTeam: { id: string; name: string; badgeUrl?: string | null };
  tournament: { id: string; name: string };
  events: {
    id: string;
    eventType: string;
    teamId: string | null;
    player: { id: string; fullName: string } | null;
    minute: number | null;
  }[];
};

type TacticInfo = {
  id: string;
  name: string;
  formation: string;
};

type TacticPerformance = {
  tactic: TacticInfo;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

function computeTeamStats(teamId: string, matches: MatchRecord[]) {
  const completed = matches.filter((m) => m.status === "completed");
  let totalGoalsFor = 0, totalGoalsAgainst = 0;
  let totalShots = 0, totalFouls = 0;

  for (const m of completed) {
    const isHome = m.homeTeamId === teamId;
    const gf = (isHome ? m.homeScore : m.awayScore) ?? 0;
    const ga = (isHome ? m.awayScore : m.homeScore) ?? 0;
    totalGoalsFor += gf;
    totalGoalsAgainst += ga;

    // Count shots and fouls from events
    for (const e of m.events ?? []) {
      if (e.teamId === teamId) {
        if (e.eventType === "goal") totalShots++;
        if (e.eventType === "yellow_card" || e.eventType === "red_card") totalFouls++;
      }
    }
  }

  const count = completed.length || 1;
  return {
    avgGoalsFor: (totalGoalsFor / count).toFixed(1),
    avgGoalsAgainst: (totalGoalsAgainst / count).toFixed(1),
    avgShots: (totalShots / count).toFixed(1),
    avgFouls: (totalFouls / count).toFixed(1),
    totalGoalsFor,
    totalGoalsAgainst,
    matchCount: completed.length,
  };
}

function computeTacticPerformance(
  teamId: string,
  matches: MatchRecord[],
  tactics: TacticInfo[]
): TacticPerformance[] {
  const tacticMap = new Map(tactics.map((t) => [t.id, t]));
  const perfMap = new Map<string, TacticPerformance>();

  for (const m of matches.filter((m) => m.status === "completed")) {
    const isHome = m.homeTeamId === teamId;
    const tacticId = isHome ? m.homeTacticId : m.awayTacticId;
    if (!tacticId) continue;
    const tactic = tacticMap.get(tacticId);
    if (!tactic) continue;

    if (!perfMap.has(tacticId)) {
      perfMap.set(tacticId, { tactic, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
    }
    const p = perfMap.get(tacticId)!;
    const gf = (isHome ? m.homeScore : m.awayScore) ?? 0;
    const ga = (isHome ? m.awayScore : m.homeScore) ?? 0;
    p.played++;
    p.goalsFor += gf;
    p.goalsAgainst += ga;
    if (gf > ga) p.wins++;
    else if (gf < ga) p.losses++;
    else p.draws++;
  }

  return Array.from(perfMap.values()).sort((a, b) => b.played - a.played);
}

function getMatchResult(teamId: string, m: MatchRecord) {
  const isHome = m.homeTeamId === teamId;
  const gf = (isHome ? m.homeScore : m.awayScore) ?? 0;
  const ga = (isHome ? m.awayScore : m.homeScore) ?? 0;
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

export default function TeamStatsPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [tactics, setTactics] = useState<TacticInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const tid = session?.user?.teamId;
        if (!tid) { setLoading(false); return; }
        setTeamId(tid);

        const [matchesRes, tacticsRes] = await Promise.all([
          fetch(`/api/matches?teamId=${tid}`),
          fetch(`/api/tactics?teamId=${tid}`),
        ]);

        if (matchesRes.ok) setMatches(await matchesRes.json());
        if (tacticsRes.ok) {
          const data = await tacticsRes.json();
          setTactics(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando estadísticas...</p>
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

  const stats = computeTeamStats(teamId, matches);
  const tacticPerf = computeTacticPerformance(teamId, matches, tactics);
  const completedMatches = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estadísticas del Equipo</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.avgGoalsFor}</p>
              <p className="text-xs text-muted-foreground">Goles/Partido</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Target className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.avgShots}</p>
              <p className="text-xs text-muted-foreground">Tiros/Partido</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.avgFouls}</p>
              <p className="text-xs text-muted-foreground">Faltas/Partido</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Swords className="size-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalGoalsFor} - {stats.totalGoalsAgainst}</p>
              <p className="text-xs text-muted-foreground">GF - GC Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tactic performance */}
      {tacticPerf.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rendimiento por Táctica</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Táctica</TableHead>
                    <TableHead>Formación</TableHead>
                    <TableHead className="text-center">PJ</TableHead>
                    <TableHead className="text-center">V</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-center">D</TableHead>
                    <TableHead className="text-center">GF</TableHead>
                    <TableHead className="text-center">GC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tacticPerf.map((tp) => (
                    <TableRow key={tp.tactic.id}>
                      <TableCell className="font-medium">{tp.tactic.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tp.tactic.formation}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{tp.played}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">{tp.wins}</TableCell>
                      <TableCell className="text-center text-yellow-600 font-medium">{tp.draws}</TableCell>
                      <TableCell className="text-center text-red-600 font-medium">{tp.losses}</TableCell>
                      <TableCell className="text-center">{tp.goalsFor}</TableCell>
                      <TableCell className="text-center">{tp.goalsAgainst}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de Partidos</CardTitle>
        </CardHeader>
        <CardContent>
          {completedMatches.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay partidos completados.</p>
          ) : (
            <div className="space-y-2">
              {completedMatches.map((m) => {
                const isHome = m.homeTeamId === teamId;
                const opponent = isHome ? m.awayTeam : m.homeTeam;
                const result = getMatchResult(teamId!, m);
                const gf = isHome ? m.homeScore : m.awayScore;
                const ga = isHome ? m.awayScore : m.homeScore;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded flex items-center justify-center text-xs font-bold text-white ${
                        result === "win" ? "bg-green-500" :
                        result === "loss" ? "bg-red-500" :
                        "bg-yellow-500"
                      }`}>
                        {result === "win" ? <TrendingUp className="size-4" /> :
                         result === "loss" ? <TrendingDown className="size-4" /> :
                         <Minus className="size-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {isHome ? "vs" : "@"} {opponent.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.dateTime).toLocaleDateString("es", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {m.tournament && (
                            <span> · {m.tournament.name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-lg tabular-nums">
                      {gf ?? "-"} - {ga ?? "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
