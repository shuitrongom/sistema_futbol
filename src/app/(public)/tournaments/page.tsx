"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Trophy,
  CalendarDays,
  Users,
  Loader2,
  Filter,
  ChevronRight,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  format: string;
  status: string;
  _count: { tournamentTeams: number; matches: number };
  tournamentCategories: { category: Category }[];
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
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tournamentsRes, categoriesRes] = await Promise.all([
          fetch("/api/tournaments"),
          fetch("/api/categories"),
        ]);
        const tournamentsData = await tournamentsRes.json();
        const categoriesData = await categoriesRes.json();
        setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Only show public-visible tournaments (not draft)
  const visibleTournaments = tournaments.filter((t) => t.status !== "draft");

  const filtered =
    selectedCategory === "all"
      ? visibleTournaments
      : visibleTournaments.filter((t) =>
          t.tournamentCategories.some((tc) => tc.category.id === selectedCategory)
        );

  const active = filtered.filter((t) => t.status === "in_progress" || t.status === "registration");
  const completed = filtered.filter((t) => t.status === "completed");

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
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-2">
            {/* Gold accent bar */}
            <div className="w-1.5 h-12 bg-gradient-to-b from-[#d4af37] to-[#d4af37]/30 rounded-full" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Torneos
              </h1>
              <p className="text-white/40 text-sm mt-1">
                Explora los torneos activos y finalizados
              </p>
            </div>
          </div>
        </motion.div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-2 mb-8 flex-wrap"
          >
            <Filter className="size-4 text-white/30 mr-1" />
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedCategory === "all"
                  ? "bg-[#d4af37] text-[#0a0e17] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? "bg-[#d4af37] text-[#0a0e17] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </motion.div>
        )}


        {/* Active tournaments */}
        {active.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mb-14"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-5">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
              </span>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Torneos Activos
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.map((t, i) => (
                <motion.div key={t.id} variants={fadeUp} custom={i + 1}>
                  <TournamentCard tournament={t} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Completed tournaments */}
        {completed.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-5">
              <span className="size-2.5 rounded-full bg-white/20" />
              <h2 className="text-lg font-bold text-white/60 uppercase tracking-wider">
                Torneos Finalizados
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map((t, i) => (
                <motion.div key={t.id} variants={fadeUp} custom={i + 1}>
                  <TournamentCard tournament={t} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-2xl border border-white/5 bg-[#141b2d]/50 backdrop-blur-sm p-16 text-center">
              <div className="size-20 rounded-full bg-[#d4af37]/5 flex items-center justify-center mx-auto mb-4">
                <Trophy className="size-10 text-[#d4af37]/20" />
              </div>
              <p className="text-white/40 text-sm font-medium">No se encontraron torneos.</p>
              <p className="text-white/20 text-xs mt-1">Intenta con otra categoría</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


/* ─── Tournament Card Component ─── */

function TournamentCard({ tournament: t }: { tournament: Tournament }) {
  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    in_progress: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      label: "En curso",
    },
    registration: {
      bg: "bg-[#d4af37]/10",
      text: "text-[#d4af37]",
      border: "border-[#d4af37]/20",
      label: "Inscripción",
    },
    completed: {
      bg: "bg-white/5",
      text: "text-white/40",
      border: "border-white/10",
      label: "Finalizado",
    },
    cancelled: {
      bg: "bg-[#e63946]/10",
      text: "text-[#e63946]",
      border: "border-[#e63946]/20",
      label: "Cancelado",
    },
  };

  const status = statusConfig[t.status] || statusConfig.completed;

  return (
    <Link href={`/tournaments/${t.id}`}>
      <div className="group relative rounded-2xl border border-white/[0.06] bg-[#141b2d]/60 backdrop-blur-sm p-5 hover:-translate-y-1 hover:border-[#d4af37]/40 hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] transition-all duration-300 cursor-pointer h-full overflow-hidden">
        {/* Hover glow overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative">
          {/* Status badge + name */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-white text-base leading-tight pr-3 group-hover:text-[#d4af37] transition-colors duration-300">
              {t.name}
            </h3>
            <Badge className={`${status.bg} ${status.text} ${status.border} text-[10px] uppercase tracking-wider font-bold flex-shrink-0`}>
              {status.label}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-white/40">
              <CalendarDays className="size-3.5 text-[#d4af37]/50 flex-shrink-0" />
              <span>
                {new Date(t.startDate).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                {" — "}
                {new Date(t.endDate).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Trophy className="size-3.5 text-[#d4af37]/50 flex-shrink-0" />
              <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 text-[10px] font-semibold px-2 py-0">
                {formatLabels[t.format] || t.format}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Users className="size-3.5 text-[#d4af37]/50 flex-shrink-0" />
              <span>{t._count.tournamentTeams} equipos</span>
            </div>
          </div>

          {/* Category badges */}
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

          {/* View arrow */}
          <div className="flex items-center justify-end mt-3 text-[#d4af37]/0 group-hover:text-[#d4af37]/60 transition-all duration-300">
            <span className="text-[10px] font-semibold uppercase tracking-wider mr-1">Ver torneo</span>
            <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
