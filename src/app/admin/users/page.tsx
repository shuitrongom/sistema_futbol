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
import { Plus, Pencil, UserX, UserCheck, Search, Link2, Unlink, Loader2 } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  phone: string | null;
  team: { id: string; name: string } | null;
  createdAt: string;
}

interface LinkedPlayer {
  id: string;
  relationship: string;
  player: {
    id: string;
    fullName: string;
    position: string | null;
    teamPlayers: { team: { name: string } }[];
  };
}

interface PlayerOption {
  id: string;
  fullName: string;
  position: string;
  teamPlayers?: { jerseyNumber: number; team: { id: string; name: string } }[];
  team?: { name: string } | null;
}

interface TeamOption {
  id: string;
  name: string;
  teamCategories: { category: { id: string; name: string } }[];
  _count: { teamPlayers: number };
}

interface CategoryOption {
  id: string;
  name: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: "Padre",
  mother: "Madre",
  guardian: "Tutor",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  coach: "Entrenador",
  parent: "Padre/Tutor",
  player: "Jugador",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "default",
  coach: "default",
  parent: "secondary",
  player: "secondary",
};

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "coach" as string,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [editRole, setEditRole] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Parent-player linking state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingParent, setLinkingParent] = useState<User | null>(null);
  const [linkedPlayers, setLinkedPlayers] = useState<LinkedPlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerOption[]>([]);
  const [linkPlayerId, setLinkPlayerId] = useState("");
  const [linkRelationship, setLinkRelationship] = useState("father");
  const [linkError, setLinkError] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  // Cascading filter state for player selection
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function openCreateDialog() {
    setFormData(emptyForm);
    setError("");
    setCreateDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    setEditRole(user.role);
    setError("");
    setEditDialogOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear usuario");
        return;
      }
      setCreateDialogOpen(false);
      fetchUsers();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al actualizar");
        return;
      }
      setEditDialogOpen(false);
      fetchUsers();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleUserStatus(user: User) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) fetchUsers();
    } catch {
      // ignore
    }
  }

  // Parent-player linking functions
  const fetchLinkedPlayers = useCallback(async (parentId: string) => {
    setLinkLoading(true);
    try {
      const res = await fetch(`/api/parent-players?parentId=${parentId}`);
      if (res.ok) {
        const data = await res.json();
        setLinkedPlayers(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLinkLoading(false);
    }
  }, []);

  const fetchAllPlayers = useCallback(async () => {
    try {
      const [playersRes, categoriesRes, teamsRes] = await Promise.all([
        fetch("/api/players"),
        fetch("/api/categories"),
        fetch("/api/teams"),
      ]);
      if (playersRes.ok) setAllPlayers(await playersRes.json());
      if (categoriesRes.ok) setAllCategories(await categoriesRes.json());
      if (teamsRes.ok) setAllTeams(await teamsRes.json());
    } catch {
      // ignore
    }
  }, []);

  function openLinkDialog(user: User) {
    setLinkingParent(user);
    setLinkedPlayers([]);
    setLinkPlayerId("");
    setLinkRelationship("father");
    setLinkError("");
    setFilterCategoryId("");
    setFilterTeamId("");
    setLinkDialogOpen(true);
    fetchLinkedPlayers(user.id);
    fetchAllPlayers();
  }

  async function handleLinkPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!linkingParent || !linkPlayerId) return;
    setLinkSubmitting(true);
    setLinkError("");
    try {
      const res = await fetch("/api/parent-players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: linkingParent.id,
          playerId: linkPlayerId,
          relationship: linkRelationship,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLinkError(data.error || "Error al vincular jugador");
        return;
      }
      setLinkPlayerId("");
      setLinkRelationship("father");
      fetchLinkedPlayers(linkingParent.id);
    } catch {
      setLinkError("Error de conexión");
    } finally {
      setLinkSubmitting(false);
    }
  }

  async function handleUnlinkPlayer(playerId: string) {
    if (!linkingParent) return;
    try {
      const res = await fetch("/api/parent-players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: linkingParent.id,
          playerId,
        }),
      });
      if (res.ok) {
        fetchLinkedPlayers(linkingParent.id);
      }
    } catch {
      // ignore
    }
  }

  function getPlayerTeamName(player: PlayerOption): string {
    if (player.teamPlayers && player.teamPlayers.length > 0) {
      return player.teamPlayers[0].team.name;
    }
    if (player.team) {
      return player.team.name;
    }
    return "Sin equipo";
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ROLE_LABELS[u.role]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4 mr-1" /> Crear Usuario
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o rol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No se encontraron usuarios" : "No hay usuarios registrados"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_COLORS[user.role] as "default" | "secondary"}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.team?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {user.role === "parent" && (
                          <Button variant="ghost" size="icon-sm" onClick={() => openLinkDialog(user)} title="Vincular Hijos">
                            <Link2 className="size-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(user)} title="Editar rol">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => toggleUserStatus(user)}
                          title={user.isActive ? "Desactivar" : "Activar"}
                        >
                          {user.isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
            <DialogDescription>Registra un nuevo usuario en el sistema</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input id="fullName" value={formData.fullName} onChange={set("fullName")} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={set("email")} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone} onChange={set("phone")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Contraseña *</Label>
                <Input id="password" type="password" value={formData.password} onChange={set("password")} required minLength={6} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Rol *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={set("role")}
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                >
                  <option value="admin">Administrador</option>
                  <option value="coach">Entrenador</option>
                  <option value="parent">Padre/Tutor</option>
                  <option value="player">Jugador</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>
              Cambiar el rol de <strong>{editingUser?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRole} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-1">
              <Label htmlFor="editRole">Rol</Label>
              <select
                id="editRole"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
              >
                <option value="admin">Administrador</option>
                <option value="coach">Entrenador</option>
                <option value="parent">Padre/Tutor</option>
                <option value="player">Jugador</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Actualizar Rol"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Children Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Hijos</DialogTitle>
            <DialogDescription>
              Gestionar jugadores vinculados a <strong>{linkingParent?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Currently linked players */}
            <div className="space-y-2">
              <Label>Jugadores vinculados</Label>
              {linkLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando...
                </div>
              ) : linkedPlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No hay jugadores vinculados</p>
              ) : (
                <div className="space-y-2">
                  {linkedPlayers.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between rounded-lg border p-2.5"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{link.player.fullName}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {RELATIONSHIP_LABELS[link.relationship] ?? link.relationship}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {link.player.teamPlayers?.[0]?.team?.name ?? "Sin equipo"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkPlayer(link.player.id)}
                        title="Desvincular"
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink className="size-4 mr-1" />
                        Desvincular
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Link new player form */}
            <form onSubmit={handleLinkPlayer} className="space-y-3 border-t pt-4">
              <Label>Vincular nuevo jugador</Label>
              {linkError && <p className="text-sm text-destructive">{linkError}</p>}

              {/* Step 1: Category filter */}
              <div className="space-y-1">
                <Label htmlFor="filterCategory">1. Categoría</Label>
                <select
                  id="filterCategory"
                  value={filterCategoryId}
                  onChange={(e) => { setFilterCategoryId(e.target.value); setFilterTeamId(""); setLinkPlayerId(""); }}
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                >
                  <option value="">Todas las categorías</option>
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Team filter */}
              <div className="space-y-1">
                <Label htmlFor="filterTeam">2. Equipo *</Label>
                <select
                  id="filterTeam"
                  value={filterTeamId}
                  onChange={(e) => { setFilterTeamId(e.target.value); setLinkPlayerId(""); }}
                  required
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                >
                  <option value="">Seleccionar equipo...</option>
                  {allTeams
                    .filter((t) => !filterCategoryId || t.teamCategories.some((tc) => tc.category.id === filterCategoryId))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t._count.teamPlayers} jugadores)
                      </option>
                    ))}
                </select>
              </div>

              {/* Step 3: Player */}
              <div className="space-y-1">
                <Label htmlFor="linkPlayer">3. Jugador *</Label>
                <select
                  id="linkPlayer"
                  value={linkPlayerId}
                  onChange={(e) => setLinkPlayerId(e.target.value)}
                  required
                  disabled={!filterTeamId}
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark] disabled:opacity-50"
                >
                  <option value="">{filterTeamId ? "Seleccionar jugador..." : "Primero selecciona un equipo"}</option>
                  {allPlayers
                    .filter((p) => p.teamPlayers?.some((tp) => tp.team.id === filterTeamId))
                    .map((p) => {
                      const tp = p.teamPlayers?.find((tp) => tp.team.id === filterTeamId);
                      return (
                        <option key={p.id} value={p.id}>
                          #{tp?.jerseyNumber ?? "?"} {p.fullName}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Relationship */}
              <div className="space-y-1">
                <Label htmlFor="linkRelationship">Relación *</Label>
                <select
                  id="linkRelationship"
                  value={linkRelationship}
                  onChange={(e) => setLinkRelationship(e.target.value)}
                  className="flex h-8 w-full rounded-xl border border-white/10 bg-[#1a1f36]/80 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50 transition-all [color-scheme:dark]"
                >
                  <option value="father">Padre</option>
                  <option value="mother">Madre</option>
                  <option value="guardian">Tutor</option>
                </select>
              </div>
              <Button type="submit" disabled={linkSubmitting || !linkPlayerId} size="sm">
                {linkSubmitting ? "Vinculando..." : "Vincular"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
