"use client";

import { Card } from "@/components/ui/card";
import { User } from "lucide-react";

const positionLabels: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

const positionColors: Record<string, string> = {
  goalkeeper: "bg-amber-500/20 text-amber-300",
  defender: "bg-blue-500/20 text-blue-300",
  midfielder: "bg-emerald-500/20 text-emerald-300",
  forward: "bg-red-500/20 text-red-300",
};

export interface PlayerCardProps {
  fullName: string;
  position: string;
  photoUrl: string | null;
  jerseyNumber?: number | null;
  teamName?: string | null;
  stats?: {
    goals?: number;
    assists?: number;
    matches?: number;
  } | null;
}

export default function PlayerCard({
  fullName,
  position,
  photoUrl,
  jerseyNumber,
  teamName,
  stats,
}: PlayerCardProps) {
  return (
    <Card className="group relative overflow-hidden p-0 hover:shadow-lg transition-shadow">
      {/* Jersey number watermark */}
      {jerseyNumber != null && (
        <span className="absolute top-2 right-3 text-4xl font-bold text-foreground/5 select-none">
          {jerseyNumber}
        </span>
      )}

      <div className="flex items-start gap-3 p-4">
        {/* Photo */}
        <div className="shrink-0 size-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt={fullName} className="size-full object-cover" />
          ) : (
            <User className="size-8 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {jerseyNumber != null && (
              <span className="text-lg font-bold text-primary leading-none">#{jerseyNumber}</span>
            )}
            <h4 className="font-semibold text-sm truncate">{fullName}</h4>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${positionColors[position] || "bg-muted text-muted-foreground"}`}>
              {positionLabels[position] || position}
            </span>
            {teamName && (
              <span className="text-xs text-muted-foreground truncate">{teamName}</span>
            )}
          </div>

          {/* Stats row */}
          {stats && (
            <div className="flex items-center gap-3 mt-2">
              {stats.goals != null && (
                <div className="text-center">
                  <span className="text-sm font-bold leading-none">{stats.goals}</span>
                  <span className="block text-[10px] text-muted-foreground">Goles</span>
                </div>
              )}
              {stats.assists != null && (
                <div className="text-center">
                  <span className="text-sm font-bold leading-none">{stats.assists}</span>
                  <span className="block text-[10px] text-muted-foreground">Asist.</span>
                </div>
              )}
              {stats.matches != null && (
                <div className="text-center">
                  <span className="text-sm font-bold leading-none">{stats.matches}</span>
                  <span className="block text-[10px] text-muted-foreground">PJ</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
