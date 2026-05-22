"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
    email: z.email("Email inválido"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Error al registrar");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Error al registrar usuario");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1923] px-4">
      <Card className="w-full max-w-md bg-[#1a2332] border-[#2d3748]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            ⚽ Crear Cuenta
          </CardTitle>
          <CardDescription className="text-slate-400">
            Regístrate en el Sistema de Gestión de Fútbol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300">
                Nombre Completo
              </Label>
              <Input
                id="fullName"
                placeholder="Juan Pérez"
                className="bg-[#0f1923] border-[#2d3748] text-white placeholder:text-slate-500"
                {...register("fullName", {
                  required: "Nombre es requerido",
                })}
              />
              {errors.fullName && (
                <p className="text-red-400 text-xs">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-[#0f1923] border-[#2d3748] text-white placeholder:text-slate-500"
                {...register("email", { required: "Email es requerido" })}
              />
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">
                Teléfono (opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                className="bg-[#0f1923] border-[#2d3748] text-white placeholder:text-slate-500"
                {...register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-[#0f1923] border-[#2d3748] text-white placeholder:text-slate-500"
                {...register("password", {
                  required: "Contraseña es requerida",
                })}
              />
              {errors.password && (
                <p className="text-red-400 text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Confirmar Contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-[#0f1923] border-[#2d3748] text-white placeholder:text-slate-500"
                {...register("confirmPassword", {
                  required: "Confirmar contraseña es requerido",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1a472a] hover:bg-[#2d6a4f] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Crear Cuenta"}
            </Button>

            <p className="text-center text-sm text-slate-400">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[#d4af37] hover:underline">
                Iniciar Sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
