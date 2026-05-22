"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface StandingRow {
  id: string;
  teamId: string;
  team: { id: string; name: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface StandingsTableProps {
  standings: StandingRow[];
  /** Number of teams that qualify (shown in green zone) */
  qualifyingSpots?: number;
  /** Number of teams in relegation zone (shown in red zone) */
  relegationSpots?: number;
  /** Compact mode for widgets */
  compact?: boolean;
}

export default function StandingsTable({
  standings,
  qualifyingSpots = 0,
  relegationSpots = 0,
  compact = false,
}: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No hay datos de posiciones disponibles
      </div>
    );
  }

  function getRowClass(index: number) {
    if (qualifyingSpots > 0 && index < qualifyingSpots) {
      return "border-l-2 border-l-emerald-500 bg-emerald-500/5";
    }
    if (relegationSpots > 0 && index >= standings.length - relegationSpots) {
      return "border-l-2 border-l-red-500 bg-red-500/5";
    }
    return "";
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="text-center w-10">PJ</TableHead>
            <TableHead className="text-center w-10">G</TableHead>
            <TableHead className="text-center w-10">E</TableHead>
            <TableHead className="text-center w-10">P</TableHead>
            {!compact && (
              <>
                <TableHead className="text-center w-10">GF</TableHead>
                <TableHead className="text-center w-10">GC</TableHead>
                <TableHead className="text-center w-10">DG</TableHead>
              </>
            )}
            <TableHead className="text-center w-12 font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row, index) => (
            <TableRow key={row.id} className={getRowClass(index)}>
              <TableCell className="text-center font-mono text-sm font-semibold">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">{row.team.name}</TableCell>
              <TableCell className="text-center font-mono text-sm">{row.played}</TableCell>
              <TableCell className="text-center font-mono text-sm">{row.won}</TableCell>
              <TableCell className="text-center font-mono text-sm">{row.drawn}</TableCell>
              <TableCell className="text-center font-mono text-sm">{row.lost}</TableCell>
              {!compact && (
                <>
                  <TableCell className="text-center font-mono text-sm">{row.goalsFor}</TableCell>
                  <TableCell className="text-center font-mono text-sm">{row.goalsAgainst}</TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    <span className={row.goalDifference > 0 ? "text-emerald-600" : row.goalDifference < 0 ? "text-red-500" : ""}>
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </span>
                  </TableCell>
                </>
              )}
              <TableCell className="text-center font-mono text-sm font-bold">
                {row.points}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Legend */}
      {(qualifyingSpots > 0 || relegationSpots > 0) && (
        <div className="flex gap-4 px-4 py-2 text-xs text-muted-foreground border-t">
          {qualifyingSpots > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Zona de clasificación
            </div>
          )}
          {relegationSpots > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Zona de descenso
            </div>
          )}
        </div>
      )}
    </div>
  );
}
