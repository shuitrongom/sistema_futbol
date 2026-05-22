"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StandingsTable from "@/components/football/StandingsTable";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Trophy,
  CalendarDays,
  Users,
  ArrowRight,
  Loader2,
  MapPin,
  Clock,
  Flame,
  ChevronRight,
  Zap,
} from "lucide-react";

/* ─── Types ─── */

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  format: string;
  status: string;
  _count: { tournamentTeams: number; matches: number };
  tournamentCategories: { category: { id: string; name: string } }[];
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

/* ─── Animation variants ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Animated counter hook ─── */

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || target === 0) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { count, ref };
}

/* ─── Hero slide type ─── */

interface HeroSlide {
  title: string;
  subtitle: string;
  gradient: string;
}


/* ─── Main Component ─── */

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [topScorer, setTopScorer] = useState<{ name: string; goals: number; team: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tournaments and matches independently
        let tournamentsData: Tournament[] = [];
        let matchesData: MatchData[] = [];

        try {
          const res = await fetch("/api/tournaments");
          if (res.ok) tournamentsData = await res.json();
        } catch { /* ignore */ }

        try {
          const res = await fetch("/api/matches");
          if (res.ok) matchesData = await res.json();
        } catch { /* ignore */ }

        setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
        setMatches(Array.isArray(matchesData) ? matchesData : []);

        // Fetch standings for the first active tournament
        const activeTournament = (Array.isArray(tournamentsData) ? tournamentsData : []).find(
          (t) => t.status === "in_progress"
        );
        if (activeTournament) {
          try {
            const standingsRes = await fetch(`/api/tournaments/${activeTournament.id}/standings`);
            if (standingsRes.ok) {
              const standingsData = await standingsRes.json();
              setStandings(Array.isArray(standingsData) ? standingsData : []);
            }
          } catch { /* ignore */ }
        }

        // Calculate top scorer (skip if no completed matches to avoid many requests)
        const completedMatches = (Array.isArray(matchesData) ? matchesData : []).filter(
          (m) => m.status === "completed"
        );
        if (completedMatches.length > 0 && completedMatches.length <= 20) {
          const goalCounts: Record<string, { name: string; goals: number; team: string }> = {};
          for (const match of completedMatches.slice(0, 10)) {
            try {
              const eventsRes = await fetch(`/api/matches/${match.id}/events`);
              if (eventsRes.ok) {
                const events = await eventsRes.json();
                if (Array.isArray(events)) {
                  for (const ev of events) {
                    if (ev.eventType === "goal" && ev.player) {
                      const key = ev.player.id;
                      if (!goalCounts[key]) {
                        goalCounts[key] = { name: ev.player.fullName, goals: 0, team: ev.team?.name || "" };
                      }
                      goalCounts[key].goals++;
                    }
                  }
                }
              }
            } catch { /* skip */ }
          }
          const sorted = Object.values(goalCounts).sort((a, b) => b.goals - a.goals);
          if (sorted.length > 0) setTopScorer(sorted[0]);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ─── Derived data ─── */

  const activeTournaments = tournaments.filter((t) => t.status === "in_progress" || t.status === "registration");
  const liveMatches = matches.filter((m) => m.status === "in_progress");
  const recentCompleted = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 4);
  const upcomingMatches = matches
    .filter((m) => m.status === "scheduled" && new Date(m.dateTime) > new Date())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 6);
  const scoreWidgets = [...liveMatches, ...recentCompleted].slice(0, 8);

  // Stats
  const totalGoals = standings.reduce((acc, r) => acc + r.goalsFor, 0);

  // Best offense: team with most goalsFor
  const bestOffense = standings.length > 0
    ? standings.reduce((best, r) => (r.goalsFor > best.goalsFor ? r : best), standings[0])
    : null;

  // Best defense: team with least goalsAgainst (min 1 game played)
  const bestDefense = standings.filter((r) => r.played > 0).length > 0
    ? standings.filter((r) => r.played > 0).reduce((best, r) => (r.goalsAgainst < best.goalsAgainst ? r : best), standings.filter((r) => r.played > 0)[0])
    : null;

  /* ─── Hero slides ─── */

  const heroSlides: HeroSlide[] = React.useMemo(() => {
    const slides: HeroSlide[] = [];

    const inProgress = tournaments.filter((t) => t.status === "in_progress");
    const registration = tournaments.filter((t) => t.status === "registration");

    for (const t of inProgress) {
      slides.push({
        title: `${t.name.toUpperCase()}`,
        subtitle: `${t._count.tournamentTeams} equipos compiten por la gloria`,
        gradient: "from-[#1a472a]/80 via-[#0a0e17]/60 to-[#0a0e17]",
      });
    }

    for (const t of registration) {
      slides.push({
        title: `${t.name.toUpperCase()}`,
        subtitle: "¡Inscripciones abiertas! Registra tu equipo ahora",
        gradient: "from-[#d4af37]/20 via-[#0a0e17]/60 to-[#0a0e17]",
      });
    }

    if (slides.length === 0) {
      slides.push({
        title: "BIENVENIDO A LA LIGA",
        subtitle: "La plataforma profesional para torneos de fútbol",
        gradient: "from-[#141b2d] via-[#0a0e17]/80 to-[#0a0e17]",
      });
    }

    return slides;
  }, [tournaments]);

  /* ─── Auto-slide ─── */

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length, nextSlide]);

  /* ─── Counters ─── */

  const goalsCounter = useCountUp(totalGoals);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0a0e17]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#1a472a] flex items-center justify-center animate-pulse">
            <Trophy className="size-6 text-[#0a0e17]" />
          </div>
          <Loader2 className="size-6 animate-spin text-[#d4af37]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0e17] min-h-screen">

      {/* ===== 1. HERO WITH AUTO-SLIDING NEWS BANNER ===== */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] to-[#141b2d]" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d4af37] rounded-full opacity-[0.04] blur-[200px]" />

        {/* Slide content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Badge */}
              <Badge className="bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 hover:bg-[#d4af37]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
                <Zap className="size-3 mr-1.5" />
                {heroSlides[currentSlide]?.gradient.includes("1a472a") ? "LIGA EN CURSO" : heroSlides[currentSlide]?.gradient.includes("d4af37") ? "INSCRIPCIONES ABIERTAS" : "LIGA DE FÚTBOL"}
              </Badge>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] uppercase tracking-tight">
                {heroSlides[currentSlide]?.title}
              </h1>

              {/* Subtitle */}
              <p className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto">
                {heroSlides[currentSlide]?.subtitle}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/tournaments">
                  <Button
                    size="lg"
                    className="bg-[#d4af37] hover:bg-[#e0c050] text-[#0a0e17] font-bold text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] transition-all h-13 px-10 border-0 rounded-full"
                  >
                    <Trophy className="size-5 mr-2" />
                    Ver Torneos
                  </Button>
                </Link>
                <Link href="/teams">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-[#d4af37]/40 hover:text-[#d4af37] font-semibold text-sm uppercase tracking-wider h-13 px-10 transition-all rounded-full"
                  >
                    <Users className="size-5 mr-2" />
                    Explorar Equipos
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation dots */}
          {heroSlides.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentSlide
                      ? "w-8 h-2 bg-[#d4af37]"
                      : "w-2 h-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Ir a slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0e17] to-transparent" />
      </section>


      {/* ===== 2. LIVE / RECENT SCORES TICKER ===== */}
      {scoreWidgets.length > 0 && (
        <section className="relative z-10 py-6 overflow-hidden bg-[#0a0e17]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-4">
              {liveMatches.length > 0 ? (
                <>
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e63946] opacity-75" />
                    <span className="relative inline-flex rounded-full size-2.5 bg-[#e63946]" />
                  </span>
                  <span className="text-[#e63946] text-xs font-bold uppercase tracking-widest">En Vivo</span>
                </>
              ) : (
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Resultados Recientes</span>
              )}
            </div>
          </div>

          {/* Marquee-style auto-scroll */}
          <div className="relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0e17] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0e17] to-transparent z-10 pointer-events-none" />

            <div className="flex gap-3 animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused] w-max px-4">
              {/* Duplicate for seamless loop */}
              {[...scoreWidgets, ...scoreWidgets].map((m, idx) => (
                <div
                  key={`${m.id}-${idx}`}
                  className="flex-shrink-0 w-[260px] sm:w-[280px] rounded-xl border border-white/[0.06] bg-[#141b2d]/80 backdrop-blur-sm p-4 hover:border-[#d4af37]/20 transition-all duration-300"
                >
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-2">
                    {m.tournament && (
                      <span className="text-[10px] text-[#d4af37]/60 font-semibold uppercase tracking-widest truncate">
                        {m.tournament.name}
                      </span>
                    )}
                    {m.status === "in_progress" && (
                      <Badge className="bg-[#e63946]/20 text-[#e63946] border-[#e63946]/30 text-[10px] px-2 py-0 animate-pulse">
                        EN VIVO
                      </Badge>
                    )}
                    {m.status === "completed" && (
                      <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px] px-2 py-0">
                        Final
                      </Badge>
                    )}
                  </div>

                  {/* Teams + Score */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ring-1 ring-white/10"
                        style={{ backgroundColor: m.homeTeam.primaryColor ?? "#374151" }}
                      >
                        {m.homeTeam.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-white text-xs font-semibold truncate">{m.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2">
                      {m.homeScore !== null && m.awayScore !== null ? (
                        <span className="font-mono font-bold text-lg text-[#d4af37] tabular-nums">
                          {m.homeScore} - {m.awayScore}
                        </span>
                      ) : (
                        <span className="text-sm text-white/40 font-medium">vs</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-white text-xs font-semibold truncate text-right">{m.awayTeam.name}</span>
                      <div
                        className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ring-1 ring-white/10"
                        style={{ backgroundColor: m.awayTeam.primaryColor ?? "#374151" }}
                      >
                        {m.awayTeam.name.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mt-2 text-[10px] text-white/25">
                    {new Date(m.dateTime).toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marquee animation defined in globals.css */}
        </section>
      )}


      {/* ===== 3. "LO MEJOR DEL TORNEO" STATS SECTION ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-[#d4af37] to-[#d4af37]/30 rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
              Lo Mejor del Torneo
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Goleador */}
            <motion.div variants={fadeUp} custom={1}>
              <div className="group relative rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-[#d4af37]/20 via-[#d4af37]/10 to-[#141b2d] border border-[#d4af37]/20 hover:scale-[1.03] transition-transform duration-300 cursor-default h-full">
                <div className="absolute top-3 right-3 text-[#d4af37]/10 text-6xl font-black pointer-events-none">🏆</div>
                <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-2">Goleador</p>
                {topScorer ? (
                  <>
                    <p className="text-4xl font-black text-white tabular-nums">{topScorer.goals}</p>
                    <p className="text-white/70 text-sm font-semibold mt-1">{topScorer.name}</p>
                    <p className="text-white/30 text-xs">{topScorer.team}</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-black text-white/20">—</p>
                    <p className="text-white/30 text-sm mt-1">Sin datos aún</p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Mejor Ofensiva */}
            <motion.div variants={fadeUp} custom={2}>
              <div className="group relative rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-[#1a472a]/40 via-[#1a472a]/20 to-[#141b2d] border border-[#1a472a]/30 hover:scale-[1.03] transition-transform duration-300 cursor-default h-full">
                <div className="absolute top-3 right-3 text-[#1a472a]/20 text-6xl font-black pointer-events-none">⚽</div>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Mejor Ofensiva</p>
                {bestOffense ? (
                  <>
                    <p className="text-4xl font-black text-white tabular-nums">{bestOffense.goalsFor}</p>
                    <p className="text-white/70 text-sm font-semibold mt-1">{bestOffense.team.name}</p>
                    <p className="text-white/30 text-xs">goles a favor</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-black text-white/20">—</p>
                    <p className="text-white/30 text-sm mt-1">Sin datos aún</p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Mejor Defensiva */}
            <motion.div variants={fadeUp} custom={3}>
              <div className="group relative rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-blue-900/30 via-blue-900/15 to-[#141b2d] border border-blue-800/20 hover:scale-[1.03] transition-transform duration-300 cursor-default h-full">
                <div className="absolute top-3 right-3 text-blue-800/20 text-6xl font-black pointer-events-none">🛡️</div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Mejor Defensiva</p>
                {bestDefense ? (
                  <>
                    <p className="text-4xl font-black text-white tabular-nums">{bestDefense.goalsAgainst}</p>
                    <p className="text-white/70 text-sm font-semibold mt-1">{bestDefense.team.name}</p>
                    <p className="text-white/30 text-xs">goles en contra</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-black text-white/20">—</p>
                    <p className="text-white/30 text-sm mt-1">Sin datos aún</p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Total Goles */}
            <motion.div variants={fadeUp} custom={4}>
              <div className="group relative rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-[#e63946]/20 via-[#e63946]/10 to-[#141b2d] border border-[#e63946]/20 hover:scale-[1.03] transition-transform duration-300 cursor-default h-full">
                <div className="absolute top-3 right-3 text-[#e63946]/10 text-6xl font-black pointer-events-none">📊</div>
                <p className="text-[#e63946] text-xs font-bold uppercase tracking-widest mb-2">Total Goles</p>
                <p className="text-4xl font-black text-white tabular-nums">
                  <span ref={goalsCounter.ref}>{goalsCounter.count}</span>
                </p>
                <p className="text-white/30 text-xs mt-1">en todos los torneos</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>


      {/* ===== 4. ACTIVE TOURNAMENTS GRID ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-[#d4af37] to-[#d4af37]/30 rounded-full" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
                  Torneos Activos
                </h2>
                {/* Animated gold underline */}
                <motion.div
                  className="h-0.5 bg-gradient-to-r from-[#d4af37] to-transparent rounded-full mt-1"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>
            <Link
              href="/tournaments"
              className="text-[#d4af37] hover:text-[#e0c050] text-sm font-semibold flex items-center gap-1.5 transition-colors group"
            >
              Ver todos
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          {activeTournaments.length === 0 ? (
            <motion.div variants={fadeUp} custom={1}>
              <div className="rounded-2xl border border-white/5 bg-[#141b2d]/50 backdrop-blur-sm p-12 text-center">
                <Trophy className="size-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No hay torneos activos en este momento.</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTournaments.slice(0, 6).map((t, i) => (
                <motion.div key={t.id} variants={fadeUp} custom={i + 1}>
                  <Link href={`/tournaments/${t.id}`}>
                    <div className="group relative rounded-2xl border border-white/[0.06] bg-[#141b2d]/60 backdrop-blur-sm p-5 hover:-translate-y-1 hover:border-[#d4af37]/40 hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] transition-all duration-300 cursor-pointer h-full overflow-hidden">
                      {/* Glow on hover */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-white text-base leading-tight pr-8">{t.name}</h3>
                          <Badge
                            className={
                              t.status === "in_progress"
                                ? "bg-[#1a472a]/30 text-emerald-400 border-emerald-500/20 text-[10px] uppercase tracking-wider font-bold"
                                : "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 text-[10px] uppercase tracking-wider font-bold"
                            }
                          >
                            {t.status === "in_progress" ? "En curso" : "Inscripción"}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-white/40">
                            <CalendarDays className="size-3.5 text-[#d4af37]/60" />
                            {new Date(t.startDate).toLocaleDateString("es")} — {new Date(t.endDate).toLocaleDateString("es")}
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <Trophy className="size-3.5 text-[#d4af37]/60" />
                            <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 text-[10px] font-semibold px-2 py-0">
                              {formatLabels[t.format] || t.format}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <Users className="size-3.5 text-[#d4af37]/60" />
                            {t._count.tournamentTeams} equipos · {t._count.matches} partidos
                          </div>
                        </div>

                        {t.tournamentCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
                            {t.tournamentCategories.map((tc) => (
                              <Badge
                                key={tc.category.id}
                                variant="outline"
                                className="text-[10px] text-white/30 border-white/10 bg-white/[0.02]"
                              >
                                {tc.category.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>


      {/* ===== 5. UPCOMING MATCHES ===== */}
      {upcomingMatches.length > 0 && (
        <section className="relative overflow-hidden">
          {/* Dark gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] via-[#141b2d]/50 to-[#0a0e17]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 30px,
                rgba(212,175,55,0.4) 30px,
                rgba(212,175,55,0.4) 31px
              )`,
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-gradient-to-b from-[#d4af37] to-[#d4af37]/30 rounded-full" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
                  Próximos Partidos
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((m, i) => (
                  <motion.div key={m.id} variants={fadeUp} custom={i + 1}>
                    <div className={`rounded-2xl border border-white/[0.06] p-5 hover:border-[#d4af37]/20 hover:shadow-[0_4px_20px_rgba(212,175,55,0.06)] transition-all duration-300 ${
                      i % 2 === 0 ? "bg-[#141b2d]/60" : "bg-[#141b2d]/40"
                    } backdrop-blur-sm`}>
                      {/* Tournament name */}
                      {m.tournament && (
                        <p className="text-[10px] text-[#d4af37]/60 font-semibold uppercase tracking-widest mb-3">
                          {m.tournament.name}
                        </p>
                      )}

                      {/* Teams */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Home */}
                        <div className="flex-1 text-center">
                          <div
                            className="size-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/10"
                            style={{ backgroundColor: m.homeTeam.primaryColor ?? "#374151" }}
                          >
                            {m.homeTeam.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-white text-sm font-semibold truncate">{m.homeTeam.name}</p>
                        </div>

                        {/* VS */}
                        <div className="flex flex-col items-center gap-1 px-2">
                          <span className="text-[#d4af37] font-black text-2xl drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">VS</span>
                          <div className="w-10 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
                        </div>

                        {/* Away */}
                        <div className="flex-1 text-center">
                          <div
                            className="size-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/10"
                            style={{ backgroundColor: m.awayTeam.primaryColor ?? "#374151" }}
                          >
                            {m.awayTeam.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-white text-sm font-semibold truncate">{m.awayTeam.name}</p>
                        </div>
                      </div>

                      {/* Date / Location */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/30">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 text-[#d4af37]/40" />
                          {new Date(m.dateTime).toLocaleDateString("es", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {new Date(m.dateTime).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {m.location && (
                          <div className="flex items-center gap-1 truncate ml-2">
                            <MapPin className="size-3 text-[#d4af37]/40" />
                            {m.location.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}


      {/* ===== 6. STANDINGS TABLE ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-[#d4af37] to-[#d4af37]/30 rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
              Tabla de Posiciones
            </h2>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            {standings.length > 0 ? (
              <Card className="overflow-hidden rounded-2xl border-white/[0.06] bg-[#141b2d]/60 backdrop-blur-sm">
                <StandingsTable standings={standings} qualifyingSpots={2} />
              </Card>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-[#141b2d]/50 backdrop-blur-sm p-12 text-center">
                <Trophy className="size-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">
                  No hay tabla de posiciones disponible.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ===== 7. CALL TO ACTION BANNER ===== */}
      <section className="relative overflow-hidden">
        <div
          className="relative py-16 sm:py-20"
          style={{
            background: "linear-gradient(135deg, #1a472a 0%, #d4af37 100%)",
          }}
        >
          {/* Animated background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 40px,
                rgba(0,0,0,0.1) 40px,
                rgba(0,0,0,0.1) 41px
              )`,
            }}
          />
          {/* Subtle moving shimmer */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 3s linear infinite",
            }}
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-lg">
                ¿Quieres participar?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                ¡Inscribe tu equipo y forma parte de la mejor liga de fútbol!
              </p>
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-[#0a0e17] hover:bg-[#141b2d] text-white font-bold text-sm uppercase tracking-wider h-13 px-10 rounded-full shadow-xl hover:shadow-2xl transition-all border-0"
                >
                  <Flame className="size-5 mr-2" />
                  ¡Inscribe tu equipo!
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Shimmer animation defined in globals.css */}
      </section>

      {/* Bottom spacer */}
      <div className="h-8 bg-[#0a0e17]" />
    </div>
  );
}
