import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const updatePreferencesSchema = z.object({
  whatsappEnabled: z.boolean(),
  emailEnabled: z.boolean(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      return NextResponse.json({
        userId: user.id,
        whatsappEnabled: true,
        emailEnabled: true,
      });
    }

    return NextResponse.json({
      userId: preferences.userId,
      whatsappEnabled: preferences.whatsappEnabled,
      emailEnabled: preferences.emailEnabled,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        whatsappEnabled: parsed.data.whatsappEnabled,
        emailEnabled: parsed.data.emailEnabled,
      },
      create: {
        userId: user.id,
        whatsappEnabled: parsed.data.whatsappEnabled,
        emailEnabled: parsed.data.emailEnabled,
      },
    });

    return NextResponse.json({
      userId: preferences.userId,
      whatsappEnabled: preferences.whatsappEnabled,
      emailEnabled: preferences.emailEnabled,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
