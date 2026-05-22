"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Shield, Search, Filter, MapPin, Users, Loader2, ChevronRight, Trophy } from "lucide-react";

interface Category { id: string; name: string }
interface Team {
  id: string; name: string; badgeUrl: string | null; primaryColor: string | null;
  secondaryColor: string | null; city: string | null;
  teamCategories: { category: Category }[];
  _count: { teamPlayers: number; tournamentTeams: number };
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamsRes, categoriesRes] = await Promise.all([fetch("/api/teams"), fetch("/api/categories")]);
        setTeams(Array.isArray(await teamsRes.json()) ? await (await fetch("/api/teams")).json() : []);
        setCategories(Array.isArray(await categoriesRes.json()) ? await (await fetch("/api/categories")).json() : []);
      } catch {} finally { setLoading(false); }
    }
    fetchData();
  }, []);

  // Fix: re-fetch properly
  useEffect(() => {
    async function load() {
      try {
        const [t, c] = await Promise.all([fetch("/api/teams"), fetch("/api/categories")]);
        if (t.ok) setTeams(await t.json());
        if (c.ok) setCategories(await c.json());
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = teams;
    if (selectedCategory !== "all") result = result.filter((t) => t.teamCategories.some((tc) => tc.category.id === selectedCategory));
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter((t) => t.name.toLowerCase().includes(q) || (t.city && t.city.toLowerCase().includes(q))); }
    return result;
  }, [teams, selectedCategory, search]);

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
              <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">Equipos</h1>
              <p className="text-white/40 text-sm mt-1">Explora todos los equipos registrados</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
          <Input placeholder="Buscar por nombre o ciudad..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#1a1f36]/60 border-[#C1D82F]/10 text-white placeholder:text-white/20 rounded-xl h-11 focus-visible:ring-[#C1D82F]/30 focus-visible:border-[#C1D82F]/30" />
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <Filter className="size-4 text-white/30 mr-1" />
            <button onClick={() => setSelectedCategory("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedCategory === "all" ? "bg-[#C1D82F] text-[#0d1117] shadow-[0_0_15px_rgba(193,216,47,0.3)]" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}>Todas</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === cat.id ? "bg-[#C1D82F] text-[#0d1117] shadow-[0_0_15px_rgba(193,216,47,0.3)]" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                }`}>{cat.name}</button>
            ))}
          </div>
        )}

        {/* Teams grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((team, i) => (
              <motion.div key={team.id} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
                <Link href={`/teams/${team.id}`}>
                  <div className="group relative rounded-2xl border border-white/[0.06] bg-[#1a1f36]/60 backdrop-blur-sm p-5 hover:-translate-y-1 hover:border-[#C1D82F]/30 hover:shadow-[0_8px_30px_rgba(193,216,47,0.08)] transition-all duration-300 cursor-pointer h-full">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C1D82F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="shrink-0 size-14 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-white/10 group-hover:ring-[#C1D82F]/30 transition-all"
                          style={{ backgroundColor: team.primaryColor || "#1a472a" }}>
                          {team.badgeUrl ? (
                            <img src={team.badgeUrl} alt={team.name} className="size-full object-cover" loading="lazy" />
                          ) : (
                            <span className="text-sm font-bold" style={{ color: team.secondaryColor || "#C1D82F" }}>
                              {team.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm truncate group-hover:text-[#C1D82F] transition-colors">{team.name}</h3>
                          {team.city && (
                            <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
                              <MapPin className="size-3 shrink-0 text-[#C1D82F]/40" /><span className="truncate">{team.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/30 mb-3">
                        <Users className="size-3 text-[#C1D82F]/40" /><span>{team._count.teamPlayers} jugadores</span>
                      </div>
                      {team.teamCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                          {team.teamCategories.map((tc) => (
                            <Badge key={tc.category.id} variant="outline" className="text-[10px] text-white/30 border-white/10 bg-white/[0.02]">{tc.category.name}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-end mt-2 text-[#C1D82F]/0 group-hover:text-[#C1D82F]/60 transition-all duration-300">
                        <span className="text-[10px] font-semibold uppercase tracking-wider mr-1">Ver equipo</span>
                        <ChevronRight className="size-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-[#1a1f36]/50 p-16 text-center">
            <Shield className="size-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">No se encontraron equipos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
