"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Plus, UserMinus, Search, Camera, Loader2, X, UserPlus, Pencil } from "lucide-react";

const positionLabels: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

const positionColors: Record<string, string> = {
  goalkeeper: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  defender: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  midfielder: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  forward: "bg-red-500/20 text-red-300 border-red-500/30",
};

type RosterPlayer = {
  id: string;
  jerseyNumber: number;
  player: {
    id: string;
    fullName: string;
    position: string;
    birthDate: string;
    photoUrl: string | null;
  };
};

type AvailablePlayer = {
  id: string;
  fullName: string;
  position: string;
  birthDate: string;
  idNumber: string;
};

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function RosterPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<AvailablePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPlayerId, setUploadingPlayerId] = useState<string | null>(null);
  const playerPhotoInputRef = useRef<HTMLInputElement>(null);
  const activePlayerIdRef = useRef<string | null>(null);

  // New player form state
  const [createMode, setCreateMode] = useState(false);
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<File | null>(null);
  const [newPlayerPhotoPreview, setNewPlayerPhotoPreview] = useState<string | null>(null);
  const newPlayerPhotoInputRef = useRef<HTMLInputElement>(null);
  const [newPlayer, setNewPlayer] = useState({
    fullName: "",
    birthDate: "",
    idNumber: "",
    position: "",
    phone: "",
    email: "",
  });

  const handlePlayerPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const playerId = activePlayerIdRef.current;
    if (!file || !playerId) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploadingPlayerId(playerId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "players");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json();

      const updateRes = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: url }),
      });
      if (updateRes.ok) {
        await fetchRoster();
      }
    } catch {
      // ignore
    } finally {
      setUploadingPlayerId(null);
      activePlayerIdRef.current = null;
      if (e.target) e.target.value = "";
    }
  };

  const handleDeletePlayerPhoto = async (playerId: string) => {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: null }),
      });
      if (res.ok) await fetchRoster();
    } catch {}
  };

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

  const fetchRoster = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data.teamPlayers ?? []);
      }
    } catch {
      // ignore
    }
  }, [teamId]);

  const fetchAllPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players");
      if (res.ok) {
        const data = await res.json();
        setAllPlayers(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (teamId) {
      setLoading(true);
      Promise.all([fetchRoster(), fetchAllPlayers()]).finally(() => setLoading(false));
    }
  }, [teamId, fetchRoster, fetchAllPlayers]);

  const rosterPlayerIds = new Set(roster.map((r) => r.player.id));
  const availablePlayers = allPlayers.filter((p) => !rosterPlayerIds.has(p.id));

  const handleAdd = async () => {
    if (!teamId || !selectedPlayerId || !jerseyNumber) {
      setError("Selecciona un jugador y número de camiseta");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedPlayerId, jerseyNumber: parseInt(jerseyNumber) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al agregar jugador");
        return;
      }
      setDialogOpen(false);
      setSelectedPlayerId("");
      setJerseyNumber("");
      await fetchRoster();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!teamId || !jerseyNumber) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    if (!newPlayer.fullName || !newPlayer.birthDate || !newPlayer.idNumber || !newPlayer.position) {
      setError("Nombre, fecha de nacimiento, identificación y posición son obligatorios");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // 1. Upload photo if selected
      let photoUrl: string | null = null;
      if (newPlayerPhoto) {
        const formData = new FormData();
        formData.append("file", newPlayerPhoto);
        formData.append("folder", "players");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.url;
        }
      }

      // 2. Create the player
      const createRes = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newPlayer.fullName,
          birthDate: newPlayer.birthDate,
          idNumber: newPlayer.idNumber,
          position: newPlayer.position,
          phone: newPlayer.phone || null,
          email: newPlayer.email || null,
          photoUrl,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        setError(data.error ?? "Error al crear jugador");
        return;
      }
      const createdPlayer = await createRes.json();

      // 3. Add to team
      const addRes = await fetch(`/api/teams/${teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: createdPlayer.id, jerseyNumber: parseInt(jerseyNumber) }),
      });
      if (!addRes.ok) {
        const data = await addRes.json();
        setError(data.error ?? "Error al agregar jugador al equipo");
        return;
      }

      setDialogOpen(false);
      setSelectedPlayerId("");
      setJerseyNumber("");
      setNewPlayer({ fullName: "", birthDate: "", idNumber: "", position: "", phone: "", email: "" });
      setNewPlayerPhoto(null);
      setNewPlayerPhotoPreview(null);
      setCreateMode(false);
      await Promise.all([fetchRoster(), fetchAllPlayers()]);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (playerId: string, playerName: string) => {
    if (!teamId) return;
    if (!confirm(`¿Remover a ${playerName} del equipo?`)) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) await fetchRoster();
    } catch {
      // ignore
    }
  };

  // Edit player state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState({
    id: "",
    fullName: "",
    birthDate: "",
    position: "",
    phone: "",
    email: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEditDialog = (r: RosterPlayer) => {
    setEditPlayer({
      id: r.player.id,
      fullName: r.player.fullName,
      birthDate: r.player.birthDate.split("T")[0],
      position: r.player.position,
      phone: "",
      email: "",
    });
    setEditError(null);
    setEditDialogOpen(true);
    // Fetch full player data for phone/email
    fetch(`/api/players/${r.player.id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setEditPlayer((prev) => ({
            ...prev,
            phone: data.phone ?? "",
            email: data.email ?? "",
          }));
        }
      })
      .catch(() => {});
  };

  const handleEditSave = async () => {
    if (!editPlayer.fullName || !editPlayer.birthDate || !editPlayer.position) {
      setEditError("Nombre, fecha de nacimiento y posición son obligatorios");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/players/${editPlayer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editPlayer.fullName,
          birthDate: editPlayer.birthDate,
          position: editPlayer.position,
          phone: editPlayer.phone || null,
          email: editPlayer.email || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error ?? "Error al actualizar jugador");
        return;
      }
      setEditDialogOpen(false);
      await fetchRoster();
    } catch {
      setEditError("Error de conexión");
    } finally {
      setEditSaving(false);
    }
  };

  const filteredRoster = roster.filter((r) =>
    searchQuery
      ? r.player.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.jerseyNumber.toString().includes(searchQuery)
      : true
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando plantilla...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Plantilla del Equipo</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Agregar Jugador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Jugador al Equipo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}

              {/* Toggle between modes */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!createMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setCreateMode(false); setError(null); }}
                  className="flex-1"
                >
                  Jugador Existente
                </Button>
                <Button
                  type="button"
                  variant={createMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setCreateMode(true); setError(null); }}
                  className="flex-1"
                >
                  <UserPlus className="size-4 mr-1" />
                  Crear Nuevo
                </Button>
              </div>

              {!createMode ? (
                <>
                  <div>
                    <Label>Jugador</Label>
                    <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar jugador..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayers.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.fullName} — {positionLabels[p.position] || p.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="jersey">Número de Camiseta</Label>
                    <Input
                      id="jersey"
                      type="number"
                      min={1}
                      max={99}
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      placeholder="Ej: 10"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAdd} disabled={saving}>
                      {saving ? "Agregando..." : "Agregar"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Photo upload */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="size-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => newPlayerPhotoInputRef.current?.click()}
                    >
                      {newPlayerPhotoPreview ? (
                        <img src={newPlayerPhotoPreview} alt="Preview" className="size-full object-cover" />
                      ) : (
                        <Camera className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => newPlayerPhotoInputRef.current?.click()}
                      className="text-xs text-primary hover:underline"
                    >
                      {newPlayerPhotoPreview ? "Cambiar foto" : "Agregar foto"}
                    </button>
                    {newPlayerPhotoPreview && (
                      <button
                        type="button"
                        onClick={() => { setNewPlayerPhoto(null); setNewPlayerPhotoPreview(null); }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Quitar foto
                      </button>
                    )}
                    <input
                      ref={newPlayerPhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { setError("La imagen no debe superar 5MB"); return; }
                        setNewPlayerPhoto(file);
                        setNewPlayerPhotoPreview(URL.createObjectURL(file));
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div>
                    <Label>Nombre Completo *</Label>
                    <Input
                      value={newPlayer.fullName}
                      onChange={(e) => setNewPlayer({ ...newPlayer, fullName: e.target.value })}
                      placeholder="Nombre del jugador"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Fecha de Nacimiento *</Label>
                      <Input
                        type="date"
                        value={newPlayer.birthDate}
                        onChange={(e) => setNewPlayer({ ...newPlayer, birthDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>No. Identificación *</Label>
                      <Input
                        value={newPlayer.idNumber}
                        onChange={(e) => setNewPlayer({ ...newPlayer, idNumber: e.target.value })}
                        placeholder="CURP, INE, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Posición *</Label>
                      <Select value={newPlayer.position} onValueChange={(v) => setNewPlayer({ ...newPlayer, position: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="goalkeeper">Portero</SelectItem>
                          <SelectItem value="defender">Defensa</SelectItem>
                          <SelectItem value="midfielder">Mediocampista</SelectItem>
                          <SelectItem value="forward">Delantero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>No. Camiseta *</Label>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={jerseyNumber}
                        onChange={(e) => setJerseyNumber(e.target.value)}
                        placeholder="Ej: 10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Teléfono</Label>
                      <Input
                        value={newPlayer.phone}
                        onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newPlayer.email}
                        onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateAndAdd} disabled={saving}>
                      {saving ? "Creando..." : "Crear y Agregar"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o número..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Roster table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Jugadores ({roster.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRoster.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {roster.length === 0 ? "No hay jugadores en la plantilla." : "Sin resultados."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoster
                    .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold text-primary">{r.jerseyNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative group shrink-0">
                              <div className="size-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {r.player.photoUrl ? (
                                  <img src={r.player.photoUrl} alt="" className="size-full object-cover" />
                                ) : (
                                  <User className="size-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { activePlayerIdRef.current = r.player.id; playerPhotoInputRef.current?.click(); }}
                                  disabled={uploadingPlayerId === r.player.id}
                                  className="p-0.5 rounded hover:bg-white/20 transition-colors cursor-pointer"
                                >
                                  {uploadingPlayerId === r.player.id ? (
                                    <Loader2 className="size-3.5 text-white animate-spin" />
                                  ) : (
                                    <Camera className="size-3.5 text-white" />
                                  )}
                                </button>
                                {r.player.photoUrl && (
                                  <button
                                    onClick={() => handleDeletePlayerPhoto(r.player.id)}
                                    className="p-0.5 rounded hover:bg-red-500/30 transition-colors cursor-pointer"
                                  >
                                    <X className="size-3.5 text-red-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <span
                              className="font-medium text-sm cursor-pointer hover:text-primary hover:underline transition-colors"
                              onClick={() => openEditDialog(r)}
                            >
                              {r.player.fullName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={positionColors[r.player.position] || ""}>
                            {positionLabels[r.player.position] || r.player.position}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{calcAge(r.player.birthDate)} años</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => openEditDialog(r)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemove(r.player.id, r.player.fullName)}
                            >
                              <UserMinus className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Player Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Jugador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editError && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{editError}</p>}
            <div>
              <Label>Nombre Completo *</Label>
              <Input
                value={editPlayer.fullName}
                onChange={(e) => setEditPlayer({ ...editPlayer, fullName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha de Nacimiento *</Label>
                <Input
                  type="date"
                  value={editPlayer.birthDate}
                  onChange={(e) => setEditPlayer({ ...editPlayer, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Posición *</Label>
                <Select value={editPlayer.position} onValueChange={(v) => setEditPlayer({ ...editPlayer, position: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goalkeeper">Portero</SelectItem>
                    <SelectItem value="defender">Defensa</SelectItem>
                    <SelectItem value="midfielder">Mediocampista</SelectItem>
                    <SelectItem value="forward">Delantero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={editPlayer.phone}
                  onChange={(e) => setEditPlayer({ ...editPlayer, phone: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editPlayer.email}
                  onChange={(e) => setEditPlayer({ ...editPlayer, email: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input shared across all player photo uploads */}
      <input
        ref={playerPhotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handlePlayerPhotoChange}
      />
    </div>
  );
}
