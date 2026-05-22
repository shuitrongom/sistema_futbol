"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, Users, ArrowLeft, UserMinus, ImageIcon,
} from "lucide-react";

/* ───────── Types ───────── */

interface TeamPlayer {
  id: string;
  jerseyNumber: number;
  player: {
    id: string;
    fullName: string;
    position: string;
    photoUrl: string | null;
    email: string | null;
    phone: string | null;
    birthDate: string;
    idNumber: string;
  };
}

interface Team {
  id: string;
  name: string;
  city: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  badgeUrl: string | null;
  coachId: string | null;
  homeUniformPrimary: string | null;
  homeUniformSecondary: string | null;
  homeUniformDescription: string | null;
  homeUniformImageUrl: string | null;
  awayUniformPrimary: string | null;
  awayUniformSecondary: string | null;
  awayUniformDescription: string | null;
  awayUniformImageUrl: string | null;
  coach: { id: string; fullName: string; email: string } | null;
  teamCategories: { category: { id: string; name: string } }[];
  teamPlayers?: TeamPlayer[];
  _count: { teamPlayers: number; tournamentTeams: number };
}

interface Category { id: string; name: string; }
interface Coach { id: string; fullName: string; email: string; }

const POSITIONS = [
  { value: "goalkeeper", label: "Portero" },
  { value: "defender", label: "Defensa" },
  { value: "midfielder", label: "Mediocampista" },
  { value: "forward", label: "Delantero" },
];

const posLabel = (pos: string) =>
  POSITIONS.find((p) => p.value === pos)?.label ?? pos;

const emptyTeamForm = {
  name: "", city: "", primaryColor: "#1a472a", secondaryColor: "#d4af37",
  badgeUrl: "", coachId: "",
  homeUniformPrimary: "#ffffff", homeUniformSecondary: "#000000",
  homeUniformDescription: "", homeUniformImageUrl: "",
  awayUniformPrimary: "#000000", awayUniformSecondary: "#ffffff",
  awayUniformDescription: "", awayUniformImageUrl: "",
  categoryIds: [] as string[],
};

const emptyPlayerForm = {
  fullName: "", birthDate: "", idNumber: "", position: "midfielder",
  phone: "", email: "", photoUrl: "", jerseyNumber: "",
};

/* ───────── Component ───────── */

export default function TeamsPage() {
  /* ── shared state ── */
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── team CRUD state ── */
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);

  /* ── detail view state ── */
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ── player dialog state ── */
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<TeamPlayer | null>(null);
  const [playerForm, setPlayerForm] = useState(emptyPlayerForm);
  const [playerError, setPlayerError] = useState("");
  const [playerSubmitting, setPlayerSubmitting] = useState(false);

  /* ── remove player dialog ── */
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removingPlayer, setRemovingPlayer] = useState<TeamPlayer | null>(null);

  /* ───────── Data fetching ───────── */

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) setTeams(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchMeta = useCallback(async () => {
    const [catRes, coachRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/users?role=coach").catch(() => null),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (coachRes?.ok) setCoaches(await coachRes.json());
  }, []);

  useEffect(() => { fetchTeams(); fetchMeta(); }, [fetchTeams, fetchMeta]);

  const fetchTeamDetail = useCallback(async (teamId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const data: Team = await res.json();
        setSelectedTeam(data);
        setTeamPlayers(data.teamPlayers ?? []);
      }
    } catch { /* ignore */ } finally { setLoadingDetail(false); }
  }, []);

  /* ───────── Team CRUD helpers ───────── */

  function openCreateTeamDialog() {
    setEditingTeam(null);
    setTeamForm(emptyTeamForm);
    setError("");
    setTeamDialogOpen(true);
  }

  function openEditTeamDialog(team: Team) {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      city: team.city ?? "",
      primaryColor: team.primaryColor ?? "#1a472a",
      secondaryColor: team.secondaryColor ?? "#d4af37",
      badgeUrl: team.badgeUrl ?? "",
      coachId: team.coachId ?? "",
      homeUniformPrimary: team.homeUniformPrimary ?? "#ffffff",
      homeUniformSecondary: team.homeUniformSecondary ?? "#000000",
      homeUniformDescription: team.homeUniformDescription ?? "",
      homeUniformImageUrl: team.homeUniformImageUrl ?? "",
      awayUniformPrimary: team.awayUniformPrimary ?? "#000000",
      awayUniformSecondary: team.awayUniformSecondary ?? "#ffffff",
      awayUniformDescription: team.awayUniformDescription ?? "",
      awayUniformImageUrl: team.awayUniformImageUrl ?? "",
      categoryIds: team.teamCategories.map((tc) => tc.category.id),
    });
    setError("");
    setTeamDialogOpen(true);
  }

  async function handleTeamSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";
      const method = editingTeam ? "PUT" : "POST";
      const payload = {
        name: teamForm.name,
        city: teamForm.city || null,
        primaryColor: teamForm.primaryColor || null,
        secondaryColor: teamForm.secondaryColor || null,
        badgeUrl: teamForm.badgeUrl || null,
        coachId: teamForm.coachId || null,
        homeUniformPrimary: teamForm.homeUniformPrimary || null,
        homeUniformSecondary: teamForm.homeUniformSecondary || null,
        homeUniformDescription: teamForm.homeUniformDescription || null,
        homeUniformImageUrl: teamForm.homeUniformImageUrl || null,
        awayUniformPrimary: teamForm.awayUniformPrimary || null,
        awayUniformSecondary: teamForm.awayUniformSecondary || null,
        awayUniformDescription: teamForm.awayUniformDescription || null,
        awayUniformImageUrl: teamForm.awayUniformImageUrl || null,
        categoryIds: teamForm.categoryIds,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
        return;
      }
      setTeamDialogOpen(false);
      fetchTeams();
      // refresh detail if we were editing the selected team
      if (editingTeam && selectedTeam?.id === editingTeam.id) {
        fetchTeamDetail(editingTeam.id);
      }
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  async function handleDeleteTeam() {
    if (!deletingTeam) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${deletingTeam.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
        return;
      }
      setDeleteDialogOpen(false);
      setDeletingTeam(null);
      if (selectedTeam?.id === deletingTeam.id) {
        setSelectedTeam(null);
        setTeamPlayers([]);
      }
      fetchTeams();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  function toggleCategory(catId: string) {
    setTeamForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId],
    }));
  }

  const setTeamField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTeamForm((prev) => ({ ...prev, [field]: e.target.value }));

  /* ───────── Player helpers ───────── */

  function openAddPlayerDialog() {
    setEditingPlayer(null);
    setPlayerForm(emptyPlayerForm);
    setPlayerError("");
    setPlayerDialogOpen(true);
  }

  function openEditPlayerDialog(tp: TeamPlayer) {
    setEditingPlayer(tp);
    setPlayerForm({
      fullName: tp.player.fullName,
      birthDate: tp.player.birthDate.split("T")[0],
      idNumber: tp.player.idNumber,
      position: tp.player.position,
      phone: tp.player.phone ?? "",
      email: tp.player.email ?? "",
      photoUrl: tp.player.photoUrl ?? "",
      jerseyNumber: String(tp.jerseyNumber),
    });
    setPlayerError("");
    setPlayerDialogOpen(true);
  }

  async function handlePlayerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeam) return;
    setPlayerSubmitting(true);
    setPlayerError("");

    try {
      if (editingPlayer) {
        // Update existing player info
        const updatePayload = {
          fullName: playerForm.fullName,
          birthDate: playerForm.birthDate,
          position: playerForm.position,
          phone: playerForm.phone || null,
          email: playerForm.email || null,
          photoUrl: playerForm.photoUrl || null,
        };
        const res = await fetch(`/api/players/${editingPlayer.player.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
        if (!res.ok) {
          const data = await res.json();
          setPlayerError(data.error || "Error al actualizar jugador");
          return;
        }
      } else {
        // Step 1: Create the player
        const createPayload = {
          fullName: playerForm.fullName,
          birthDate: playerForm.birthDate,
          idNumber: playerForm.idNumber,
          position: playerForm.position,
          phone: playerForm.phone || null,
          email: playerForm.email || null,
          photoUrl: playerForm.photoUrl || null,
        };
        const createRes = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });
        if (!createRes.ok) {
          const data = await createRes.json();
          setPlayerError(data.error || "Error al crear jugador");
          return;
        }
        const newPlayer = await createRes.json();

        // Step 2: Assign to team
        const assignRes = await fetch(`/api/teams/${selectedTeam.id}/players`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: newPlayer.id,
            jerseyNumber: parseInt(playerForm.jerseyNumber),
          }),
        });
        if (!assignRes.ok) {
          const data = await assignRes.json();
          setPlayerError(data.error || "Error al asignar jugador al equipo");
          return;
        }
      }

      setPlayerDialogOpen(false);
      fetchTeamDetail(selectedTeam.id);
      fetchTeams(); // refresh player counts
    } catch {
      setPlayerError("Error de conexión");
    } finally {
      setPlayerSubmitting(false);
    }
  }

  async function handleRemovePlayer() {
    if (!selectedTeam || !removingPlayer) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: removingPlayer.player.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al remover jugador");
        return;
      }
      setRemoveDialogOpen(false);
      setRemovingPlayer(null);
      fetchTeamDetail(selectedTeam.id);
      fetchTeams();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  const setPlayerField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPlayerForm((prev) => ({ ...prev, [field]: e.target.value }));

  /* ───────── Select a team to view detail ───────── */

  function selectTeam(team: Team) {
    setSelectedTeam(team);
    fetchTeamDetail(team.id);
  }

  function goBackToList() {
    setSelectedTeam(null);
    setTeamPlayers([]);
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER — Detail view (selected team)
     ═══════════════════════════════════════════════════════════ */

  if (selectedTeam) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={goBackToList}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {selectedTeam.badgeUrl ? (
                <img src={selectedTeam.badgeUrl} alt="" className="size-10 rounded-lg object-cover" />
              ) : selectedTeam.primaryColor ? (
                <span className="inline-block size-10 rounded-lg border" style={{ backgroundColor: selectedTeam.primaryColor }} />
              ) : null}
              <div>
                <h1 className="text-2xl font-bold">{selectedTeam.name}</h1>
                <p className="text-muted-foreground text-sm">
                  {selectedTeam.city || "Sin ciudad"} · {selectedTeam.coach?.fullName || "Sin entrenador"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditTeamDialog(selectedTeam)}>
              <Pencil className="size-4 mr-1" /> Editar Equipo
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { setDeletingTeam(selectedTeam); setError(""); setDeleteDialogOpen(true); }}>
              <Trash2 className="size-4 mr-1" /> Eliminar
            </Button>
          </div>
        </div>

        {/* Team info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Categorías</p>
            <div className="flex flex-wrap gap-1">
              {selectedTeam.teamCategories.length > 0
                ? selectedTeam.teamCategories.map((tc) => (
                    <Badge key={tc.category.id} variant="secondary">{tc.category.name}</Badge>
                  ))
                : <span className="text-sm text-muted-foreground">Sin categorías</span>}
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Jugadores</p>
            <p className="text-2xl font-bold">{teamPlayers.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Torneos</p>
            <p className="text-2xl font-bold">{selectedTeam._count.tournamentTeams}</p>
          </Card>
        </div>

        {/* Players section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="size-5" /> Jugadores del Equipo
            </h2>
            <Button size="sm" onClick={openAddPlayerDialog}>
              <Plus className="size-4 mr-1" /> Agregar Jugador
            </Button>
          </div>

          <Card className="p-0">
            {loadingDetail ? (
              <div className="p-8 text-center text-muted-foreground">Cargando jugadores...</div>
            ) : teamPlayers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay jugadores en este equipo. Haz clic en &quot;Agregar Jugador&quot; para añadir uno.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Identificación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPlayers.map((tp) => (
                    <TableRow key={tp.id}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">{tp.jerseyNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="size-9 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          {tp.player.photoUrl ? (
                            <img src={tp.player.photoUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageIcon className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tp.player.fullName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{posLabel(tp.player.position)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tp.player.idNumber}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEditPlayerDialog(tp)} title="Editar jugador">
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="destructive" size="icon-sm" onClick={() => { setRemovingPlayer(tp); setRemoveDialogOpen(true); }} title="Remover del equipo">
                            <UserMinus className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* ── Dialogs (rendered inside detail view) ── */}
        {renderTeamDialog()}
        {renderDeleteTeamDialog()}
        {renderPlayerDialog()}
        {renderRemovePlayerDialog()}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER — Team list view (default)
     ═══════════════════════════════════════════════════════════ */

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipos</h1>
          <p className="text-muted-foreground">Gestiona los equipos y sus jugadores</p>
        </div>
        <Button onClick={openCreateTeamDialog}>
          <Plus className="size-4 mr-1" /> Nuevo Equipo
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Cargando equipos...</div>
      ) : teams.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">No hay equipos registrados</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="p-4 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
              onClick={() => selectTeam(team)}
            >
              <div className="flex items-start gap-3">
                {team.badgeUrl ? (
                  <img src={team.badgeUrl} alt="" className="size-12 rounded-lg object-cover shrink-0" />
                ) : team.primaryColor ? (
                  <span className="inline-block size-12 rounded-lg border shrink-0" style={{ backgroundColor: team.primaryColor }} />
                ) : (
                  <span className="inline-block size-12 rounded-lg border bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{team.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {team.city || "Sin ciudad"} · {team.coach?.fullName || "Sin entrenador"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="size-3 mr-1" />{team._count.teamPlayers} jugadores
                    </Badge>
                    {team.teamCategories.slice(0, 2).map((tc) => (
                      <Badge key={tc.category.id} variant="secondary" className="text-xs">{tc.category.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-3 border-t pt-3">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditTeamDialog(team); }}>
                  <Pencil className="size-3.5 mr-1" /> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setDeletingTeam(team); setError(""); setDeleteDialogOpen(true); }}>
                  <Trash2 className="size-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {renderTeamDialog()}
      {renderDeleteTeamDialog()}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     Dialog render helpers
     ═══════════════════════════════════════════════════════════ */

  function renderTeamDialog() {
    return (
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeam ? "Editar Equipo" : "Nuevo Equipo"}</DialogTitle>
            <DialogDescription>
              {editingTeam ? "Modifica los datos del equipo" : "Crea un nuevo equipo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTeamSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label htmlFor="t-name">Nombre *</Label>
                <Input id="t-name" value={teamForm.name} onChange={setTeamField("name")} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-city">Ciudad</Label>
                <Input id="t-city" value={teamForm.city} onChange={setTeamField("city")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-coach">Entrenador</Label>
                <select id="t-coach" value={teamForm.coachId} onChange={setTeamField("coachId")}
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]">
                  <option value="">Sin asignar</option>
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-primary">Color primario</Label>
                <Input id="t-primary" type="color" value={teamForm.primaryColor} onChange={setTeamField("primaryColor")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-secondary">Color secundario</Label>
                <Input id="t-secondary" type="color" value={teamForm.secondaryColor} onChange={setTeamField("secondaryColor")} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Escudo del equipo</Label>
                <ImageUpload
                  value={teamForm.badgeUrl || null}
                  onChange={(url) => setTeamForm((prev) => ({ ...prev, badgeUrl: url || "" }))}
                  folder="badges"
                  label="Subir escudo"
                  previewSize="lg"
                />
              </div>
            </div>

            {/* Uniforme Local */}
            <fieldset className="border border-border rounded-lg p-3 space-y-2">
              <legend className="text-sm font-medium px-1">Uniforme Local</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Color primario</Label>
                  <Input type="color" value={teamForm.homeUniformPrimary} onChange={setTeamField("homeUniformPrimary")} />
                </div>
                <div className="space-y-1">
                  <Label>Color secundario</Label>
                  <Input type="color" value={teamForm.homeUniformSecondary} onChange={setTeamField("homeUniformSecondary")} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Descripción</Label>
                  <Input value={teamForm.homeUniformDescription} onChange={setTeamField("homeUniformDescription")} placeholder="Ej: Camiseta blanca con rayas azules" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Imagen uniforme local</Label>
                  <ImageUpload
                    value={teamForm.homeUniformImageUrl || null}
                    onChange={(url) => setTeamForm((prev) => ({ ...prev, homeUniformImageUrl: url || "" }))}
                    folder="uniforms"
                    label="Subir imagen"
                    previewSize="sm"
                  />
                </div>
              </div>
            </fieldset>

            {/* Uniforme Visitante */}
            <fieldset className="border border-border rounded-lg p-3 space-y-2">
              <legend className="text-sm font-medium px-1">Uniforme Visitante</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Color primario</Label>
                  <Input type="color" value={teamForm.awayUniformPrimary} onChange={setTeamField("awayUniformPrimary")} />
                </div>
                <div className="space-y-1">
                  <Label>Color secundario</Label>
                  <Input type="color" value={teamForm.awayUniformSecondary} onChange={setTeamField("awayUniformSecondary")} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Descripción</Label>
                  <Input value={teamForm.awayUniformDescription} onChange={setTeamField("awayUniformDescription")} placeholder="Ej: Camiseta negra con detalles dorados" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Imagen uniforme visitante</Label>
                  <ImageUpload
                    value={teamForm.awayUniformImageUrl || null}
                    onChange={(url) => setTeamForm((prev) => ({ ...prev, awayUniformImageUrl: url || "" }))}
                    folder="uniforms"
                    label="Subir imagen"
                    previewSize="sm"
                  />
                </div>
              </div>
            </fieldset>

            {/* Categorías */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Categorías</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        teamForm.categoryIds.includes(cat.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : editingTeam ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  function renderDeleteTeamDialog() {
    return (
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Equipo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el equipo <strong>{deletingTeam?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={submitting}>
              {submitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  function renderPlayerDialog() {
    return (
      <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? "Editar Jugador" : "Agregar Jugador"}</DialogTitle>
            <DialogDescription>
              {editingPlayer
                ? "Modifica los datos del jugador"
                : `Crea un nuevo jugador y asígnalo a ${selectedTeam?.name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePlayerSubmit} className="space-y-4">
            {playerError && <p className="text-sm text-destructive">{playerError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label htmlFor="p-fullName">Nombre completo *</Label>
                <Input id="p-fullName" value={playerForm.fullName} onChange={setPlayerField("fullName")} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-birthDate">Fecha de nacimiento *</Label>
                <Input id="p-birthDate" type="date" value={playerForm.birthDate} onChange={setPlayerField("birthDate")} required max={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-idNumber">Nº Identificación *</Label>
                <Input id="p-idNumber" value={playerForm.idNumber} onChange={setPlayerField("idNumber")} required disabled={!!editingPlayer} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-position">Posición *</Label>
                <select id="p-position" value={playerForm.position} onChange={setPlayerField("position")}
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]">
                  {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-jerseyNumber">Nº Camiseta *</Label>
                <Input id="p-jerseyNumber" type="number" min={1} max={99} value={playerForm.jerseyNumber} onChange={setPlayerField("jerseyNumber")} required disabled={!!editingPlayer} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-phone">Teléfono</Label>
                <Input id="p-phone" value={playerForm.phone} onChange={setPlayerField("phone")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" type="email" value={playerForm.email} onChange={setPlayerField("email")} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Foto del jugador</Label>
                <ImageUpload
                  value={playerForm.photoUrl || null}
                  onChange={(url) => setPlayerForm((prev) => ({ ...prev, photoUrl: url || "" }))}
                  folder="players"
                  label="Subir foto"
                  previewSize="md"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={playerSubmitting}>
                {playerSubmitting ? "Guardando..." : editingPlayer ? "Actualizar" : "Agregar Jugador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  function renderRemovePlayerDialog() {
    return (
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Jugador</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas remover a <strong>{removingPlayer?.player.fullName}</strong> del equipo <strong>{selectedTeam?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemovePlayer} disabled={submitting}>
              {submitting ? "Removiendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
}
