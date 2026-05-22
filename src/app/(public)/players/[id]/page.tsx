"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  User,
  ArrowLeft,
  Loader2,
  Shield,
  Target,
  Handshake,
  Calendar,
} from "lucide-react";

interface PlayerTeam {
  id: string;
  jerseyNumber: number;
  team: { id: string; name: string };
}

interface Player {
  id: string;
  fullName: string;
  birthDate: string;
  position: string;
  photoUrl: string | null;
  teamPlayers: PlayerTeam[];
}

interface MatchEvent {
  id: string;
  eventType: string;
  minute: number | null;
  player: { id: string; fullName: string } | null;
  team: { id: string; name: string } | null;
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
  events: MatchEvent[];
}

const positionLabels: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

const positionColors: Record<string, string> = {
  goalkeeper: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  defender: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  midfielder: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  forward: "bg-red-500/20 text-red-300 border-red-500/30",
};

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = params.id as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState({ goals: 0, assists: 0, yellowCards: 0, redCards: 0, matches: 0 });
  const [recentMatches, setRecentMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const playerRes = await fetch(`/api/players/${playerId}`);
        if (!playerRes.ok) {
          setError(true);
          return;
        }
        const playerData: Player = await playerRes.json();
        setPlayer(playerData);

        // Fetch matches for the player's team to compute stats
        const activeTeam = playerData.teamPlayers?.[0];
        if (activeTeam) {
          const matchesRes = await fetch(`/api/matches?teamId=${activeTeam.team.id}`);
          const matchesData: MatchData[] = await matchesRes.json();
          const completed = (Array.isArray(matchesData) ? matchesData : [])
            .filter((m) => m.status === "completed");

          let goals = 0, assists = 0, yellowCards = 0, redCards = 0;
          const playerMatches: MatchData[] = [];

          for (const match of completed) {
            // Fetch events for each match
            try {
              const eventsRes = await fetch(`/api/matches/${match.id}/events`);
              const events: MatchEvent[] = await eventsRes.json();
              if (!Array.isArray(events)) continue;

              const playerEvents = events.filter((e) => e.player?.id === playerId);
              if (playerEvents.length > 0) {
                playerMatches.push({ ...match, events: playerEvents });
              }

              for (const ev of playerEvents) {
                if (ev.eventType === "goal") goals++;
                if (ev.eventType === "assist") assists++;
                if (ev.eventType === "yellow_card") yellowCards++;
                if (ev.eventType === "red_card") redCards++;
              }
            } catch {
              // skip
            }
          }

          setStats({ goals, assists, yellowCards, redCards, matches: completed.length });
          setRecentMatches(
            completed
              .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
              .slice(0, 5)
          );
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (playerId) fetchData();
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <User className="size-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Jugador no encontrado</h2>
        <Link href="/teams">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" />
            Volver a equipos
          </Button>
        </Link>
      </div>
    );
  }

  const activeTeam = player.teamPlayers?.[0];
  const age = Math.floor(
    (Date.now() - new Date(player.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      {activeTeam && (
        <Link
          href={`/teams/${activeTeam.team.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Volver a {activeTeam.team.name}
        </Link>
      )}

      {/* Player Hero */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Card className="overflow-hidden mb-6">
          <div className="relative bg-gradient-to-br from-[#0f1923] via-[#1a472a] to-[#0f1923] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Photo */}
              <div className="shrink-0 size-32 sm:size-40 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border-2 border-[#d4af37]/30">
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.fullName}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <User className="size-16 text-white/30" />
                )}
              </div>

              {/* Info */}
              <div className="text-center sm:text-left">
                {activeTeam && (
                  <span className="text-[#d4af37] text-6xl sm:text-7xl font-bold opacity-20 absolute top-4 right-6 select-none hidden sm:block">
                    #{activeTeam.jerseyNumber}
                  </span>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  {activeTeam && (
                    <span className="text-3xl font-bold text-[#d4af37]">#{activeTeam.jerseyNumber}</span>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{player.fullName}</h1>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge className={positionColors[player.position] || "bg-muted"}>
                    {positionLabels[player.position] || player.position}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-white/70">
                    {age} años
                  </Badge>
                </div>
                {activeTeam && (
                  <Link href={`/teams/${activeTeam.team.id}`}>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 text-white/60 hover:text-white/80 transition-colors">
                      <Shield className="size-4" />
                      <span className="text-sm">{activeTeam.team.name}</span>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <StatHighlight icon={<Target className="size-5 text-[#1a472a]" />} label="Goles" value={stats.goals} />
          <StatHighlight icon={<Handshake className="size-5 text-[#d4af37]" />} label="Asistencias" value={stats.assists} />
          <StatHighlight
            icon={<div className="size-4 rounded-sm bg-yellow-400 border border-yellow-500" />}
            label="Amarillas"
            value={stats.yellowCards}
          />
          <StatHighlight
            icon={<div className="size-4 rounded-sm bg-red-500 border border-red-600" />}
            label="Rojas"
            value={stats.redCards}
          />
          <StatHighlight icon={<Calendar className="size-5 text-muted-foreground" />} label="Partidos" value={stats.matches} />
        </div>
      </motion.div>

      {/* Stats Visual Bar */}
      {stats.matches > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold mb-4">Rendimiento</h2>
            <div className="space-y-3">
              <BarStat label="Goles por partido" value={stats.matches > 0 ? stats.goals / stats.matches : 0} max={2} color="bg-[#1a472a]" />
              <BarStat label="Asistencias por partido" value={stats.matches > 0 ? stats.assists / stats.matches : 0} max={2} color="bg-[#d4af37]" />
              <BarStat label="Tarjetas por partido" value={stats.matches > 0 ? (stats.yellowCards + stats.redCards) / stats.matches : 0} max={1} color="bg-[#e63946]" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="size-5 text-[#1a472a]" />
            Últimos Partidos
          </h2>
          <div className="space-y-2">
            {recentMatches.map((m) => {
              const isHome = m.homeTeam.id === activeTeam?.team.id;
              const teamScore = isHome ? m.homeScore : m.awayScore;
              const opponentScore = isHome ? m.awayScore : m.homeScore;
              const opponent = isHome ? m.awayTeam : m.homeTeam;
              const result =
                (teamScore ?? 0) > (opponentScore ?? 0)
                  ? "V"
                  : (teamScore ?? 0) < (opponentScore ?? 0)
                  ? "D"
                  : "E";
              const resultColor =
                result === "V"
                  ? "bg-emerald-500 text-white"
                  : result === "D"
                  ? "bg-red-500 text-white"
                  : "bg-amber-500 text-white";

              return (
                <Card key={m.id} className="p-3 flex items-center gap-3">
                  <span className={`shrink-0 size-8 rounded-lg flex items-center justify-center text-xs font-bold ${resultColor}`}>
                    {result}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isHome ? "vs" : "@"} {opponent.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.dateTime).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                      {m.tournament && ` · ${m.tournament.name}`}
                    </p>
                  </div>
                  <span className="text-lg font-bold tabular-nums">
                    {teamScore} - {opponentScore}
                  </span>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatHighlight({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <span className="text-2xl font-bold">{value}</span>
      <span className="block text-xs text-muted-foreground mt-0.5">{label}</span>
    </Card>
  );
}

function BarStat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
