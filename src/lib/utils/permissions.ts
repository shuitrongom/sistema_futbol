import type { SessionUser } from "@/lib/auth";

// Admin: full access to everything (Req 20.1-20.8)
export function canManageTournaments(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canManageAllTeams(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canManageLocations(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canManageCategories(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canRegisterResults(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canManageUsers(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canInscribeTeams(user: SessionUser): boolean {
  return user.role === "admin";
}

// Coach: limited to own team (Req 20.9-20.31)
export function canManageTeam(user: SessionUser, teamId: string): boolean {
  if (user.role === "admin") return true;
  if (user.role === "coach" && user.teamId === teamId) return true;
  return false;
}

export function canManageTeamPlayers(
  user: SessionUser,
  teamId: string
): boolean {
  return canManageTeam(user, teamId);
}

export function canManageTactics(user: SessionUser, teamId: string): boolean {
  return canManageTeam(user, teamId);
}

export function canAccessExerciseLibrary(user: SessionUser): boolean {
  return user.role === "admin" || user.role === "coach";
}

export function canManageTrainingPlans(
  user: SessionUser,
  teamId: string
): boolean {
  return canManageTeam(user, teamId);
}

export function canEvaluatePlayers(
  user: SessionUser,
  teamId: string
): boolean {
  return canManageTeam(user, teamId);
}

export function canAssignTasks(user: SessionUser, teamId: string): boolean {
  return canManageTeam(user, teamId);
}

export function canSendFeedback(user: SessionUser, teamId: string): boolean {
  return canManageTeam(user, teamId);
}

export function canGenerateReports(
  user: SessionUser,
  teamId: string
): boolean {
  return canManageTeam(user, teamId);
}

export function canAccessDashboard(
  user: SessionUser,
  teamId: string
): boolean {
  return canManageTeam(user, teamId);
}

export function canManageUniforms(user: SessionUser, teamId: string): boolean {
  return canManageTeam(user, teamId);
}

export function canAccessRecommendations(
  user: SessionUser,
  teamId: string
): boolean {
  return canManageTeam(user, teamId);
}

// Parent: limited to own children (Req 20.32-20.41)
export function canAccessPlayer(
  user: SessionUser,
  _playerId: string,
  parentPlayerIds?: string[]
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "coach") return true; // coach access checked via team
  if (user.role === "parent" && parentPlayerIds) {
    return parentPlayerIds.includes(_playerId);
  }
  return false;
}

export function canViewPlayerStats(
  user: SessionUser,
  playerId: string,
  parentPlayerIds?: string[]
): boolean {
  return canAccessPlayer(user, playerId, parentPlayerIds);
}

export function canViewPlayerReports(
  user: SessionUser,
  playerId: string,
  parentPlayerIds?: string[]
): boolean {
  return canAccessPlayer(user, playerId, parentPlayerIds);
}

export function canConfigureNotifications(user: SessionUser): boolean {
  return user.role === "parent";
}

// Public access
export function isPublicRoute(path: string): boolean {
  const publicPaths = [
    "/",
    "/tournaments",
    "/teams",
    "/players",
    "/login",
    "/register",
  ];
  return publicPaths.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
}
