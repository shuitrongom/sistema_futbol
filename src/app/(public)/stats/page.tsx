"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, BarChart3, Loader2, CalendarDays, Users, ChevronRight } from "lucide-react";

interface Tournament {
  id: string; name: string; startDate: string; endDate: string;
  format: string; status: string;
  _count: { tournamentTeams: number; matches: number };
}

const formatLabels: Record<string, string> = {
  league: "Liga", knockout: "Eliminación directa", group_knockout: "Grupos + Eliminación",
  double_knockout: "Doble eliminación", swiss: "Sistema suizo", league_playoff: "Liga + Liguilla",
  league_single: "Liga solo ida", cup: "Copa", round_robin_groups: "Grupos round-robin", mini_tournament: "Torneo relámpago",
};

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  in_progress: { label: "En curso", bg: "bg-[#2B8B41]/10", text: "text-[#C1D82F]", border: "border-[#2B8B41]/20" },
  completed: { label: "Finalizado", bg: "bg-white/5", text: "text-white/40", border: "border-white/10" },
  registration: { label: "Inscripción", bg: "bg-[#C1D82F]/10", text: "text-[#C1D82F]", border: "border-[#C1D82F]/20" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function StatsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/tournaments");
        if (res.ok) {
          const data = await res.json();
          setTournaments((Array.isArray(data) ? data : []).filter((t: Tournament) => t.status !== "draft"));
        }
      } catch {} finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0d1117]">
        <Loader2 className="size-8 animate-spin text-[#C1D82F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-1.5 h-12 bg-gradient-to-b from-[#C1D82F] to-[#2B8B41] rounded-full" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <BarChart3 className="size-8 text-[#C1D82F]" />
                Estadísticas
              </h1>
              <p className="text-white/40 text-sm mt-1">Selecciona un torneo para ver sus estadísticas detalladas</p>
            </div>
          </div>
        </motion.div>

        {tournaments.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#1a1f36]/50 p-16 text-center">
            <div className="size-20 rounded-full bg-[#C1D82F]/5 flex items-center justify-center mx-auto mb-4">
              <Trophy className="size-10 text-[#C1D82F]/20" />
            </div>
            <p className="text-white/40 text-sm">No hay torneos con estadísticas disponibles.</p>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" initial="hidden" animate="visible">
            {tournaments.map((t, i) => {
              const status = statusConfig[t.status] || statusConfig.completed;
              return (
                <motion.div key={t.id} variants={fadeUp} custom={i}>
                  <Link href={`/tournaments/${t.id}/stats`}>
                    <div className="group relative rounded-2xl border border-white/[0.06] bg-[#1a1f36]/60 backdrop-blur-sm p-5 hover:-translate-y-1 hover:border-[#C1D82F]/30 hover:shadow-[0_8px_30px_rgba(193,216,47,0.08)] transition-all duration-300 cursor-pointer h-full overflow-hidden">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C1D82F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-white text-base group-hover:text-[#C1D82F] transition-colors">{t.name}</h3>
                          <Badge className={`${status.bg} ${status.text} ${status.border} text-[10px] uppercase tracking-wider font-bold`}>{status.label}</Badge>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-white/40">
                            <CalendarDays className="size-3.5 text-[#C1D82F]/50" />
                            {new Date(t.startDate).toLocaleDateString("es")} — {new Date(t.endDate).toLocaleDateString("es")}
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <Trophy className="size-3.5 text-[#C1D82F]/50" />
                            <Badge className="bg-[#C1D82F]/10 text-[#C1D82F] border-[#C1D82F]/20 text-[10px] font-semibold px-2 py-0">{formatLabels[t.format] || t.format}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <Users className="size-3.5 text-[#C1D82F]/50" />
                            {t._count.tournamentTeams} equipos · {t._count.matches} partidos
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/5 text-[#C1D82F]/0 group-hover:text-[#C1D82F]/60 transition-all duration-300">
                          <BarChart3 className="size-3 mr-1" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider mr-1">Ver estadísticas</span>
                          <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
