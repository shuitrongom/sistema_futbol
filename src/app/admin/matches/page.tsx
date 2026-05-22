"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardEdit, Plus, Trash2 } from "lucide-react";

interface MatchTeam {
  id: string;
  name: string;
  badgeUrl?: string | null;
  primaryColor?: string | null;
}

interface MatchEvent {
  id: string;
  eventType: string;
  minute?: number | null;
  player?: { id: string; fullName: string } | null;
  team?: { id: string; name: string } | null;
}

interface Match {
  id: string;
  dateTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  tournament: { id: string; name: string };
  phase?: { id: string; name: string } | null;
  location?: { id: string; name: string } | null;
  events: MatchEvent[];
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programado",
  in_progress: "En curso",
  completed: "Finalizado",
  postponed: "Aplazado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "secondary",
  in_progress: "default",
  completed: "secondary",
  postponed: "destructive",
  cancelled: "destructive",
};

const EVENT_LABELS: Record<string, string> = {
  goal: "⚽ Gol",
  yellow_card: "🟨 Amarilla",
  red_card: "🟥 Roja",
  substitution: "🔄 Sustitución",
  assist: "👟 Asistencia",
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [loading, setLoading] = useState(true);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [eventForm, setEventForm] = useState({
    eventType: "goal" as string,
    teamId: "",
    playerId: "",
    minute: 0,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
        if (data.length > 0 && !selectedTournament) {
          setSelectedTournament(data[0].id);
        }
      }
    } catch { /* ignore */ }
  }, [selectedTournament]);

  const fetchMatches = useCallback(async () => {
    if (!selectedTournament) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?tournamentId=${selectedTournament}`);
      if (res.ok) setMatches(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [selectedTournament]);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);
  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  function openResultDialog(match: Match) {
    setSelectedMatch(match);
    setHomeScore(match.homeScore ?? 0);
    setAwayScore(match.awayScore ?? 0);
    setError("");
    setResultDialogOpen(true);
  }

  function openEventDialog(match: Match) {
    setSelectedMatch(match);
    setEventForm({ eventType: "goal", teamId: match.homeTeam.id, playerId: "", minute: 0 });
    setError("");
    setEventDialogOpen(true);
  }

  async function handleSubmitResult(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/result`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeScore, awayScore }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al registrar resultado");
        return;
      }
      setResultDialogOpen(false);
      fetchMatches();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  async function handleSubmitEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: eventForm.eventType,
          teamId: eventForm.teamId || undefined,
          playerId: eventForm.playerId || undefined,
          minute: eventForm.minute || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al agregar evento");
        return;
      }
      setEventDialogOpen(false);
      fetchMatches();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partidos</h1>
          <p className="text-muted-foreground">Gestiona resultados y eventos de partidos</p>
        </div>
      </div>

      {/* Tournament filter */}
      <div className="flex items-center gap-3">
        <Label htmlFor="tournament-filter">Torneo:</Label>
        <select
          id="tournament-filter"
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="flex h-8 rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando partidos...</div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay partidos para este torneo</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-center">Resultado</TableHead>
                <TableHead>Visitante</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(m.dateTime).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                    {" "}
                    {new Date(m.dateTime).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell className="font-medium">{m.homeTeam.name}</TableCell>
                  <TableCell className="text-center font-mono font-bold">
                    {m.homeScore !== null ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                  </TableCell>
                  <TableCell className="font-medium">{m.awayTeam.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.phase?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[m.status] as "default" | "secondary" | "destructive"}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openResultDialog(m)} title="Registrar resultado">
                        <ClipboardEdit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEventDialog(m)} title="Agregar evento">
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
            <DialogDescription>
              {selectedMatch && `${selectedMatch.homeTeam.name} vs ${selectedMatch.awayTeam.name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitResult} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{selectedMatch?.homeTeam.name} (Local)</Label>
                <Input type="number" min={0} value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>{selectedMatch?.awayTeam.name} (Visitante)</Label>
                <Input type="number" min={0} value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} />
              </div>
            </div>

            {/* Show events for this match */}
            {selectedMatch && selectedMatch.events.length > 0 && (
              <div className="space-y-2">
                <Label>Eventos del partido</Label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedMatch.events.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2 text-sm p-1.5 rounded border">
                      <span>{EVENT_LABELS[ev.eventType] ?? ev.eventType}</span>
                      {ev.minute != null && <span className="text-muted-foreground">{ev.minute}&apos;</span>}
                      {ev.player && <span className="font-medium">{ev.player.fullName}</span>}
                      {ev.team && <span className="text-muted-foreground">({ev.team.name})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResultDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Evento</DialogTitle>
            <DialogDescription>
              {selectedMatch && `${selectedMatch.homeTeam.name} vs ${selectedMatch.awayTeam.name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEvent} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Tipo de evento</Label>
                <select
                  value={eventForm.eventType}
                  onChange={(e) => setEventForm((p) => ({ ...p, eventType: e.target.value }))}
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                >
                  <option value="goal">⚽ Gol</option>
                  <option value="yellow_card">🟨 Tarjeta Amarilla</option>
                  <option value="red_card">🟥 Tarjeta Roja</option>
                  <option value="substitution">🔄 Sustitución</option>
                  <option value="assist">👟 Asistencia</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Equipo</Label>
                <select
                  value={eventForm.teamId}
                  onChange={(e) => setEventForm((p) => ({ ...p, teamId: e.target.value }))}
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                >
                  {selectedMatch && (
                    <>
                      <option value={selectedMatch.homeTeam.id}>{selectedMatch.homeTeam.name}</option>
                      <option value={selectedMatch.awayTeam.id}>{selectedMatch.awayTeam.name}</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Minuto</Label>
                <Input
                  type="number"
                  min={0}
                  max={150}
                  value={eventForm.minute}
                  onChange={(e) => setEventForm((p) => ({ ...p, minute: Number(e.target.value) }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEventDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
