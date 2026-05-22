"use client";

import { useEffect, useState, useCallback, lazy, Suspense } from "react";
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
import { Plus, Pencil, Trash2, MapPin, ExternalLink } from "lucide-react";

const LocationMap = lazy(() => import("@/components/LocationMap"));

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  _count: { matches: number };
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations");
      if (res.ok) setLocations(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  function openCreateDialog() {
    setEditingLocation(null);
    setFormName("");
    setFormAddress("");
    setFormCapacity("");
    setFormLat(null);
    setFormLng(null);
    setError("");
    setDialogOpen(true);
  }

  function openEditDialog(loc: Location) {
    setEditingLocation(loc);
    setFormName(loc.name);
    setFormAddress(loc.address);
    setFormCapacity(loc.capacity?.toString() ?? "");
    setFormLat(loc.latitude);
    setFormLng(loc.longitude);
    setError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : "/api/locations";
      const method = editingLocation ? "PUT" : "POST";
      const payload = {
        name: formName,
        address: formAddress,
        capacity: formCapacity ? parseInt(formCapacity) : null,
        latitude: formLat,
        longitude: formLng,
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
      setDialogOpen(false);
      fetchLocations();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deletingLocation) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/locations/${deletingLocation.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
        return;
      }
      setDeleteDialogOpen(false);
      setDeletingLocation(null);
      fetchLocations();
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  }

  function handleMapLocationChange(lat: number, lng: number, address: string) {
    setFormLat(lat);
    setFormLng(lng);
    if (!formAddress || formAddress.length < 5) {
      setFormAddress(address);
    }
  }

  function openInGoogleMaps(lat: number, lng: number) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ubicaciones</h1>
          <p className="text-muted-foreground">Gestiona las canchas y ubicaciones de partidos</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4 mr-1" /> Nueva Ubicación
        </Button>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando ubicaciones...</div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay ubicaciones registradas</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Partidos</TableHead>
                <TableHead>Mapa</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-[#e63946]" />
                      {loc.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {loc.address}
                  </TableCell>
                  <TableCell>{loc.capacity ? loc.capacity.toLocaleString() : "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{loc._count.matches}</Badge></TableCell>
                  <TableCell>
                    {loc.latitude && loc.longitude ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInGoogleMaps(loc.latitude!, loc.longitude!)}
                        className="text-xs gap-1"
                      >
                        <ExternalLink className="size-3" /> Ver mapa
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin coordenadas</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(loc)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="destructive" size="icon-sm"
                        onClick={() => { setDeletingLocation(loc); setError(""); setDeleteDialogOpen(true); }}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}</DialogTitle>
            <DialogDescription>
              {editingLocation ? "Modifica los datos de la ubicación" : "Selecciona la ubicación en el mapa o busca por nombre"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="loc-name">Nombre del campo *</Label>
                <Input
                  id="loc-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Campo Deportivo San Juan"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="loc-capacity">Capacidad</Label>
                <Input
                  id="loc-capacity"
                  type="number"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(e.target.value)}
                  placeholder="Espectadores (opcional)"
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="loc-address">Dirección</Label>
              <Input
                id="loc-address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Se llena automáticamente al seleccionar en el mapa"
                required
              />
            </div>

            {/* Map */}
            <div className="space-y-1">
              <Label>Ubicación en el mapa</Label>
              <Suspense fallback={<div className="h-[300px] rounded-lg border bg-muted flex items-center justify-center text-muted-foreground">Cargando mapa...</div>}>
                <LocationMap
                  lat={formLat}
                  lng={formLng}
                  address={formAddress}
                  onLocationChange={handleMapLocationChange}
                />
              </Suspense>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : editingLocation ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Ubicación</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{deletingLocation?.name}</strong>?
              {deletingLocation && deletingLocation._count.matches > 0 && (
                <span className="block mt-2 text-destructive">
                  Tiene {deletingLocation._count.matches} partido(s) asociado(s).
                </span>
              )}
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
    </div>
  );
}
