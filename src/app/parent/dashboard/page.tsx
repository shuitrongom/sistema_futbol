"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Trophy,
  CalendarDays,
  Bell,
  Loader2,
  UserCircle,
  ShieldAlert,
  Shirt,
  Goal,
  Handshake,
} from "lucide-react";

/* ---------- types ---------- */

interface MyChild {
  id: string;
  fullName: string;
  birthDate: string;
  position: string;
  photoUrl: string | null;
  relationship: string;
  teamId: string | null;
  teamName: string;
  teamBadge: string | null;
  jerseyNumber: number | null;
}

interface NextMatch {
  id: string;
  dateTime: string;
  opponent: string;
  location: string;
}

interface ChildStats {
  goals: number;
  assists: number;
}

interface Notification {
  id: string;
  message: string;
  date: string;
}

interface ChildDashboard {
  child: MyChild;
  nextMatch: NextMatch | null;
  stats: ChildStats;
}

/* ---------- helpers ---------- */

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- data fetching ---------- */

async function fetchNextMatch(teamId: string): Promise<NextMatch | null> {
  try {
    const res = await fetch(
      `/api/matches?teamId=${encodeURIComponent(teamId)}&status=scheduled`
    );
    if (!res.ok) return null;
    const matches = await res.json();

    const now = new Date();
    const upcoming = matches
      .filter((m: { dateTime: string }) => new Date(m.dateTime) > now)
      .sort(
        (a: { dateTime: string }, b: { dateTime: string }) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      );

    if (upcoming.length === 0) return null;

    const m = upcoming[0];
    const opponent =
      m.homeTeam?.id === teamId
        ? m.awayTeam?.name ?? "Por definir"
        : m.homeTeam?.name ?? "Por definir";

    return {
      id: m.id,
      dateTime: m.dateTime,
      opponent,
      location: m.location?.name ?? "Por definir",
    };
  } catch {
    return null;
  }
}

async function fetchChildStats(
  playerId: string,
  teamId: string
): Promise<ChildStats> {
  const stats: ChildStats = { goals: 0, assists: 0 };
  try {
    const res = await fetch(
      `/api/matches?teamId=${encodeURIComponent(teamId)}&status=completed`
    );
    if (!res.ok) return stats;
    const matches = await res.json();

    for (const match of matches) {
      if (match.matchEvents) {
        for (const event of match.matchEvents) {
          if (event.playerId === playerId) {
            if (event.eventType === "goal") stats.goals++;
            if (event.eventType === "assist") stats.assists++;
          }
        }
      }
    }
  } catch {
    // non-blocking — return zeroes
  }
  return stats;
}

async function fetchNotifications(
  children: MyChild[]
): Promise<Notification[]> {
  const notifs: Notification[] = [];
  try {
    for (const child of children) {
      const res = await fetch(
        `/api/reports?playerId=${encodeURIComponent(child.id)}`
      );
      if (!res.ok) continue;
      const reports = await res.json();
      for (const rep of reports.slice(0, 3)) {
        notifs.push({
          id: rep.id,
          message: `Nuevo reporte de progreso para ${child.fullName}`,
          date: rep.createdAt,
        });
      }
    }
    // Sort by date descending and take top 5
    notifs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return notifs.slice(0, 5);
  } catch {
    return notifs;
  }
}

/* ---------- component ---------- */

export default function ParentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<ChildDashboard[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function load() {
      try {
        /* 1. Fetch children from the dedicated endpoint */
        const childrenRes = await fetch("/api/my-children");
        if (!childrenRes.ok) {
          setLoading(false);
          return;
        }
        const children: MyChild[] = await childrenRes.json();

        if (children.length === 0) {
          setLoading(false);
          return;
        }

        /* 2. For each child, fetch next match + stats in parallel */
        const boards = await Promise.all(
          children.map(async (child) => {
            const [nextMatch, stats] = await Promise.all([
              child.teamId
                ? fetchNextMatch(child.teamId)
                : Promise.resolve(null),
              child.teamId
                ? fetchChildStats(child.id, child.teamId)
                : Promise.resolve({ goals: 0, assists: 0 }),
            ]);
            return { child, nextMatch, stats } as ChildDashboard;
          })
        );

        setDashboards(boards);

        /* 3. Fetch notifications (reports) */
        const notifs = await fetchNotifications(children);
        setNotifications(notifs);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------- loading state ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  /* ---------- empty state ---------- */
  if (dashboards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a472a]">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tus hijos</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium text-muted-foreground">
              No tienes hijos vinculados
            </p>
            <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
              <ShieldAlert className="size-4" />
              Contacta al administrador para vincular a tus hijos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- main render ---------- */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a472a]">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tus hijos</p>
      </div>

      {/* Children cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {dashboards.map(({ child, nextMatch, stats }) => (
          <Link key={child.id} href={`/parent/children/${child.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-[#1a472a]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {child.photoUrl ? (
                    <img
                      src={child.photoUrl}
                      alt={child.fullName}
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-12 rounded-full bg-[#1a472a]/10 flex items-center justify-center">
                      <UserCircle className="size-7 text-[#1a472a]" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base">
                      {child.fullName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {POSITION_LABELS[child.position] || child.position}
                      </Badge>
                      {child.jerseyNumber != null && (
                        <Badge className="bg-[#d4af37] text-black text-xs">
                          <Shirt className="size-3 mr-0.5" />#{child.jerseyNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Team */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {child.teamBadge ? (
                    <img
                      src={child.teamBadge}
                      alt={child.teamName}
                      className="size-4 rounded object-cover"
                    />
                  ) : (
                    <Trophy className="size-4 text-[#1a472a]" />
                  )}
                  <span>{child.teamName}</span>
                </div>

                {/* Next match */}
                {nextMatch && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="size-4 text-[#d4af37]" />
                    <span>
                      vs {nextMatch.opponent} —{" "}
                      {formatDateTime(nextMatch.dateTime)}
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2 justify-center">
                    <Goal className="size-4 text-[#1a472a]" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#1a472a]">
                        {stats.goals}
                      </p>
                      <p className="text-xs text-muted-foreground">Goles</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Handshake className="size-4 text-[#d4af37]" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#d4af37]">
                        {stats.assists}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Asistencias
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="size-5 text-[#d4af37]" />
              Notificaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="size-2 mt-2 rounded-full bg-[#1a472a] shrink-0" />
                  <div>
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notif.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
