"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
  className?: string;
  previewSize?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "size-16",
  md: "size-24",
  lg: "size-32",
};

export default function ImageUpload({
  value,
  onChange,
  folder = "general",
  label = "Subir imagen",
  className = "",
  previewSize = "md",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo excede 5MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Use JPG, PNG, WebP o GIF");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al subir");
        return;
      }

      const data = await res.json();
      onChange(data.url);
    } catch {
      setError("Error de conexión");
    } finally {
      setUploading(false);
      // Reset input
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div
          className={`${SIZES[previewSize]} rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50 shrink-0`}
        >
          {value ? (
            <img
              src={value}
              alt="Preview"
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground/40" />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id={`upload-${folder}`}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="size-3 mr-1.5 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="size-3 mr-1.5" />
                {label}
              </>
            )}
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700 h-auto p-0 text-xs"
            >
              <X className="size-3 mr-1" />
              Quitar
            </Button>
          )}

          <p className="text-[10px] text-muted-foreground">
            JPG, PNG, WebP o GIF. Máx 5MB
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
