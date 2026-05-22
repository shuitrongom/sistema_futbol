import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, isActive: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", email });
    }

    const isValid = await compare(password, user.passwordHash);

    return NextResponse.json({
      userFound: true,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordValid: isValid,
      hashPrefix: user.passwordHash.substring(0, 10),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
