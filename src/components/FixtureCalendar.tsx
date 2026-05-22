"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  CalendarDays,
} from "lucide-react";

interface MatchTeam {
  id: string;
  name: string;
  badgeUrl?: string | null;
  primaryColor?: string | null;
}

interface FixtureMatch {
  id: string;
  dateTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  phase?: { id: string; name: string; type?: string } | null;
  location?: { id: string; name: string; address?: string } | null;
}

interface FixtureCalendarProps {
  matches: FixtureMatch[];
}

const statusBadge: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Programado", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  in_progress: { label: "En vivo", className: "bg-red-500/20 text-red-300 border-red-500/30 animate-pulse" },
  completed: { label: "Finalizado", className: "bg-white/10 text-white/50 border-white/20" },
  postponed: { label: "Aplazado", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-600 border-red-200" },
};

export default function FixtureCalendar({ matches }: FixtureCalendarProps) {
  // Group matches by date
  const grouped = matches.reduce<Record<string, FixtureMatch[]>>((acc, match) => {
    const dateKey = new Date(match.dateTime).toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const dateA = new Date(grouped[a][0].dateTime);
    const dateB = new Date(grouped[b][0].dateTime);
    return dateA.getTime() - dateB.getTime();
  });

  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CalendarDays className="size-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No hay partidos programados.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateLabel) => (
        <div key={dateLabel}>
          {/* Date header */}
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="size-4 text-[#1a472a]" />
            <h3 className="text-sm font-semibold capitalize">{dateLabel}</h3>
          </div>

          {/* Matches for this date */}
          <div className="space-y-2">
            {grouped[dateLabel]
              .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
              .map((match) => (
                <FixtureMatchCard key={match.id} match={match} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamBadgeIcon({ team }: { team: MatchTeam }) {
  if (team.badgeUrl) {
    return (
      <img
        src={team.badgeUrl}
        alt={`${team.name} escudo`}
        className="size-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
      style={{ backgroundColor: team.primaryColor || "#6b7280" }}
    >
      {team.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function FixtureMatchCard({ match }: { match: FixtureMatch }) {
  const isCompleted = match.status === "completed";
  const isLive = match.status === "in_progress";
  const time = new Date(match.dateTime).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const badge = statusBadge[match.status] || statusBadge.scheduled;

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Time + Phase */}
        <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0 sm:w-24 shrink-0">
          <span className="flex items-center gap-1 text-sm font-mono font-medium">
            <Clock className="size-3 text-muted-foreground" />
            {time}
          </span>
          {match.phase && (
            <span className="text-[10px] text-muted-foreground truncate">
              {match.phase.name}
            </span>
          )}
        </div>

        {/* Match content */}
        <div className="flex-1 flex items-center gap-2 sm:gap-4">
          {/* Home team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <div className="text-right min-w-0">
              <p className="text-sm font-medium truncate">{match.homeTeam.name}</p>
              <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5">
                Local
              </Badge>
            </div>
            <TeamBadgeIcon team={match.homeTeam} />
          </div>

          {/* Score */}
          <div className="flex items-center justify-center w-20 shrink-0">
            {isCompleted || isLive ? (
              <div className={`font-mono font-bold text-lg tabular-nums px-3 py-1 rounded ${isLive ? "bg-red-500/20 text-red-300" : "bg-muted"}`}>
                {match.homeScore ?? 0} - {match.awayScore ?? 0}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">vs</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamBadgeIcon team={match.awayTeam} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{match.awayTeam.name}</p>
              <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5">
                Visitante
              </Badge>
            </div>
          </div>
        </div>

        {/* Status + Location */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 sm:w-32 shrink-0">
          <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
            {badge.label}
          </Badge>
          {match.location && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-[120px]">
              <MapPin className="size-2.5 shrink-0" />
              {match.location.name}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
