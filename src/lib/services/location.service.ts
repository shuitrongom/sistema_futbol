import prisma from "@/lib/prisma";

export interface CreateLocationInput {
  name: string;
  address: string;
  capacity?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  capacity?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export async function getAllLocations() {
  return prisma.location.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { matches: true },
      },
    },
  });
}

export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      _count: {
        select: { matches: true },
      },
    },
  });
}

export async function createLocation(data: CreateLocationInput) {
  return prisma.location.create({
    data: {
      name: data.name,
      address: data.address,
      capacity: data.capacity ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    },
  });
}

export async function updateLocation(id: string, data: UpdateLocationInput) {
  return prisma.location.update({
    where: { id },
    data,
  });
}

export async function deleteLocation(id: string) {
  return prisma.location.delete({
    where: { id },
  });
}

export async function locationHasScheduledMatches(id: string): Promise<boolean> {
  const count = await prisma.match.count({
    where: {
      locationId: id,
      status: { in: ["scheduled", "in_progress"] },
    },
  });
  return count > 0;
}

export async function checkLocationAvailability(
  locationId: string,
  startDate: Date,
  endDate: Date
) {
  const conflicts = await prisma.match.findMany({
    where: {
      locationId,
      status: { in: ["scheduled", "in_progress"] },
      dateTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { dateTime: "asc" },
    select: {
      id: true,
      dateTime: true,
      status: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });
  return conflicts;
}
