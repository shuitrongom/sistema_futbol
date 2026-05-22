"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCircle, Trophy } from "lucide-react";

interface ChildInfo {
  id: string;
  fullName: string;
  photoUrl: string | null;
  position: string;
  teamName: string;
  jerseyNumber: number | null;
}

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

export default function ChildrenListPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildInfo[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const evalsRes = await fetch("/api/evaluations");
        const evals = evalsRes.ok ? await evalsRes.json() : [];

        const playerMap = new Map<string, ChildInfo>();
        for (const ev of evals) {
          if (ev.player && !playerMap.has(ev.player.id || ev.playerId)) {
            const tp = ev.player.teamPlayers?.[0];
            playerMap.set(ev.player.id || ev.playerId, {
              id: ev.player.id || ev.playerId,
              fullName: ev.player.fullName,
              photoUrl: ev.player.photoUrl,
              position: ev.player.position,
              teamName: tp?.team?.name || "Sin equipo",
              jerseyNumber: tp?.jerseyNumber ?? null,
            });
          }
        }
        setChildren(Array.from(playerMap.values()));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a472a]">Mis Hijos</h1>
        <p className="text-muted-foreground">Selecciona un hijo para ver su información</p>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tienes hijos registrados en el sistema.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link key={child.id} href={`/parent/children/${child.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  {child.photoUrl ? (
                    <img
                      src={child.photoUrl}
                      alt={child.fullName}
                      className="size-20 rounded-full object-cover mx-auto mb-3"
                    />
                  ) : (
                    <div className="size-20 rounded-full bg-[#1a472a]/10 flex items-center justify-center mx-auto mb-3">
                      <UserCircle className="size-10 text-[#1a472a]" />
                    </div>
                  )}
                  <h3 className="font-semibold">{child.fullName}</h3>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge className="bg-[#1a472a] text-white text-xs">
                      {POSITION_LABELS[child.position] || child.position}
                    </Badge>
                    {child.jerseyNumber && (
                      <Badge className="bg-[#d4af37] text-black text-xs">#{child.jerseyNumber}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Trophy className="size-3" />
                    <span>{child.teamName}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
