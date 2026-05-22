import prisma from "@/lib/prisma";

// Suspension rules
const YELLOW_CARD_THRESHOLD = 5; // 5 yellows = 1 match suspension
const RED_CARD_SUSPENSION = 1;   // red card = 1 match suspension

/**
 * Process suspensions after a match is completed.
 * Checks for yellow card accumulation and red cards.
 */
export async function processMatchSuspensions(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      events: {
        where: {
          eventType: { in: ["yellow_card", "red_card"] },
        },
      },
    },
  });

  if (!match) return;

  // Process red cards - immediate suspension
  const redCards = match.events.filter((e) => e.eventType === "red_card" && e.playerId);
  for (const event of redCards) {
    await createSuspension(
      event.playerId!,
      match.tournamentId,
      "Tarjeta roja directa",
      RED_CARD_SUSPENSION
    );
  }

  // Process yellow card accumulation
  const yellowPlayers = new Set(
    match.events
      .filter((e) => e.eventType === "yellow_card" && e.playerId)
      .map((e) => e.playerId!)
  );

  for (const playerId of Array.from(yellowPlayers)) {
    // Count total yellows in this tournament
    const yellowCount = await prisma.matchEvent.count({
      where: {
        playerId,
        eventType: "yellow_card",
        match: {
          tournamentId: match.tournamentId,
          status: "completed",
        },
      },
    });

    // Check if threshold reached (and not already suspended for this accumulation)
    if (yellowCount > 0 && yellowCount % YELLOW_CARD_THRESHOLD === 0) {
      const existingSuspension = await prisma.suspension.findFirst({
        where: {
          playerId,
          tournamentId: match.tournamentId,
          reason: `Acumulación de ${YELLOW_CARD_THRESHOLD} tarjetas amarillas`,
          isActive: true,
        },
      });

      if (!existingSuspension) {
        await createSuspension(
          playerId,
          match.tournamentId,
          `Acumulación de ${YELLOW_CARD_THRESHOLD} tarjetas amarillas`,
          1
        );
      }
    }
  }

  // Decrement matches_remaining for active suspensions of players in this match
  await decrementSuspensions(matchId);
}


/**
 * Create a new suspension for a player.
 */
async function createSuspension(
  playerId: string,
  tournamentId: string,
  reason: string,
  matchesRemaining: number
) {
  return prisma.suspension.create({
    data: {
      playerId,
      tournamentId,
      reason,
      matchesRemaining,
      isActive: true,
    },
  });
}

/**
 * Decrement matches_remaining for active suspensions after a match.
 * Auto-deactivates suspensions when matches_remaining reaches 0.
 */
async function decrementSuspensions(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { tournamentId: true, homeTeamId: true, awayTeamId: true },
  });
  if (!match) return;

  // Get players from both teams
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: {
      teamId: { in: [match.homeTeamId, match.awayTeamId] },
      leftAt: null,
    },
    select: { playerId: true },
  });

  const playerIds = teamPlayers.map((tp) => tp.playerId);

  // Find active suspensions for these players in this tournament
  // that were created BEFORE this match (not from this match's events)
  const suspensions = await prisma.suspension.findMany({
    where: {
      playerId: { in: playerIds },
      tournamentId: match.tournamentId,
      isActive: true,
      matchesRemaining: { gt: 0 },
    },
  });

  for (const suspension of suspensions) {
    const newRemaining = suspension.matchesRemaining - 1;
    await prisma.suspension.update({
      where: { id: suspension.id },
      data: {
        matchesRemaining: newRemaining,
        isActive: newRemaining > 0,
      },
    });
  }
}

/**
 * Check if a player is eligible to play in a tournament.
 * Returns true if the player has no active suspensions.
 */
export async function isPlayerEligible(
  playerId: string,
  tournamentId: string
): Promise<boolean> {
  const activeSuspension = await prisma.suspension.findFirst({
    where: {
      playerId,
      tournamentId,
      isActive: true,
    },
  });

  return !activeSuspension;
}

/**
 * Get all active suspensions for a tournament.
 */
export async function getActiveSuspensions(tournamentId: string) {
  return prisma.suspension.findMany({
    where: {
      tournamentId,
      isActive: true,
    },
    include: {
      player: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get suspension history for a player in a tournament.
 */
export async function getPlayerSuspensions(
  playerId: string,
  tournamentId?: string
) {
  const where: Record<string, unknown> = { playerId };
  if (tournamentId) where.tournamentId = tournamentId;

  return prisma.suspension.findMany({
    where,
    include: {
      tournament: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
