"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormationPitch from "@/components/football/FormationPitch";
import { Plus, Star, Trash2, Edit, History } from "lucide-react";

type FieldType = "7" | "9" | "11";

const FORMATIONS_BY_FIELD: Record<FieldType, { formation: string; label: string }[]> = {
  "7": [
    { formation: "3-3", label: "3-3 (Equilibrada)" },
    { formation: "2-3-1", label: "2-3-1 (Ofensiva)" },
    { formation: "3-2-1", label: "3-2-1 (Defensiva)" },
    { formation: "2-2-2", label: "2-2-2 (Diamante)" },
    { formation: "1-3-2", label: "1-3-2 (Mediocampo fuerte)" },
    { formation: "3-1-2", label: "3-1-2 (Pivote)" },
    { formation: "2-1-2-1", label: "2-1-2-1 (Rombo)" },
  ],
  "9": [
    { formation: "3-3-2", label: "3-3-2 (Equilibrada)" },
    { formation: "3-4-1", label: "3-4-1 (Mediocampo fuerte)" },
    { formation: "4-3-1", label: "4-3-1 (Defensiva)" },
    { formation: "3-2-3", label: "3-2-3 (Ofensiva)" },
    { formation: "2-4-2", label: "2-4-2 (Amplitud)" },
    { formation: "4-2-2", label: "4-2-2 (Bloque bajo)" },
    { formation: "3-1-3-1", label: "3-1-3-1 (Pivote + amplitud)" },
    { formation: "2-3-3", label: "2-3-3 (Ultra ofensiva)" },
  ],
  "11": [
    { formation: "4-4-2", label: "4-4-2 (Clásica)" },
    { formation: "4-3-3", label: "4-3-3 (Posesión)" },
    { formation: "3-5-2", label: "3-5-2 (Mediocampo)" },
    { formation: "5-3-2", label: "5-3-2 (Defensiva)" },
    { formation: "4-2-3-1", label: "4-2-3-1 (Moderna)" },
    { formation: "4-1-4-1", label: "4-1-4-1 (Pivote)" },
    { formation: "4-4-1-1", label: "4-4-1-1 (Mediapunta)" },
    { formation: "3-4-3", label: "3-4-3 (Ultra ofensiva)" },
    { formation: "5-4-1", label: "5-4-1 (Bloque bajo)" },
    { formation: "4-3-2-1", label: "4-3-2-1 (Árbol de navidad)" },
    { formation: "4-5-1", label: "4-5-1 (Mediocampo denso)" },
    { formation: "3-4-1-2", label: "3-4-1-2 (Mediapunta + 2 puntas)" },
    { formation: "4-1-2-1-2", label: "4-1-2-1-2 (Diamante)" },
    { formation: "3-4-2-1", label: "3-4-2-1 (Falso 9)" },
    { formation: "4-3-1-2", label: "4-3-1-2 (Doble punta)" },
  ],
};

const FIELD_LABELS: Record<FieldType, string> = {
  "7": "Fútbol 7 (6 + portero)",
  "9": "Fútbol 9 (8 + portero)",
  "11": "Fútbol 11 (10 + portero)",
};

const STRATEGIES = [
  { value: "offensive", label: "Ofensiva" },
  { value: "defensive", label: "Defensiva" },
  { value: "counter_attack", label: "Contraataque" },
  { value: "possession", label: "Posesión" },
] as const;

type Tactic = {
  id: string;
  name: string;
  formation: string;
  strategy: string | null;
  playerPositions: Record<string, string>;
  isPrimary: boolean;
  createdAt: string;
  team: { id: string; name: string };
};

type PlayerInfo = {
  id: string;
  fullName: string;
  jerseyNumber?: number;
  position?: string;
};

type MatchHistory = {
  matchId: string;
  dateTime: string;
  opponent: { id: string; name: string };
  teamScore: number | null;
  opponentScore: number | null;
  result: "win" | "draw" | "loss" | "unknown";
  tactic: { id: string; name: string; formation: string } | null;
};

export default function TacticsPage() {
  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"editor" | "saved" | "history">("saved");

  // Editor state
  const [editingTactic, setEditingTactic] = useState<Tactic | null>(null);
  const [formName, setFormName] = useState("");
  const [formFieldType, setFormFieldType] = useState<FieldType>("11");
  const [formFormation, setFormFormation] = useState<string>("4-4-2");
  const [formStrategy, setFormStrategy] = useState<string>("");
  const [formPositions, setFormPositions] = useState<Record<string, string>>({});
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch team info from session
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const tid = session?.user?.teamId;
        if (tid) setTeamId(tid);
      } catch {
        // ignore
      }
    }
    fetchSession();
  }, []);

  const fetchTactics = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/tactics?teamId=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setTactics(data);
      }
    } catch {
      // ignore
    }
  }, [teamId]);

  const fetchPlayers = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        const teamPlayers = (data.teamPlayers ?? []).map(
          (tp: { player: { id: string; fullName: string; position: string }; jerseyNumber: number }) => ({
            id: tp.player.id,
            fullName: tp.player.fullName,
            jerseyNumber: tp.jerseyNumber,
            position: tp.player.position,
          })
        );
        setPlayers(teamPlayers);
      }
    } catch {
      // ignore
    }
  }, [teamId]);

  const fetchHistory = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/tactics?teamId=${teamId}&history=true`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMatchHistory(data);
      }
    } catch {
      // ignore
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      setLoading(true);
      Promise.all([fetchTactics(), fetchPlayers(), fetchHistory()]).finally(() =>
        setLoading(false)
      );
    }
  }, [teamId, fetchTactics, fetchPlayers, fetchHistory]);

  const resetForm = () => {
    setEditingTactic(null);
    setFormName("");
    setFormFieldType("11");
    setFormFormation("4-4-2");
    setFormStrategy("");
    setFormPositions({});
    setFormIsPrimary(false);
    setError(null);
  };

  const openEditor = (tactic?: Tactic) => {
    if (tactic) {
      setEditingTactic(tactic);
      setFormName(tactic.name);
      // Detect field type from formation
      const parts = tactic.formation.split("-").map(Number);
      const total = parts.reduce((a, b) => a + b, 0) + 1; // +1 for GK
      if (total <= 7) setFormFieldType("7");
      else if (total <= 9) setFormFieldType("9");
      else setFormFieldType("11");
      setFormFormation(tactic.formation);
      setFormStrategy(tactic.strategy ?? "");
      setFormPositions(tactic.playerPositions ?? {});
      setFormIsPrimary(tactic.isPrimary);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!teamId || !formName.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const body = {
        teamId,
        name: formName,
        formation: formFormation,
        strategy: formStrategy || null,
        playerPositions: formPositions,
        isPrimary: formIsPrimary,
      };

      const url = editingTactic
        ? `/api/tactics/${editingTactic.id}`
        : "/api/tactics";
      const method = editingTactic ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al guardar");
        return;
      }

      setDialogOpen(false);
      resetForm();
      await fetchTactics();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta táctica?")) return;
    try {
      const res = await fetch(`/api/tactics/${id}`, { method: "DELETE" });
      if (res.ok) await fetchTactics();
    } catch {
      // ignore
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const res = await fetch(`/api/tactics/${id}/primary`, { method: "PUT" });
      if (res.ok) await fetchTactics();
    } catch {
      // ignore
    }
  };

  const handleAssignPlayer = (slotKey: string, playerId: string) => {
    setFormPositions((prev) => {
      const next = { ...prev };
      // Remove player from any other slot
      for (const key of Object.keys(next)) {
        if (next[key] === playerId) delete next[key];
      }
      next[slotKey] = playerId;
      return next;
    });
  };

  const handleRemovePlayer = (slotKey: string) => {
    setFormPositions((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando tácticas...</p>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No tienes un equipo asignado.</p>
      </div>
    );
  }

  const resultBadge = (result: string) => {
    switch (result) {
      case "win":
        return <Badge className="bg-green-600">V</Badge>;
      case "draw":
        return <Badge className="bg-yellow-600">E</Badge>;
      case "loss":
        return <Badge className="bg-red-600">D</Badge>;
      default:
        return <Badge variant="secondary">?</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tácticas y Formaciones</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Táctica
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTactic ? "Editar Táctica" : "Nueva Táctica"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tactic-name">Nombre</Label>
                  <Input
                    id="tactic-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Ataque por bandas"
                  />
                </div>
                <div>
                  <Label>Tipo de Campo</Label>
                  <select
                    value={formFieldType}
                    onChange={(e) => {
                      const ft = e.target.value as FieldType;
                      setFormFieldType(ft);
                      const firstFormation = FORMATIONS_BY_FIELD[ft][0]?.formation || "";
                      setFormFormation(firstFormation);
                      setFormPositions({});
                    }}
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                  >
                    {(Object.keys(FORMATIONS_BY_FIELD) as FieldType[]).map((ft) => (
                      <option key={ft} value={ft}>{FIELD_LABELS[ft]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Formación</Label>
                  <select
                    value={formFormation}
                    onChange={(e) => {
                      setFormFormation(e.target.value);
                      setFormPositions({});
                    }}
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                  >
                    {FORMATIONS_BY_FIELD[formFieldType].map((f) => (
                      <option key={f.formation} value={f.formation}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Estrategia</Label>
                  <select
                    value={formStrategy}
                    onChange={(e) => setFormStrategy(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                  >
                    <option value="">Seleccionar...</option>
                    {STRATEGIES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPrimary}
                      onChange={(e) => setFormIsPrimary(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Táctica principal</span>
                  </label>
                </div>
              </div>

              <FormationPitch
                formation={formFormation}
                playerPositions={formPositions}
                availablePlayers={players}
                onAssignPlayer={handleAssignPlayer}
                onRemovePlayer={handleRemovePlayer}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "saved"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("saved")}
        >
          Tácticas Guardadas
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("history")}
        >
          <History className="w-4 h-4 inline mr-1" />
          Historial en Partidos
        </button>
      </div>

      {/* Saved Tactics */}
      {activeTab === "saved" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tactics.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No hay tácticas guardadas. Crea tu primera táctica.
            </p>
          )}
          {tactics.map((tactic) => (
            <Card key={tactic.id} className="relative">
              {tactic.isPrimary && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-yellow-500 text-black">
                    <Star className="w-3 h-3 mr-1" />
                    Principal
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{tactic.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{tactic.formation}</Badge>
                  {tactic.strategy && (
                    <Badge variant="secondary">
                      {STRATEGIES.find((s) => s.value === tactic.strategy)?.label ?? tactic.strategy}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <FormationPitch
                    formation={tactic.formation}
                    playerPositions={tactic.playerPositions}
                    availablePlayers={players}
                    readOnly
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  {!tactic.isPrimary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(tactic.id)}
                      title="Marcar como principal"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor(tactic)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tactic.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Match History */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Tácticas en Partidos</CardTitle>
          </CardHeader>
          <CardContent>
            {matchHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay historial de tácticas en partidos.
              </p>
            ) : (
              <div className="space-y-3">
                {matchHistory.map((m) => (
                  <div
                    key={m.matchId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {resultBadge(m.result)}
                      <div>
                        <p className="font-medium text-sm">
                          vs {m.opponent.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.dateTime).toLocaleDateString("es", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {m.teamScore ?? "-"} - {m.opponentScore ?? "-"}
                      </p>
                      {m.tactic && (
                        <p className="text-xs text-muted-foreground">
                          {m.tactic.name} ({m.tactic.formation})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
