"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Save, Pencil, X, Shirt, Camera, Loader2, CheckCircle2, Upload } from "lucide-react";

type UniformData = {
  homeUniformPrimary: string | null;
  homeUniformSecondary: string | null;
  homeUniformDescription: string | null;
  homeUniformImageUrl: string | null;
  awayUniformPrimary: string | null;
  awayUniformSecondary: string | null;
  awayUniformDescription: string | null;
  awayUniformImageUrl: string | null;
};

function JerseySvg({ primary, secondary, size = "lg" }: { primary: string; secondary: string; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-full max-w-[180px]" : "w-full max-w-[100px]";
  return (
    <svg viewBox="0 0 120 140" className={`${cls} h-auto drop-shadow-2xl`}>
      <defs>
        <linearGradient id={`grad-${primary}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: primary, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: primary, stopOpacity: 0.85 }} />
        </linearGradient>
      </defs>
      <path
        d="M30 35 L15 50 L15 70 L25 65 L25 130 L95 130 L95 65 L105 70 L105 50 L90 35 L75 25 L70 30 C65 35 55 35 50 30 L45 25 Z"
        fill={`url(#grad-${primary})`}
        stroke={secondary}
        strokeWidth="2.5"
      />
      <path d="M45 25 L50 30 C55 35 65 35 70 30 L75 25" fill="none" stroke={secondary} strokeWidth="3" />
      <line x1="20" y1="55" x2="25" y2="52" stroke={secondary} strokeWidth="2.5" />
      <line x1="100" y1="55" x2="95" y2="52" stroke={secondary} strokeWidth="2.5" />
      <rect x="25" y="120" width="70" height="10" rx="2" fill={secondary} opacity="0.5" />
      <line x1="60" y1="40" x2="60" y2="115" stroke={secondary} strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function UniformsPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [uniforms, setUniforms] = useState<UniformData>({
    homeUniformPrimary: null, homeUniformSecondary: null, homeUniformDescription: null, homeUniformImageUrl: null,
    awayUniformPrimary: null, awayUniformSecondary: null, awayUniformDescription: null, awayUniformImageUrl: null,
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UniformData>(uniforms);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFieldRef = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const tid = session?.user?.teamId;
        if (!tid) { setLoading(false); return; }
        setTeamId(tid);
        const teamRes = await fetch(`/api/teams/${tid}`);
        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeamName(data.name);
          const u: UniformData = {
            homeUniformPrimary: data.homeUniformPrimary, homeUniformSecondary: data.homeUniformSecondary,
            homeUniformDescription: data.homeUniformDescription, homeUniformImageUrl: data.homeUniformImageUrl,
            awayUniformPrimary: data.awayUniformPrimary, awayUniformSecondary: data.awayUniformSecondary,
            awayUniformDescription: data.awayUniformDescription, awayUniformImageUrl: data.awayUniformImageUrl,
          };
          setUniforms(u);
          setForm(u);
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!teamId) return;
    setSaving(true); setError(null); setSuccess(false);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error ?? "Error al guardar"); return; }
      setUniforms(form); setEditing(false); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Error de conexión"); } finally { setSaving(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const field = activeFieldRef.current;
    if (!file || !field) return;
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "uniforms");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, [field]: url }));
      }
    } catch {} finally { setUploadingField(null); activeFieldRef.current = null; if (e.target) e.target.value = ""; }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="size-6 animate-spin text-[#C1D82F]" /></div>;
  if (!teamId) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-white/40">No tienes un equipo asignado.</p></div>;

  const display = editing ? form : uniforms;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-gradient-to-b from-[#C1D82F] to-[#2B8B41] rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Uniformes</h1>
            <p className="text-white/40 text-sm">{teamName}</p>
          </div>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="bg-[#C1D82F] text-[#0d1117] hover:bg-[#d4e84a] font-bold rounded-full px-6">
            <Pencil className="size-4 mr-2" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(false); setForm(uniforms); setError(null); }} className="rounded-full border-white/10 text-white/60">
              <X className="size-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#C1D82F] text-[#0d1117] hover:bg-[#d4e84a] font-bold rounded-full px-6">
              <Save className="size-4 mr-2" /> {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        )}
      </motion.div>

      {error && <div className="p-3 rounded-xl bg-[#EB3525]/10 border border-[#EB3525]/20 text-[#EB3525] text-sm">{error}</div>}
      {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-[#C1D82F]/10 border border-[#C1D82F]/20 text-[#C1D82F] text-sm flex items-center gap-2"><CheckCircle2 className="size-4" /> Uniformes actualizados correctamente</motion.div>}

      {/* Uniform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HOME */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="rounded-2xl border border-[#C1D82F]/10 bg-[#1a1f36]/60 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <Shirt className="size-5 text-[#C1D82F]" />
              <h2 className="font-bold text-white uppercase tracking-wide text-sm">Local</h2>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              {/* Jersey Preview */}
              <motion.div whileHover={{ scale: 1.05, rotateY: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                {display.homeUniformImageUrl ? (
                  <img src={display.homeUniformImageUrl} alt="Local" className="w-40 h-auto rounded-xl object-contain" />
                ) : (
                  <JerseySvg primary={display.homeUniformPrimary || "#ffffff"} secondary={display.homeUniformSecondary || "#000000"} />
                )}
              </motion.div>

              {/* Color swatches */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full ring-2 ring-white/10 shadow-lg" style={{ backgroundColor: display.homeUniformPrimary || "#ffffff" }} />
                  <span className="text-[10px] text-white/30 uppercase">Primario</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full ring-2 ring-white/10 shadow-lg" style={{ backgroundColor: display.homeUniformSecondary || "#000000" }} />
                  <span className="text-[10px] text-white/30 uppercase">Secundario</span>
                </div>
              </div>

              {display.homeUniformDescription && (
                <p className="text-xs text-white/40 text-center max-w-[200px]">{display.homeUniformDescription}</p>
              )}

              {/* Edit fields */}
              {editing && (
                <div className="w-full space-y-3 pt-4 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white/50 text-xs">Primario</Label>
                      <div className="flex gap-2 mt-1">
                        <input type="color" value={form.homeUniformPrimary || "#ffffff"} onChange={(e) => setForm({ ...form, homeUniformPrimary: e.target.value })} className="size-9 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                        <Input value={form.homeUniformPrimary || ""} onChange={(e) => setForm({ ...form, homeUniformPrimary: e.target.value })} className="flex-1 bg-white/5 border-white/10 text-white text-xs h-9" placeholder="#ffffff" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs">Secundario</Label>
                      <div className="flex gap-2 mt-1">
                        <input type="color" value={form.homeUniformSecondary || "#000000"} onChange={(e) => setForm({ ...form, homeUniformSecondary: e.target.value })} className="size-9 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                        <Input value={form.homeUniformSecondary || ""} onChange={(e) => setForm({ ...form, homeUniformSecondary: e.target.value })} className="flex-1 bg-white/5 border-white/10 text-white text-xs h-9" placeholder="#000000" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/50 text-xs">Descripción</Label>
                    <Input value={form.homeUniformDescription || ""} onChange={(e) => setForm({ ...form, homeUniformDescription: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs h-9 mt-1" placeholder="Ej: Camiseta verde con franjas doradas" />
                  </div>
                  <div>
                    <Label className="text-white/50 text-xs">Imagen del uniforme</Label>
                    <div className="flex gap-2 mt-1">
                      <Button variant="outline" size="sm" className="flex-1 border-white/10 text-white/50 hover:text-[#C1D82F] hover:border-[#C1D82F]/30"
                        disabled={uploadingField === "homeUniformImageUrl"}
                        onClick={() => { activeFieldRef.current = "homeUniformImageUrl"; fileInputRef.current?.click(); }}>
                        {uploadingField === "homeUniformImageUrl" ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Upload className="size-3 mr-1" />}
                        {form.homeUniformImageUrl ? "Cambiar" : "Subir imagen"}
                      </Button>
                      {form.homeUniformImageUrl && (
                        <Button variant="outline" size="sm" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                          onClick={() => setForm({ ...form, homeUniformImageUrl: null })}>
                          <X className="size-3 mr-1" /> Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* AWAY */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="rounded-2xl border border-white/[0.06] bg-[#1a1f36]/60 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <Shirt className="size-5 text-white/60" />
              <h2 className="font-bold text-white uppercase tracking-wide text-sm">Visitante</h2>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <motion.div whileHover={{ scale: 1.05, rotateY: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                {display.awayUniformImageUrl ? (
                  <img src={display.awayUniformImageUrl} alt="Visitante" className="w-40 h-auto rounded-xl object-contain" />
                ) : (
                  <JerseySvg primary={display.awayUniformPrimary || "#000000"} secondary={display.awayUniformSecondary || "#ffffff"} />
                )}
              </motion.div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full ring-2 ring-white/10 shadow-lg" style={{ backgroundColor: display.awayUniformPrimary || "#000000" }} />
                  <span className="text-[10px] text-white/30 uppercase">Primario</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full ring-2 ring-white/10 shadow-lg" style={{ backgroundColor: display.awayUniformSecondary || "#ffffff" }} />
                  <span className="text-[10px] text-white/30 uppercase">Secundario</span>
                </div>
              </div>

              {display.awayUniformDescription && (
                <p className="text-xs text-white/40 text-center max-w-[200px]">{display.awayUniformDescription}</p>
              )}

              {editing && (
                <div className="w-full space-y-3 pt-4 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white/50 text-xs">Primario</Label>
                      <div className="flex gap-2 mt-1">
                        <input type="color" value={form.awayUniformPrimary || "#000000"} onChange={(e) => setForm({ ...form, awayUniformPrimary: e.target.value })} className="size-9 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                        <Input value={form.awayUniformPrimary || ""} onChange={(e) => setForm({ ...form, awayUniformPrimary: e.target.value })} className="flex-1 bg-white/5 border-white/10 text-white text-xs h-9" placeholder="#000000" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs">Secundario</Label>
                      <div className="flex gap-2 mt-1">
                        <input type="color" value={form.awayUniformSecondary || "#ffffff"} onChange={(e) => setForm({ ...form, awayUniformSecondary: e.target.value })} className="size-9 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                        <Input value={form.awayUniformSecondary || ""} onChange={(e) => setForm({ ...form, awayUniformSecondary: e.target.value })} className="flex-1 bg-white/5 border-white/10 text-white text-xs h-9" placeholder="#ffffff" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/50 text-xs">Descripción</Label>
                    <Input value={form.awayUniformDescription || ""} onChange={(e) => setForm({ ...form, awayUniformDescription: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs h-9 mt-1" placeholder="Ej: Camiseta blanca con detalles rojos" />
                  </div>
                  <div>
                    <Label className="text-white/50 text-xs">Imagen del uniforme</Label>
                    <div className="flex gap-2 mt-1">
                      <Button variant="outline" size="sm" className="flex-1 border-white/10 text-white/50 hover:text-[#C1D82F] hover:border-[#C1D82F]/30"
                        disabled={uploadingField === "awayUniformImageUrl"}
                        onClick={() => { activeFieldRef.current = "awayUniformImageUrl"; fileInputRef.current?.click(); }}>
                        {uploadingField === "awayUniformImageUrl" ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Upload className="size-3 mr-1" />}
                        {form.awayUniformImageUrl ? "Cambiar" : "Subir imagen"}
                      </Button>
                      {form.awayUniformImageUrl && (
                        <Button variant="outline" size="sm" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                          onClick={() => setForm({ ...form, awayUniformImageUrl: null })}>
                          <X className="size-3 mr-1" /> Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}
