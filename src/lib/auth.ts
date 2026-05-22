import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("No autenticado", 401);
  }
  return user;
}

export async function requireRole(
  allowedRoles: string[]
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Permisos insuficientes", 403);
  }
  return user;
}

export async function requireTeamAccess(teamId: string): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role === "admin") {
    return user;
  }

  if (user.role === "coach") {
    const team = await prisma.team.findFirst({
      where: { id: teamId, coachId: user.id },
      select: { id: true },
    });
    if (!team) {
      throw new AuthError("Sin acceso a este equipo", 403);
    }
    return user;
  }

  throw new AuthError("Permisos insuficientes", 403);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 403) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}
