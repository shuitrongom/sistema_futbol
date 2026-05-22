"use client";

import { Badge } from "@/components/ui/badge";

interface MatchTeam {
  id: string;
  name: string;
  badgeUrl?: string | null;
  primaryColor?: string | null;
}

interface MatchScoreWidgetProps {
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "in_progress" | "completed" | "postponed" | "cancelled";
  dateTime: string;
  /** Current minute for live matches */
  minute?: number;
  /** Phase or round name */
  phaseName?: string;
  /** Location name */
  locationName?: string;
}

export default function MatchScoreWidget({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  dateTime,
  minute,
  phaseName,
  locationName,
}: MatchScoreWidgetProps) {
  const isLive = status === "in_progress";
  const isCompleted = status === "completed";
  const isScheduled = status === "scheduled";

  return (
    <div className="rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow">
      {/* Header: phase + status */}
      <div className="flex items-center justify-between mb-2">
        {phaseName && (
          <span className="text-xs text-muted-foreground truncate">{phaseName}</span>
        )}
        <div className="ml-auto">
          {isLive && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
              EN VIVO {minute != null && `${minute}'`}
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Finalizado
            </Badge>
          )}
          {isScheduled && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {new Date(dateTime).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            </Badge>
          )}
        </div>
      </div>

      {/* Score area */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamBadge team={homeTeam} />
          <span className="font-medium text-sm truncate">{homeTeam.name}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 px-2">
          {homeScore !== null && awayScore !== null ? (
            <span className="font-mono font-bold text-lg tabular-nums">
              {homeScore} - {awayScore}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground font-medium">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-medium text-sm truncate text-right">{awayTeam.name}</span>
          <TeamBadge team={awayTeam} />
        </div>
      </div>

      {/* Footer: date + location */}
      <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
        <span>
          {new Date(dateTime).toLocaleDateString("es", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
        {locationName && <span className="truncate ml-2">{locationName}</span>}
      </div>
    </div>
  );
}

function TeamBadge({ team }: { team: MatchTeam }) {
  if (team.badgeUrl) {
    return (
      <img
        src={team.badgeUrl}
        alt={`${team.name} escudo`}
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
      style={{ backgroundColor: team.primaryColor ?? "#6b7280" }}
    >
      {team.name.slice(0, 2).toUpperCase()}
    </div>
  );
}
