import prisma from "@/lib/prisma";
import type { PlayerPosition } from "@prisma/client";

export interface CreatePlayerInput {
  fullName: string;
  birthDate: string;
  idNumber: string;
  position: PlayerPosition;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
}

export interface UpdatePlayerInput {
  fullName?: string;
  birthDate?: string;
  position?: PlayerPosition;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
}

const playerInclude = {
  teamPlayers: {
    where: { leftAt: null },
    include: { team: { select: { id: true, name: true } } },
  },
};

export async function getAllPlayers(teamId?: string) {
  return prisma.player.findMany({
    where: teamId
      ? { teamPlayers: { some: { teamId, leftAt: null } } }
      : undefined,
    orderBy: { fullName: "asc" },
    include: playerInclude,
  });
}

export async function getPlayerById(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: playerInclude,
  });
}

export async function createPlayer(data: CreatePlayerInput) {
  return prisma.player.create({
    data: {
      fullName: data.fullName,
      birthDate: new Date(data.birthDate),
      idNumber: data.idNumber,
      position: data.position,
      phone: data.phone ?? null,
      email: data.email ?? null,
      photoUrl: data.photoUrl ?? null,
    },
    include: playerInclude,
  });
}

export async function updatePlayer(id: string, data: UpdatePlayerInput) {
  const updateData: Record<string, unknown> = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
  if (data.position !== undefined) updateData.position = data.position;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

  return prisma.player.update({
    where: { id },
    data: updateData,
    include: playerInclude,
  });
}

export async function idNumberExists(
  idNumber: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.player.findUnique({
    where: { idNumber },
    select: { id: true },
  });
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}
