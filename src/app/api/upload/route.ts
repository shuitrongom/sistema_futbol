import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const BUCKET_NAME = "uploads";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Use JPG, PNG, WebP o GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 5MB" },
        { status: 400 }
      );
    }

    // Sanitize folder name
    const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, "");

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${safeFolder}/${uniqueName}`;

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, Buffer.from(bytes), {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[Upload] Supabase storage error:", error.message);
      return NextResponse.json(
        { error: "Error al subir archivo" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const url = urlData.publicUrl;

    return NextResponse.json({ url, filename: uniqueName }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
