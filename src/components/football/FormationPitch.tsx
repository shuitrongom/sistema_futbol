"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type PlayerInfo = {
  id: string;
  fullName: string;
  jerseyNumber?: number;
  position?: string;
};

type PositionSlot = {
  key: string;
  label: string;
  x: number;
  y: number;
};

interface FormationPitchProps {
  formation: string;
  playerPositions: Record<string, string>;
  availablePlayers: PlayerInfo[];
  onAssignPlayer?: (slotKey: string, playerId: string) => void;
  onRemovePlayer?: (slotKey: string) => void;
  readOnly?: boolean;
  // Custom positions override (for free drag)
  customPositions?: Record<string, { x: number; y: number }>;
  onPositionChange?: (positions: Record<string, { x: number; y: number }>) => void;
}

function generateSlots(formation: string): PositionSlot[] {
  const parts = formation.split("-").map(Number);
  if (parts.some(isNaN)) return [];
  const slots: PositionSlot[] = [];
  slots.push({ key: "GK", label: "POR", x: 50, y: 92 });
  const yStart = 78;
  const total = parts.reduce((a, b) => a + b, 0) + 1;
  const yEnd = total <= 7 ? 22 : total <= 9 ? 18 : 15;
  const lineCount = parts.length;
  const lineLabels = ["DEF", "MED", "DEL"];
  if (parts.length === 4) lineLabels.splice(1, 0, "MCD");
  if (parts.length === 5) { lineLabels.splice(1, 0, "MCD"); lineLabels.splice(3, 0, "MCO"); }

  parts.forEach((count, lineIdx) => {
    const y = lineCount === 1 ? 50 : yStart - (lineIdx * (yStart - yEnd)) / (lineCount - 1);
    const label = lineLabels[lineIdx] || "JUG";
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? 50 : 12 + (i * 76) / (count - 1);
      slots.push({ key: `P${slots.length}`, label, x: Math.round(x), y: Math.round(y) });
    }
  });
  return slots;
}

export default function FormationPitch({
  formation,
  playerPositions,
  availablePlayers,
  onAssignPlayer,
  onRemovePlayer,
  readOnly = false,
  customPositions,
  onPositionChange,
}: FormationPitchProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const pitchRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false);

  const slots = generateSlots(formation);
  const totalPlayers = slots.length;
  const playerMap = new Map(availablePlayers.map((p) => [p.id, p]));
  const assignedPlayerIds = new Set(Object.values(playerPositions));

  // Initialize local positions from slots or custom positions
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const slot of slots) {
      if (customPositions?.[slot.key]) {
        positions[slot.key] = customPositions[slot.key];
      } else {
        positions[slot.key] = { x: slot.x, y: slot.y };
      }
    }
    setLocalPositions(positions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formation, JSON.stringify(customPositions)]);

  const getPositionForSlot = (slotKey: string, slot: PositionSlot) => {
    return localPositions[slotKey] || { x: slot.x, y: slot.y };
  };

  // Free drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent, slotKey: string) => {
    if (readOnly) return;
    if (!playerPositions[slotKey]) return;
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;
    setDraggingSlot(slotKey);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [readOnly, playerPositions]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingSlot || !pitchRef.current) return;
    e.preventDefault();
    didDragRef.current = true;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    setLocalPositions((prev) => ({ ...prev, [draggingSlot]: { x, y } }));
  }, [draggingSlot]);

  const handlePointerUp = useCallback(() => {
    if (draggingSlot && onPositionChange && didDragRef.current) {
      onPositionChange(localPositions);
    }
    setDraggingSlot(null);
  }, [draggingSlot, localPositions, onPositionChange]);

  const handleSlotClick = useCallback((slotKey: string) => {
    if (readOnly) return;
    // Ignore click if we just finished dragging
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (playerPositions[slotKey]) {
      if (onRemovePlayer) onRemovePlayer(slotKey);
    } else {
      setSelectedSlot(selectedSlot === slotKey ? null : slotKey);
    }
  }, [readOnly, playerPositions, onRemovePlayer, selectedSlot]);

  const handlePlayerSelect = useCallback((playerId: string) => {
    if (selectedSlot && onAssignPlayer) {
      onAssignPlayer(selectedSlot, playerId);
      setSelectedSlot(null);
    }
  }, [selectedSlot, onAssignPlayer]);

  const unassignedPlayers = availablePlayers.filter((p) => !assignedPlayerIds.has(p.id));
  const pitchAspect = totalPlayers <= 7 ? "aspect-[4/5]" : totalPlayers <= 9 ? "aspect-[3/4]" : "aspect-[68/100]";

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Pitch */}
      <div
        ref={pitchRef}
        className={`relative w-full lg:w-2/3 ${pitchAspect} rounded-2xl overflow-hidden border border-[#C1D82F]/20 select-none touch-none`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grass */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a5c2e] via-[#1e6b34] to-[#1a5c2e]" />
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 8%, rgba(255,255,255,0.12) 8%, rgba(255,255,255,0.12) 16%)",
        }} />

        {/* Markings */}
        <div className="absolute inset-0">
          <div className="absolute inset-3 border border-white/20 rounded-lg" />
          <div className="absolute top-1/2 left-3 right-3 h-px bg-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30" />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[44%] h-[16%] border-b border-l border-r border-white/20 rounded-b-sm" />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[18%] h-[6%] border-b border-l border-r border-white/20 rounded-b-sm" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[44%] h-[16%] border-t border-l border-r border-white/20 rounded-t-sm" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[18%] h-[6%] border-t border-l border-r border-white/20 rounded-t-sm" />
        </div>

        {/* Formation label */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider">
            {formation} · {totalPlayers} jugadores
          </span>
        </div>

        {/* Drag hint */}
        {!readOnly && Object.values(playerPositions).some(Boolean) && !draggingSlot && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
            <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white/50 text-[9px]">
              Arrastra los jugadores para moverlos
            </span>
          </div>
        )}

        {/* Players */}
        {slots.map((slot) => {
          const playerId = playerPositions[slot.key];
          const player = playerId ? playerMap.get(playerId) : null;
          const isSelected = selectedSlot === slot.key;
          const isDragging = draggingSlot === slot.key;
          const isGK = slot.key === "GK";
          const pos = getPositionForSlot(slot.key, slot);

          return (
            <div
              key={slot.key}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10",
                isDragging ? "z-30 cursor-grabbing" : player ? "cursor-grab" : "cursor-pointer",
                isDragging && "scale-110",
              )}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transition: isDragging ? "none" : "left 0.3s ease, top 0.3s ease, transform 0.15s ease",
              }}
              onPointerDown={(e) => handlePointerDown(e, slot.key)}
              onClick={() => !isDragging && handleSlotClick(slot.key)}
            >
              {/* Glow */}
              {(player || isSelected) && (
                <div className={cn(
                  "absolute -inset-1 rounded-full blur-md opacity-30",
                  isDragging ? "bg-[#C1D82F] opacity-50" : isSelected ? "bg-[#C1D82F]" : isGK ? "bg-[#d4af37]" : "bg-white"
                )} />
              )}

              {/* Player circle */}
              <div className={cn(
                "relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-xl transition-colors duration-200",
                player
                  ? isGK
                    ? "bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#0d1117] ring-2 ring-[#d4af37]/50"
                    : "bg-gradient-to-br from-white to-gray-100 text-[#0d1117] ring-2 ring-white/50"
                  : "bg-white/10 text-white/50 ring-2 ring-dashed ring-white/25",
                isSelected && "ring-[#C1D82F] bg-[#C1D82F]/20 text-[#C1D82F]",
                isDragging && "ring-[#C1D82F] ring-2 shadow-[0_0_20px_rgba(193,216,47,0.4)]",
                !readOnly && player && "hover:scale-105",
              )}>
                {player ? (player.jerseyNumber ?? "?") : slot.label}
              </div>

              {/* Name */}
              <span className={cn(
                "text-[9px] sm:text-[10px] mt-0.5 text-center max-w-[55px] truncate font-medium drop-shadow-lg",
                isDragging ? "text-[#C1D82F]" : "text-white/80"
              )}>
                {player ? player.fullName.split(" ")[0] : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Player list */}
      {!readOnly && (
        <div className="w-full lg:w-1/3 space-y-2">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">
            Jugadores disponibles
          </h3>
          {selectedSlot && (
            <p className="text-xs text-[#C1D82F] flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#C1D82F] animate-pulse" />
              Toca una posición vacía, luego un jugador
            </p>
          )}
          <div className="max-h-[350px] overflow-y-auto space-y-1 pr-1">
            {unassignedPlayers.length === 0 && (
              <p className="text-xs text-white/30 py-4 text-center">Todos asignados</p>
            )}
            {unassignedPlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => handlePlayerSelect(player.id)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-[#C1D82F]/5 hover:border-[#C1D82F]/20 transition-all text-sm cursor-pointer",
                  selectedSlot && "hover:bg-[#C1D82F]/10"
                )}
              >
                <span className="w-8 h-8 rounded-full bg-[#C1D82F]/10 flex items-center justify-center text-xs font-bold text-[#C1D82F]">
                  {player.jerseyNumber ?? "?"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-xs text-white/80">{player.fullName}</p>
                  <p className="text-[10px] text-white/30 capitalize">{player.position ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
