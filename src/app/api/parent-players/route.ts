import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const linkSchema = z.object({
  parentId: z.string().uuid("ID de padre inválido"),
  playerId: z.string().uuid("ID de jugador inválido"),
  relationship: z.enum(["father", "mother", "guardian"], {
    message: "Relación debe ser: father, mother o guardian",
  }),
});

// GET - List parent-player links (optionally filter by parentId)
export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const parentId = req.nextUrl.searchParams.get("parentId");

    const where = parentId ? { parentId } : {};
    const links = await prisma.parentPlayer.findMany({
      where,
      include: {
        parent: { select: { id: true, fullName: true, email: true, phone: true } },
        player: { select: { id: true, fullName: true, position: true, teamPlayers: { select: { team: { select: { name: true } } }, take: 1 } } },
      },
      orderBy: { parent: { fullName: "asc" } },
    });

    return NextResponse.json(links);
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST - Link a parent to a player
export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await req.json();
    const parsed = linkSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(". ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    // Verify parent exists and has parent role
    const parent = await prisma.user.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent || parent.role !== "parent") {
      return NextResponse.json({ error: "El usuario no existe o no tiene rol de padre" }, { status: 400 });
    }

    // Verify player exists
    const player = await prisma.player.findUnique({ where: { id: parsed.data.playerId } });
    if (!player) {
      return NextResponse.json({ error: "El jugador no existe" }, { status: 400 });
    }

    // Check if link already exists
    const existing = await prisma.parentPlayer.findFirst({
      where: { parentId: parsed.data.parentId, playerId: parsed.data.playerId },
    });
    if (existing) {
      return NextResponse.json({ error: "Este padre ya está vinculado a este jugador" }, { status: 409 });
    }

    const link = await prisma.parentPlayer.create({
      data: {
        parentId: parsed.data.parentId,
        playerId: parsed.data.playerId,
        relationship: parsed.data.relationship,
      },
      include: {
        parent: { select: { id: true, fullName: true, email: true } },
        player: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE - Unlink a parent from a player
export async function DELETE(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await req.json();
    const { parentId, playerId } = body;

    if (!parentId || !playerId) {
      return NextResponse.json({ error: "parentId y playerId son requeridos" }, { status: 400 });
    }

    const link = await prisma.parentPlayer.findFirst({
      where: { parentId, playerId },
    });

    if (!link) {
      return NextResponse.json({ error: "Vínculo no encontrado" }, { status: 404 });
    }

    await prisma.parentPlayer.delete({ where: { id: link.id } });

    return NextResponse.json({ message: "Vínculo eliminado" });
  } catch (error) {
    return handleAuthError(error);
  }
}
