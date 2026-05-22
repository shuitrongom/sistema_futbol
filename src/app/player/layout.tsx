"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard, User, Star, ListTodo, TrendingUp,
  Menu, LogOut, ChevronLeft, Shirt,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/player/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/player/evaluations", label: "Evaluaciones", icon: Star },
  { href: "/player/tasks", label: "Tareas", icon: ListTodo },
  { href: "/player/development", label: "Plan de Desarrollo", icon: TrendingUp },
];

function SidebarContent({ pathname, playerName, onNavigate }: {
  pathname: string; playerName: string; onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-[#1a1f36] text-white">
      <div className="p-5 border-b border-[#C1D82F]/10">
        <Link href="/player/dashboard" className="flex items-center gap-3 group" onClick={onNavigate}>
          <div className="size-10 rounded-xl bg-gradient-to-br from-[#C1D82F] to-[#2B8B41] flex items-center justify-center shadow-lg shadow-[#C1D82F]/20">
            <Shirt className="size-5 text-[#0d1117]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-wide text-[#C1D82F]">JUGADOR</p>
            <p className="text-[11px] text-white/40 truncate">{playerName || "Jugador"}</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="text-[10px] text-white/20 font-semibold uppercase tracking-widest px-3 mb-2">Menú</p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/player/dashboard" && pathname.startsWith(item.href));
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

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [playerName, setPlayerName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/session");
        const s = await r.json();
        if (s?.user?.name) setPlayerName(s.user.name);
      } catch {}
    })();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1117]">
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-[#C1D82F]/5">
        <SidebarContent pathname={pathname} playerName={playerName} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-0 bg-transparent" showCloseButton={false}>
          <SidebarContent pathname={pathname} playerName={playerName} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="flex-1 overflow-y-auto bg-[#0d1117]">
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#1a1f36] border-b border-[#C1D82F]/10">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-[#C1D82F] p-2 rounded-xl transition-all">
            <Menu className="size-5" />
          </button>
          <span className="text-[#C1D82F] font-bold text-sm tracking-wide">JUGADOR</span>
        </div>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
