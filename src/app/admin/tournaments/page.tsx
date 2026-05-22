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
  DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users, Calendar, Play } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  format: string;
  minTeams: number;
  maxTeams: number;
  status: string;
  tournamentCategories: { category: { id: string; name: string } }[];
  _count: { tournamentTeams: number; matches: number; phases: number };
}

interface Category { id: string; name: string; }

const FORMAT_LABELS: Record<string, string> = {
  league: "Liga (ida y vuelta)",
  knockout: "Eliminación directa",
  group_knockout: "Grupos + Eliminatorias",
  double_knockout: "Doble eliminación",
  swiss: "Sistema suizo",
  league_playoff: "Liga + Liguilla",
  league_single: "Liga solo ida",
  cup: "Copa (eliminatorias ida/vuelta)",
  round_robin_groups: "Grupos round-robin",
  mini_tournament: "Torneo relámpago",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  registration: "Inscripción",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  registration: "default",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const emptyForm = {
  name: "",
  startDate: "",
  endDate: "",
  format: "league" as string,
  minTeams: 2,
  maxTeams: 16,
  categoryIds: [] as string[],
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamsDialogOpen, setTeamsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);
  const [viewingTournament, setViewingTournament] = useState<Tournament | null>(null);
  const [tournamentTeams, setTournamentTeams] = useState<Array<{
    teamId: string;
    team: { id: string; name: string; teamCategories: { category: { id: string; name: string } }[]; _count: { teamPlayers: number } };
  }>>([]);
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) setTournaments(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchTournaments(); fetchCategories(); }, [fetchTournaments, fetchCategories]);

  function openCreateDialog() {
    setEditingTournament(null);
    setFormData(emptyForm);
    setError("");
    setDialogOpen(true);
  }

  function openEditDialog(t: Tournament) {
    setEditingTournament(t);
    setFormData({
      name: t.name,
      startDate: t.startDate.split("T")[0],
      endDate: t.endDate.split("T")[0],
      format: t.format,
      minTeams: t.minTeams,
      maxTeams: t.maxTeams,
      categoryIds: t.tournamentCategories.map((tc) => tc.category.id),
    });
    setError("");
    setDialogOpen(true);
  }

  async function openTeamsDialog(t: Tournament) {
    setViewingTournament(t);
    setError("");
    setTeamsDialogOpen(true);
    try {
      const [teamsRes, allTeamsRes] = await Promise.all([
        fetch(`/api/tournaments/${t.id}`),
        fetch("/api/teams"),
      ]);
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTournamentTeams(data.tournamentTeams ?? []);
      }
      if (allTeamsRes.ok) {
        const allTeams = await allTeamsRes.json();
        setAvailableTeams(allTeams);
      }
    } catch { /* ignore */ }
  }

  async function handleChangeStatus(tournamentId: string, newStatus: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTournaments();
      } else {
        const data = await res.json();
        setError(data.error || "Error al cambiar estado");
      }
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const url = editingTournament
        ? `/api/tournaments/${editingTournament.id}`
        : "/api/tournaments";
      const method = editingTournament ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
        return;
      }
      setDialogOpen(false);
      fetchTournaments();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deletingTournament) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tournaments/${deletingTournament.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
        return;
      }
      setDeleteDialogOpen(false);
      setDeletingTournament(null);
      fetchTournaments();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  async function handleInscribeTeam(teamId: string) {
    if (!viewingTournament) return;
    setError("");
    try {
      const res = await fetch(
        `/api/tournaments/${viewingTournament.id}/teams/${teamId}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al inscribir");
        return;
      }
      openTeamsDialog(viewingTournament);
      fetchTournaments();
    } catch { setError("Error de conexión"); }
  }

  async function handleRemoveTeam(teamId: string) {
    if (!viewingTournament) return;
    setError("");
    try {
      const res = await fetch(
        `/api/tournaments/${viewingTournament.id}/teams/${teamId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al remover");
        return;
      }
      openTeamsDialog(viewingTournament);
      fetchTournaments();
    } catch { setError("Error de conexión"); }
  }

  async function handleGenerateFixture(tournamentId: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/generate-fixture`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al generar fixture");
        return;
      }
      alert(`Fixture generado: ${data.matchCount} partidos creados`);
      fetchTournaments();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  function toggleCategory(catId: string) {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId],
    }));
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const inscribedTeamIds = new Set(tournamentTeams.map((tt) => tt.team?.id ?? tt.teamId));
  const teamsNotInscribed = availableTeams.filter((t) => !inscribedTeamIds.has(t.id));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Torneos</h1>
          <p className="text-muted-foreground">Gestiona los torneos del sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreateDialog} />}>
            <Plus className="size-4" /> Nuevo Torneo
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTournament ? "Editar Torneo" : "Nuevo Torneo"}</DialogTitle>
              <DialogDescription>
                {editingTournament ? "Modifica los datos del torneo" : "Crea un nuevo torneo"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" value={formData.name} onChange={set("name")} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="startDate">Fecha inicio *</Label>
                    <Input id="startDate" type="date" value={formData.startDate} onChange={set("startDate")} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate">Fecha fin *</Label>
                    <Input id="endDate" type="date" value={formData.endDate} onChange={set("endDate")} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="format">Formato *</Label>
                  <select id="format" value={formData.format} onChange={set("format")}
                    className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]">
                    <option value="league">Liga (ida y vuelta)</option>
                    <option value="knockout">Eliminación directa</option>
                    <option value="group_knockout">Grupos + Eliminatorias</option>
                    <option value="double_knockout">Doble eliminación</option>
                    <option value="swiss">Sistema suizo</option>
                    <option value="league_playoff">Liga + Liguilla (estilo Liga MX)</option>
                    <option value="league_single">Liga solo ida (torneo corto)</option>
                    <option value="cup">Copa (eliminatorias ida/vuelta)</option>
                    <option value="round_robin_groups">Grupos round-robin (sin eliminatorias)</option>
                    <option value="mini_tournament">Torneo relámpago (un día)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="minTeams">Mín. equipos</Label>
                    <Input id="minTeams" type="number" min={2} value={formData.minTeams} onChange={set("minTeams")} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxTeams">Máx. equipos *</Label>
                    <Input id="maxTeams" type="number" min={2} value={formData.maxTeams} onChange={set("maxTeams")} required />
                  </div>
                </div>
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Categorías permitidas</Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                            formData.categoryIds.includes(cat.id)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : editingTournament ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando torneos...</div>
        ) : tournaments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay torneos registrados</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Torneo</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Equipos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categorías</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{FORMAT_LABELS[t.format] ?? t.format}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Users className="size-3 mr-1" />
                      {t._count.tournamentTeams}/{t.maxTeams}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_COLORS[t.status] as "default" | "secondary" | "destructive"}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </Badge>
                      <select
                        value={t.status}
                        onChange={(e) => handleChangeStatus(t.id, e.target.value)}
                        disabled={submitting}
                        className="text-xs border rounded px-1 py-0.5 bg-background"
                      >
                        <option value="draft">Borrador</option>
                        <option value="registration">Inscripción</option>
                        <option value="in_progress">En curso</option>
                        <option value="completed">Finalizado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.tournamentCategories.map((tc) => (
                        <Badge key={tc.category.id} variant="secondary">{tc.category.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openTeamsDialog(t)} title="Equipos">
                        <Users className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(t)} title="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      {["draft", "registration"].includes(t.status) && (
                        <>
                          <Button variant="ghost" size="icon-sm"
                            onClick={() => handleGenerateFixture(t.id)}
                            disabled={submitting || t._count.tournamentTeams < t.minTeams}
                            title="Generar Fixture">
                            <Calendar className="size-4" />
                          </Button>
                        </>
                      )}
                      {["draft", "cancelled"].includes(t.status) && (
                        <Button variant="destructive" size="icon-sm"
                          onClick={() => { setDeletingTournament(t); setError(""); setDeleteDialogOpen(true); }}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Torneo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el torneo <strong>{deletingTournament?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teams Dialog */}
      <Dialog open={teamsDialogOpen} onOpenChange={setTeamsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipos - {viewingTournament?.name}</DialogTitle>
            <DialogDescription>
              {viewingTournament && `${tournamentTeams.length}/${viewingTournament.maxTeams} equipos inscritos`}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Inscribed teams */}
          <div className="space-y-2">
            <Label>Equipos inscritos</Label>
            {tournamentTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay equipos inscritos</p>
            ) : (
              <div className="space-y-1">
                {tournamentTeams.map((tt) => (
                  <div key={tt.teamId} className="flex items-center justify-between p-2 rounded-md border">
                    <div>
                      <span className="font-medium text-sm">{tt.team?.name ?? tt.teamId}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {tt.team?._count?.teamPlayers ?? 0} jugadores
                      </span>
                    </div>
                    {viewingTournament && ["draft", "registration"].includes(viewingTournament.status) && (
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveTeam(tt.team?.id ?? tt.teamId)}>
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add teams */}
          {viewingTournament && ["draft", "registration"].includes(viewingTournament.status) &&
            tournamentTeams.length < viewingTournament.maxTeams && (
            <div className="space-y-2">
              <Label>Inscribir equipo</Label>
              {teamsNotInscribed.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay más equipos disponibles</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {teamsNotInscribed.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-2 rounded-md border">
                      <span className="text-sm">{team.name}</span>
                      <Button size="sm" onClick={() => handleInscribeTeam(team.id)}>
                        Inscribir
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
