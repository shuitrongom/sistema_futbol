"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Save,
  Plus,
  Trash2,
  Users,
  ArrowLeftRight,
} from "lucide-react";

// ─── Types ───

export type CriterionDef = {
  key: string;
  label: string;
  dimension: "technical" | "tactical" | "physical" | "mental";
};

export type PositionTemplate = {
  position: string;
  label: string;
  criteria: CriterionDef[];
};

export type SavedTemplate = {
  id: string;
  name: string;
  position: string;
  criteria: CriterionDef[];
};

export type PlayerScore = {
  playerId: string;
  playerName: string;
  position: string;
  scores: Record<string, number>;
};

// ─── Default criteria by position ───

const BASE_CRITERIA: CriterionDef[] = [
  { key: "ballControl", label: "Control de balón", dimension: "technical" },
  { key: "passing", label: "Pase", dimension: "technical" },
  { key: "dribbling", label: "Regate", dimension: "technical" },
  { key: "shooting", label: "Tiro", dimension: "technical" },
  { key: "heading", label: "Juego aéreo", dimension: "technical" },
  { key: "weakFoot", label: "Pie débil", dimension: "technical" },
  { key: "positioning", label: "Posicionamiento", dimension: "tactical" },
  { key: "gameVision", label: "Visión de juego", dimension: "tactical" },
  { key: "decisionMaking", label: "Toma de decisiones", dimension: "tactical" },
  { key: "systemUnderstanding", label: "Comprensión del sistema", dimension: "tactical" },
  { key: "speed", label: "Velocidad", dimension: "physical" },
  { key: "endurance", label: "Resistencia", dimension: "physical" },
  { key: "strength", label: "Fuerza", dimension: "physical" },
  { key: "agility", label: "Agilidad", dimension: "physical" },
  { key: "coordination", label: "Coordinación", dimension: "physical" },
  { key: "concentration", label: "Concentración", dimension: "mental" },
  { key: "attitude", label: "Actitud", dimension: "mental" },
  { key: "leadership", label: "Liderazgo", dimension: "mental" },
  { key: "teamwork", label: "Trabajo en equipo", dimension: "mental" },
  { key: "resilience", label: "Resiliencia", dimension: "mental" },
];

const POSITION_SPECIFIC: Record<string, CriterionDef[]> = {
  goalkeeper: [
    { key: "reflexes", label: "Reflejos", dimension: "technical" },
    { key: "distribution", label: "Distribución", dimension: "technical" },
    { key: "aerialCommand", label: "Dominio aéreo", dimension: "physical" },
    { key: "oneOnOne", label: "Mano a mano", dimension: "tactical" },
  ],
  defender: [
    { key: "tackling", label: "Entrada", dimension: "technical" },
    { key: "aerial", label: "Juego aéreo defensivo", dimension: "physical" },
    { key: "marking", label: "Marcaje", dimension: "tactical" },
    { key: "coverageRange", label: "Rango de cobertura", dimension: "tactical" },
  ],
  midfielder: [
    { key: "passingRange", label: "Rango de pase", dimension: "technical" },
    { key: "vision", label: "Visión", dimension: "tactical" },
    { key: "workRate", label: "Ritmo de trabajo", dimension: "physical" },
    { key: "ballRetention", label: "Retención de balón", dimension: "technical" },
  ],
  forward: [
    { key: "finishing", label: "Definición", dimension: "technical" },
    { key: "movement", label: "Movimiento", dimension: "tactical" },
    { key: "holdUpPlay", label: "Juego de espaldas", dimension: "technical" },
    { key: "composure", label: "Compostura", dimension: "mental" },
  ],
};

const DIMENSION_LABELS: Record<string, { label: string; color: string }> = {
  technical: { label: "Técnica", color: "bg-blue-100 text-blue-800" },
  tactical: { label: "Táctica", color: "bg-green-100 text-green-800" },
  physical: { label: "Física", color: "bg-orange-100 text-orange-800" },
  mental: { label: "Mental", color: "bg-purple-100 text-purple-800" },
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Portero",
  defender: "Defensa",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

function getCriteriaForPosition(position: string): CriterionDef[] {
  return [...BASE_CRITERIA, ...(POSITION_SPECIFIC[position] || [])];
}

// ─── Props ───

type EvaluationSheetProps = {
  position?: string;
  savedTemplates?: SavedTemplate[];
  onSaveTemplate?: (template: Omit<SavedTemplate, "id">) => void;
  comparisonPlayers?: PlayerScore[];
};

export default function EvaluationSheet({
  position = "midfielder",
  savedTemplates = [],
  onSaveTemplate,
  comparisonPlayers = [],
}: EvaluationSheetProps) {
  const [selectedPosition, setSelectedPosition] = useState(position);
  const [criteria, setCriteria] = useState<CriterionDef[]>(
    getCriteriaForPosition(position)
  );
  const [scores, setScores] = useState<Record<string, number>>({});
  const [templateName, setTemplateName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Custom criterion form
  const [newCriterionLabel, setNewCriterionLabel] = useState("");
  const [newCriterionDimension, setNewCriterionDimension] = useState<string>("technical");

  // When position changes, reset criteria to defaults for that position
  const handlePositionChange = (pos: string) => {
    setSelectedPosition(pos);
    setCriteria(getCriteriaForPosition(pos));
    setScores({});
  };

  // Load a saved template
  const handleLoadTemplate = (template: SavedTemplate) => {
    setSelectedPosition(template.position);
    setCriteria(template.criteria);
    setScores({});
  };

  // Add custom criterion
  const handleAddCriterion = () => {
    if (!newCriterionLabel.trim()) return;
    const key = `custom_${Date.now()}`;
    setCriteria((prev) => [
      ...prev,
      {
        key,
        label: newCriterionLabel.trim(),
        dimension: newCriterionDimension as CriterionDef["dimension"],
      },
    ]);
    setNewCriterionLabel("");
  };

  // Remove a criterion
  const handleRemoveCriterion = (key: string) => {
    setCriteria((prev) => prev.filter((c) => c.key !== key));
    setScores((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Update score
  const handleScoreChange = (key: string, value: number) => {
    if (value < 1 || value > 10) return;
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  // Save template
  const handleSaveTemplate = () => {
    if (!templateName.trim() || !onSaveTemplate) return;
    onSaveTemplate({
      name: templateName.trim(),
      position: selectedPosition,
      criteria,
    });
    setTemplateName("");
    setSaveDialogOpen(false);
  };

  // Group criteria by dimension
  const grouped = useMemo(() => {
    const groups: Record<string, CriterionDef[]> = {};
    for (const c of criteria) {
      if (!groups[c.dimension]) groups[c.dimension] = [];
      groups[c.dimension].push(c);
    }
    return groups;
  }, [criteria]);

  // Filter comparison players by same position
  const samePositionPlayers = comparisonPlayers.filter(
    (p) => p.position === selectedPosition
  );

  return (
    <div className="space-y-6">
      {/* Header: Position selector + Template actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-[#1a472a]" />
          <h3 className="font-semibold text-lg">Hoja de Evaluación</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Select value={selectedPosition} onValueChange={handlePositionChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(POSITION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {savedTemplates.length > 0 && (
            <Select onValueChange={(id) => {
              const t = savedTemplates.find((t) => t.id === id);
              if (t) handleLoadTemplate(t);
            }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Cargar plantilla" />
              </SelectTrigger>
              <SelectContent>
                {savedTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {onSaveTemplate && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="size-3.5" />
              Guardar Plantilla
            </Button>
          )}

          {samePositionPlayers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setShowComparison(!showComparison)}
            >
              <ArrowLeftRight className="size-3.5" />
              {showComparison ? "Ocultar" : "Comparar"}
            </Button>
          )}
        </div>
      </div>

      {/* Criteria by Dimension */}
      {Object.entries(grouped).map(([dimension, items]) => {
        const dimCfg = DIMENSION_LABELS[dimension] || { label: dimension, color: "bg-gray-100 text-gray-800" };
        return (
          <Card key={dimension} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`text-xs ${dimCfg.color}`}>{dimCfg.label}</Badge>
              <span className="text-xs text-muted-foreground">
                {items.length} criterios
              </span>
            </div>
            <div className="space-y-2">
              {items.map((c) => (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="text-sm w-44 truncate">{c.label}</span>
                  <div className="flex-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleScoreChange(c.key, v)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                          scores[c.key] === v
                            ? "bg-[#1a472a] text-white"
                            : scores[c.key] && scores[c.key] >= v
                            ? "bg-[#1a472a]/20 text-[#1a472a]"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <span className="font-mono text-sm w-6 text-right">
                    {scores[c.key] || "-"}
                  </span>
                  {c.key.startsWith("custom_") && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(c.key)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}

                  {/* Comparison columns */}
                  {showComparison && samePositionPlayers.map((p) => (
                    <span
                      key={p.playerId}
                      className="font-mono text-xs w-8 text-center text-muted-foreground"
                      title={p.playerName}
                    >
                      {p.scores[c.key] ?? "-"}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Comparison Legend */}
      {showComparison && samePositionPlayers.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Comparación con jugadores de misma posición</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {samePositionPlayers.map((p) => (
              <Badge key={p.playerId} variant="outline" className="text-xs">
                {p.playerName}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Add Custom Criterion */}
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
          <Plus className="size-4" />
          Agregar Criterio Personalizado
        </h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Nombre del criterio"
            value={newCriterionLabel}
            onChange={(e) => setNewCriterionLabel(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCriterion(); }}
          />
          <Select value={newCriterionDimension} onValueChange={setNewCriterionDimension}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DIMENSION_LABELS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleAddCriterion}
            disabled={!newCriterionLabel.trim()}
          >
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
      </Card>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Guardar Plantilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Nombre de la plantilla"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); }}
            />
            <p className="text-xs text-muted-foreground">
              Posición: {POSITION_LABELS[selectedPosition]} · {criteria.length} criterios
            </p>
            <Button
              className="w-full bg-[#1a472a] hover:bg-[#2d6a4f]"
              disabled={!templateName.trim()}
              onClick={handleSaveTemplate}
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
