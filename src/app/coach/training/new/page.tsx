"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarCheck,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Clock,
  ArrowLeft,
  Save,
  Flame,
  Target,
  Snowflake,
  BookOpen,
} from "lucide-react";

type Exercise = {
  id: string;
  title: string;
  category: string;
  difficulty: string | null;
  durationMinutes: number | null;
  minAge: number | null;
  maxAge: number | null;
  methodologySource: string | null;
};

type SessionDraft = {
  tempId: string;
  phase: "warmup" | "main" | "cooldown";
  sessionDate: string;
  durationMinutes: string;
  exercises: { exerciseId: string; title: string; duration: number | null }[];
};

const PHASE_CONFIG = {
  warmup: { label: "Calentamiento", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  main: { label: "Parte Principal", icon: Target, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  cooldown: { label: "Enfriamiento", icon: Snowflake, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

export default function NewTrainingPlanPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Plan fields
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetAgeMin, setTargetAgeMin] = useState("");
  const [targetAgeMax, setTargetAgeMax] = useState("");
  const [level, setLevel] = useState("");
  const [objectives, setObjectives] = useState("");

  // Sessions
  const [sessions, setSessions] = useState<SessionDraft[]>([]);

  // Exercise browser
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("");
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        if (session?.user?.teamId) setTeamId(session.user.teamId);
      } catch {
        // ignore
      }
    }
    fetchSession();
  }, []);

  const fetchExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (exerciseSearch) params.set("keyword", exerciseSearch);
      if (exerciseCategory) params.set("category", exerciseCategory);
      if (targetAgeMin) params.set("minAge", targetAgeMin);
      if (targetAgeMax) params.set("maxAge", targetAgeMax);

      const res = await fetch(`/api/exercises?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises);
      }
    } catch {
      // ignore
    } finally {
      setLoadingExercises(false);
    }
  }, [exerciseSearch, exerciseCategory, targetAgeMin, targetAgeMax]);

  useEffect(() => {
    const timer = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  const addSession = (phase: "warmup" | "main" | "cooldown") => {
    setSessions((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        phase,
        sessionDate: "",
        durationMinutes: "",
        exercises: [],
      },
    ]);
  };

  const removeSession = (tempId: string) => {
    setSessions((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const addExerciseToSession = (tempId: string, exercise: Exercise) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.tempId === tempId
          ? {
              ...s,
              exercises: [
                ...s.exercises,
                {
                  exerciseId: exercise.id,
                  title: exercise.title,
                  duration: exercise.durationMinutes,
                },
              ],
            }
          : s
      )
    );
  };

  const removeExerciseFromSession = (tempId: string, index: number) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.tempId === tempId
          ? { ...s, exercises: s.exercises.filter((_, i) => i !== index) }
          : s
      )
    );
  };

  const handleSave = async () => {
    if (!teamId || !name.trim()) return;
    setSaving(true);

    try {
      const planRes = await fetch("/api/training-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          name: name.trim(),
          targetAgeMin: targetAgeMin ? parseInt(targetAgeMin) : null,
          targetAgeMax: targetAgeMax ? parseInt(targetAgeMax) : null,
          level: level || null,
          objectives: objectives.trim() || null,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (!planRes.ok) {
        const err = await planRes.json();
        alert(err.error || "Error al crear plan");
        return;
      }

      const plan = await planRes.json();

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        await fetch(`/api/training-plans/${plan.id}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionDate: session.sessionDate || null,
            durationMinutes: session.durationMinutes ? parseInt(session.durationMinutes) : null,
            phase: session.phase,
            sessionOrder: i + 1,
            exercises: session.exercises.map((e, idx) => ({
              exerciseId: e.exerciseId,
              exerciseOrder: idx + 1,
            })),
          }),
        });
      }

      router.push(`/coach/training/${plan.id}`);
    } catch {
      alert("Error al guardar el plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C1D82F]/10 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-[#C1D82F]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nuevo Plan de Entrenamiento</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Form */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-6 space-y-5"
          >
            <h2 className="font-semibold text-white flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[#C1D82F]" />
              Información del Plan
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Nombre del plan *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Plan pretemporada Sub-14"
                className="w-full h-10 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Fecha inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Fecha fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Edad mínima</label>
                <input
                  type="number"
                  min={4}
                  max={99}
                  value={targetAgeMin}
                  onChange={(e) => setTargetAgeMin(e.target.value)}
                  placeholder="Ej: 12"
                  className="w-full h-10 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Edad máxima</label>
                <input
                  type="number"
                  min={4}
                  max={99}
                  value={targetAgeMax}
                  onChange={(e) => setTargetAgeMax(e.target.value)}
                  placeholder="Ej: 14"
                  className="w-full h-10 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Nivel</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Objetivos</label>
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Describe los objetivos del plan..."
                className="w-full min-h-[80px] rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all resize-y"
              />
            </div>
          </motion.div>

          {/* Sessions Builder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-[#C1D82F]" />
                Sesiones
              </h2>
              <div className="flex gap-1.5">
                {(["warmup", "main", "cooldown"] as const).map((phase) => {
                  const cfg = PHASE_CONFIG[phase];
                  const Icon = cfg.icon;
                  return (
                    <motion.button
                      key={phase}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => addSession(phase)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${cfg.bg} ${cfg.color} hover:brightness-125`}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Flame className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">Agrega sesiones usando los botones de arriba</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {sessions.map((session, idx) => {
                    const cfg = PHASE_CONFIG[session.phase];
                    const PhaseIcon = cfg.icon;
                    const totalDur = session.exercises.reduce((sum, e) => sum + (e.duration ?? 0), 0);

                    return (
                      <motion.div
                        key={session.tempId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`rounded-xl border p-4 space-y-3 ${cfg.bg}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-white/20" />
                            <PhaseIcon className={`w-4 h-4 ${cfg.color}`} />
                            <span className="font-medium text-sm text-white">
                              Sesión {idx + 1} — {cfg.label}
                            </span>
                            {totalDur > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 text-[10px] font-medium text-white/50">
                                <Clock className="w-2.5 h-2.5" />
                                {totalDur} min
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeSession(session.tempId)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-white/40">Fecha</label>
                            <input
                              type="date"
                              className="w-full h-8 rounded-lg border border-white/10 bg-[#0d1117]/50 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C1D82F]/40 transition-all [color-scheme:dark]"
                              value={session.sessionDate}
                              onChange={(e) =>
                                setSessions((prev) =>
                                  prev.map((s) =>
                                    s.tempId === session.tempId ? { ...s, sessionDate: e.target.value } : s
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-white/40">Duración (min)</label>
                            <input
                              type="number"
                              className="w-full h-8 rounded-lg border border-white/10 bg-[#0d1117]/50 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C1D82F]/40 transition-all"
                              value={session.durationMinutes}
                              onChange={(e) =>
                                setSessions((prev) =>
                                  prev.map((s) =>
                                    s.tempId === session.tempId ? { ...s, durationMinutes: e.target.value } : s
                                  )
                                )
                              }
                              placeholder={totalDur > 0 ? `~${totalDur}` : ""}
                            />
                          </div>
                        </div>

                        {/* Exercises in session */}
                        <div className="space-y-1.5">
                          {session.exercises.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="flex items-center gap-2 bg-[#0d1117]/40 rounded-lg px-2.5 py-1.5 text-xs"
                            >
                              <span className="text-white/30 font-mono w-5">{exIdx + 1}.</span>
                              <span className="flex-1 truncate text-white/70">{ex.title}</span>
                              {ex.duration && (
                                <span className="text-white/30 shrink-0">{ex.duration}m</span>
                              )}
                              <button
                                onClick={() => removeExerciseFromSession(session.tempId, exIdx)}
                                className="text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-all"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C1D82F] text-[#0d1117] font-semibold text-sm shadow-lg shadow-[#C1D82F]/20 hover:shadow-[#C1D82F]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar Plan"}
            </motion.button>
          </div>
        </div>

        {/* Exercise Library Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <div className="rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-4 space-y-4 sticky top-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C1D82F]" />
              <h3 className="font-semibold text-sm text-white">Biblioteca de Ejercicios</h3>
            </div>
            <p className="text-xs text-white/30">Haz clic en + para agregar a una sesión</p>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
              <input
                placeholder="Buscar ejercicio..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="w-full h-9 rounded-xl border border-white/10 bg-[#0d1117]/50 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all"
              />
            </div>

            <Select
              value={exerciseCategory || "all"}
              onValueChange={(v) => setExerciseCategory(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="ball_control">Control de Balón</SelectItem>
                <SelectItem value="passing">Pases</SelectItem>
                <SelectItem value="shooting">Tiros</SelectItem>
                <SelectItem value="agility">Agilidad</SelectItem>
                <SelectItem value="tactics">Tácticas</SelectItem>
                <SelectItem value="physical">Físico</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>

            <div className="max-h-[500px] overflow-y-auto space-y-1.5 scrollbar-thin">
              {loadingExercises ? (
                <div className="text-center py-8">
                  <div className="w-5 h-5 border-2 border-[#C1D82F]/30 border-t-[#C1D82F] rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-white/30 mt-2">Cargando...</p>
                </div>
              ) : exercises.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-8">Sin resultados</p>
              ) : (
                exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center gap-2 rounded-xl border border-white/5 px-3 py-2.5 text-xs hover:border-[#C1D82F]/20 hover:bg-[#C1D82F]/5 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white/80 truncate group-hover:text-white transition-colors">
                        {ex.title}
                      </p>
                      <div className="flex items-center gap-2 text-white/30 mt-0.5">
                        {ex.durationMinutes && <span>{ex.durationMinutes}m</span>}
                        {ex.methodologySource && (
                          <span className="px-1.5 py-0 rounded bg-white/5 text-[9px]">
                            {ex.methodologySource}
                          </span>
                        )}
                      </div>
                    </div>
                    {sessions.length > 0 && (
                      <div className="flex flex-col gap-0.5">
                        {sessions.map((s, idx) => {
                          const cfg = PHASE_CONFIG[s.phase];
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={s.tempId}
                              onClick={() => addExerciseToSession(s.tempId, ex)}
                              className={`flex items-center gap-0.5 text-[9px] text-white/30 hover:text-[#C1D82F] px-1.5 py-0.5 rounded-lg hover:bg-[#C1D82F]/10 transition-all`}
                              title={`Agregar a Sesión ${idx + 1}`}
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <Icon className={`w-2.5 h-2.5 ${cfg.color}`} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
