import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get current user's photo
export async function GET() {
  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { photoUrl: true, fullName: true },
    });
    return NextResponse.json({ photoUrl: dbUser?.photoUrl ?? null, fullName: dbUser?.fullName ?? "" });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT - Update current user's photo
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { photoUrl } = await req.json();

    await prisma.user.update({
      where: { id: user.id },
      data: { photoUrl: photoUrl || null },
    });

    return NextResponse.json({ success: true, photoUrl });
  } catch (error) {
    console.error("[PROFILE PHOTO ERROR]", error);
    return handleAuthError(error);
  }
}
