"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Heart,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Star,
  Dumbbell,
  Filter,
  X,
  Package,
  Gauge,
  Calendar,
} from "lucide-react";

type Exercise = {
  id: string;
  title: string;
  description: string;
  category: string;
  minAge: number | null;
  maxAge: number | null;
  difficulty: string | null;
  durationMinutes: number | null;
  playersRequired: number | null;
  materials: string | null;
  methodologySource: string | null;
  isSmallSidedGame: boolean;
  gameFormat: string | null;
};

const CATEGORIES = [
  { value: "ball_control", label: "Control de Balón" },
  { value: "passing", label: "Pases" },
  { value: "shooting", label: "Tiros" },
  { value: "agility", label: "Agilidad" },
  { value: "tactics", label: "Tácticas" },
  { value: "physical", label: "Físico" },
  { value: "individual", label: "Individual" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

const METHODOLOGIES = [
  { value: "Chelsea FC", label: "Chelsea FC" },
  { value: "Barcelona", label: "Barcelona" },
  { value: "Ajax", label: "Ajax" },
  { value: "Arsenal", label: "Arsenal" },
  { value: "Real Madrid (La Fábrica)", label: "Real Madrid" },
  { value: "Bayern Munich", label: "Bayern Munich" },
  { value: "Manchester City", label: "Manchester City" },
  { value: "Liverpool", label: "Liverpool" },
  { value: "Juventus", label: "Juventus" },
  { value: "PSG", label: "PSG" },
  { value: "Borussia Dortmund", label: "Borussia Dortmund" },
  { value: "Benfica", label: "Benfica" },
  { value: "Santos FC", label: "Santos FC" },
  { value: "Club América", label: "Club América" },
];

const AGE_RANGES = [
  { value: "6-10", label: "6-10 años", min: 6, max: 10 },
  { value: "10-14", label: "10-14 años", min: 10, max: 14 },
  { value: "14-18", label: "14-18 años", min: 14, max: 18 },
];

function categoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function difficultyLabel(diff: string | null) {
  if (!diff) return "";
  return DIFFICULTIES.find((d) => d.value === diff)?.label ?? diff;
}

function difficultyColor(diff: string | null) {
  switch (diff) {
    case "beginner": return "bg-green-100 text-green-800";
    case "intermediate": return "bg-yellow-100 text-yellow-800";
    case "advanced": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function methodologyColor(source: string | null) {
  switch (source) {
    case "Chelsea FC": return "bg-blue-600 text-white";
    case "Barcelona": return "bg-[#a50044] text-white";
    case "Ajax": return "bg-red-600 text-white";
    case "Arsenal": return "bg-red-700 text-white";
    case "Real Madrid (La Fábrica)": return "bg-[#febe10] text-black";
    case "Bayern Munich": return "bg-[#dc052d] text-white";
    case "Manchester City": return "bg-[#6cabdd] text-white";
    case "Liverpool": return "bg-[#c8102e] text-white";
    case "Juventus": return "bg-black text-white";
    case "PSG": return "bg-[#004170] text-white";
    case "Borussia Dortmund": return "bg-[#fde100] text-black";
    case "Benfica": return "bg-[#e20e0e] text-white";
    case "Santos FC": return "bg-white text-black border border-gray-300";
    case "Club América": return "bg-[#ffe100] text-[#1a3a5c]";
    default: return "";
  }
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [methodology, setMethodology] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (category) params.set("category", category);
      if (difficulty) params.set("difficulty", difficulty);
      if (methodology) params.set("methodologySource", methodology);
      if (ageRange) {
        const range = AGE_RANGES.find((r) => r.value === ageRange);
        if (range) {
          params.set("minAge", String(range.min));
          params.set("maxAge", String(range.max));
        }
      }
      params.set("page", String(page));
      params.set("pageSize", "12");

      const res = await fetch(`/api/exercises?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [keyword, category, difficulty, methodology, ageRange, page]);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/exercises/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds(new Set(data.map((e: Exercise) => e.id)));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (exerciseId: string) => {
    const isFav = favoriteIds.has(exerciseId);
    const method = isFav ? "DELETE" : "POST";

    try {
      const res = await fetch(`/api/exercises/${exerciseId}/favorite`, { method });
      if (res.ok) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.delete(exerciseId);
          else next.add(exerciseId);
          return next;
        });
      }
    } catch {
      // ignore
    }
  };

  const clearFilters = () => {
    setKeyword("");
    setCategory("");
    setDifficulty("");
    setMethodology("");
    setAgeRange("");
    setPage(1);
  };

  const hasActiveFilters = category || difficulty || methodology || ageRange || keyword;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="size-6 text-[#C1D82F]" />
            Biblioteca de Ejercicios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} ejercicios disponibles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/coach/exercises/favorites">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Heart className="size-4" />
              Favoritos
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-4" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside
          className={`${
            showFilters ? "block" : "hidden"
          } lg:block w-full lg:w-64 shrink-0 space-y-4`}
        >
          <div className="rounded-lg border p-4 space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Filtros</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs text-muted-foreground">
                  <X className="size-3 mr-1" /> Limpiar
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ejercicio..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categoría</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value === "all" ? "" : e.target.value); setPage(1); }}
                className="flex h-9 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
              >
                <option value="all">Todas</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Age Range */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Edad</label>
              <select
                value={ageRange}
                onChange={(e) => { setAgeRange(e.target.value === "all" ? "" : e.target.value); setPage(1); }}
                className="flex h-9 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
              >
                <option value="all">Todas las edades</option>
                {AGE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Dificultad</label>
              <select
                value={difficulty}
                onChange={(e) => { setDifficulty(e.target.value === "all" ? "" : e.target.value); setPage(1); }}
                className="flex h-9 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
              >
                <option value="all">Todas</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Methodology */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Metodología</label>
              <select
                value={methodology}
                onChange={(e) => { setMethodology(e.target.value === "all" ? "" : e.target.value); setPage(1); }}
                className="flex h-9 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
              >
                <option value="all">Todas</option>
                {METHODOLOGIES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No se encontraron ejercicios</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isFavorite={favoriteIds.has(exercise.id)}
                    onToggleFavorite={() => toggleFavorite(exercise.id)}
                    onClick={() => setSelectedExercise(exercise)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Exercise Detail Modal */}
      <Dialog open={!!selectedExercise} onOpenChange={(open) => { if (!open) setSelectedExercise(null); }}>
        <DialogContent className="max-w-lg bg-[#0d1117] border-gray-700 text-white max-h-[85vh] overflow-y-auto">
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white leading-tight pr-8">
                  {selectedExercise.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Methodology Badge */}
                {selectedExercise.methodologySource && (
                  <Badge
                    variant="default"
                    className={`text-xs gap-1.5 px-3 py-1 ${methodologyColor(selectedExercise.methodologySource)}`}
                  >
                    <Star className="size-3" />
                    {selectedExercise.methodologySource}
                  </Badge>
                )}

                {/* Full Description */}
                <div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {selectedExercise.description}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
                    <Dumbbell className="size-4 text-[#C1D82F]" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Categoría</p>
                      <p className="text-sm text-white">{categoryLabel(selectedExercise.category)}</p>
                    </div>
                  </div>

                  {/* Difficulty */}
                  {selectedExercise.difficulty && (
                    <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
                      <Gauge className="size-4 text-[#C1D82F]" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Dificultad</p>
                        <p className="text-sm text-white">{difficultyLabel(selectedExercise.difficulty)}</p>
                      </div>
                    </div>
                  )}

                  {/* Age Range */}
                  {selectedExercise.minAge != null && selectedExercise.maxAge != null && (
                    <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
                      <Calendar className="size-4 text-[#C1D82F]" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Edad</p>
                        <p className="text-sm text-white">{selectedExercise.minAge}-{selectedExercise.maxAge} años</p>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  {selectedExercise.durationMinutes && (
                    <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
                      <Clock className="size-4 text-[#C1D82F]" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Duración</p>
                        <p className="text-sm text-white">{selectedExercise.durationMinutes} minutos</p>
                      </div>
                    </div>
                  )}

                  {/* Players Required */}
                  {selectedExercise.playersRequired && (
                    <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
                      <Users className="size-4 text-[#C1D82F]" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Jugadores</p>
                        <p className="text-sm text-white">{selectedExercise.playersRequired}</p>
                      </div>
                    </div>
                  )}

                  {/* Materials */}
                  {selectedExercise.materials && (
                    <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
                      <Package className="size-4 text-[#C1D82F]" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Materiales</p>
                        <p className="text-sm text-white">{selectedExercise.materials}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Small-Sided Game Format */}
                {selectedExercise.isSmallSidedGame && selectedExercise.gameFormat && (
                  <div className="flex items-center gap-2 rounded-lg bg-purple-900/30 border border-purple-700/50 px-3 py-2">
                    <span className="text-sm text-purple-300 font-medium">
                      ⚽ Juego reducido: {selectedExercise.gameFormat}
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setSelectedExercise(null)}
                  className="w-full bg-[#C1D82F] text-black hover:bg-[#a8bc28] font-semibold"
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExerciseCard({
  exercise,
  isFavorite,
  onToggleFavorite,
  onClick,
}: {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
}) {
  return (
    <Card className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {exercise.title}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              {categoryLabel(exercise.category)}
            </span>
            {exercise.difficulty && (
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${difficultyColor(exercise.difficulty)}`}>
                {difficultyLabel(exercise.difficulty)}
              </span>
            )}
            {exercise.isSmallSidedGame && exercise.gameFormat && (
              <span className="inline-flex items-center rounded-md bg-purple-100 text-purple-800 px-1.5 py-0.5 text-[10px] font-medium">
                {exercise.gameFormat}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFavorite(); }}
          className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            className={`size-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
          />
        </button>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">
        {exercise.description}
      </p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
        {exercise.durationMinutes && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {exercise.durationMinutes} min
          </span>
        )}
        {exercise.playersRequired && (
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {exercise.playersRequired}
          </span>
        )}
        {exercise.minAge != null && exercise.maxAge != null && (
          <span className="flex items-center gap-1">
            {exercise.minAge}-{exercise.maxAge} años
          </span>
        )}
      </div>

      {exercise.methodologySource && (
        <div className="pt-1">
          <Badge
            variant="default"
            className={`text-[10px] gap-1 ${methodologyColor(exercise.methodologySource)}`}
          >
            <Star className="size-2.5" />
            {exercise.methodologySource}
          </Badge>
        </div>
      )}
    </Card>
  );
}
