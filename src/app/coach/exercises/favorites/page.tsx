"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Heart,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Dumbbell,
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

const CATEGORIES: Record<string, string> = {
  ball_control: "Control de Balón",
  passing: "Pases",
  shooting: "Tiros",
  agility: "Agilidad",
  tactics: "Tácticas",
  physical: "Físico",
  individual: "Individual",
};

function difficultyLabel(diff: string | null) {
  switch (diff) {
    case "beginner": return "Principiante";
    case "intermediate": return "Intermedio";
    case "advanced": return "Avanzado";
    default: return "";
  }
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
    default: return "";
  }
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exercises/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (exerciseId: string) => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/favorite`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((e) => e.id !== exerciseId));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/coach/exercises">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="size-6 text-red-500" />
            Ejercicios Favoritos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {favorites.length} ejercicio{favorites.length !== 1 ? "s" : ""} guardado{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">
            No tienes ejercicios favoritos aún
          </p>
          <Link href="/coach/exercises">
            <Button variant="outline">Explorar ejercicios</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((exercise) => (
            <Card key={exercise.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                    {exercise.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                      {CATEGORIES[exercise.category] ?? exercise.category}
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
                  onClick={() => removeFavorite(exercise.id)}
                  className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                  aria-label="Quitar de favoritos"
                >
                  <Heart className="size-4 fill-red-500 text-red-500" />
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
                  <span>
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
          ))}
        </div>
      )}
    </div>
  );
}
