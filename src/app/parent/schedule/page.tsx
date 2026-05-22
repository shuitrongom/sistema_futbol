"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  MapPin,
  Clock,
  Loader2,
  Trophy,
} from "lucide-react";

interface MatchRecord {
  id: string;
  dateTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; name: string; badgeUrl: string | null };
  awayTeam: { id: string; name: string; badgeUrl: string | null };
  location: { name: string; address: string } | null;
  tournament?: { name: string } | null;
}

interface ChildTeam {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}



export default function ParentSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [childTeams, setChildTeams] = useState<ChildTeam[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // Get evaluations to find children's teams
        const [evalsRes, matchesRes] = await Promise.all([
          fetch("/api/evaluations"),
          fetch("/api/matches"),
        ]);

        const evals = evalsRes.ok ? await evalsRes.json() : [];
        const allMatches: MatchRecord[] = matchesRes.ok ? await matchesRes.json() : [];

        // Extract unique children and their teams
        const teamMap = new Map<string, ChildTeam>();
        for (const ev of evals) {
          if (ev.player?.teamPlayers?.[0]?.team) {
            const tp = ev.player.teamPlayers[0];
            const key = ev.player.id;
            if (!teamMap.has(key)) {
              teamMap.set(key, {
                playerId: ev.player.id,
                playerName: ev.player.fullName,
                teamId: tp.team.id,
                teamName: tp.team.name,
              });
            }
          }
        }
        const teams = Array.from(teamMap.values());
        setChildTeams(teams);

        // Filter matches for children's teams
        const teamIds = new Set(teams.map((t) => t.teamId));
        const relevantMatches = allMatches
          .filter(
            (m) =>
              (m.status === "scheduled" || m.status === "in_progress") &&
              (teamIds.has(m.homeTeam?.id) || teamIds.has(m.awayTeam?.id))
          )
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        setMatches(relevantMatches);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  // Group matches by date
  const groupedMatches = new Map<string, MatchRecord[]>();
  for (const match of matches) {
    const dateKey = new Date(match.dateTime).toDateString();
    if (!groupedMatches.has(dateKey)) groupedMatches.set(dateKey, []);
    groupedMatches.get(dateKey)!.push(match);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a472a]">Calendario de Partidos</h1>
        <p className="text-muted-foreground">
          Próximos partidos de{" "}
          {childTeams.map((t) => t.playerName).join(", ") || "tus hijos"}
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No hay partidos programados próximamente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedMatches.entries()).map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="size-4 text-[#1a472a]" />
                <h2 className="text-sm font-semibold text-[#1a472a] capitalize">
                  {formatDate(dayMatches[0].dateTime)}
                </h2>
                {isToday(dayMatches[0].dateTime) && (
                  <Badge className="bg-[#e63946] text-white text-xs">Hoy</Badge>
                )}
              </div>

              <div className="space-y-3">
                {dayMatches.map((match) => {
                  const childTeamIds = new Set(childTeams.map((t) => t.teamId));
                  const isHome = childTeamIds.has(match.homeTeam?.id);
                  const childTeamName = isHome ? match.homeTeam.name : match.awayTeam.name;

                  return (
                    <Card key={match.id} className="border-l-4 border-l-[#1a472a]">
                      <CardContent className="pt-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Teams */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-right flex-1">
                              <p className={`font-medium ${isHome ? "text-[#1a472a] font-bold" : ""}`}>
                                {match.homeTeam.name}
                              </p>
                            </div>
                            <div className="text-center px-3">
                              <p className="text-xs text-muted-foreground">VS</p>
                            </div>
                            <div className="text-left flex-1">
                              <p className={`font-medium ${!isHome ? "text-[#1a472a] font-bold" : ""}`}>
                                {match.awayTeam.name}
                              </p>
                            </div>
                          </div>

                          {/* Time & Location */}
                          <div className="flex flex-col items-end gap-1 text-sm">
                            <div className="flex items-center gap-1 text-[#d4af37]">
                              <Clock className="size-3" />
                              <span className="font-medium">{formatTime(match.dateTime)}</span>
                            </div>
                            {match.location && (
                              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <MapPin className="size-3" />
                                <span>{match.location.name}</span>
                              </div>
                            )}
                            {match.tournament && (
                              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <Trophy className="size-3" />
                                <span>{match.tournament.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Child indicator */}
                        <div className="mt-2 pt-2 border-t">
                          <Badge variant="outline" className="text-xs">
                            {childTeamName} ({isHome ? "Local" : "Visitante"})
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
