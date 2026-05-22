"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUpload from "@/components/ImageUpload";
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
import { Plus, Pencil, UserPlus, Link2 } from "lucide-react";

interface Player {
  id: string;
  fullName: string;
  birthDate: string;
  idNumber: string;
  position: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  userId: string | null;
  teamPlayers: { team: { id: string; name: string } }[];
}

interface Team { id: string; name: string; }

interface PlayerUser {
  id: string;
  fullName: string;
  email: string;
}

const positions = [
  { value: "goalkeeper", label: "Portero" },
  { value: "defender", label: "Defensa" },
  { value: "midfielder", label: "Mediocampista" },
  { value: "forward", label: "Delantero" },
];

const emptyForm = {
  fullName: "", birthDate: "", idNumber: "", position: "midfielder",
  phone: "", email: "", photoUrl: "",
};

const emptyAssign = { teamId: "", jerseyNumber: "" };

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [assigningPlayer, setAssigningPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [assignData, setAssignData] = useState(emptyAssign);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Link user dialog
  const [linkUserDialogOpen, setLinkUserDialogOpen] = useState(false);
  const [linkingPlayer, setLinkingPlayer] = useState<Player | null>(null);
  const [playerUsers, setPlayerUsers] = useState<PlayerUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players");
      if (res.ok) setPlayers(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.map((t: Team & Record<string, unknown>) => ({ id: t.id, name: t.name })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPlayers(); fetchTeams(); }, [fetchPlayers, fetchTeams]);

  function openCreateDialog() {
    setEditingPlayer(null);
    setFormData(emptyForm);
    setError("");
    setDialogOpen(true);
  }

  function openEditDialog(player: Player) {
    setEditingPlayer(player);
    setFormData({
      fullName: player.fullName,
      birthDate: player.birthDate.split("T")[0],
      idNumber: player.idNumber,
      position: player.position,
      phone: player.phone ?? "",
      email: player.email ?? "",
      photoUrl: player.photoUrl ?? "",
    });
    setError("");
    setDialogOpen(true);
  }

  function openAssignDialog(player: Player) {
    setAssigningPlayer(player);
    setAssignData(emptyAssign);
    setError("");
    setAssignDialogOpen(true);
  }

  async function openLinkUserDialog(player: Player) {
    setLinkingPlayer(player);
    setSelectedUserId(player.userId ?? "");
    setLinkUserDialogOpen(true);
    // Fetch users with role "player"
    try {
      const res = await fetch("/api/users?role=player");
      if (res.ok) {
        const data = await res.json();
        setPlayerUsers(data);
      }
    } catch { /* ignore */ }
  }

  async function handleLinkUser(e: React.FormEvent) {
    e.preventDefault();
    if (!linkingPlayer) return;
    setLinkSubmitting(true);
    try {
      const res = await fetch(`/api/players/${linkingPlayer.id}/link-user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId || null }),
      });
      if (res.ok) {
        setLinkUserDialogOpen(false);
        fetchPlayers();
      }
    } catch { /* ignore */ }
    finally { setLinkSubmitting(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const url = editingPlayer ? `/api/players/${editingPlayer.id}` : "/api/players";
      const method = editingPlayer ? "PUT" : "POST";
      const payload = editingPlayer
        ? { fullName: formData.fullName, birthDate: formData.birthDate, position: formData.position, phone: formData.phone || null, email: formData.email || null, photoUrl: formData.photoUrl || null }
        : { ...formData, phone: formData.phone || null, email: formData.email || null, photoUrl: formData.photoUrl || null };
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
      setDialogOpen(false);
      fetchPlayers();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assigningPlayer) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/teams/${assignData.teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: assigningPlayer.id,
          jerseyNumber: parseInt(assignData.jerseyNumber),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al asignar");
        return;
      }
      setAssignDialogOpen(false);
      fetchPlayers();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const posLabel = (pos: string) => positions.find((p) => p.value === pos)?.label ?? pos;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jugadores</h1>
          <p className="text-muted-foreground">Gestiona los jugadores del sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreateDialog} />}>
            <Plus className="size-4" /> Nuevo Jugador
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPlayer ? "Editar Jugador" : "Nuevo Jugador"}</DialogTitle>
              <DialogDescription>
                {editingPlayer ? "Modifica los datos del jugador" : "Registra un nuevo jugador"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="fullName">Nombre completo *</Label>
                  <Input id="fullName" value={formData.fullName} onChange={set("fullName")} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                  <Input id="birthDate" type="date" value={formData.birthDate} onChange={set("birthDate")} required max={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="idNumber">Nº Identificación *</Label>
                  <Input id="idNumber" value={formData.idNumber} onChange={set("idNumber")} required disabled={!!editingPlayer} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="position">Posición *</Label>
                  <select id="position" value={formData.position} onChange={set("position")}
                    className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]">
                    {positions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={formData.phone} onChange={set("phone")} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={set("email")} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Foto del jugador</Label>
                  <ImageUpload
                    value={formData.photoUrl || null}
                    onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url || "" }))}
                    folder="players"
                    label="Subir foto"
                    previewSize="md"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : editingPlayer ? "Actualizar" : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando jugadores...</div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay jugadores registrados</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead>Equipos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{player.idNumber}</TableCell>
                  <TableCell><Badge variant="secondary">{posLabel(player.position)}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {player.teamPlayers.length > 0
                        ? player.teamPlayers.map((tp) => (
                            <Badge key={tp.team.id} variant="secondary">{tp.team.name}</Badge>
                          ))
                        : <span className="text-muted-foreground text-sm">Sin equipo</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(player)} title="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openAssignDialog(player)} title="Asignar a equipo">
                        <UserPlus className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Assign to team dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar a Equipo</DialogTitle>
            <DialogDescription>
              Asigna a <strong>{assigningPlayer?.fullName}</strong> a un equipo con número de camiseta.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="teamId">Equipo *</Label>
              <select id="teamId" value={assignData.teamId}
                onChange={(e) => setAssignData((p) => ({ ...p, teamId: e.target.value }))}
                className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]" required>
                <option value="">Seleccionar equipo</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jerseyNumber">Número de camiseta *</Label>
              <Input id="jerseyNumber" type="number" min={1} max={99}
                value={assignData.jerseyNumber}
                onChange={(e) => setAssignData((p) => ({ ...p, jerseyNumber: e.target.value }))}
                required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Asignando..." : "Asignar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
