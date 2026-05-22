"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, LogIn, Loader2, Eye, EyeOff } from "lucide-react";

type LoginFormData = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      if (result?.error) { setError("Credenciales inválidas"); return; }
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;
      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "coach") router.push("/coach/dashboard");
      else if (role === "parent") router.push("/parent/dashboard");
      else if (role === "player") router.push("/player/dashboard");
      else router.push("/tournaments");
      router.refresh();
    } catch { setError("Error al iniciar sesión"); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2B8B41] rounded-full opacity-[0.06] blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#C1D82F] rounded-full opacity-[0.04] blur-[120px]" />
      </div>
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(193,216,47,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(193,216,47,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #EB3525, #C1D82F, #2B8B41, #EB3525)", backgroundSize: "200% 100%", animation: "gradientSlide 3s linear infinite" }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-[#C1D82F] to-[#2B8B41] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C1D82F]/20">
            <Trophy className="size-7 text-[#1a1f36]" />
          </div>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-[#C1D82F] font-extrabold text-2xl tracking-tight">LIGA</span>
            <span className="text-white font-bold text-2xl tracking-tight">MX</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#C1D82F]/10 bg-[#1a1f36]/80 backdrop-blur-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white">Iniciar Sesión</h1>
            <p className="text-white/40 text-sm mt-1">Accede a tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-[#EB3525]/10 border border-[#EB3525]/20 text-[#EB3525] text-sm text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-sm">Email</Label>
              <Input id="email" type="email" placeholder="correo@ejemplo.com"
                className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus-visible:ring-[#C1D82F]/50 focus-visible:border-[#C1D82F]/30"
                {...register("email", { required: "Email es requerido" })} />
              {errors.email && <p className="text-[#EB3525] text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/60 text-sm">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus-visible:ring-[#C1D82F]/50 focus-visible:border-[#C1D82F]/30 pr-11"
                  {...register("password", { required: "Contraseña es requerida" })} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[#EB3525] text-xs">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading}
              className="w-full bg-[#C1D82F] hover:bg-[#d4e84a] text-[#1a1f36] font-bold h-11 rounded-full shadow-lg shadow-[#C1D82F]/20 hover:shadow-[#C1D82F]/40 transition-all border-0 text-sm uppercase tracking-wider">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <><LogIn className="size-4 mr-2" />Iniciar Sesión</>}
            </Button>
            <p className="text-center text-sm text-white/30">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-[#C1D82F] hover:text-[#d4e84a] font-medium transition-colors">Registrarse</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
