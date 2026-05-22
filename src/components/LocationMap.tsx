"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LocationMapProps {
  lat: number | null;
  lng: number | null;
  address: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

export default function LocationMap({ lat, lng, address, onLocationChange }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Default to Mexico City if no coordinates
  const defaultLat = lat ?? 19.4326;
  const defaultLng = lng ?? -99.1332;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    // Dynamic import of Leaflet (client-side only)
    import("leaflet").then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: lat ? 15 : 6,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add marker if coordinates exist
      if (lat && lng) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      // Click on map to set location
      map.on("click", async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;

        // Update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map);
        }

        // Reverse geocode to get address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "es" } }
          );
          if (res.ok) {
            const data = await res.json();
            onLocationChange(clickLat, clickLng, data.display_name || `${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}`);
          } else {
            onLocationChange(clickLat, clickLng, `${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}`);
          }
        } catch {
          onLocationChange(clickLat, clickLng, `${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}`);
        }
      });

      mapInstanceRef.current = map;

      // Force resize after render
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Update marker when lat/lng change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !lat || !lng) return;
    import("leaflet").then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView([lat, lng], 15);
    });
  }, [lat, lng]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=mx`,
        { headers: { "Accept-Language": "es" } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results.length > 0) {
          const { lat: foundLat, lon: foundLng, display_name } = results[0];
          const numLat = parseFloat(foundLat);
          const numLng = parseFloat(foundLng);
          onLocationChange(numLat, numLng, display_name);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([numLat, numLng], 15);
            import("leaflet").then((L) => {
              if (markerRef.current) {
                markerRef.current.setLatLng([numLat, numLng]);
              } else {
                markerRef.current = L.marker([numLat, numLng]).addTo(mapInstanceRef.current);
              }
            });
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  if (!mounted) {
    return (
      <div className="h-[300px] rounded-lg border bg-muted flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lugar... (ej: Campo deportivo San Juan)"
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm" disabled={searching}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : "Buscar"}
        </Button>
      </form>

      {/* Map */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div
        ref={mapRef}
        className="h-[300px] rounded-lg border overflow-hidden z-0"
        style={{ position: "relative" }}
      />

      {/* Current location info */}
      {lat && lng && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <MapPin className="size-3.5 mt-0.5 shrink-0 text-[#e63946]" />
          <div>
            <p className="font-medium text-foreground">{address || "Ubicación seleccionada"}</p>
            <p>Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Haz clic en el mapa para seleccionar la ubicación del campo, o usa el buscador.
      </p>
    </div>
  );
}
