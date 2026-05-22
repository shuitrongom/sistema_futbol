"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Shield, Users, CalendarDays, MapPin, Tags, UserCog, Swords, ArrowRight, TrendingUp, Loader2,
} from "lucide-react";

interface DashboardStats {
  activeTournaments: number;
  totalTeams: number;
  totalPlayers: number;
  matchesToday: number;
}

const QUICK_LINKS = [
  { href: "/admin/tournaments", label: "Torneos", desc: "Gestionar competiciones", icon: Trophy },
  { href: "/admin/teams", label: "Equipos", desc: "Equipos y jugadores", icon: Shield },
  { href: "/admin/matches", label: "Partidos", desc: "Resultados y eventos", icon: Swords },
  { href: "/admin/locations", label: "Ubicaciones", desc: "Canchas y campos", icon: MapPin },
  { href: "/admin/categories", label: "Categorías", desc: "Clasificaciones", icon: Tags },
  { href: "/admin/users", label: "Usuarios", desc: "Entrenadores y padres", icon: UserCog },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const } }),
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const results = await Promise.allSettled([
          fetch("/api/tournaments"), fetch("/api/teams"), fetch("/api/players"), fetch("/api/matches"),
        ]);
        const tournaments = results[0].status === "fulfilled" && results[0].value.ok ? await results[0].value.json() : [];
        const teams = results[1].status === "fulfilled" && results[1].value.ok ? await results[1].value.json() : [];
        const players = results[2].status === "fulfilled" && results[2].value.ok ? await results[2].value.json() : [];
        const matches = results[3].status === "fulfilled" && results[3].value.ok ? await results[3].value.json() : [];
        const today = new Date().toISOString().split("T")[0];
        setStats({
          activeTournaments: Array.isArray(tournaments) ? tournaments.filter((t: { status: string }) => t.status === "in_progress" || t.status === "registration").length : 0,
          totalTeams: Array.isArray(teams) ? teams.length : 0,
          totalPlayers: Array.isArray(players) ? players.length : 0,
          matchesToday: Array.isArray(matches) ? matches.filter((m: { dateTime: string }) => m.dateTime?.startsWith(today)).length : 0,
        });
      } catch {
        setStats({ activeTournaments: 0, totalTeams: 0, totalPlayers: 0, matchesToday: 0 });
      } finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  const statCards = stats ? [
    { label: "Torneos Activos", value: stats.activeTournaments, icon: Trophy },
    { label: "Total Equipos", value: stats.totalTeams, icon: Shield },
    { label: "Total Jugadores", value: stats.totalPlayers, icon: Users },
    { label: "Partidos Hoy", value: stats.matchesToday, icon: CalendarDays },
  ] : [];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-8 bg-gradient-to-b from-[#C1D82F] to-[#2B8B41] rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
        </div>
        <p className="text-white/40 text-sm ml-5">Resumen general del sistema</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-[#C1D82F]" /></div>
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" initial="hidden" animate="visible">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={fadeUp} custom={i}>
                <div className="relative rounded-2xl border border-[#C1D82F]/10 bg-[#1a1f36]/60 backdrop-blur-sm p-5 overflow-hidden hover:border-[#C1D82F]/20 transition-all duration-300">
                  <div className="absolute -top-10 -right-10 size-24 rounded-full bg-[#C1D82F]/[0.03] blur-2xl" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                      <p className="text-3xl font-extrabold text-white mt-2">{stat.value}</p>
                    </div>
                    <div className="size-12 rounded-xl bg-[#C1D82F]/10 flex items-center justify-center text-[#C1D82F]">
                      <Icon className="size-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-[11px] text-white/25">
                    <TrendingUp className="size-3" /><span>Actualizado ahora</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <motion.div initial="hidden" animate="visible">
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-6 bg-gradient-to-b from-[#C1D82F] to-[#2B8B41] rounded-full" />
          <h2 className="text-lg font-bold text-white tracking-tight">Accesos Rápidos</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.div key={link.href} variants={fadeUp} custom={i + 1}>
                <Link href={link.href}>
                  <div className="relative rounded-2xl border border-[#C1D82F]/10 bg-[#1a1f36]/60 backdrop-blur-sm p-4 cursor-pointer group hover:-translate-y-0.5 hover:border-[#C1D82F]/30 hover:shadow-[0_4px_20px_rgba(193,216,47,0.08)] transition-all duration-300 overflow-hidden">
                    <div className="absolute -top-8 -right-8 size-20 rounded-full bg-[#C1D82F]/[0.02] blur-xl" />
                    <div className="relative flex items-center gap-4">
                      <div className="size-11 rounded-xl bg-[#C1D82F]/10 flex items-center justify-center text-[#C1D82F] shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm group-hover:text-[#C1D82F] transition-colors">{link.label}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{link.desc}</p>
                      </div>
                      <ArrowRight className="size-4 text-white/20 group-hover:text-[#C1D82F] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
