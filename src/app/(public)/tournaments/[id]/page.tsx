"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StandingsTable from "@/components/football/StandingsTable";
import FixtureCalendar from "@/components/FixtureCalendar";
import {
  Trophy,
  CalendarDays,
  Users,
  Loader2,
  ArrowLeft,
  Target,
  Shield,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface TeamInTournament {
  team: {
    id: string;
    name: string;
    badgeUrl?: string | null;
    primaryColor?: string | null;
    city?: string | null;
    teamCategories: { category: Category }[];
    _count: { teamPlayers: number };
  };
}

interface Phase {
  id: string;
  name: string;
  type: string;
  status: string;
  phaseOrder: number;
}

interface TournamentDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  format: string;
  status: string;
  minTeams: number;
  maxTeams: number;
  tournamentCategories: { category: Category }[];
  tournamentTeams: TeamInTournament[];
  phases: Phase[];
  _count: { tournamentTeams: number; matches: number; phases: number };
}

interface MatchData {
  id: string;
  dateTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; name: string; badgeUrl?: string | null; primaryColor?: string | null };
  awayTeam: { id: string; name: string; badgeUrl?: string | null; primaryColor?: string | null };
  tournament: { id: string; name: string } | null;
  phase: { id: string; name: string; type: string } | null;
  location: { id: string; name: string; address?: string } | null;
  events?: { id: string; eventType: string; minute?: number; player?: { id: string; fullName: string }; team?: { id: string; name: string } }[];
}

interface StandingRow {
  id: string;
  teamId: string;
  team: { id: string; name: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const formatLabels: Record<string, string> = {
  league: "Liga",
  knockout: "Eliminación directa",
  group_knockout: "Grupos + Eliminación",
  double_knockout: "Doble eliminación",
  swiss: "Sistema suizo",
  league_playoff: "Liga + Liguilla",
  league_single: "Liga solo ida",
  cup: "Copa",
  round_robin_groups: "Grupos round-robin",
  mini_tournament: "Torneo relámpago",
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  registration: "Inscripción",
  in_progress: "En curso",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  in_progress: "bg-emerald-600 text-white",
  registration: "bg-blue-600 text-white",
  completed: "bg-gray-500 text-white",
};

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [topScorers, setTopScorers] = useState<{ name: string; goals: number; team: string; playerId: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tournamentRes, matchesRes, standingsRes] = await Promise.all([
          fetch(`/api/tournaments/${id}`),
          fetch(`/api/matches?tournamentId=${id}`),
          fetch(`/api/tournaments/${id}/standings`),
        ]);

        const tournamentData = await tournamentRes.json();
        const matchesData = await matchesRes.json();
        const standingsData = await standingsRes.json();

        if (tournamentRes.ok) setTournament(tournamentData);
        setMatches(Array.isArray(matchesData) ? matchesData : []);
        setStandings(Array.isArray(standingsData) ? standingsData : []);

        // Calculate top scorers from events
        const completedMatches = (Array.isArray(matchesData) ? matchesData : []).filter(
          (m: MatchData) => m.status === "completed"
        );
        const goalCounts: Record<string, { name: string; goals: number; team: string; playerId: string }> = {};
        for (const match of completedMatches) {
          if (match.events && Array.isArray(match.events)) {
            for (const ev of match.events) {
              if (ev.eventType === "goal" && ev.player) {
                const key = ev.player.id;
                if (!goalCounts[key]) {
                  goalCounts[key] = { name: ev.player.fullName, goals: 0, team: ev.team?.name || "", playerId: ev.player.id };
                }
                goalCounts[key].goals++;
              }
            }
          }
        }
        setTopScorers(Object.values(goalCounts).sort((a, b) => b.goals - a.goals).slice(0, 10));
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

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-muted-foreground">Torneo no encontrado.</p>
        <Link href="/tournaments" className="text-[#1a472a] hover:underline text-sm mt-2 inline-block">
          ← Volver a torneos
        </Link>
      </div>
    );
  }

  // Team stats from standings
  const teamStats = standings.length > 0
    ? {
        mostGoals: [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0],
        leastConceded: [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0],
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link href="/tournaments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="size-3" />
        Volver a torneos
      </Link>

      {/* Tournament header */}
      <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
        <div className="size-14 rounded-xl bg-[#1a472a] flex items-center justify-center shrink-0">
          <Trophy className="size-7 text-[#d4af37]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <Badge className={statusColors[tournament.status] || ""}>
              {statusLabels[tournament.status] || tournament.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {new Date(tournament.startDate).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
              {" — "}
              {new Date(tournament.endDate).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="size-3.5" />
              {formatLabels[tournament.format] || tournament.format}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {tournament._count.tournamentTeams} equipos
            </span>
          </div>
          {tournament.tournamentCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tournament.tournamentCategories.map((tc) => (
                <Badge key={tc.category.id} variant="outline" className="text-xs">
                  {tc.category.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="standings">
        <TabsList className="flex-wrap">
          <TabsTrigger value="standings">Tabla de Posiciones</TabsTrigger>
          <TabsTrigger value="fixture">Fixture</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
        </TabsList>

        {/* Standings Tab */}
        <TabsContent value="standings" className="mt-6">
          {standings.length > 0 ? (
            <Card className="overflow-hidden">
              <StandingsTable standings={standings} qualifyingSpots={2} />
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground text-sm">
                La tabla de posiciones aún no está disponible.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Fixture Tab */}
        <TabsContent value="fixture" className="mt-6">
          {matches.length > 0 ? (
            <FixtureCalendar matches={matches} />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground text-sm">
                El fixture aún no ha sido generado.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Scorers */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="size-4 text-[#d4af37]" />
                Goleadores
              </h3>
              {topScorers.length > 0 ? (
                <div className="space-y-2">
                  {topScorers.map((scorer, i) => (
                    <div
                      key={scorer.playerId}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold w-6 text-center ${i < 3 ? "text-[#d4af37]" : "text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{scorer.name}</p>
                          <p className="text-xs text-muted-foreground">{scorer.team}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {scorer.goals}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Sin datos de goleadores.
                </p>
              )}
            </Card>

            {/* Team Stats */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="size-4 text-[#1a472a]" />
                Estadísticas de Equipos
              </h3>
              {teamStats ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Equipo más goleador</p>
                    <p className="font-semibold text-sm">{teamStats.mostGoals.team.name}</p>
                    <p className="text-xs text-muted-foreground">{teamStats.mostGoals.goalsFor} goles a favor</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Equipo menos goleado</p>
                    <p className="font-semibold text-sm">{teamStats.leastConceded.team.name}</p>
                    <p className="text-xs text-muted-foreground">{teamStats.leastConceded.goalsAgainst} goles en contra</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Sin estadísticas disponibles.
                </p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-6">
          {tournament.tournamentTeams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournament.tournamentTeams.map(({ team }) => (
                <Card key={team.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    {team.badgeUrl ? (
                      <img
                        src={team.badgeUrl}
                        alt={`${team.name} escudo`}
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="size-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: team.primaryColor || "#6b7280" }}
                      >
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{team.name}</h4>
                      {team.city && (
                        <p className="text-xs text-muted-foreground">{team.city}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {team._count.teamPlayers} jugadores
                        </span>
                        {team.teamCategories.map((tc) => (
                          <Badge key={tc.category.id} variant="outline" className="text-[10px]">
                            {tc.category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No hay equipos inscritos en este torneo.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
