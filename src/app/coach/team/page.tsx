"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Shirt,
  BarChart3,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Camera,
  Loader2,
  X,
} from "lucide-react";

type TeamData = {
  id: string;
  name: string;
  badgeUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  city: string | null;
  coach: { id: string; fullName: string; email: string } | null;
  teamCategories: { category: { id: string; name: string } }[];
  teamPlayers: { id: string; player: { id: string; fullName: string; position: string }; jerseyNumber: number }[];
};

type MatchRecord = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  dateTime: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
};

function computeStats(teamId: string, matches: MatchRecord[]) {
  const completed = matches.filter((m) => m.status === "completed");
  let wins = 0, losses = 0, draws = 0;
  const streakResults: string[] = [];

  for (const m of completed) {
    const isHome = m.homeTeamId === teamId;
    const teamScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;
    if (teamScore == null || oppScore == null) continue;
    if (teamScore > oppScore) { wins++; streakResults.push("W"); }
    else if (teamScore < oppScore) { losses++; streakResults.push("L"); }
    else { draws++; streakResults.push("D"); }
  }

  // Current streak (last 5)
  const last5 = streakResults.slice(-5).reverse();

  return { wins, losses, draws, played: completed.length, last5 };
}

const TEAM_SECTIONS = [
  { href: "roster", label: "Plantilla", icon: Users, desc: "Gestionar jugadores" },
  { href: "tactics", label: "Tácticas", icon: Trophy, desc: "Formaciones y estrategias" },
  { href: "uniforms", label: "Uniformes", icon: Shirt, desc: "Local y visitante" },
  { href: "stats", label: "Estadísticas", icon: BarChart3, desc: "Rendimiento del equipo" },
];

export default function CoachTeamPage() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof computeStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "badges");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json();

      const updateRes = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeUrl: url }),
      });
      if (updateRes.ok) {
        setTeam((prev) => prev ? { ...prev, badgeUrl: url } : prev);
      }
    } catch {
      // ignore
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleLogoDelete = async () => {
    if (!team) return;
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeUrl: null }),
      });
      if (res.ok) setTeam((prev) => prev ? { ...prev, badgeUrl: null } : prev);
    } catch {}
  };

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const teamId = session?.user?.teamId;
        if (!teamId) { setLoading(false); return; }

        const [teamRes, matchesRes] = await Promise.all([
          fetch(`/api/teams/${teamId}`),
          fetch(`/api/matches?teamId=${teamId}`),
        ]);

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeam(teamData);
        }

        if (matchesRes.ok) {
          const matchesData: MatchRecord[] = await matchesRes.json();
          if (teamId) setStats(computeStats(teamId, matchesData));
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
        <p className="text-muted-foreground">Cargando equipo...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No tienes un equipo asignado.</p>
      </div>
    );
  }

  const categories = team.teamCategories.map((tc) => tc.category.name);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mi Equipo</h1>

      {/* Team header */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center gap-5 p-6">
          <div className="relative group shrink-0">
            <div className="size-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {team.badgeUrl ? (
                <img src={team.badgeUrl} alt={team.name} className="size-full object-contain" />
              ) : (
                <Shield className="size-10 text-muted-foreground" />
              )}
            </div>
            <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                {uploadingLogo ? <Loader2 className="size-4 text-white animate-spin" /> : <Camera className="size-4 text-white" />}
              </button>
              {team.badgeUrl && (
                <button onClick={handleLogoDelete} className="p-1.5 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer">
                  <X className="size-4 text-red-400" />
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold">{team.name}</h2>
            {team.city && <p className="text-sm text-muted-foreground">{team.city}</p>}
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {categories.map((c) => (
                <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
            {team.coach && (
              <p className="text-sm text-muted-foreground">
                Entrenador: <span className="font-medium text-foreground">{team.coach.fullName}</span>
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{team.teamPlayers.length}</p>
            <p className="text-xs text-muted-foreground">Jugadores</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.played}</p>
              <p className="text-xs text-muted-foreground">Partidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="size-4 text-green-500" />
                <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
              </div>
              <p className="text-xs text-muted-foreground">Victorias</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Minus className="size-4 text-yellow-500" />
                <p className="text-2xl font-bold text-yellow-600">{stats.draws}</p>
              </div>
              <p className="text-xs text-muted-foreground">Empates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="size-4 text-red-500" />
                <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
              </div>
              <p className="text-xs text-muted-foreground">Derrotas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center gap-1 justify-center">
                <Flame className="size-4 text-orange-500" />
                <div className="flex gap-0.5">
                  {stats.last5.map((r, i) => (
                    <span
                      key={i}
                      className={`size-5 rounded text-[10px] font-bold flex items-center justify-center ${
                        r === "W" ? "bg-green-500/20 text-green-300" :
                        r === "L" ? "bg-red-500/20 text-red-300" :
                        "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {r === "W" ? "V" : r === "L" ? "D" : "E"}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Racha</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEAM_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={`/coach/team/${s.href}`}>
              <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
