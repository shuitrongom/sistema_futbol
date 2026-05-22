"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard, Swords, Dumbbell, CalendarCheck, ClipboardCheck,
  ListTodo, TrendingUp, FileText, Lightbulb, BarChart3, Menu, Shield, LogOut, ChevronLeft, Camera, Loader2, User, X, PenTool,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/team", label: "Mi Equipo", icon: Shield },
  { href: "/coach/team/tactics", label: "Tácticas", icon: Swords },
  { href: "/coach/team/plays", label: "Jugadas", icon: PenTool },
  { href: "/coach/exercises", label: "Ejercicios", icon: Dumbbell },
  { href: "/coach/training", label: "Entrenamiento", icon: CalendarCheck },
  { href: "/coach/evaluations", label: "Evaluaciones", icon: ClipboardCheck },
  { href: "/coach/tasks", label: "Tareas", icon: ListTodo },
  { href: "/coach/development", label: "Desarrollo", icon: TrendingUp },
  { href: "/coach/reports", label: "Reportes", icon: FileText },
  { href: "/coach/recommendations", label: "Recomendaciones", icon: Lightbulb },
  { href: "/coach/analytics", label: "Análisis", icon: BarChart3 },
];

function SidebarContent({ pathname, coachName, coachPhoto, onPhotoChange, onPhotoDelete, uploading, onNavigate }: {
  pathname: string; coachName: string; coachPhoto: string | null;
  onPhotoChange: (file: File) => void; onPhotoDelete: () => void; uploading: boolean; onNavigate?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-full bg-[#1a1f36] text-white">
      <div className="p-5 border-b border-[#C1D82F]/10">
        <div className="flex items-center gap-3">
          {/* Photo with upload/delete overlay */}
          <div className="relative group shrink-0">
            <div className="size-11 rounded-xl overflow-hidden ring-2 ring-[#C1D82F]/20 group-hover:ring-[#C1D82F]/50 transition-all">
              {coachPhoto ? (
                <img src={coachPhoto} alt={coachName} className="size-full object-cover" />
              ) : (
                <div className="size-full bg-gradient-to-br from-[#2B8B41] to-[#C1D82F] flex items-center justify-center">
                  <User className="size-5 text-white" />
                </div>
              )}
            </div>
            {/* Overlay on hover */}
            <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer">
                {uploading ? <Loader2 className="size-3.5 text-white animate-spin" /> : <Camera className="size-3.5 text-white" />}
              </button>
              {coachPhoto && (
                <button onClick={() => onPhotoDelete()} className="p-1 rounded hover:bg-red-500/30 transition-colors cursor-pointer">
                  <X className="size-3.5 text-red-400" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPhotoChange(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-wide text-[#C1D82F]">ENTRENADOR</p>
            <p className="text-[11px] text-white/40 truncate">{coachName || "Coach"}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="text-[10px] text-white/20 font-semibold uppercase tracking-widest px-3 mb-2">Menú</p>
        {NAV_ITEMS.map((item) => {
          const isExact = pathname === item.href;
          const isChild = pathname.startsWith(item.href + "/");
          const hasBetterMatch = NAV_ITEMS.some(
            (other) => other.href !== item.href && other.href.startsWith(item.href + "/") && (pathname === other.href || pathname.startsWith(other.href + "/"))
          );
          const isActive = isExact || (isChild && !hasBetterMatch);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#C1D82F]/10 text-[#C1D82F] border border-[#C1D82F]/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
              }`}>
              <Icon className={`size-4 shrink-0 ${isActive ? "text-[#C1D82F]" : ""}`} />
              <span className="truncate">{item.label}</span>
              {isActive && <div className="ml-auto size-1.5 rounded-full bg-[#C1D82F] shadow-[0_0_6px_#C1D82F]" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all">
          <ChevronLeft className="size-4" /><span>Volver al inicio</span>
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-[#EB3525] hover:bg-[#EB3525]/5 transition-all w-full">
          <LogOut className="size-4" /><span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [coachName, setCoachName] = useState("");
  const [coachPhoto, setCoachPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, photoRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/profile/photo"),
        ]);
        const session = await sessionRes.json();
        if (session?.user?.name) setCoachName(session.user.name);
        if (photoRes.ok) {
          const data = await photoRes.json();
          if (data.photoUrl) setCoachPhoto(data.photoUrl);
        }
      } catch {}
    })();
  }, []);

  async function handlePhotoChange(file: File) {
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "profiles");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json();

      // 2. Update profile
      const updateRes = await fetch("/api/profile/photo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: url }),
      });
      if (updateRes.ok) setCoachPhoto(url);
    } catch {} finally { setUploading(false); }
  }

  async function handlePhotoDelete() {
    try {
      const res = await fetch("/api/profile/photo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: null }),
      });
      if (res.ok) setCoachPhoto(null);
    } catch {}
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1117]">
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-[#C1D82F]/5">
        <SidebarContent pathname={pathname} coachName={coachName} coachPhoto={coachPhoto} onPhotoChange={handlePhotoChange} onPhotoDelete={handlePhotoDelete} uploading={uploading} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-0 bg-transparent" showCloseButton={false}>
          <SidebarContent pathname={pathname} coachName={coachName} coachPhoto={coachPhoto} onPhotoChange={handlePhotoChange} onPhotoDelete={handlePhotoDelete} uploading={uploading} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="flex-1 overflow-y-auto bg-[#0d1117]">
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#1a1f36] border-b border-[#C1D82F]/10">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-[#C1D82F] p-2 rounded-xl transition-all"><Menu className="size-5" /></button>
          <span className="text-[#C1D82F] font-bold text-sm tracking-wide">ENTRENADOR</span>
        </div>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
