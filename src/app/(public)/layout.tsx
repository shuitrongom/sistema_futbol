"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Trophy,
  Shield,
  BarChart3,
  LogIn,
  Menu,
  X,
  Mail,
  MapPin,
  Phone,
  Globe,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/tournaments", label: "Torneos", icon: Trophy },
  { href: "/teams", label: "Equipos", icon: Shield },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      {/* Animated top gradient line */}
      <div className="h-[2px] w-full relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, #EB3525, #C1D82F, #2B8B41, #EB3525)",
            backgroundSize: "200% 100%",
            animation: "gradientSlide 3s linear infinite",
          }}
        />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#1a1f36] border-b border-[#C1D82F]/10 shadow-[0_2px_20px_rgba(193,216,47,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="size-10 rounded-xl bg-gradient-to-br from-[#C1D82F] to-[#2B8B41] flex items-center justify-center shadow-lg shadow-[#C1D82F]/20 group-hover:shadow-[#C1D82F]/40 transition-shadow">
                <Trophy className="size-5 text-[#1a1f36]" />
              </div>
              <div className="hidden sm:flex items-baseline gap-1">
                <span className="text-[#C1D82F] font-extrabold text-xl tracking-tight">LIGA</span>
                <span className="text-white font-bold text-xl tracking-tight">MX</span>
              </div>
              <div className="flex sm:hidden items-baseline gap-0.5">
                <span className="text-[#C1D82F] font-extrabold text-lg tracking-tight">LIGA</span>
                <span className="text-white font-bold text-lg tracking-tight">MX</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-4 py-2 group"
                  >
                    <span
                      className={`flex items-center gap-2 text-sm font-semibold tracking-wide uppercase transition-colors duration-300 ${
                        isActive ? "text-[#C1D82F]" : "text-white/70 group-hover:text-[#C1D82F]"
                      }`}
                    >
                      <Icon className="size-4" />
                      {link.label}
                    </span>
                    {/* Active lime dot below */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-[#C1D82F] shadow-[0_0_8px_#C1D82F]"
                      />
                    )}
                    {/* Hover underline animation */}
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#C1D82F]/50 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </Link>
                );
              })}
              <Link href="/login" className="ml-3">
                <Button
                  size="sm"
                  className="bg-[#C1D82F] hover:bg-[#d4e84a] text-[#1a1f36] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#C1D82F]/20 hover:shadow-[#C1D82F]/40 transition-all border-0 rounded-full px-6"
                >
                  <LogIn className="size-4 mr-1.5" />
                  Iniciar Sesión
                </Button>
              </Link>
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-white/80 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all"
            >
              <Menu className="size-5" />
            </button>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetContent side="right" className="w-80 p-0 border-0 bg-[#1a1f36]" showCloseButton={false}>
                <div className="flex flex-col h-full">
                  {/* Mobile header */}
                  <div className="flex items-center justify-between p-5 border-b border-[#C1D82F]/10">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-xl bg-gradient-to-br from-[#C1D82F] to-[#2B8B41] flex items-center justify-center">
                        <Trophy className="size-4 text-[#1a1f36]" />
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[#C1D82F] font-extrabold text-lg">LIGA</span>
                        <span className="text-white font-bold text-lg">MX</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/50 hover:text-[#C1D82F] hover:bg-white/5 rounded-xl"
                      onClick={() => setMobileOpen(false)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  {/* Mobile nav links */}
                  <nav className="flex-1 py-6 px-4 space-y-1">
                    <Link
                      href="/"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-all ${
                        pathname === "/"
                          ? "bg-[#C1D82F]/10 text-[#C1D82F] border border-[#C1D82F]/20"
                          : "text-white/60 hover:text-[#C1D82F] hover:bg-white/5"
                      }`}
                    >
                      <Trophy className="size-4" />
                      Inicio
                    </Link>
                    {NAV_LINKS.map((link) => {
                      const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-all ${
                            isActive
                              ? "bg-[#C1D82F]/10 text-[#C1D82F] border border-[#C1D82F]/20"
                              : "text-white/60 hover:text-[#C1D82F] hover:bg-white/5"
                          }`}
                        >
                          <Icon className="size-4" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Mobile login */}
                  <div className="p-5 border-t border-[#C1D82F]/10">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-[#C1D82F] hover:bg-[#d4e84a] text-[#1a1f36] font-bold uppercase tracking-wider border-0 h-12 text-sm rounded-full">
                        <LogIn className="size-4 mr-2" />
                        Iniciar Sesión
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="relative bg-[#0d1117] overflow-hidden">
        {/* Lime green accent divider */}
        <div className="h-1 bg-gradient-to-r from-[#EB3525] via-[#C1D82F] to-[#2B8B41]" />

        {/* Geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              rgba(193,216,47,0.3) 20px,
              rgba(193,216,47,0.3) 21px
            )`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-gradient-to-br from-[#C1D82F] to-[#2B8B41] flex items-center justify-center">
                  <Trophy className="size-5 text-[#1a1f36]" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[#C1D82F] font-extrabold text-xl tracking-tight">LIGA</span>
                  <span className="text-white font-bold text-xl tracking-tight">MX</span>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                La plataforma profesional para la gestión integral de ligas, torneos y competiciones de fútbol.
              </p>
              {/* Social media icons */}
              <div className="flex items-center gap-3 pt-2">
                {[
                  { icon: Globe, label: "Web" },
                  { icon: Globe, label: "Redes" },
                  { icon: Mail, label: "Email" },
                ].map(({ icon: SocialIcon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="size-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#C1D82F] hover:border-[#C1D82F]/30 hover:bg-[#C1D82F]/10 transition-all duration-300"
                  >
                    <SocialIcon className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Links */}
            <div>
              <h4 className="text-[#C1D82F] font-bold text-sm uppercase tracking-wider mb-4">
                Enlaces Rápidos
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/tournaments" className="text-white/40 hover:text-[#C1D82F] text-sm transition-colors duration-300 flex items-center gap-2">
                    <Trophy className="size-3.5" />
                    Torneos
                  </Link>
                </li>
                <li>
                  <Link href="/teams" className="text-white/40 hover:text-[#C1D82F] text-sm transition-colors duration-300 flex items-center gap-2">
                    <Shield className="size-3.5" />
                    Equipos
                  </Link>
                </li>
                <li>
                  <Link href="/stats" className="text-white/40 hover:text-[#C1D82F] text-sm transition-colors duration-300 flex items-center gap-2">
                    <BarChart3 className="size-3.5" />
                    Estadísticas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="text-[#C1D82F] font-bold text-sm uppercase tracking-wider mb-4">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-white/40 text-sm">
                  <Mail className="size-3.5 text-[#C1D82F]/60" />
                  contacto@ligafutbol.com
                </li>
                <li className="flex items-center gap-2 text-white/40 text-sm">
                  <Phone className="size-3.5 text-[#C1D82F]/60" />
                  +52 (55) 1234-5678
                </li>
                <li className="flex items-center gap-2 text-white/40 text-sm">
                  <MapPin className="size-3.5 text-[#C1D82F]/60" />
                  Ciudad de México, MX
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs">
              © {new Date().getFullYear()} LIGA MX FUTBOL. Todos los derechos reservados.
            </p>
            <p className="text-white/15 text-xs">
              Powered by <span className="text-[#C1D82F]/40">Liga Platform</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
