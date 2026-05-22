"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Bell,
  MessageCircle,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ParentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notifications/preferences");
        if (res.ok) {
          const data = await res.json();
          setWhatsappEnabled(data.whatsappEnabled);
          setEmailEnabled(data.emailEnabled);
        }
      } catch {
        // ignore - use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappEnabled, emailEnabled }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Error al guardar preferencias");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#1a472a]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1a472a]">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tus preferencias de notificación</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="size-5 text-[#d4af37]" />
            Preferencias de Notificación
          </CardTitle>
          <CardDescription>
            Elige cómo quieres recibir notificaciones sobre partidos, tareas y reportes de tus hijos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* WhatsApp */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                <MessageCircle className="size-5 text-green-600" />
              </div>
              <div>
                <Label htmlFor="whatsapp" className="text-sm font-medium cursor-pointer">
                  Notificaciones por WhatsApp
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recordatorios de partidos, resultados y tareas asignadas
                </p>
              </div>
            </div>
            <Switch
              id="whatsapp"
              checked={whatsappEnabled}
              onCheckedChange={setWhatsappEnabled}
            />
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="size-5 text-blue-600" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium cursor-pointer">
                  Notificaciones por Email
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reportes de progreso, feedback del entrenador y resultados de partidos
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>

          {/* Status messages */}
          {saved && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="size-4" />
              Preferencias guardadas correctamente
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#1a472a] hover:bg-[#1a472a]/90"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Settings className="size-4 mr-2" /> Guardar Preferencias
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#1a472a]/5 border-[#1a472a]/20">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Bell className="size-5 text-[#1a472a] shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-[#1a472a]">Tipos de notificaciones</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Recordatorios de partidos (48h antes)</li>
                <li>• Resultados de partidos con estadísticas</li>
                <li>• Tareas asignadas a tus hijos</li>
                <li>• Feedback del entrenador</li>
                <li>• Reportes de progreso</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
