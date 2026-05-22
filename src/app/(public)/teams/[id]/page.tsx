"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UniformDisplay from "@/components/football/UniformDisplay";
import PlayerCard from "@/components/football/PlayerCard";
import MatchScoreWidget from "@/components/football/MatchScoreWidget";
import { motion } from "framer-motion";
import {
  Shield,
  MapPin,
  Users,
  Trophy,
  CalendarDays,
  ArrowLeft,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface TeamPlayer {
  id: string;
  jerseyNumber: number;
  player: {
    id: string;
    fullName: string;
    position: string;
    photoUrl: string | null;
  };
}

interface Category {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  badgeUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  city: string | null;
  coach: { id: string; fullName: string; email: string } | null;
  homeUniformPrimary: string | null;
  homeUniformSecondary: string | null;
  homeUniformDescription: string | null;
  homeUniformImageUrl: string | null;
  awayUniformPrimary: string | null;
  awayUniformSecondary: string | null;
  awayUniformDescription: string | null;
  awayUniformImageUrl: string | null;
  teamCategories: { category: Category }[];
  teamPlayers: TeamPlayer[];
  _count: { teamPlayers: number; tournamentTeams: number };
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
  phase: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
}

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamRes, matchesRes] = await Promise.all([
          fetch(`/api/teams/${teamId}`),
          fetch(`/api/matches?teamId=${teamId}`),
        ]);
        if (!teamRes.ok) {
          setError(true);
          return;
        }
        const teamData = await teamRes.json();
        const matchesData = await matchesRes.json();
        setTeam(teamData);
        setMatches(Array.isArray(matchesData) ? matchesData : []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (teamId) fetchData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Shield className="size-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Equipo no encontrado</h2>
        <Link href="/teams">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" />
            Volver a equipos
          </Button>
        </Link>
      </div>
    );
  }

  const completedMatches = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  const upcomingMatches = matches
    .filter((m) => m.status === "scheduled" && new Date(m.dateTime) > new Date())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Stats
  const wins = completedMatches.filter((m) => {
    const isHome = m.homeTeam.id === teamId;
    return isHome
      ? (m.homeScore ?? 0) > (m.awayScore ?? 0)
      : (m.awayScore ?? 0) > (m.homeScore ?? 0);
  }).length;
  const draws = completedMatches.filter(
    (m) => m.homeScore != null && m.homeScore === m.awayScore
  ).length;
  const losses = completedMatches.length - wins - draws;
  const goalsFor = completedMatches.reduce((sum, m) => {
    const isHome = m.homeTeam.id === teamId;
    return sum + (isHome ? m.homeScore ?? 0 : m.awayScore ?? 0);
  }, 0);
  const goalsAgainst = completedMatches.reduce((sum, m) => {
    const isHome = m.homeTeam.id === teamId;
    return sum + (isHome ? m.awayScore ?? 0 : m.homeScore ?? 0);
  }, 0);

  const initials = team.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/teams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="size-4" />
        Volver a equipos
      </Link>

      {/* Team Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div
              className="shrink-0 size-24 rounded-2xl flex items-center justify-center overflow-hidden border-2"
              style={{
                backgroundColor: team.primaryColor || "#1a472a",
                borderColor: team.secondaryColor || "#d4af37",
              }}
            >
              {team.badgeUrl ? (
                <img src={team.badgeUrl} alt={team.name} className="size-full object-cover" loading="lazy" />
              ) : (
                <span className="text-2xl font-bold" style={{ color: team.secondaryColor || "#d4af37" }}>
                  {initials}
                </span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              {team.city && (
                <div className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground mt-1">
                  <MapPin className="size-4" />
                  <span>{team.city}</span>
                </div>
              )}
              {team.coach && (
                <p className="text-sm text-muted-foreground mt-1">
                  Entrenador: <span className="font-medium text-foreground">{team.coach.fullName}</span>
                </p>
              )}
              {team.teamCategories.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-1 mt-2">
                  {team.teamCategories.map((tc) => (
                    <Badge key={tc.category.id} className="bg-[#1a472a] text-white">
                      {tc.category.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats + Uniforms row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="lg:col-span-1">
          <Card className="p-5 h-full">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-[#1a472a]" />
              Estadísticas
            </h2>
            {completedMatches.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="PJ" value={completedMatches.length} />
                <StatBox label="V" value={wins} color="text-emerald-600" />
                <StatBox label="E" value={draws} color="text-amber-600" />
                <StatBox label="D" value={losses} color="text-red-600" />
                <StatBox label="GF" value={goalsFor} />
                <StatBox label="GC" value={goalsAgainst} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin partidos jugados</p>
            )}
          </Card>
        </motion.div>

        {/* Uniforms */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="lg:col-span-2">
          <UniformDisplay
            homeUniformPrimary={team.homeUniformPrimary}
            homeUniformSecondary={team.homeUniformSecondary}
            homeUniformDescription={team.homeUniformDescription}
            homeUniformImageUrl={team.homeUniformImageUrl}
            awayUniformPrimary={team.awayUniformPrimary}
            awayUniformSecondary={team.awayUniformSecondary}
            awayUniformDescription={team.awayUniformDescription}
            awayUniformImageUrl={team.awayUniformImageUrl}
          />
        </motion.div>
      </div>

      {/* Player Roster */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="size-5 text-[#1a472a]" />
          Plantilla ({team.teamPlayers.length})
        </h2>
        {team.teamPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.teamPlayers.map((tp) => (
              <Link key={tp.id} href={`/players/${tp.player.id}`}>
                <PlayerCard
                  fullName={tp.player.fullName}
                  position={tp.player.position}
                  photoUrl={tp.player.photoUrl}
                  jerseyNumber={tp.jerseyNumber}
                  teamName={team.name}
                />
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Users className="size-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No hay jugadores registrados</p>
          </Card>
        )}
      </motion.div>

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="size-5 text-[#1a472a]" />
            Próximos Partidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingMatches.slice(0, 6).map((m) => (
              <MatchScoreWidget
                key={m.id}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeScore={m.homeScore}
                awayScore={m.awayScore}
                status={m.status as "scheduled" | "in_progress" | "completed" | "postponed" | "cancelled"}
                dateTime={m.dateTime}
                phaseName={m.tournament?.name}
                locationName={m.location?.name}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Results */}
      {completedMatches.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="size-5 text-[#1a472a]" />
            Resultados Recientes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedMatches.slice(0, 6).map((m) => (
              <MatchScoreWidget
                key={m.id}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeScore={m.homeScore}
                awayScore={m.awayScore}
                status={m.status as "scheduled" | "in_progress" | "completed" | "postponed" | "cancelled"}
                dateTime={m.dateTime}
                phaseName={m.tournament?.name}
                locationName={m.location?.name}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/50">
      <span className={`text-xl font-bold leading-none ${color || ""}`}>{value}</span>
      <span className="block text-[10px] text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
