"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  PenTool,
  Move,
  Pencil,
  Eraser,
  RotateCcw,
  ChevronDown,
  Search,
  Minus,
  Circle,
  Users,
  Target,
  Shield,
  Zap,
  ArrowRight,
  Flag,
  Repeat,
  Crosshair,
  Footprints,
} from "lucide-react";
import { EXTRA_PLAYS } from "@/data/extra-plays";

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldType = "7" | "9" | "11";
type PlayCategory =
  | "corner_attack"
  | "corner_defense"
  | "free_kick"
  | "build_up"
  | "counter_attack"
  | "pressing"
  | "set_piece"
  | "transition";

type ActiveTool = "move" | "draw";
type DrawColor = "#ffffff" | "#ef4444" | "#facc15" | "#3b82f6";
type LineWidth = 2 | 5;

interface Play {
  id: string;
  name: string;
  description: string;
  team: string;
  category: PlayCategory;
  fieldType: FieldType;
  players: { number: number; x: number; y: number }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_META: Record<PlayCategory, { label: string; icon: React.ReactNode }> = {
  corner_attack: { label: "Córner ofensivo", icon: <Target className="w-3.5 h-3.5" /> },
  corner_defense: { label: "Córner defensivo", icon: <Shield className="w-3.5 h-3.5" /> },
  free_kick: { label: "Tiro libre", icon: <Crosshair className="w-3.5 h-3.5" /> },
  build_up: { label: "Salida de balón", icon: <ArrowRight className="w-3.5 h-3.5" /> },
  counter_attack: { label: "Contraataque", icon: <Zap className="w-3.5 h-3.5" /> },
  pressing: { label: "Presión alta", icon: <Footprints className="w-3.5 h-3.5" /> },
  set_piece: { label: "Jugada ensayada", icon: <Flag className="w-3.5 h-3.5" /> },
  transition: { label: "Transición", icon: <Repeat className="w-3.5 h-3.5" /> },
};

const TEAMS = [
  "Real Madrid",
  "Barcelona",
  "Manchester City",
  "Liverpool",
  "Bayern Munich",
  "Arsenal",
  "Juventus",
  "Club América",
  "Selección Argentina",
  "Selección Brasil",
  "Selección Francia",
  "Selección Alemania",
  "Selección México",
  "Inter de Milán",
  "PSG",
  "Borussia Dortmund",
  "Ajax Academy",
  "Benfica Academy",
  "Ajax Academy F7",
  "Ajax Academy F9",
  "Barcelona Academy F7",
  "Barcelona Academy F9",
  "Bayern Munich Academy F9",
  "Benfica Academy F9",
  "Real Madrid Academy F7",
  "Club América Academy F7",
];

const DRAW_COLORS: { color: DrawColor; label: string }[] = [
  { color: "#ffffff", label: "Blanco" },
  { color: "#ef4444", label: "Rojo" },
  { color: "#facc15", label: "Amarillo" },
  { color: "#3b82f6", label: "Azul" },
];

// ─── Plays Data (40+ plays) ─────────────────────────────────────────────────

const PLAYS_DATA: Play[] = [
  // ── Real Madrid (6 plays) ──────────────────────────────────────────────────
  {
    id: "rm-1",
    name: "Salida desde portero — Thibaut",
    description:
      "Salida de balón desde el portero con los centrales abiertos y el pivote bajando entre ellos. Los laterales suben para dar amplitud mientras el mediocampo ofrece líneas de pase en diagonal.",
    team: "Real Madrid",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 75 },
      { number: 3, x: 70, y: 75 },
      { number: 5, x: 50, y: 70 },
      { number: 2, x: 88, y: 60 },
      { number: 12, x: 12, y: 60 },
      { number: 8, x: 35, y: 55 },
      { number: 10, x: 65, y: 55 },
      { number: 7, x: 15, y: 35 },
      { number: 11, x: 85, y: 35 },
      { number: 9, x: 50, y: 25 },
    ],
  },
  {
    id: "rm-2",
    name: "Contraataque por banda — Vinícius",
    description:
      "Transición rápida tras recuperación en campo propio. El balón viaja en largo al extremo izquierdo que arranca en velocidad por la banda. El delantero centro y el extremo derecho atacan el área.",
    team: "Real Madrid",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 35, y: 72 },
      { number: 3, x: 65, y: 72 },
      { number: 2, x: 82, y: 65 },
      { number: 12, x: 18, y: 65 },
      { number: 5, x: 50, y: 60 },
      { number: 8, x: 40, y: 50 },
      { number: 10, x: 60, y: 45 },
      { number: 7, x: 10, y: 30 },
      { number: 11, x: 80, y: 35 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "rm-3",
    name: "Cambio de orientación diagonal — Kroos",
    description:
      "Circulación de balón por el lado izquierdo para atraer la presión rival, seguido de un pase diagonal largo al lateral derecho desmarcado. El extremo derecho fija al lateral rival para crear espacio.",
    team: "Real Madrid",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 25, y: 72 },
      { number: 3, x: 65, y: 72 },
      { number: 2, x: 85, y: 55 },
      { number: 12, x: 15, y: 55 },
      { number: 8, x: 35, y: 58 },
      { number: 5, x: 50, y: 62 },
      { number: 10, x: 55, y: 45 },
      { number: 7, x: 20, y: 35 },
      { number: 11, x: 82, y: 30 },
      { number: 9, x: 50, y: 22 },
    ],
  },
  {
    id: "rm-4",
    name: "Presión tras pérdida — 6 segundos",
    description:
      "Presión inmediata tras perder el balón en campo rival. Los tres delanteros cierran líneas de pase mientras los mediocampistas suben agresivamente. Se busca recuperar en menos de 6 segundos.",
    team: "Real Madrid",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 30, y: 60 },
      { number: 3, x: 70, y: 60 },
      { number: 2, x: 85, y: 50 },
      { number: 12, x: 15, y: 50 },
      { number: 5, x: 50, y: 48 },
      { number: 8, x: 35, y: 38 },
      { number: 10, x: 65, y: 38 },
      { number: 7, x: 20, y: 22 },
      { number: 11, x: 80, y: 22 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "rm-5",
    name: "Tiro libre lateral — Curva al segundo palo",
    description:
      "Tiro libre desde la banda derecha a 25 metros. Dos jugadores se posicionan sobre el balón para confundir. El cobrador envía un centro con efecto al segundo palo donde atacan dos rematadores.",
    team: "Real Madrid",
    category: "free_kick",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 40, y: 55 },
      { number: 3, x: 60, y: 55 },
      { number: 5, x: 50, y: 50 },
      { number: 8, x: 70, y: 35 },
      { number: 10, x: 72, y: 33 },
      { number: 9, x: 45, y: 22 },
      { number: 7, x: 30, y: 20 },
      { number: 11, x: 55, y: 18 },
      { number: 2, x: 80, y: 45 },
      { number: 12, x: 20, y: 45 },
    ],
  },
  {
    id: "rm-6",
    name: "Contraataque rápido Fútbol 7",
    description:
      "Transición veloz en fútbol 7 tras recuperación del portero. El balón sale rápido al mediocampista central que filtra al delantero en profundidad por el centro o la banda.",
    team: "Real Madrid",
    category: "counter_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 75, y: 70 },
      { number: 3, x: 25, y: 70 },
      { number: 4, x: 50, y: 65 },
      { number: 5, x: 30, y: 45 },
      { number: 6, x: 70, y: 45 },
      { number: 7, x: 50, y: 25 },
    ],
  },

  // ── Barcelona (6 plays) ───────────────────────────────────────────────────
  {
    id: "bar-1",
    name: "Triángulos tiki-taka — Posesión",
    description:
      "Circulación de balón mediante triángulos cortos en el mediocampo. Los jugadores se posicionan formando rombos para siempre ofrecer tres líneas de pase al portador del balón.",
    team: "Barcelona",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 28, y: 72 },
      { number: 3, x: 72, y: 72 },
      { number: 2, x: 85, y: 58 },
      { number: 12, x: 15, y: 58 },
      { number: 5, x: 50, y: 65 },
      { number: 8, x: 35, y: 50 },
      { number: 10, x: 65, y: 50 },
      { number: 7, x: 20, y: 32 },
      { number: 11, x: 80, y: 32 },
      { number: 9, x: 50, y: 28 },
    ],
  },
  {
    id: "bar-2",
    name: "Falso 9 — Atracción y desmarque",
    description:
      "El delantero centro baja al mediocampo para atraer a los centrales rivales, creando espacio para que los extremos corten hacia adentro. El mediocampista ofensivo ataca el espacio dejado por el falso 9.",
    team: "Barcelona",
    category: "set_piece",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 25, y: 72 },
      { number: 3, x: 75, y: 72 },
      { number: 2, x: 88, y: 55 },
      { number: 12, x: 12, y: 55 },
      { number: 5, x: 50, y: 62 },
      { number: 8, x: 38, y: 48 },
      { number: 10, x: 62, y: 42 },
      { number: 9, x: 50, y: 40 },
      { number: 7, x: 25, y: 25 },
      { number: 11, x: 75, y: 25 },
    ],
  },
  {
    id: "bar-3",
    name: "Superioridad posicional — Sobrecarga izquierda",
    description:
      "Concentración de jugadores en el lado izquierdo para crear superioridad numérica. El lateral, interior y extremo forman un triángulo mientras el pivote da cobertura. Cambio rápido al lado débil si se cierra.",
    team: "Barcelona",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 22, y: 70 },
      { number: 3, x: 68, y: 72 },
      { number: 12, x: 10, y: 50 },
      { number: 2, x: 82, y: 60 },
      { number: 5, x: 45, y: 60 },
      { number: 8, x: 25, y: 45 },
      { number: 10, x: 55, y: 48 },
      { number: 7, x: 15, y: 28 },
      { number: 11, x: 78, y: 35 },
      { number: 9, x: 45, y: 22 },
    ],
  },
  {
    id: "bar-4",
    name: "Presión alta coordinada — Trampa del fuera de juego",
    description:
      "Línea defensiva muy adelantada con presión coordinada al portador. Los centrales suben hasta el medio campo mientras los mediocampistas presionan las líneas de pase cortas del rival.",
    team: "Barcelona",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 85 },
      { number: 4, x: 30, y: 55 },
      { number: 3, x: 70, y: 55 },
      { number: 2, x: 88, y: 48 },
      { number: 12, x: 12, y: 48 },
      { number: 5, x: 50, y: 45 },
      { number: 8, x: 35, y: 35 },
      { number: 10, x: 65, y: 35 },
      { number: 7, x: 20, y: 20 },
      { number: 11, x: 80, y: 20 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "bar-5",
    name: "Tiki-taka Fútbol 9 — Rombo central",
    description:
      "Adaptación del juego posicional al fútbol 9 con un rombo en el mediocampo. Los jugadores rotan posiciones constantemente manteniendo la estructura geométrica para conservar la posesión.",
    team: "Barcelona",
    category: "build_up",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 75, y: 72 },
      { number: 3, x: 25, y: 72 },
      { number: 4, x: 50, y: 68 },
      { number: 5, x: 50, y: 50 },
      { number: 6, x: 30, y: 42 },
      { number: 7, x: 70, y: 42 },
      { number: 8, x: 50, y: 32 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "bar-6",
    name: "Córner corto — Combinación y centro",
    description:
      "Córner corto con pase al jugador cercano que devuelve de primera. El cobrador recibe y envía un centro raso al primer palo donde un compañero peina hacia el segundo palo.",
    team: "Barcelona",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 40, y: 60 },
      { number: 3, x: 60, y: 60 },
      { number: 8, x: 88, y: 18 },
      { number: 10, x: 80, y: 22 },
      { number: 9, x: 45, y: 15 },
      { number: 7, x: 35, y: 18 },
      { number: 11, x: 55, y: 12 },
      { number: 5, x: 50, y: 22 },
      { number: 2, x: 70, y: 30 },
      { number: 12, x: 25, y: 55 },
    ],
  },

  // ── Manchester City (6 plays) ─────────────────────────────────────────────
  {
    id: "mc-1",
    name: "Laterales invertidos — Construcción interior",
    description:
      "Los laterales se meten al centro del campo formando un doble pivote con el mediocentro. Esto libera las bandas para los extremos y crea superioridad numérica en el centro del campo.",
    team: "Manchester City",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 72 },
      { number: 3, x: 70, y: 72 },
      { number: 2, x: 60, y: 58 },
      { number: 12, x: 40, y: 58 },
      { number: 5, x: 50, y: 55 },
      { number: 8, x: 35, y: 42 },
      { number: 10, x: 65, y: 42 },
      { number: 7, x: 12, y: 30 },
      { number: 11, x: 88, y: 30 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "mc-2",
    name: "Pases al espacio — Pocket passes",
    description:
      "Pases filtrados entre líneas buscando al mediapunta o interior que se desmarca en los espacios entre la defensa y el mediocampo rival. El receptor gira y enfrenta la defensa con ventaja.",
    team: "Manchester City",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 28, y: 70 },
      { number: 3, x: 72, y: 70 },
      { number: 2, x: 85, y: 55 },
      { number: 12, x: 15, y: 55 },
      { number: 5, x: 50, y: 60 },
      { number: 8, x: 40, y: 45 },
      { number: 10, x: 55, y: 38 },
      { number: 7, x: 18, y: 28 },
      { number: 11, x: 82, y: 28 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "mc-3",
    name: "Sobrecarga por banda — Wide overload",
    description:
      "Acumulación de jugadores en una banda con el extremo abierto, el lateral superpuesto y el interior apoyando. Se busca el 3 contra 2 en la banda para generar centros o cortes hacia adentro.",
    team: "Manchester City",
    category: "set_piece",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 72 },
      { number: 3, x: 70, y: 72 },
      { number: 12, x: 10, y: 45 },
      { number: 2, x: 80, y: 58 },
      { number: 5, x: 50, y: 58 },
      { number: 8, x: 22, y: 38 },
      { number: 10, x: 55, y: 42 },
      { number: 7, x: 8, y: 25 },
      { number: 11, x: 75, y: 30 },
      { number: 9, x: 40, y: 20 },
    ],
  },
  {
    id: "mc-4",
    name: "Transición rápida — Recuperación y verticalidad",
    description:
      "Tras recuperar el balón en zona media, pase vertical inmediato al delantero que pivotea para el extremo en carrera. Se busca llegar al área en máximo tres pases tras la recuperación.",
    team: "Manchester City",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 32, y: 68 },
      { number: 3, x: 68, y: 68 },
      { number: 2, x: 82, y: 55 },
      { number: 12, x: 18, y: 55 },
      { number: 5, x: 50, y: 55 },
      { number: 8, x: 38, y: 42 },
      { number: 10, x: 62, y: 40 },
      { number: 7, x: 15, y: 25 },
      { number: 11, x: 85, y: 25 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "mc-5",
    name: "Construcción Fútbol 9 — Laterales interiores",
    description:
      "Versión adaptada al fútbol 9 del sistema de laterales invertidos. Los laterales se meten al centro creando un triángulo con el pivote mientras los extremos dan amplitud máxima.",
    team: "Manchester City",
    category: "build_up",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 65, y: 68 },
      { number: 3, x: 35, y: 68 },
      { number: 4, x: 50, y: 60 },
      { number: 5, x: 40, y: 48 },
      { number: 6, x: 60, y: 48 },
      { number: 7, x: 15, y: 30 },
      { number: 8, x: 85, y: 30 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "mc-6",
    name: "Córner al primer palo — Ataque directo",
    description:
      "Córner enviado con fuerza al primer palo donde un jugador alto ataca el balón. Dos compañeros se posicionan en el segundo palo y el punto penal para rematar el rechace o desvío.",
    team: "Manchester City",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 45, y: 55 },
      { number: 3, x: 55, y: 55 },
      { number: 8, x: 92, y: 15 },
      { number: 5, x: 50, y: 18 },
      { number: 9, x: 40, y: 14 },
      { number: 7, x: 55, y: 12 },
      { number: 11, x: 35, y: 20 },
      { number: 10, x: 65, y: 22 },
      { number: 2, x: 75, y: 35 },
      { number: 12, x: 30, y: 50 },
    ],
  },

  // ── Liverpool (5 plays) ───────────────────────────────────────────────────
  {
    id: "liv-1",
    name: "Gegenpressing — Recuperación inmediata",
    description:
      "Presión colectiva inmediata tras perder la posesión. Los jugadores más cercanos al balón cierran espacios agresivamente mientras el resto compacta las líneas para reducir el campo disponible.",
    team: "Liverpool",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 30, y: 58 },
      { number: 3, x: 70, y: 58 },
      { number: 2, x: 85, y: 48 },
      { number: 12, x: 15, y: 48 },
      { number: 5, x: 50, y: 45 },
      { number: 8, x: 35, y: 35 },
      { number: 10, x: 65, y: 35 },
      { number: 7, x: 20, y: 20 },
      { number: 11, x: 80, y: 20 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "liv-2",
    name: "Contraataque 3v2 — Velocidad letal",
    description:
      "Transición rápida con tres atacantes contra dos defensores. El delantero centro conduce por el centro mientras los extremos abren las bandas. El pase final llega al jugador con más espacio.",
    team: "Liverpool",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 35, y: 70 },
      { number: 3, x: 65, y: 70 },
      { number: 2, x: 80, y: 62 },
      { number: 12, x: 20, y: 62 },
      { number: 5, x: 50, y: 58 },
      { number: 8, x: 40, y: 48 },
      { number: 10, x: 60, y: 45 },
      { number: 7, x: 15, y: 25 },
      { number: 9, x: 50, y: 22 },
      { number: 11, x: 85, y: 25 },
    ],
  },
  {
    id: "liv-3",
    name: "Centros de laterales — Overlapping runs",
    description:
      "Los laterales suben por fuera de los extremos que cortan hacia adentro. El lateral recibe en la banda y envía un centro al área donde el delantero y el extremo contrario atacan el remate.",
    team: "Liverpool",
    category: "set_piece",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 70 },
      { number: 3, x: 70, y: 70 },
      { number: 12, x: 8, y: 35 },
      { number: 2, x: 92, y: 35 },
      { number: 5, x: 50, y: 58 },
      { number: 8, x: 38, y: 45 },
      { number: 10, x: 62, y: 45 },
      { number: 7, x: 25, y: 28 },
      { number: 11, x: 75, y: 28 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "liv-4",
    name: "Transición defensa-ataque — Pase largo",
    description:
      "Tras recuperar en zona defensiva, pase largo directo al extremo que se desmarca a la espalda de la defensa rival. El mediocampista acompaña la jugada por el centro para el segundo balón.",
    team: "Liverpool",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 32, y: 72 },
      { number: 3, x: 68, y: 72 },
      { number: 2, x: 82, y: 60 },
      { number: 12, x: 18, y: 60 },
      { number: 5, x: 50, y: 62 },
      { number: 8, x: 42, y: 50 },
      { number: 10, x: 58, y: 48 },
      { number: 7, x: 12, y: 22 },
      { number: 11, x: 88, y: 28 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "liv-5",
    name: "Gegenpressing Fútbol 7 — Presión total",
    description:
      "Adaptación del gegenpressing al fútbol 7. Tras perder el balón, los tres jugadores más cercanos presionan inmediatamente mientras los demás cierran líneas de pase hacia atrás.",
    team: "Liverpool",
    category: "pressing",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 72, y: 62 },
      { number: 3, x: 28, y: 62 },
      { number: 4, x: 50, y: 55 },
      { number: 5, x: 30, y: 35 },
      { number: 6, x: 70, y: 35 },
      { number: 7, x: 50, y: 20 },
    ],
  },

  // ── Bayern Munich (5 plays) ──────────────────────────────────────────────
  {
    id: "bay-1",
    name: "Presión alta — Trigger en pase al lateral",
    description:
      "Cuando el rival pasa al lateral, se activa la presión coordinada. El extremo cierra la línea de banda, el interior presiona por dentro y el delantero corta el pase hacia atrás al central.",
    team: "Bayern Munich",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 28, y: 55 },
      { number: 3, x: 72, y: 55 },
      { number: 2, x: 88, y: 45 },
      { number: 12, x: 12, y: 45 },
      { number: 5, x: 50, y: 48 },
      { number: 8, x: 35, y: 35 },
      { number: 10, x: 65, y: 35 },
      { number: 7, x: 15, y: 18 },
      { number: 11, x: 85, y: 18 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "bay-2",
    name: "Juego por banda — Overlap y centro",
    description:
      "El extremo recibe y fija al lateral rival. El lateral propio superpone por fuera a máxima velocidad. El centro va al área donde el delantero y el extremo contrario atacan el primer y segundo palo.",
    team: "Bayern Munich",
    category: "set_piece",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 70 },
      { number: 3, x: 70, y: 70 },
      { number: 12, x: 8, y: 38 },
      { number: 2, x: 85, y: 55 },
      { number: 5, x: 50, y: 58 },
      { number: 8, x: 35, y: 45 },
      { number: 10, x: 60, y: 42 },
      { number: 7, x: 18, y: 25 },
      { number: 11, x: 82, y: 30 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "bay-3",
    name: "Transición veloz — De defensa a gol",
    description:
      "Recuperación en campo propio y transición vertical inmediata. El pivote lanza en largo al delantero que baja a recibir, pivotea y habilita al extremo que llega a máxima velocidad.",
    team: "Bayern Munich",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 32, y: 70 },
      { number: 3, x: 68, y: 70 },
      { number: 2, x: 82, y: 58 },
      { number: 12, x: 18, y: 58 },
      { number: 5, x: 50, y: 60 },
      { number: 8, x: 40, y: 48 },
      { number: 10, x: 60, y: 42 },
      { number: 7, x: 15, y: 22 },
      { number: 11, x: 85, y: 22 },
      { number: 9, x: 50, y: 30 },
    ],
  },
  {
    id: "bay-4",
    name: "Córner defensivo — Zonal mixto",
    description:
      "Defensa de córner con sistema mixto: tres jugadores en zona cubriendo primer palo, centro y segundo palo, más dos marcajes individuales a los rematadores rivales más peligrosos.",
    team: "Bayern Munich",
    category: "corner_defense",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 10 },
      { number: 4, x: 38, y: 15 },
      { number: 3, x: 62, y: 15 },
      { number: 5, x: 50, y: 14 },
      { number: 2, x: 72, y: 18 },
      { number: 12, x: 28, y: 18 },
      { number: 8, x: 45, y: 22 },
      { number: 10, x: 55, y: 22 },
      { number: 7, x: 35, y: 28 },
      { number: 9, x: 65, y: 28 },
      { number: 11, x: 50, y: 45 },
    ],
  },
  {
    id: "bay-5",
    name: "Presión alta Fútbol 9 — Asfixia",
    description:
      "Presión coordinada en fútbol 9 con línea alta. Los tres delanteros presionan al portero y centrales rivales mientras los mediocampistas cierran las opciones de pase por las bandas.",
    team: "Bayern Munich",
    category: "pressing",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 70, y: 62 },
      { number: 3, x: 30, y: 62 },
      { number: 4, x: 50, y: 55 },
      { number: 5, x: 35, y: 38 },
      { number: 6, x: 65, y: 38 },
      { number: 7, x: 20, y: 20 },
      { number: 8, x: 80, y: 20 },
      { number: 9, x: 50, y: 15 },
    ],
  },

  // ── Arsenal (5 plays) ────────────────────────────────────────────────────
  {
    id: "ars-1",
    name: "Córner primer palo — Flick on",
    description:
      "Córner al primer palo donde un jugador alto peina el balón hacia el segundo palo. Dos compañeros atacan el segundo palo y el punto penal para rematar el desvío con ventaja.",
    team: "Arsenal",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 42, y: 55 },
      { number: 3, x: 58, y: 55 },
      { number: 8, x: 92, y: 15 },
      { number: 5, x: 42, y: 16 },
      { number: 9, x: 50, y: 12 },
      { number: 7, x: 58, y: 14 },
      { number: 11, x: 35, y: 20 },
      { number: 10, x: 65, y: 20 },
      { number: 2, x: 75, y: 30 },
      { number: 12, x: 25, y: 50 },
    ],
  },
  {
    id: "ars-2",
    name: "Córner segundo palo — Back post run",
    description:
      "Córner con vuelo largo al segundo palo. Un jugador arranca desde fuera del área hacia el segundo palo con carrera diagonal. Los demás crean bloqueos legales para liberar al rematador.",
    team: "Arsenal",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 45, y: 55 },
      { number: 3, x: 55, y: 55 },
      { number: 8, x: 92, y: 15 },
      { number: 5, x: 48, y: 18 },
      { number: 9, x: 40, y: 15 },
      { number: 7, x: 55, y: 22 },
      { number: 11, x: 30, y: 12 },
      { number: 10, x: 62, y: 28 },
      { number: 2, x: 72, y: 32 },
      { number: 12, x: 28, y: 50 },
    ],
  },
  {
    id: "ars-3",
    name: "Córner corto — Rutina ensayada",
    description:
      "Córner corto con pase al compañero cercano que devuelve de primera. El cobrador recibe perfilado y envía un centro raso al borde del área chica donde tres jugadores atacan en oleada.",
    team: "Arsenal",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 42, y: 55 },
      { number: 3, x: 58, y: 55 },
      { number: 8, x: 88, y: 18 },
      { number: 10, x: 80, y: 22 },
      { number: 5, x: 50, y: 20 },
      { number: 9, x: 42, y: 15 },
      { number: 7, x: 55, y: 14 },
      { number: 11, x: 35, y: 18 },
      { number: 2, x: 70, y: 30 },
      { number: 12, x: 25, y: 50 },
    ],
  },
  {
    id: "ars-4",
    name: "Tiro libre directo — Barrera y disparo",
    description:
      "Tiro libre frontal a 22 metros. Dos jugadores sobre el balón: uno amaga y el otro dispara buscando el palo del portero. Un tercer jugador se posiciona para el rechace.",
    team: "Arsenal",
    category: "free_kick",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 38, y: 55 },
      { number: 3, x: 62, y: 55 },
      { number: 8, x: 48, y: 32 },
      { number: 10, x: 52, y: 32 },
      { number: 5, x: 50, y: 25 },
      { number: 9, x: 40, y: 18 },
      { number: 7, x: 60, y: 18 },
      { number: 11, x: 30, y: 22 },
      { number: 2, x: 75, y: 40 },
      { number: 12, x: 25, y: 45 },
    ],
  },
  {
    id: "ars-5",
    name: "Jugada ensayada Fútbol 7 — Córner corto",
    description:
      "Córner corto adaptado al fútbol 7. Pase corto al compañero que devuelve, seguido de centro al área chica donde dos jugadores atacan el primer y segundo palo.",
    team: "Arsenal",
    category: "corner_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 60, y: 60 },
      { number: 3, x: 40, y: 60 },
      { number: 4, x: 88, y: 22 },
      { number: 5, x: 78, y: 28 },
      { number: 6, x: 50, y: 20 },
      { number: 7, x: 35, y: 18 },
    ],
  },

  // ── Juventus (5 plays) ───────────────────────────────────────────────────
  {
    id: "juv-1",
    name: "Bloque bajo — Contraataque letal",
    description:
      "Defensa compacta con dos líneas de cuatro muy juntas. Tras recuperar, pase largo al delantero que retiene mientras los extremos arrancan en velocidad para crear superioridad en transición.",
    team: "Juventus",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 28, y: 78 },
      { number: 3, x: 72, y: 78 },
      { number: 2, x: 85, y: 75 },
      { number: 12, x: 15, y: 75 },
      { number: 5, x: 50, y: 68 },
      { number: 8, x: 30, y: 65 },
      { number: 10, x: 70, y: 65 },
      { number: 7, x: 20, y: 45 },
      { number: 11, x: 80, y: 45 },
      { number: 9, x: 50, y: 35 },
    ],
  },
  {
    id: "juv-2",
    name: "Córner defensivo — Marcaje individual",
    description:
      "Defensa de córner con marcaje individual estricto. Cada defensor tiene asignado un atacante rival. El portero cubre el primer palo y un jugador queda libre para el rechace.",
    team: "Juventus",
    category: "corner_defense",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 10 },
      { number: 4, x: 40, y: 15 },
      { number: 3, x: 60, y: 15 },
      { number: 5, x: 50, y: 16 },
      { number: 2, x: 70, y: 18 },
      { number: 12, x: 30, y: 18 },
      { number: 8, x: 42, y: 22 },
      { number: 10, x: 58, y: 22 },
      { number: 7, x: 35, y: 26 },
      { number: 9, x: 65, y: 26 },
      { number: 11, x: 50, y: 42 },
    ],
  },
  {
    id: "juv-3",
    name: "Organización defensiva — Líneas compactas",
    description:
      "Estructura defensiva con distancia máxima de 25 metros entre la línea defensiva y la delantera. Los mediocampistas basculan como unidad y los delanteros cortan las líneas de pase centrales.",
    team: "Juventus",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 28, y: 75 },
      { number: 3, x: 72, y: 75 },
      { number: 2, x: 85, y: 72 },
      { number: 12, x: 15, y: 72 },
      { number: 5, x: 50, y: 62 },
      { number: 8, x: 30, y: 60 },
      { number: 10, x: 70, y: 60 },
      { number: 7, x: 25, y: 48 },
      { number: 11, x: 75, y: 48 },
      { number: 9, x: 50, y: 45 },
    ],
  },
  {
    id: "juv-4",
    name: "Tiro libre defensivo — Barrera y cobertura",
    description:
      "Organización defensiva en tiro libre rival. Barrera de 4 jugadores bien posicionada, portero cubriendo el palo descubierto y un jugador tumbado detrás de la barrera para bloquear disparos rasos.",
    team: "Juventus",
    category: "free_kick",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 12 },
      { number: 4, x: 42, y: 25 },
      { number: 3, x: 46, y: 25 },
      { number: 5, x: 50, y: 25 },
      { number: 2, x: 54, y: 25 },
      { number: 12, x: 48, y: 28 },
      { number: 8, x: 30, y: 20 },
      { number: 10, x: 70, y: 20 },
      { number: 7, x: 25, y: 15 },
      { number: 9, x: 75, y: 15 },
      { number: 11, x: 50, y: 50 },
    ],
  },
  {
    id: "juv-5",
    name: "Bloque bajo Fútbol 9 — Muro defensivo",
    description:
      "Defensa compacta en fútbol 9 con dos líneas de tres y un delantero esperando la transición. Las líneas se mantienen muy juntas para no dejar espacios entre ellas.",
    team: "Juventus",
    category: "counter_attack",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 70, y: 75 },
      { number: 3, x: 30, y: 75 },
      { number: 4, x: 50, y: 72 },
      { number: 5, x: 30, y: 60 },
      { number: 6, x: 70, y: 60 },
      { number: 7, x: 50, y: 58 },
      { number: 8, x: 50, y: 40 },
      { number: 9, x: 50, y: 25 },
    ],
  },

  // ── Club América (5 plays) ───────────────────────────────────────────────
  {
    id: "ca-1",
    name: "Transición rápida — Salida vertical",
    description:
      "Tras recuperar en zona media, pase vertical inmediato al mediapunta que gira y enfrenta la defensa. Los extremos abren las bandas y el delantero ofrece profundidad para el pase final.",
    team: "Club América",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 72 },
      { number: 3, x: 70, y: 72 },
      { number: 2, x: 85, y: 58 },
      { number: 12, x: 15, y: 58 },
      { number: 5, x: 50, y: 60 },
      { number: 8, x: 38, y: 48 },
      { number: 10, x: 55, y: 38 },
      { number: 7, x: 18, y: 28 },
      { number: 11, x: 82, y: 28 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "ca-2",
    name: "Presión compacta — Mediocampo denso",
    description:
      "Mediocampo compacto con cuatro jugadores en línea que reducen los espacios entre líneas. Los delanteros presionan hacia las bandas para forzar el error rival en zonas laterales.",
    team: "Club América",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 30, y: 68 },
      { number: 3, x: 70, y: 68 },
      { number: 2, x: 85, y: 62 },
      { number: 12, x: 15, y: 62 },
      { number: 5, x: 35, y: 50 },
      { number: 8, x: 50, y: 48 },
      { number: 10, x: 65, y: 50 },
      { number: 7, x: 25, y: 35 },
      { number: 11, x: 75, y: 35 },
      { number: 9, x: 50, y: 28 },
    ],
  },
  {
    id: "ca-3",
    name: "Contraataque por centro — Pared y profundidad",
    description:
      "Contraataque iniciado con una pared rápida en el centro del campo. El mediapunta recibe, da pared con el delantero y recibe de vuelta en carrera para encarar al portero.",
    team: "Club América",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 32, y: 72 },
      { number: 3, x: 68, y: 72 },
      { number: 2, x: 82, y: 60 },
      { number: 12, x: 18, y: 60 },
      { number: 5, x: 50, y: 58 },
      { number: 8, x: 42, y: 45 },
      { number: 10, x: 55, y: 35 },
      { number: 7, x: 20, y: 30 },
      { number: 11, x: 80, y: 30 },
      { number: 9, x: 50, y: 22 },
    ],
  },
  {
    id: "ca-4",
    name: "Córner ofensivo — Bloqueo y remate",
    description:
      "Córner con jugadores creando bloqueos en el área. Un jugador alto se desmarca del grupo hacia el primer palo mientras otro ataca el segundo palo libre de marca.",
    team: "Club América",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 42, y: 55 },
      { number: 3, x: 58, y: 55 },
      { number: 8, x: 8, y: 15 },
      { number: 5, x: 45, y: 18 },
      { number: 9, x: 50, y: 14 },
      { number: 7, x: 55, y: 16 },
      { number: 11, x: 38, y: 12 },
      { number: 10, x: 60, y: 22 },
      { number: 2, x: 72, y: 30 },
      { number: 12, x: 30, y: 50 },
    ],
  },
  {
    id: "ca-5",
    name: "Transición Fútbol 7 — Velocidad americana",
    description:
      "Transición rápida en fútbol 7 con pase directo al delantero que pivotea para el mediocampista en carrera. Se busca llegar al arco rival en máximo 4 segundos tras la recuperación.",
    team: "Club América",
    category: "transition",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 72, y: 68 },
      { number: 3, x: 28, y: 68 },
      { number: 4, x: 50, y: 58 },
      { number: 5, x: 35, y: 40 },
      { number: 6, x: 65, y: 40 },
      { number: 7, x: 50, y: 22 },
    ],
  },
  // ── Selección Argentina (6 plays) ──────────────────────────────────────────
  {
    id: "arg-1",
    name: "Build-up con Messi bajando al mediocampo",
    description:
      "Construcción desde atrás con Messi bajando a recibir entre líneas. Los interiores generan espacios con desmarques de ruptura mientras los laterales dan amplitud alta.",
    team: "Selección Argentina",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 75 },
      { number: 6, x: 70, y: 75 },
      { number: 5, x: 50, y: 68 },
      { number: 3, x: 12, y: 58 },
      { number: 2, x: 88, y: 58 },
      { number: 7, x: 35, y: 50 },
      { number: 20, x: 65, y: 50 },
      { number: 10, x: 50, y: 42 },
      { number: 11, x: 22, y: 30 },
      { number: 9, x: 55, y: 25 },
    ],
  },
  {
    id: "arg-2",
    name: "Contraataque rápido por bandas — Di María style",
    description:
      "Transición veloz tras recuperación con pase largo a la banda derecha. El extremo recibe en carrera y busca el centro al área donde el delantero y el mediapunta atacan los espacios.",
    team: "Selección Argentina",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 35, y: 78 },
      { number: 6, x: 65, y: 78 },
      { number: 5, x: 50, y: 72 },
      { number: 3, x: 15, y: 65 },
      { number: 2, x: 85, y: 55 },
      { number: 7, x: 40, y: 55 },
      { number: 20, x: 60, y: 48 },
      { number: 11, x: 88, y: 30 },
      { number: 10, x: 55, y: 28 },
      { number: 9, x: 45, y: 20 },
    ],
  },
  {
    id: "arg-3",
    name: "Presión alta tras pérdida — Sistema Scaloni",
    description:
      "Pressing inmediato tras perder la posesión con los tres delanteros cerrando líneas de pase. Los mediocampistas suben para achicar espacios y forzar el error rival en su campo.",
    team: "Selección Argentina",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 65 },
      { number: 6, x: 70, y: 65 },
      { number: 5, x: 50, y: 60 },
      { number: 3, x: 15, y: 55 },
      { number: 2, x: 85, y: 55 },
      { number: 7, x: 35, y: 38 },
      { number: 20, x: 65, y: 38 },
      { number: 10, x: 50, y: 28 },
      { number: 11, x: 25, y: 22 },
      { number: 9, x: 55, y: 18 },
    ],
  },
  {
    id: "arg-4",
    name: "Córner ofensivo con bloqueos",
    description:
      "Córner desde la derecha con dos jugadores realizando bloqueos en la zona del primer palo. El central sube al segundo palo para rematar mientras el mediapunta queda al borde del área.",
    team: "Selección Argentina",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 40, y: 70 },
      { number: 2, x: 60, y: 70 },
      { number: 5, x: 50, y: 55 },
      { number: 3, x: 30, y: 50 },
      { number: 6, x: 35, y: 18 },
      { number: 7, x: 42, y: 12 },
      { number: 20, x: 55, y: 10 },
      { number: 9, x: 48, y: 8 },
      { number: 10, x: 50, y: 25 },
      { number: 11, x: 95, y: 5 },
    ],
  },
  {
    id: "arg-5",
    name: "Tiro libre con pared y disparo",
    description:
      "Tiro libre a 25 metros con dos jugadores sobre el balón. Uno amaga y el otro ejecuta un disparo con efecto buscando el ángulo superior mientras los delanteros atacan el rebote.",
    team: "Selección Argentina",
    category: "free_kick",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 35, y: 70 },
      { number: 6, x: 65, y: 70 },
      { number: 5, x: 50, y: 65 },
      { number: 3, x: 20, y: 60 },
      { number: 2, x: 80, y: 60 },
      { number: 10, x: 48, y: 32 },
      { number: 7, x: 52, y: 32 },
      { number: 9, x: 45, y: 15 },
      { number: 11, x: 55, y: 15 },
      { number: 20, x: 60, y: 25 },
    ],
  },
  {
    id: "arg-6",
    name: "Transición defensa-ataque vertical",
    description:
      "Transición directa tras recuperación en campo propio. El pivote distribuye rápido al mediapunta que conecta con los extremos en carrera. Se busca verticalidad máxima en pocos toques.",
    team: "Selección Argentina",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 32, y: 75 },
      { number: 6, x: 68, y: 75 },
      { number: 5, x: 50, y: 65 },
      { number: 3, x: 15, y: 60 },
      { number: 2, x: 85, y: 60 },
      { number: 7, x: 38, y: 48 },
      { number: 20, x: 62, y: 48 },
      { number: 10, x: 50, y: 35 },
      { number: 11, x: 20, y: 22 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  // ── Selección Brasil (6 plays) ──────────────────────────────────────────────
  {
    id: "bra-1",
    name: "Jogo bonito — Combinación en el último tercio",
    description:
      "Juego combinativo brasileño con paredes rápidas en el último tercio del campo. Los extremos se asocian con el mediapunta para generar superioridad numérica cerca del área rival.",
    team: "Selección Brasil",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 28, y: 72 },
      { number: 3, x: 72, y: 72 },
      { number: 5, x: 50, y: 65 },
      { number: 6, x: 15, y: 55 },
      { number: 2, x: 85, y: 55 },
      { number: 8, x: 38, y: 45 },
      { number: 7, x: 62, y: 42 },
      { number: 10, x: 50, y: 30 },
      { number: 11, x: 22, y: 25 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "bra-2",
    name: "Contraataque con extremos veloces",
    description:
      "Transición rápida aprovechando la velocidad de los extremos. Tras recuperación, el balón viaja directo a las bandas donde los atacantes encaran en velocidad buscando el uno contra uno.",
    team: "Selección Brasil",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 32, y: 78 },
      { number: 3, x: 68, y: 78 },
      { number: 5, x: 50, y: 70 },
      { number: 6, x: 18, y: 62 },
      { number: 2, x: 82, y: 55 },
      { number: 8, x: 42, y: 52 },
      { number: 7, x: 58, y: 48 },
      { number: 11, x: 12, y: 28 },
      { number: 10, x: 50, y: 30 },
      { number: 9, x: 88, y: 25 },
    ],
  },
  {
    id: "bra-3",
    name: "Salida de balón desde portero con laterales altos",
    description:
      "Construcción paciente desde el portero con los centrales abiertos. Los laterales suben como extremos mientras el doble pivote ofrece líneas de pase cortas para progresar.",
    team: "Selección Brasil",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 4, x: 25, y: 78 },
      { number: 3, x: 75, y: 78 },
      { number: 5, x: 42, y: 68 },
      { number: 8, x: 58, y: 68 },
      { number: 6, x: 10, y: 48 },
      { number: 2, x: 90, y: 48 },
      { number: 7, x: 35, y: 42 },
      { number: 10, x: 50, y: 35 },
      { number: 11, x: 65, y: 38 },
      { number: 9, x: 50, y: 22 },
    ],
  },
  {
    id: "bra-4",
    name: "Presión coordinada en campo rival",
    description:
      "Pressing alto con los delanteros cerrando la salida del rival. Los mediocampistas cubren las líneas de pase centrales mientras los laterales suben para cerrar las bandas.",
    team: "Selección Brasil",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 30, y: 62 },
      { number: 3, x: 70, y: 62 },
      { number: 5, x: 42, y: 50 },
      { number: 8, x: 58, y: 50 },
      { number: 6, x: 18, y: 42 },
      { number: 2, x: 82, y: 42 },
      { number: 7, x: 35, y: 28 },
      { number: 10, x: 50, y: 22 },
      { number: 11, x: 65, y: 28 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "bra-5",
    name: "Córner con movimiento cruzado",
    description:
      "Córner con movimientos cruzados donde dos jugadores intercambian posiciones para desmarcar. El central ataca el segundo palo mientras el delantero busca el primer palo con carrera diagonal.",
    team: "Selección Brasil",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 38, y: 68 },
      { number: 2, x: 62, y: 68 },
      { number: 5, x: 50, y: 55 },
      { number: 3, x: 28, y: 50 },
      { number: 8, x: 50, y: 25 },
      { number: 6, x: 40, y: 15 },
      { number: 7, x: 55, y: 12 },
      { number: 9, x: 45, y: 8 },
      { number: 10, x: 60, y: 20 },
      { number: 11, x: 95, y: 5 },
    ],
  },
  {
    id: "bra-6",
    name: "Tiro libre con barrera falsa",
    description:
      "Tiro libre con un jugador infiltrado en la barrera rival que se agacha en el momento del disparo. El ejecutor busca el hueco creado con un disparo raso y potente al primer palo.",
    team: "Selección Brasil",
    category: "free_kick",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 35, y: 72 },
      { number: 3, x: 65, y: 72 },
      { number: 5, x: 50, y: 62 },
      { number: 2, x: 80, y: 58 },
      { number: 6, x: 20, y: 58 },
      { number: 10, x: 45, y: 30 },
      { number: 7, x: 50, y: 30 },
      { number: 8, x: 42, y: 18 },
      { number: 9, x: 52, y: 14 },
      { number: 11, x: 60, y: 22 },
    ],
  },
  // ── Selección Francia (5 plays) ─────────────────────────────────────────────
  {
    id: "fra-1",
    name: "Contraataque letal con Mbappé",
    description:
      "Transición devastadora con pase en profundidad al extremo izquierdo que arranca desde su campo. El delantero centro abre espacio y el mediapunta llega al segundo palo para el centro.",
    team: "Selección Francia",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 78 },
      { number: 3, x: 70, y: 78 },
      { number: 5, x: 50, y: 72 },
      { number: 6, x: 18, y: 65 },
      { number: 2, x: 82, y: 60 },
      { number: 8, x: 40, y: 55 },
      { number: 13, x: 60, y: 50 },
      { number: 10, x: 15, y: 28 },
      { number: 7, x: 55, y: 25 },
      { number: 9, x: 45, y: 18 },
    ],
  },
  {
    id: "fra-2",
    name: "Transición rápida 4v3",
    description:
      "Transición con superioridad numérica 4 contra 3 tras recuperación en mediocampo. Los extremos y el delantero atacan los espacios mientras el mediapunta conecta el juego con pase filtrado.",
    team: "Selección Francia",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 32, y: 75 },
      { number: 3, x: 68, y: 75 },
      { number: 5, x: 50, y: 65 },
      { number: 6, x: 15, y: 58 },
      { number: 2, x: 85, y: 58 },
      { number: 8, x: 42, y: 45 },
      { number: 13, x: 58, y: 42 },
      { number: 10, x: 25, y: 25 },
      { number: 7, x: 75, y: 25 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "fra-3",
    name: "Pressing alto con tridente",
    description:
      "Presión intensa con los tres delanteros cerrando la salida del rival. El tridente presiona al portero y centrales mientras los mediocampistas cubren las líneas de pase intermedias.",
    team: "Selección Francia",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 28, y: 60 },
      { number: 3, x: 72, y: 60 },
      { number: 5, x: 42, y: 48 },
      { number: 13, x: 58, y: 48 },
      { number: 6, x: 15, y: 45 },
      { number: 2, x: 85, y: 45 },
      { number: 8, x: 50, y: 35 },
      { number: 10, x: 25, y: 20 },
      { number: 7, x: 75, y: 20 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "fra-4",
    name: "Córner defensivo zonal",
    description:
      "Defensa zonal en córner con seis jugadores cubriendo las zonas peligrosas del área. Dos jugadores en el primer palo, tres en zona central y uno al borde del área para rechaces.",
    team: "Selección Francia",
    category: "corner_defense",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 8 },
      { number: 4, x: 38, y: 12 },
      { number: 3, x: 55, y: 12 },
      { number: 5, x: 45, y: 16 },
      { number: 6, x: 35, y: 18 },
      { number: 2, x: 60, y: 16 },
      { number: 8, x: 50, y: 22 },
      { number: 13, x: 42, y: 28 },
      { number: 10, x: 30, y: 35 },
      { number: 7, x: 65, y: 40 },
      { number: 9, x: 50, y: 50 },
    ],
  },
  {
    id: "fra-5",
    name: "Build-up con doble pivote",
    description:
      "Salida de balón con doble pivote escalonado que ofrece dos líneas de pase al portero. Los laterales suben como extremos y el mediapunta se mueve entre líneas para recibir de espaldas.",
    team: "Selección Francia",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 4, x: 25, y: 78 },
      { number: 3, x: 75, y: 78 },
      { number: 5, x: 40, y: 68 },
      { number: 13, x: 60, y: 65 },
      { number: 6, x: 10, y: 50 },
      { number: 2, x: 90, y: 50 },
      { number: 8, x: 50, y: 45 },
      { number: 10, x: 30, y: 30 },
      { number: 7, x: 70, y: 30 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  // ── Selección Alemania (5 plays) ───────────────────────────────────────────
  {
    id: "ger-1",
    name: "Juego posicional con laterales altos",
    description:
      "Sistema posicional alemán con laterales que funcionan como extremos. El pivote baja entre centrales para crear superioridad en la salida mientras los interiores ocupan los medios espacios.",
    team: "Selección Alemania",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 4, x: 30, y: 78 },
      { number: 5, x: 70, y: 78 },
      { number: 6, x: 50, y: 72 },
      { number: 3, x: 10, y: 48 },
      { number: 2, x: 90, y: 48 },
      { number: 8, x: 35, y: 52 },
      { number: 13, x: 65, y: 52 },
      { number: 10, x: 50, y: 38 },
      { number: 7, x: 25, y: 28 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "ger-2",
    name: "Pressing coordinado en bloque alto",
    description:
      "Presión colectiva con triggers definidos. Cuando el rival pasa al lateral, se activa la presión con el extremo cerrando la línea de banda y el interior cubriendo el pase interior.",
    team: "Selección Alemania",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 28, y: 58 },
      { number: 5, x: 72, y: 58 },
      { number: 6, x: 50, y: 52 },
      { number: 3, x: 15, y: 48 },
      { number: 2, x: 85, y: 48 },
      { number: 8, x: 38, y: 38 },
      { number: 13, x: 62, y: 38 },
      { number: 10, x: 50, y: 28 },
      { number: 7, x: 22, y: 22 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "ger-3",
    name: "Salida de balón con 3 centrales",
    description:
      "Construcción con tres centrales donde el pivote baja a formar línea de tres. Los laterales suben como carrileros y los interiores se posicionan entre líneas para recibir y girar.",
    team: "Selección Alemania",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 4, x: 25, y: 80 },
      { number: 6, x: 50, y: 78 },
      { number: 5, x: 75, y: 80 },
      { number: 3, x: 8, y: 52 },
      { number: 2, x: 92, y: 52 },
      { number: 8, x: 35, y: 55 },
      { number: 13, x: 65, y: 55 },
      { number: 10, x: 50, y: 40 },
      { number: 7, x: 30, y: 25 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "ger-4",
    name: "Transición vertical rápida",
    description:
      "Transición directa tras recuperación con pase vertical al mediapunta. Se busca llegar al área rival en tres pases máximo con los extremos abriendo el campo y el delantero fijando centrales.",
    team: "Selección Alemania",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 72 },
      { number: 5, x: 70, y: 72 },
      { number: 6, x: 50, y: 62 },
      { number: 3, x: 15, y: 55 },
      { number: 2, x: 85, y: 55 },
      { number: 8, x: 40, y: 45 },
      { number: 13, x: 60, y: 42 },
      { number: 10, x: 50, y: 32 },
      { number: 7, x: 20, y: 22 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "ger-5",
    name: "Córner ofensivo con movimiento escalonado",
    description:
      "Córner con movimientos escalonados donde los jugadores atacan en oleadas. Primera oleada al primer palo, segunda al centro del área y tercera al segundo palo para generar confusión.",
    team: "Selección Alemania",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 42, y: 68 },
      { number: 2, x: 58, y: 68 },
      { number: 5, x: 50, y: 55 },
      { number: 3, x: 30, y: 48 },
      { number: 6, x: 38, y: 18 },
      { number: 8, x: 48, y: 14 },
      { number: 13, x: 55, y: 10 },
      { number: 9, x: 42, y: 8 },
      { number: 10, x: 52, y: 25 },
      { number: 7, x: 95, y: 5 },
    ],
  },
  // ── Selección México (5 plays) ──────────────────────────────────────────────
  {
    id: "mex-1",
    name: "Transición rápida estilo Liga MX",
    description:
      "Transición directa con pase largo al delantero que baja a asociarse. Los mediocampistas llegan en segunda línea mientras los extremos estiran el campo para generar espacios centrales.",
    team: "Selección México",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 75 },
      { number: 3, x: 70, y: 75 },
      { number: 6, x: 50, y: 65 },
      { number: 5, x: 15, y: 58 },
      { number: 2, x: 85, y: 58 },
      { number: 8, x: 38, y: 48 },
      { number: 7, x: 62, y: 45 },
      { number: 10, x: 50, y: 35 },
      { number: 11, x: 22, y: 25 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "mex-2",
    name: "Presión compacta en mediocampo",
    description:
      "Bloque medio compacto con las líneas juntas para reducir espacios entre defensa y mediocampo. Se busca robar en zona central y salir rápido al contraataque por las bandas.",
    team: "Selección México",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 28, y: 65 },
      { number: 3, x: 72, y: 65 },
      { number: 6, x: 50, y: 60 },
      { number: 5, x: 15, y: 55 },
      { number: 2, x: 85, y: 55 },
      { number: 8, x: 35, y: 45 },
      { number: 7, x: 65, y: 45 },
      { number: 10, x: 50, y: 38 },
      { number: 11, x: 30, y: 32 },
      { number: 9, x: 70, y: 32 },
    ],
  },
  {
    id: "mex-3",
    name: "Contraataque por centro con paredes",
    description:
      "Contraataque por el centro con combinaciones rápidas de pared entre el delantero y el mediapunta. Los extremos abren para dar amplitud y el lateral se incorpora como opción de pase.",
    team: "Selección México",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 32, y: 78 },
      { number: 3, x: 68, y: 78 },
      { number: 6, x: 50, y: 68 },
      { number: 5, x: 18, y: 62 },
      { number: 2, x: 82, y: 52 },
      { number: 8, x: 45, y: 48 },
      { number: 7, x: 55, y: 42 },
      { number: 10, x: 50, y: 30 },
      { number: 11, x: 20, y: 25 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "mex-4",
    name: "Córner ofensivo con bloqueo",
    description:
      "Córner con jugador realizando bloqueo en la zona del primer palo para liberar al rematador. El central sube al segundo palo y el delantero ataca el centro del área con carrera desde atrás.",
    team: "Selección México",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 40, y: 70 },
      { number: 2, x: 60, y: 70 },
      { number: 6, x: 50, y: 55 },
      { number: 3, x: 28, y: 48 },
      { number: 5, x: 38, y: 16 },
      { number: 8, x: 45, y: 12 },
      { number: 9, x: 52, y: 8 },
      { number: 7, x: 58, y: 14 },
      { number: 10, x: 50, y: 28 },
      { number: 11, x: 95, y: 5 },
    ],
  },
  {
    id: "mex-5",
    name: "Salida de balón bajo presión",
    description:
      "Salida de balón con el portero como jugador libre. Los centrales se abren y el pivote baja para crear triángulo. Si la presión es alta, se busca el pase largo al delantero como válvula de escape.",
    team: "Selección México",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 4, x: 22, y: 80 },
      { number: 3, x: 78, y: 80 },
      { number: 6, x: 50, y: 75 },
      { number: 5, x: 12, y: 60 },
      { number: 2, x: 88, y: 60 },
      { number: 8, x: 35, y: 55 },
      { number: 7, x: 65, y: 55 },
      { number: 10, x: 50, y: 42 },
      { number: 11, x: 25, y: 30 },
      { number: 9, x: 50, y: 22 },
    ],
  },
  // ── Inter de Milán (5 plays) ───────────────────────────────────────────────
  {
    id: "int-1",
    name: "Defensa con 3 centrales y carrileros",
    description:
      "Sistema 3-5-2 con tres centrales y carrileros que dan amplitud. Los dos mediocampistas interiores se asocian con los delanteros mientras el pivote equilibra la estructura defensiva.",
    team: "Inter de Milán",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 6, x: 25, y: 78 },
      { number: 15, x: 50, y: 80 },
      { number: 95, x: 75, y: 78 },
      { number: 32, x: 8, y: 50 },
      { number: 36, x: 92, y: 50 },
      { number: 20, x: 35, y: 55 },
      { number: 23, x: 50, y: 60 },
      { number: 22, x: 65, y: 55 },
      { number: 10, x: 40, y: 25 },
      { number: 9, x: 60, y: 22 },
    ],
  },
  {
    id: "int-2",
    name: "Contraataque con carrileros profundos",
    description:
      "Transición rápida con los carrileros proyectándose por las bandas. Los dos delanteros fijan a los centrales rivales mientras el mediocampista conecta el juego con pases en profundidad.",
    team: "Inter de Milán",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 6, x: 28, y: 75 },
      { number: 15, x: 50, y: 78 },
      { number: 95, x: 72, y: 75 },
      { number: 32, x: 10, y: 40 },
      { number: 36, x: 90, y: 38 },
      { number: 20, x: 38, y: 50 },
      { number: 23, x: 50, y: 55 },
      { number: 22, x: 62, y: 48 },
      { number: 10, x: 42, y: 22 },
      { number: 9, x: 58, y: 20 },
    ],
  },
  {
    id: "int-3",
    name: "Pressing selectivo con trampa",
    description:
      "Presión selectiva que invita al rival a jugar por una banda para luego cerrar con trampa. El carrilero y el interior cierran la salida mientras el pivote cubre el pase al centro.",
    team: "Inter de Milán",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 6, x: 30, y: 62 },
      { number: 15, x: 50, y: 65 },
      { number: 95, x: 70, y: 62 },
      { number: 32, x: 12, y: 42 },
      { number: 36, x: 88, y: 48 },
      { number: 20, x: 35, y: 40 },
      { number: 23, x: 50, y: 48 },
      { number: 22, x: 65, y: 40 },
      { number: 10, x: 38, y: 25 },
      { number: 9, x: 62, y: 22 },
    ],
  },
  {
    id: "int-4",
    name: "Córner defensivo mixto",
    description:
      "Defensa de córner con sistema mixto: marcaje zonal en las zonas peligrosas y marcaje individual sobre los rematadores rivales más peligrosos. Un jugador libre al borde del área.",
    team: "Inter de Milán",
    category: "corner_defense",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 8 },
      { number: 6, x: 35, y: 12 },
      { number: 15, x: 48, y: 14 },
      { number: 95, x: 60, y: 12 },
      { number: 32, x: 30, y: 20 },
      { number: 36, x: 65, y: 18 },
      { number: 20, x: 42, y: 22 },
      { number: 23, x: 55, y: 25 },
      { number: 22, x: 50, y: 32 },
      { number: 10, x: 35, y: 45 },
      { number: 9, x: 65, y: 50 },
    ],
  },
  {
    id: "int-5",
    name: "Build-up con pivote entre centrales",
    description:
      "Construcción con el pivote bajando entre los tres centrales para crear superioridad 4v3 en la primera línea. Los carrileros suben y los interiores ofrecen líneas de pase entre líneas.",
    team: "Inter de Milán",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 6, x: 20, y: 80 },
      { number: 23, x: 42, y: 78 },
      { number: 15, x: 58, y: 78 },
      { number: 95, x: 80, y: 80 },
      { number: 32, x: 8, y: 52 },
      { number: 36, x: 92, y: 52 },
      { number: 20, x: 35, y: 55 },
      { number: 22, x: 65, y: 55 },
      { number: 10, x: 42, y: 30 },
      { number: 9, x: 58, y: 28 },
    ],
  },
  // ── PSG (5 plays) ──────────────────────────────────────────────────────────
  {
    id: "psg-1",
    name: "Ataque con tridente creativo",
    description:
      "Ataque posicional con el tridente intercambiando posiciones constantemente. El falso 9 baja a recibir mientras los extremos atacan la profundidad con desmarques diagonales al área.",
    team: "PSG",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 28, y: 75 },
      { number: 3, x: 72, y: 75 },
      { number: 5, x: 42, y: 65 },
      { number: 6, x: 58, y: 65 },
      { number: 15, x: 12, y: 52 },
      { number: 2, x: 88, y: 52 },
      { number: 8, x: 50, y: 45 },
      { number: 10, x: 50, y: 32 },
      { number: 7, x: 22, y: 22 },
      { number: 9, x: 78, y: 22 },
    ],
  },
  {
    id: "psg-2",
    name: "Transición con Mbappé en profundidad",
    description:
      "Transición directa con pase largo al espacio para el delantero que arranca desde posición de extremo. El mediapunta acompaña la jugada y el otro extremo cierra al segundo palo.",
    team: "PSG",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 78 },
      { number: 3, x: 70, y: 78 },
      { number: 5, x: 45, y: 68 },
      { number: 6, x: 55, y: 68 },
      { number: 15, x: 15, y: 60 },
      { number: 2, x: 85, y: 55 },
      { number: 8, x: 50, y: 50 },
      { number: 10, x: 40, y: 30 },
      { number: 7, x: 15, y: 18 },
      { number: 9, x: 55, y: 22 },
    ],
  },
  {
    id: "psg-3",
    name: "Jugada ensayada por banda",
    description:
      "Jugada ensayada con combinación rápida por la banda derecha. El lateral solapa al extremo que recorta hacia dentro mientras el mediocampista llega al borde del área para el disparo.",
    team: "PSG",
    category: "set_piece",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 75 },
      { number: 3, x: 68, y: 72 },
      { number: 5, x: 45, y: 62 },
      { number: 6, x: 55, y: 60 },
      { number: 15, x: 15, y: 55 },
      { number: 2, x: 90, y: 42 },
      { number: 8, x: 50, y: 40 },
      { number: 10, x: 65, y: 30 },
      { number: 7, x: 80, y: 28 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "psg-4",
    name: "Presión alta con recuperación rápida",
    description:
      "Pressing alto con el tridente cerrando las salidas del rival. Los mediocampistas suben para achicar el campo y los laterales cierran las bandas. Se busca recuperar en 5 segundos.",
    team: "PSG",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 28, y: 60 },
      { number: 3, x: 72, y: 60 },
      { number: 5, x: 42, y: 48 },
      { number: 6, x: 58, y: 48 },
      { number: 15, x: 15, y: 42 },
      { number: 2, x: 85, y: 42 },
      { number: 8, x: 50, y: 32 },
      { number: 10, x: 35, y: 20 },
      { number: 7, x: 65, y: 20 },
      { number: 9, x: 50, y: 14 },
    ],
  },
  {
    id: "psg-5",
    name: "Córner con movimiento al primer palo",
    description:
      "Córner con carrera agresiva al primer palo del delantero centro. Dos jugadores hacen bloqueo en zona central mientras el mediapunta queda libre al borde del área para el rechace.",
    team: "PSG",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 40, y: 68 },
      { number: 2, x: 60, y: 68 },
      { number: 5, x: 50, y: 55 },
      { number: 3, x: 30, y: 50 },
      { number: 6, x: 35, y: 15 },
      { number: 8, x: 45, y: 12 },
      { number: 9, x: 38, y: 8 },
      { number: 15, x: 55, y: 10 },
      { number: 10, x: 50, y: 28 },
      { number: 7, x: 95, y: 5 },
    ],
  },
  // ── Borussia Dortmund (5 plays) ────────────────────────────────────────────
  {
    id: "bvb-1",
    name: "Contraataque vertical con velocidad",
    description:
      "Transición devastadora con pase directo al espacio detrás de la defensa rival. Los extremos arrancan en velocidad máxima y el delantero centro ataca el área con timing perfecto.",
    team: "Borussia Dortmund",
    category: "counter_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 30, y: 78 },
      { number: 15, x: 70, y: 78 },
      { number: 6, x: 50, y: 70 },
      { number: 3, x: 15, y: 62 },
      { number: 2, x: 85, y: 55 },
      { number: 8, x: 40, y: 52 },
      { number: 13, x: 60, y: 48 },
      { number: 11, x: 18, y: 28 },
      { number: 7, x: 82, y: 25 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "bvb-2",
    name: "Pressing alto juvenil",
    description:
      "Presión intensa y energética con los jóvenes atacantes cerrando todas las salidas. El equipo sube en bloque con las líneas muy juntas para asfixiar al rival en su propio campo.",
    team: "Borussia Dortmund",
    category: "pressing",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 4, x: 28, y: 58 },
      { number: 15, x: 72, y: 58 },
      { number: 6, x: 50, y: 52 },
      { number: 3, x: 15, y: 45 },
      { number: 2, x: 85, y: 45 },
      { number: 8, x: 38, y: 35 },
      { number: 13, x: 62, y: 35 },
      { number: 11, x: 25, y: 22 },
      { number: 7, x: 75, y: 22 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "bvb-3",
    name: "Transición rápida por el centro",
    description:
      "Transición por el centro con combinación rápida entre el mediapunta y el delantero. Los extremos abren el campo y el mediocampista llega desde segunda línea para el disparo.",
    team: "Borussia Dortmund",
    category: "transition",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 32, y: 75 },
      { number: 15, x: 68, y: 75 },
      { number: 6, x: 50, y: 65 },
      { number: 3, x: 15, y: 58 },
      { number: 2, x: 85, y: 58 },
      { number: 8, x: 45, y: 45 },
      { number: 13, x: 55, y: 40 },
      { number: 11, x: 20, y: 28 },
      { number: 7, x: 80, y: 28 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "bvb-4",
    name: "Córner ofensivo con carrera diagonal",
    description:
      "Córner con el central realizando carrera diagonal desde fuera del área hacia el primer palo. El delantero fija al marcador en el centro mientras el mediocampista ataca el segundo palo.",
    team: "Borussia Dortmund",
    category: "corner_attack",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 4, x: 42, y: 68 },
      { number: 2, x: 58, y: 68 },
      { number: 6, x: 50, y: 55 },
      { number: 3, x: 28, y: 48 },
      { number: 15, x: 35, y: 25 },
      { number: 8, x: 48, y: 14 },
      { number: 9, x: 52, y: 10 },
      { number: 13, x: 58, y: 18 },
      { number: 11, x: 42, y: 8 },
      { number: 7, x: 95, y: 5 },
    ],
  },
  {
    id: "bvb-5",
    name: "Build-up con pivote bajando",
    description:
      "Construcción con el pivote bajando entre los centrales para crear superioridad numérica. Los laterales suben como extremos y los interiores ocupan los medios espacios para recibir entre líneas.",
    team: "Borussia Dortmund",
    category: "build_up",
    fieldType: "11",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 4, x: 25, y: 80 },
      { number: 6, x: 50, y: 78 },
      { number: 15, x: 75, y: 80 },
      { number: 3, x: 10, y: 50 },
      { number: 2, x: 90, y: 50 },
      { number: 8, x: 35, y: 52 },
      { number: 13, x: 65, y: 52 },
      { number: 11, x: 25, y: 30 },
      { number: 7, x: 75, y: 30 },
      { number: 9, x: 50, y: 22 },
    ],
  },
  // ── Fútbol 9 — Barcelona (3 plays) ──────────────────────────────────────────
  {
    id: "bar-9-1",
    name: "Salida de balón en 9 — Tiki-taka juvenil",
    description:
      "Construcción desde el portero con los centrales abiertos y el pivote ofreciendo línea de pase. Los extremos dan amplitud y el mediapunta se mueve entre líneas para conectar el juego.",
    team: "Barcelona",
    category: "build_up",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 75, y: 72 },
      { number: 3, x: 25, y: 72 },
      { number: 4, x: 50, y: 65 },
      { number: 5, x: 15, y: 48 },
      { number: 6, x: 85, y: 48 },
      { number: 7, x: 35, y: 40 },
      { number: 8, x: 65, y: 38 },
      { number: 9, x: 50, y: 22 },
    ],
  },
  {
    id: "bar-9-2",
    name: "Presión alta en 9 — Estilo Barça",
    description:
      "Pressing alto con los tres delanteros cerrando la salida del rival. Los mediocampistas suben para achicar espacios y los defensas mantienen línea alta para comprimir el campo.",
    team: "Barcelona",
    category: "pressing",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 85 },
      { number: 2, x: 72, y: 58 },
      { number: 3, x: 28, y: 58 },
      { number: 4, x: 50, y: 52 },
      { number: 5, x: 18, y: 42 },
      { number: 6, x: 82, y: 42 },
      { number: 7, x: 35, y: 28 },
      { number: 8, x: 65, y: 28 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "bar-9-3",
    name: "Córner ofensivo en 9 — Movimiento cruzado",
    description:
      "Córner con movimientos cruzados en el área. El central ataca el segundo palo mientras el delantero busca el primer palo. El mediapunta queda al borde del área para rechaces.",
    team: "Barcelona",
    category: "corner_attack",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 55, y: 65 },
      { number: 3, x: 35, y: 60 },
      { number: 4, x: 50, y: 45 },
      { number: 5, x: 40, y: 18 },
      { number: 6, x: 55, y: 14 },
      { number: 7, x: 48, y: 10 },
      { number: 8, x: 50, y: 30 },
      { number: 9, x: 92, y: 5 },
    ],
  },
  // ── Fútbol 9 — Ajax (3 plays) ─────────────────────────────────────────────
  {
    id: "ajax-9-1",
    name: "Juego posicional en 9 — Estilo Ajax",
    description:
      "Juego posicional con rotaciones constantes entre mediocampistas y delanteros. Se busca superioridad numérica en cada zona del campo con movimientos coordinados y pases a un toque.",
    team: "Ajax Academy",
    category: "build_up",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 78, y: 70 },
      { number: 3, x: 22, y: 70 },
      { number: 4, x: 50, y: 62 },
      { number: 5, x: 15, y: 45 },
      { number: 6, x: 85, y: 45 },
      { number: 7, x: 38, y: 35 },
      { number: 8, x: 62, y: 32 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "ajax-9-2",
    name: "Contraataque en 9 — Velocidad total",
    description:
      "Transición rápida tras recuperación con pase directo al delantero. Los extremos arrancan en velocidad por las bandas y el mediocampista llega desde segunda línea al borde del área.",
    team: "Ajax Academy",
    category: "counter_attack",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 70, y: 72 },
      { number: 3, x: 30, y: 72 },
      { number: 4, x: 50, y: 60 },
      { number: 5, x: 18, y: 48 },
      { number: 6, x: 82, y: 42 },
      { number: 7, x: 40, y: 38 },
      { number: 8, x: 60, y: 30 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "ajax-9-3",
    name: "Transición en 9 — Cambio de ritmo",
    description:
      "Transición con cambio de ritmo tras recuperación en mediocampo. El pivote distribuye rápido a las bandas y los delanteros atacan el área con movimientos coordinados de desmarque.",
    team: "Ajax Academy",
    category: "transition",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 72, y: 68 },
      { number: 3, x: 28, y: 68 },
      { number: 4, x: 50, y: 55 },
      { number: 5, x: 20, y: 42 },
      { number: 6, x: 80, y: 40 },
      { number: 7, x: 38, y: 30 },
      { number: 8, x: 62, y: 28 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  // ── Fútbol 9 — Real Madrid (3 plays) ──────────────────────────────────────
  {
    id: "rm-9-1",
    name: "Salida de balón en 9 — Estilo merengue",
    description:
      "Construcción desde atrás con el portero como primer pase. Los centrales se abren y el pivote baja para crear triángulo de salida. Los extremos estiran el campo en amplitud.",
    team: "Real Madrid",
    category: "build_up",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 2, x: 75, y: 75 },
      { number: 3, x: 25, y: 75 },
      { number: 4, x: 50, y: 68 },
      { number: 5, x: 12, y: 50 },
      { number: 6, x: 88, y: 50 },
      { number: 7, x: 35, y: 42 },
      { number: 8, x: 65, y: 40 },
      { number: 9, x: 50, y: 25 },
    ],
  },
  {
    id: "rm-9-2",
    name: "Contraataque en 9 — Velocidad blanca",
    description:
      "Contraataque directo con pase largo al extremo más adelantado. El delantero centro fija a los centrales y el otro extremo cierra al segundo palo para el centro al área.",
    team: "Real Madrid",
    category: "counter_attack",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 72, y: 72 },
      { number: 3, x: 28, y: 72 },
      { number: 4, x: 50, y: 62 },
      { number: 5, x: 15, y: 50 },
      { number: 6, x: 85, y: 38 },
      { number: 7, x: 40, y: 35 },
      { number: 8, x: 60, y: 28 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "rm-9-3",
    name: "Presión alta en 9 — Intensidad madridista",
    description:
      "Pressing alto con los tres delanteros cerrando la salida. Los mediocampistas cubren las líneas de pase y los defensas mantienen línea alta para atrapar al rival en su campo.",
    team: "Real Madrid",
    category: "pressing",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 85 },
      { number: 2, x: 70, y: 58 },
      { number: 3, x: 30, y: 58 },
      { number: 4, x: 50, y: 50 },
      { number: 5, x: 18, y: 40 },
      { number: 6, x: 82, y: 40 },
      { number: 7, x: 35, y: 25 },
      { number: 8, x: 65, y: 25 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  // ── Fútbol 9 — Bayern Munich (3 plays) ────────────────────────────────────
  {
    id: "bay-9-1",
    name: "Juego posicional en 9 — Estilo Bayern",
    description:
      "Juego posicional con laterales altos que funcionan como extremos. El pivote organiza el juego y los interiores se mueven entre líneas para recibir y girar hacia el arco rival.",
    team: "Bayern Munich",
    category: "build_up",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 80, y: 68 },
      { number: 3, x: 20, y: 68 },
      { number: 4, x: 50, y: 60 },
      { number: 5, x: 12, y: 45 },
      { number: 6, x: 88, y: 45 },
      { number: 7, x: 38, y: 35 },
      { number: 8, x: 62, y: 32 },
      { number: 9, x: 50, y: 20 },
    ],
  },
  {
    id: "bay-9-2",
    name: "Presión alta en 9 — Máquina bávara",
    description:
      "Pressing intenso con todo el equipo subido. Los delanteros cierran al portero y centrales mientras los mediocampistas cubren las bandas. Se busca recuperar en zona de gol.",
    team: "Bayern Munich",
    category: "pressing",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 85 },
      { number: 2, x: 68, y: 55 },
      { number: 3, x: 32, y: 55 },
      { number: 4, x: 50, y: 48 },
      { number: 5, x: 15, y: 38 },
      { number: 6, x: 85, y: 38 },
      { number: 7, x: 35, y: 25 },
      { number: 8, x: 65, y: 25 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "bay-9-3",
    name: "Córner ofensivo en 9 — Potencia aérea",
    description:
      "Córner con los jugadores más altos atacando las zonas peligrosas del área. El central va al primer palo, el delantero al centro y el mediocampista al segundo palo con carrera.",
    team: "Bayern Munich",
    category: "corner_attack",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 58, y: 65 },
      { number: 3, x: 38, y: 60 },
      { number: 4, x: 50, y: 45 },
      { number: 5, x: 42, y: 18 },
      { number: 6, x: 55, y: 14 },
      { number: 7, x: 48, y: 10 },
      { number: 8, x: 52, y: 28 },
      { number: 9, x: 92, y: 5 },
    ],
  },
  // ── Fútbol 9 — Manchester City (3 plays) ──────────────────────────────────
  {
    id: "mc-9-1",
    name: "Salida de balón en 9 — Laterales invertidos",
    description:
      "Construcción con laterales que se meten al centro como mediocampistas. El pivote baja entre centrales y los extremos dan amplitud máxima para estirar la defensa rival.",
    team: "Manchester City",
    category: "build_up",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 2, x: 65, y: 72 },
      { number: 3, x: 35, y: 72 },
      { number: 4, x: 50, y: 65 },
      { number: 5, x: 10, y: 48 },
      { number: 6, x: 90, y: 48 },
      { number: 7, x: 38, y: 38 },
      { number: 8, x: 62, y: 35 },
      { number: 9, x: 50, y: 22 },
    ],
  },
  {
    id: "mc-9-2",
    name: "Transición en 9 — Verticalidad citizen",
    description:
      "Transición rápida con pase vertical al mediapunta que conecta con los extremos en carrera. Se busca llegar al área rival en pocos toques aprovechando los espacios tras la recuperación.",
    team: "Manchester City",
    category: "transition",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 70, y: 68 },
      { number: 3, x: 30, y: 68 },
      { number: 4, x: 50, y: 55 },
      { number: 5, x: 18, y: 42 },
      { number: 6, x: 82, y: 38 },
      { number: 7, x: 40, y: 30 },
      { number: 8, x: 60, y: 28 },
      { number: 9, x: 50, y: 18 },
    ],
  },
  {
    id: "mc-9-3",
    name: "Contraataque en 9 — Pase al espacio",
    description:
      "Contraataque con pase filtrado al espacio detrás de la defensa. El delantero arranca en diagonal y los extremos abren para dar opciones de pase en caso de que el primer pase no llegue.",
    team: "Manchester City",
    category: "counter_attack",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 72, y: 70 },
      { number: 3, x: 28, y: 70 },
      { number: 4, x: 50, y: 58 },
      { number: 5, x: 15, y: 45 },
      { number: 6, x: 85, y: 40 },
      { number: 7, x: 38, y: 32 },
      { number: 8, x: 62, y: 28 },
      { number: 9, x: 50, y: 16 },
    ],
  },
  // ── Fútbol 7 — Ajax Academy (3 plays) ───────────────────────────────────────
  {
    id: "ajax-7-1",
    name: "Salida de balón en 7 — Filosofía Ajax",
    description:
      "Construcción desde el portero con los defensas abiertos. El mediocampista central baja para crear triángulo y los extremos dan amplitud para progresar con pases cortos.",
    team: "Ajax Academy",
    category: "build_up",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 75, y: 72 },
      { number: 3, x: 25, y: 72 },
      { number: 4, x: 50, y: 58 },
      { number: 5, x: 20, y: 40 },
      { number: 6, x: 80, y: 40 },
      { number: 7, x: 50, y: 25 },
    ],
  },
  {
    id: "ajax-7-2",
    name: "Presión en 7 — Pressing total juvenil",
    description:
      "Pressing alto con todo el equipo subido. Los delanteros cierran al portero y los mediocampistas cubren las líneas de pase. Se busca recuperar rápido y atacar con ventaja numérica.",
    team: "Ajax Academy",
    category: "pressing",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 85 },
      { number: 2, x: 68, y: 58 },
      { number: 3, x: 32, y: 58 },
      { number: 4, x: 50, y: 45 },
      { number: 5, x: 25, y: 30 },
      { number: 6, x: 75, y: 30 },
      { number: 7, x: 50, y: 18 },
    ],
  },
  {
    id: "ajax-7-3",
    name: "Contraataque en 7 — Velocidad naranja",
    description:
      "Transición rápida con pase directo al delantero que pivotea para el mediocampista en carrera. Los extremos abren el campo para dar opciones de pase y generar superioridad.",
    team: "Ajax Academy",
    category: "counter_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 72, y: 68 },
      { number: 3, x: 28, y: 68 },
      { number: 4, x: 50, y: 52 },
      { number: 5, x: 22, y: 35 },
      { number: 6, x: 78, y: 32 },
      { number: 7, x: 50, y: 18 },
    ],
  },
  // ── Fútbol 7 — Barcelona La Masía (3 plays) ───────────────────────────────
  {
    id: "bar-7-1",
    name: "Juego libre creativo en 7 — La Masía",
    description:
      "Juego posicional libre con rotaciones constantes. Los jugadores intercambian posiciones fluidamente buscando superioridad numérica en cada zona con pases a un toque y movimiento sin balón.",
    team: "Barcelona",
    category: "build_up",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 72, y: 68 },
      { number: 3, x: 28, y: 68 },
      { number: 4, x: 50, y: 52 },
      { number: 5, x: 25, y: 35 },
      { number: 6, x: 75, y: 35 },
      { number: 7, x: 50, y: 20 },
    ],
  },
  {
    id: "bar-7-2",
    name: "Córner en 7 — Movimiento corto",
    description:
      "Córner corto con combinación rápida entre dos jugadores. El ejecutor pasa corto al compañero que devuelve de primera para el centro al área donde el delantero ataca el primer palo.",
    team: "Barcelona",
    category: "corner_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 55, y: 62 },
      { number: 3, x: 35, y: 55 },
      { number: 4, x: 45, y: 18 },
      { number: 5, x: 55, y: 12 },
      { number: 6, x: 50, y: 30 },
      { number: 7, x: 90, y: 8 },
    ],
  },
  {
    id: "bar-7-3",
    name: "Transición en 7 — Toque rápido",
    description:
      "Transición con pases rápidos a un toque tras recuperación. El mediocampista conecta con el delantero que baja a recibir y los extremos atacan los espacios con carreras diagonales.",
    team: "Barcelona",
    category: "transition",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 70, y: 65 },
      { number: 3, x: 30, y: 65 },
      { number: 4, x: 50, y: 48 },
      { number: 5, x: 25, y: 32 },
      { number: 6, x: 75, y: 30 },
      { number: 7, x: 50, y: 18 },
    ],
  },
  // ── Fútbol 7 — Real Madrid Cantera (3 plays) ──────────────────────────────
  {
    id: "rm-7-1",
    name: "Salida de balón en 7 — Cantera blanca",
    description:
      "Construcción paciente desde el portero con los defensas abiertos. El mediocampista ofrece línea de pase central y los extremos dan amplitud para progresar con seguridad.",
    team: "Real Madrid",
    category: "build_up",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 78, y: 70 },
      { number: 3, x: 22, y: 70 },
      { number: 4, x: 50, y: 55 },
      { number: 5, x: 18, y: 38 },
      { number: 6, x: 82, y: 38 },
      { number: 7, x: 50, y: 22 },
    ],
  },
  {
    id: "rm-7-2",
    name: "Contraataque en 7 — Velocidad merengue",
    description:
      "Contraataque directo con pase largo al extremo más adelantado. El delantero fija al central y el otro extremo cierra al segundo palo para rematar el centro al área.",
    team: "Real Madrid",
    category: "counter_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 70, y: 68 },
      { number: 3, x: 30, y: 68 },
      { number: 4, x: 50, y: 50 },
      { number: 5, x: 20, y: 32 },
      { number: 6, x: 80, y: 28 },
      { number: 7, x: 50, y: 18 },
    ],
  },
  {
    id: "rm-7-3",
    name: "Córner en 7 — Ataque directo",
    description:
      "Córner con centro directo al área donde el defensa central sube a rematar. El delantero hace bloqueo en el primer palo y el mediocampista queda al borde para el rechace.",
    team: "Real Madrid",
    category: "corner_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 55, y: 60 },
      { number: 3, x: 40, y: 50 },
      { number: 4, x: 48, y: 20 },
      { number: 5, x: 55, y: 14 },
      { number: 6, x: 50, y: 32 },
      { number: 7, x: 92, y: 8 },
    ],
  },
  // ── Fútbol 7 — Bayern Youth (3 plays) ─────────────────────────────────────
  {
    id: "bay-7-1",
    name: "Presión en 7 — Intensidad bávara",
    description:
      "Pressing alto con todo el equipo compacto. Los delanteros cierran al portero rival y los mediocampistas cubren las líneas de pase. Se busca robar en campo rival y atacar de inmediato.",
    team: "Bayern Munich",
    category: "pressing",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 85 },
      { number: 2, x: 65, y: 55 },
      { number: 3, x: 35, y: 55 },
      { number: 4, x: 50, y: 42 },
      { number: 5, x: 25, y: 28 },
      { number: 6, x: 75, y: 28 },
      { number: 7, x: 50, y: 16 },
    ],
  },
  {
    id: "bay-7-2",
    name: "Juego libre creativo en 7 — Talento alemán",
    description:
      "Juego posicional con libertad para los jugadores creativos. El mediocampista organiza el juego y los extremos buscan el uno contra uno. El delantero se mueve entre líneas para asociarse.",
    team: "Bayern Munich",
    category: "build_up",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 75, y: 68 },
      { number: 3, x: 25, y: 68 },
      { number: 4, x: 50, y: 50 },
      { number: 5, x: 22, y: 35 },
      { number: 6, x: 78, y: 35 },
      { number: 7, x: 50, y: 22 },
    ],
  },
  {
    id: "bay-7-3",
    name: "Transición en 7 — Contraataque rápido",
    description:
      "Transición directa tras recuperación con pase vertical al delantero. Los extremos arrancan en velocidad por las bandas y el mediocampista llega al borde del área como opción de disparo.",
    team: "Bayern Munich",
    category: "transition",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 68, y: 65 },
      { number: 3, x: 32, y: 65 },
      { number: 4, x: 50, y: 48 },
      { number: 5, x: 22, y: 30 },
      { number: 6, x: 78, y: 28 },
      { number: 7, x: 50, y: 16 },
    ],
  },
  // ── Fútbol 7 — Benfica Academy (3 plays) ──────────────────────────────────
  {
    id: "ben-7-1",
    name: "Salida de balón en 7 — Escola Benfica",
    description:
      "Construcción desde el portero con los defensas escalonados. El mediocampista ofrece línea de pase entre líneas y los extremos dan amplitud para progresar con paciencia y precisión.",
    team: "Benfica Academy",
    category: "build_up",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 72, y: 72 },
      { number: 3, x: 28, y: 72 },
      { number: 4, x: 50, y: 55 },
      { number: 5, x: 20, y: 38 },
      { number: 6, x: 80, y: 38 },
      { number: 7, x: 50, y: 22 },
    ],
  },
  {
    id: "ben-7-2",
    name: "Presión en 7 — Águilas jóvenes",
    description:
      "Pressing alto con los delanteros cerrando la salida del rival. El mediocampista cubre el centro y los defensas mantienen línea alta para comprimir el campo y forzar el error.",
    team: "Benfica Academy",
    category: "pressing",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 85 },
      { number: 2, x: 65, y: 58 },
      { number: 3, x: 35, y: 58 },
      { number: 4, x: 50, y: 42 },
      { number: 5, x: 28, y: 28 },
      { number: 6, x: 72, y: 28 },
      { number: 7, x: 50, y: 16 },
    ],
  },
  {
    id: "ben-7-3",
    name: "Contraataque en 7 — Velocidad portuguesa",
    description:
      "Transición rápida con pase directo al delantero que pivotea para el extremo en carrera. Se busca llegar al arco rival en pocos toques aprovechando la velocidad de los atacantes.",
    team: "Benfica Academy",
    category: "counter_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 70, y: 68 },
      { number: 3, x: 30, y: 68 },
      { number: 4, x: 50, y: 50 },
      { number: 5, x: 22, y: 32 },
      { number: 6, x: 78, y: 30 },
      { number: 7, x: 50, y: 18 },
    ],
  },
  // ── Fútbol 7 — Benfica Academy (extras) ───────────────────────────────────
  {
    id: "ben-7-4",
    name: "Córner en 7 — Ataque águila",
    description:
      "Córner con centro directo al área pequeña. El delantero ataca el primer palo con carrera agresiva mientras el mediocampista queda al borde del área para el rechace o segundo balón.",
    team: "Benfica Academy",
    category: "corner_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 55, y: 60 },
      { number: 3, x: 38, y: 52 },
      { number: 4, x: 48, y: 18 },
      { number: 5, x: 55, y: 12 },
      { number: 6, x: 50, y: 32 },
      { number: 7, x: 90, y: 8 },
    ],
  },
  {
    id: "ben-7-5",
    name: "Transición en 7 — Salida rápida Benfica",
    description:
      "Transición directa tras recuperación con el mediocampista distribuyendo rápido a las bandas. Los extremos encaran en velocidad y el delantero ataca el área con timing preciso.",
    team: "Benfica Academy",
    category: "transition",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 68, y: 65 },
      { number: 3, x: 32, y: 65 },
      { number: 4, x: 50, y: 48 },
      { number: 5, x: 20, y: 30 },
      { number: 6, x: 80, y: 28 },
      { number: 7, x: 50, y: 16 },
    ],
  },
  // ── Fútbol 9 — Ajax Academy (extras) ──────────────────────────────────────
  {
    id: "ajax-9-4",
    name: "Presión alta en 9 — Pressing naranja",
    description:
      "Pressing alto con los tres delanteros cerrando la salida. Los mediocampistas suben para achicar espacios y los defensas mantienen línea alta para comprimir el campo rival.",
    team: "Ajax Academy",
    category: "pressing",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 85 },
      { number: 2, x: 70, y: 55 },
      { number: 3, x: 30, y: 55 },
      { number: 4, x: 50, y: 48 },
      { number: 5, x: 18, y: 38 },
      { number: 6, x: 82, y: 38 },
      { number: 7, x: 35, y: 25 },
      { number: 8, x: 65, y: 25 },
      { number: 9, x: 50, y: 15 },
    ],
  },
  {
    id: "ajax-9-5",
    name: "Córner ofensivo en 9 — Movimiento Ajax",
    description:
      "Córner con movimientos coordinados donde el central ataca el segundo palo y el delantero busca el primer palo. El mediocampista queda al borde del área para rechaces y segundos balones.",
    team: "Ajax Academy",
    category: "corner_attack",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 58, y: 62 },
      { number: 3, x: 35, y: 58 },
      { number: 4, x: 50, y: 42 },
      { number: 5, x: 42, y: 16 },
      { number: 6, x: 55, y: 12 },
      { number: 7, x: 48, y: 8 },
      { number: 8, x: 52, y: 28 },
      { number: 9, x: 92, y: 5 },
    ],
  },
  // ── Fútbol 7 — Ajax Academy (extras) ──────────────────────────────────────
  {
    id: "ajax-7-4",
    name: "Córner en 7 — Rutina Ajax",
    description:
      "Córner corto con combinación rápida. El ejecutor pasa corto al compañero que devuelve de primera para el centro al área. El delantero ataca el primer palo con carrera desde atrás.",
    team: "Ajax Academy",
    category: "corner_attack",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 55, y: 60 },
      { number: 3, x: 38, y: 55 },
      { number: 4, x: 45, y: 18 },
      { number: 5, x: 55, y: 12 },
      { number: 6, x: 50, y: 32 },
      { number: 7, x: 90, y: 8 },
    ],
  },
  {
    id: "ajax-7-5",
    name: "Transición en 7 — Velocidad total Ajax",
    description:
      "Transición directa con pase vertical al delantero que baja a recibir. Los extremos arrancan en velocidad y el mediocampista llega al borde del área como opción de disparo.",
    team: "Ajax Academy",
    category: "transition",
    fieldType: "7",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 68, y: 65 },
      { number: 3, x: 32, y: 65 },
      { number: 4, x: 50, y: 48 },
      { number: 5, x: 22, y: 30 },
      { number: 6, x: 78, y: 28 },
      { number: 7, x: 50, y: 16 },
    ],
  },
  // ── Fútbol 9 — Selección Argentina (extras) ───────────────────────────────
  {
    id: "arg-9-1",
    name: "Salida de balón en 9 — Estilo albiceleste",
    description:
      "Construcción desde el portero con los centrales abiertos y el pivote bajando. Los extremos dan amplitud y el mediapunta se mueve entre líneas para conectar con el delantero centro.",
    team: "Selección Argentina",
    category: "build_up",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 92 },
      { number: 2, x: 75, y: 72 },
      { number: 3, x: 25, y: 72 },
      { number: 4, x: 50, y: 65 },
      { number: 5, x: 15, y: 48 },
      { number: 6, x: 85, y: 48 },
      { number: 7, x: 38, y: 38 },
      { number: 8, x: 62, y: 35 },
      { number: 9, x: 50, y: 22 },
    ],
  },
  {
    id: "arg-9-2",
    name: "Contraataque en 9 — Velocidad gaucha",
    description:
      "Transición rápida con pase directo al extremo más adelantado. El delantero fija a los centrales y el mediapunta llega desde segunda línea para el disparo al borde del área.",
    team: "Selección Argentina",
    category: "counter_attack",
    fieldType: "9",
    players: [
      { number: 1, x: 50, y: 88 },
      { number: 2, x: 72, y: 70 },
      { number: 3, x: 28, y: 70 },
      { number: 4, x: 50, y: 58 },
      { number: 5, x: 18, y: 42 },
      { number: 6, x: 82, y: 38 },
      { number: 7, x: 40, y: 30 },
      { number: 8, x: 60, y: 25 },
      { number: 9, x: 50, y: 16 },
    ],
  },
];

// ─── Merge all plays ─────────────────────────────────────────────────────────
const ALL_PLAYS: Play[] = [...PLAYS_DATA, ...(EXTRA_PLAYS as Play[])];

// ─── Helper: Default players for empty whiteboard ────────────────────────────

function getDefaultPlayers(fieldType: FieldType): { number: number; x: number; y: number }[] {
  if (fieldType === "7") {
    return [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 72, y: 68 },
      { number: 3, x: 28, y: 68 },
      { number: 4, x: 50, y: 55 },
      { number: 5, x: 30, y: 38 },
      { number: 6, x: 70, y: 38 },
      { number: 7, x: 50, y: 20 },
    ];
  }
  if (fieldType === "9") {
    return [
      { number: 1, x: 50, y: 90 },
      { number: 2, x: 70, y: 72 },
      { number: 3, x: 30, y: 72 },
      { number: 4, x: 50, y: 65 },
      { number: 5, x: 35, y: 48 },
      { number: 6, x: 65, y: 48 },
      { number: 7, x: 20, y: 28 },
      { number: 8, x: 80, y: 28 },
      { number: 9, x: 50, y: 18 },
    ];
  }
  return [
    { number: 1, x: 50, y: 90 },
    { number: 2, x: 82, y: 70 },
    { number: 3, x: 62, y: 75 },
    { number: 4, x: 38, y: 75 },
    { number: 5, x: 18, y: 70 },
    { number: 6, x: 50, y: 60 },
    { number: 7, x: 70, y: 48 },
    { number: 8, x: 30, y: 48 },
    { number: 9, x: 80, y: 28 },
    { number: 10, x: 50, y: 32 },
    { number: 11, x: 20, y: 28 },
  ];
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function PlaysPage() {
  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<"library" | "whiteboard">("library");

  // ── Library filters ──
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Whiteboard state ──
  const [wbFieldType, setWbFieldType] = useState<FieldType>("11");
  const [wbPlayers, setWbPlayers] = useState(getDefaultPlayers("11"));
  const [activeTool, setActiveTool] = useState<ActiveTool>("move");
  const [drawColor, setDrawColor] = useState<DrawColor>("#ffffff");
  const [lineWidth, setLineWidth] = useState<LineWidth>(2);
  const [loadedPlay, setLoadedPlay] = useState<Play | null>(null);

  // ── Canvas refs ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // ── Drag state ──
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── Filtered plays ──
  const filteredPlays = ALL_PLAYS.filter((play) => {
    if (teamFilter !== "all" && play.team !== teamFilter) return false;
    if (categoryFilter !== "all" && play.category !== categoryFilter) return false;
    if (fieldFilter !== "all" && play.fieldType !== fieldFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        play.name.toLowerCase().includes(q) ||
        play.description.toLowerCase().includes(q) ||
        play.team.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Draw play arrows on canvas ──
  const drawPlayArrows = useCallback((play: Play) => {
    // Small delay to ensure canvas is sized after tab switch
    setTimeout(() => {
      const canvas = canvasRef.current;
      const pitch = pitchRef.current;
      if (!canvas || !pitch) return;
      const rect = pitch.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const players = play.players;
      const w = canvas.width;
      const h = canvas.height;

      // Helper: draw arrow from (x1,y1) to (x2,y2)
      const drawArrow = (
        x1: number, y1: number, x2: number, y2: number,
        color: string, lw: number, dashed: boolean = false
      ) => {
        const headLen = 8 + lw * 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        // Shorten arrow so it doesn't overlap the player circle
        const shortenStart = 22;
        const shortenEnd = 22;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < shortenStart + shortenEnd + 10) return;
        const sx = x1 + Math.cos(angle) * shortenStart;
        const sy = y1 + Math.sin(angle) * shortenStart;
        const ex = x2 - Math.cos(angle) * shortenEnd;
        const ey = y2 - Math.sin(angle) * shortenEnd;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.7;
        if (dashed) ctx.setLineDash([6, 4]);

        // Line
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      // Sort players by y position (higher y = closer to own goal = more defensive)
      const sorted = [...players].sort((a, b) => b.y - a.y);
      const gk = sorted[0]; // goalkeeper (highest y)
      const defenders = sorted.slice(1, play.fieldType === "7" ? 3 : play.fieldType === "9" ? 4 : 5);
      const midfielders = sorted.slice(
        play.fieldType === "7" ? 3 : play.fieldType === "9" ? 4 : 5,
        play.fieldType === "7" ? 5 : play.fieldType === "9" ? 7 : 8
      );
      const attackers = sorted.slice(play.fieldType === "7" ? 5 : play.fieldType === "9" ? 7 : 8);

      // Category-based arrow patterns
      const cat = play.category;

      if (cat === "build_up") {
        // GK → nearest defender
        if (gk && defenders.length > 0) {
          const nearDef = defenders.reduce((a, b) =>
            Math.abs(a.x - gk.x) < Math.abs(b.x - gk.x) ? a : b
          );
          drawArrow(gk.x / 100 * w, gk.y / 100 * h, nearDef.x / 100 * w, nearDef.y / 100 * h, "#facc15", 2, true);
        }
        // Defenders → midfielders
        defenders.forEach((d, i) => {
          if (midfielders[i]) {
            drawArrow(d.x / 100 * w, d.y / 100 * h, midfielders[i].x / 100 * w, midfielders[i].y / 100 * h, "#ffffff", 2);
          }
        });
        // Midfielders → attackers
        midfielders.forEach((m, i) => {
          if (attackers[i % attackers.length]) {
            drawArrow(m.x / 100 * w, m.y / 100 * h, attackers[i % attackers.length].x / 100 * w, attackers[i % attackers.length].y / 100 * h, "#C1D82F", 2.5);
          }
        });
      } else if (cat === "counter_attack" || cat === "transition") {
        // Fast vertical arrows from back to front
        if (defenders.length > 0 && attackers.length > 0) {
          // One long arrow from a defender to the main attacker
          const mainAttacker = attackers.reduce((a, b) => a.y < b.y ? a : b);
          const midDef = defenders[Math.floor(defenders.length / 2)];
          drawArrow(midDef.x / 100 * w, midDef.y / 100 * h, mainAttacker.x / 100 * w, mainAttacker.y / 100 * h, "#ef4444", 3);
        }
        // Midfielders sprint forward
        midfielders.forEach((m) => {
          drawArrow(m.x / 100 * w, m.y / 100 * h, m.x / 100 * w, (m.y - 18) / 100 * h, "#facc15", 2);
        });
        // Attackers spread
        attackers.forEach((a) => {
          const targetX = a.x < 50 ? a.x - 8 : a.x + 8;
          drawArrow(a.x / 100 * w, a.y / 100 * h, targetX / 100 * w, (a.y - 10) / 100 * h, "#C1D82F", 2);
        });
      } else if (cat === "pressing") {
        // Everyone pushes forward (up)
        [...defenders, ...midfielders, ...attackers].forEach((p) => {
          drawArrow(p.x / 100 * w, p.y / 100 * h, p.x / 100 * w, (p.y - 12) / 100 * h, "#ef4444", 2);
        });
        // Attackers close passing lanes (converge)
        if (attackers.length >= 2) {
          const centerX = attackers.reduce((s, a) => s + a.x, 0) / attackers.length;
          attackers.forEach((a) => {
            if (Math.abs(a.x - centerX) > 5) {
              drawArrow(a.x / 100 * w, a.y / 100 * h, (a.x + (centerX - a.x) * 0.4) / 100 * w, (a.y - 5) / 100 * h, "#facc15", 2, true);
            }
          });
        }
      } else if (cat === "corner_attack") {
        // Find the corner taker (usually at x < 10 or x > 90)
        const cornerTaker = players.find((p) => p.x < 10 || p.x > 90);
        const areaPlayers = players.filter((p) => p.y < 25 && p !== cornerTaker);
        if (cornerTaker && areaPlayers.length > 0) {
          // Arrow from corner to area
          const targetPlayer = areaPlayers[Math.floor(areaPlayers.length / 2)];
          drawArrow(cornerTaker.x / 100 * w, cornerTaker.y / 100 * h, targetPlayer.x / 100 * w, targetPlayer.y / 100 * h, "#C1D82F", 3);
          // Runs into the box
          areaPlayers.forEach((p) => {
            drawArrow(p.x / 100 * w, (p.y + 8) / 100 * h, p.x / 100 * w, p.y / 100 * h, "#ffffff", 1.5, true);
          });
        }
      } else if (cat === "corner_defense") {
        // Defensive arrows pointing outward from goal
        const outfieldPlayers = players.filter((p) => p.number !== 1);
        outfieldPlayers.forEach((p) => {
          const dirX = p.x < 50 ? -5 : p.x > 50 ? 5 : 0;
          drawArrow(p.x / 100 * w, p.y / 100 * h, (p.x + dirX) / 100 * w, (p.y + 8) / 100 * h, "#3b82f6", 2);
        });
      } else if (cat === "free_kick") {
        // Find shooter (usually two players close together)
        const sortedByY = [...players].sort((a, b) => a.y - b.y);
        const shooters = sortedByY.filter((p) => p.y < 40).slice(0, 2);
        if (shooters.length > 0) {
          // Arrow to goal
          drawArrow(shooters[0].x / 100 * w, shooters[0].y / 100 * h, 50 / 100 * w, 5 / 100 * h, "#C1D82F", 3);
        }
        // Runners into box
        const runners = sortedByY.filter((p) => p.y < 30 && !shooters.includes(p));
        runners.forEach((r) => {
          drawArrow(r.x / 100 * w, r.y / 100 * h, (r.x + (r.x < 50 ? 5 : -5)) / 100 * w, (r.y - 6) / 100 * h, "#facc15", 1.5, true);
        });
      } else if (cat === "set_piece") {
        // General movement arrows
        midfielders.forEach((m, i) => {
          if (attackers[i % attackers.length]) {
            drawArrow(m.x / 100 * w, m.y / 100 * h, attackers[i % attackers.length].x / 100 * w, attackers[i % attackers.length].y / 100 * h, "#C1D82F", 2);
          }
        });
        attackers.forEach((a) => {
          drawArrow(a.x / 100 * w, a.y / 100 * h, (a.x + (a.x < 50 ? -8 : 8)) / 100 * w, (a.y - 8) / 100 * h, "#ffffff", 2, true);
        });
      }
    }, 150);
  }, []);

  // ── Load play into whiteboard ──
  const loadPlay = useCallback((play: Play) => {
    setWbFieldType(play.fieldType);
    // Renumber players sequentially 1..N to avoid confusing numbers like 12, 45, etc.
    const renumbered = play.players.map((p, i) => ({ ...p, number: i + 1 }));
    setWbPlayers(renumbered);
    setLoadedPlay(play);
    setActiveTab("whiteboard");
    drawPlayArrows(play);
  }, [drawPlayArrows]);

  // ── Canvas resize ──
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const pitch = pitchRef.current;
      if (!canvas || !pitch) return;
      const rect = pitch.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [activeTab, wbFieldType]);

  // ── Drawing handlers ──
  const getCanvasPoint = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool !== "draw") return;
      const point = getCanvasPoint(e);
      if (!point) return;
      isDrawingRef.current = true;
      lastPointRef.current = point;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [activeTool, getCanvasPoint]
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current || activeTool !== "draw") return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const point = getCanvasPoint(e);
      if (!ctx || !point || !lastPointRef.current) return;

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPointRef.current = point;
    },
    [activeTool, drawColor, lineWidth, getCanvasPoint]
  );

  const handleCanvasPointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  // ── Clear drawing ──
  const clearDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ── Reset all ──
  const resetAll = useCallback(() => {
    clearDrawing();
    setWbPlayers(getDefaultPlayers(wbFieldType));
    setLoadedPlay(null);
  }, [clearDrawing, wbFieldType]);

  // ── Player drag handlers ──
  const handlePlayerPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      if (activeTool !== "move") return;
      e.preventDefault();
      e.stopPropagation();
      const pitch = pitchRef.current;
      if (!pitch) return;
      const rect = pitch.getBoundingClientRect();
      const playerX = (wbPlayers[idx].x / 100) * rect.width;
      const playerY = (wbPlayers[idx].y / 100) * rect.height;
      dragOffsetRef.current = {
        x: e.clientX - rect.left - playerX,
        y: e.clientY - rect.top - playerY,
      };
      setDraggingIdx(idx);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [activeTool, wbPlayers]
  );

  const handlePlayerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingIdx === null) return;
      const pitch = pitchRef.current;
      if (!pitch) return;
      e.preventDefault();
      const rect = pitch.getBoundingClientRect();
      const x = Math.max(3, Math.min(97, ((e.clientX - rect.left - dragOffsetRef.current.x) / rect.width) * 100));
      const y = Math.max(3, Math.min(97, ((e.clientY - rect.top - dragOffsetRef.current.y) / rect.height) * 100));
      setWbPlayers((prev) => {
        const next = [...prev];
        next[draggingIdx] = { ...next[draggingIdx], x, y };
        return next;
      });
    },
    [draggingIdx]
  );

  const handlePlayerPointerUp = useCallback(() => {
    setDraggingIdx(null);
  }, []);

  // ── Change field type on whiteboard ──
  const changeFieldType = useCallback(
    (ft: FieldType) => {
      setWbFieldType(ft);
      setWbPlayers(getDefaultPlayers(ft));
      setLoadedPlay(null);
      clearDrawing();
    },
    [clearDrawing]
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#C1D82F]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#C1D82F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Jugadas</h1>
            <p className="text-sm text-white/50">Biblioteca de jugadas y pizarrón interactivo</p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="mt-5 flex gap-1 bg-[#1a1f36]/60 rounded-xl p-1 w-fit border border-[#C1D82F]/10">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "library"
                ? "bg-[#C1D82F] text-[#0d1117]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Biblioteca
          </button>
          <button
            onClick={() => setActiveTab("whiteboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "whiteboard"
                ? "bg-[#C1D82F] text-[#0d1117]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <PenTool className="w-4 h-4" />
            Pizarrón
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: BIBLIOTECA DE JUGADAS
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "library" && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar jugadas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C1D82F]/30 transition-colors"
            />
          </div>

          {/* Team filter pills */}
          <div className="mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">Equipo</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTeamFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  teamFilter === "all"
                    ? "bg-[#C1D82F] text-[#0d1117]"
                    : "bg-[#1a1f36]/60 text-white/60 border border-[#C1D82F]/10 hover:border-[#C1D82F]/30"
                }`}
              >
                Todos
              </button>
              {TEAMS.map((team) => (
                <button
                  key={team}
                  onClick={() => setTeamFilter(teamFilter === team ? "all" : team)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    teamFilter === team
                      ? "bg-[#C1D82F] text-[#0d1117]"
                      : "bg-[#1a1f36]/60 text-white/60 border border-[#C1D82F]/10 hover:border-[#C1D82F]/30"
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter pills */}
          <div className="mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">Categoría</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  categoryFilter === "all"
                    ? "bg-[#C1D82F] text-[#0d1117]"
                    : "bg-[#1a1f36]/60 text-white/60 border border-[#C1D82F]/10 hover:border-[#C1D82F]/30"
                }`}
              >
                Todas
              </button>
              {(Object.keys(CATEGORY_META) as PlayCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    categoryFilter === cat
                      ? "bg-[#C1D82F] text-[#0d1117]"
                      : "bg-[#1a1f36]/60 text-white/60 border border-[#C1D82F]/10 hover:border-[#C1D82F]/30"
                  }`}
                >
                  {CATEGORY_META[cat].icon}
                  {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Field type filter */}
          <div className="mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">Tipo de campo</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFieldFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  fieldFilter === "all"
                    ? "bg-[#C1D82F] text-[#0d1117]"
                    : "bg-[#1a1f36]/60 text-white/60 border border-[#C1D82F]/10 hover:border-[#C1D82F]/30"
                }`}
              >
                Todos
              </button>
              {(["7", "9", "11"] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFieldFilter(fieldFilter === ft ? "all" : ft)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    fieldFilter === ft
                      ? "bg-[#C1D82F] text-[#0d1117]"
                      : "bg-[#1a1f36]/60 text-white/60 border border-[#C1D82F]/10 hover:border-[#C1D82F]/30"
                  }`}
                >
                  Fútbol {ft}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-white/40 mb-4">
            {filteredPlays.length} jugada{filteredPlays.length !== 1 ? "s" : ""} encontrada{filteredPlays.length !== 1 ? "s" : ""}
          </p>

          {/* Play cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPlays.map((play, i) => (
                <motion.div
                  key={play.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  onClick={() => loadPlay(play)}
                  className="group cursor-pointer rounded-2xl bg-[#1a1f36]/60 border border-[#C1D82F]/10 p-4 hover:border-[#C1D82F]/30 hover:bg-[#1a1f36]/80 transition-all"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-[#C1D82F] transition-colors truncate">
                        {play.name}
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5">{play.team}</p>
                    </div>
                    <span className="ml-2 shrink-0 px-2 py-0.5 rounded-md bg-[#C1D82F]/10 text-[#C1D82F] text-[10px] font-bold">
                      F{play.fieldType}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-white/50 leading-relaxed mb-3 line-clamp-3">
                    {play.description}
                  </p>

                  {/* Category badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/50">
                      {CATEGORY_META[play.category].icon}
                      {CATEGORY_META[play.category].label}
                    </span>
                  </div>

                  {/* Load hint */}
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-[#C1D82F]/0 group-hover:text-[#C1D82F]/70 transition-colors">
                    <ArrowRight className="w-3 h-3" />
                    Cargar en pizarrón
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredPlays.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No se encontraron jugadas con esos filtros</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: PIZARRÓN INTERACTIVO
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "whiteboard" && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* Loaded play info */}
          {loadedPlay && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl bg-gradient-to-r from-[#C1D82F]/5 via-[#1a1f36]/80 to-[#C1D82F]/5 border border-[#C1D82F]/20 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C1D82F]/10 flex items-center justify-center shrink-0">
                    {CATEGORY_META[loadedPlay.category].icon}
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#C1D82F]">{loadedPlay.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-medium text-white/60">{loadedPlay.team}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#C1D82F]/10 text-[10px] font-medium text-[#C1D82F]/80">{CATEGORY_META[loadedPlay.category].label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-medium text-white/60">Fútbol {loadedPlay.fieldType}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setLoadedPlay(null); clearDrawing(); }}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors p-1"
                >
                  ✕
                </button>
              </div>
              {/* Description */}
              <div className="px-4 pb-4 pt-1">
                <p className="text-sm text-white/70 leading-relaxed">{loadedPlay.description}</p>
              </div>
              {/* Legend */}
              <div className="px-4 pb-3 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
                <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Leyenda:</span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className="w-5 h-0.5 bg-[#C1D82F] rounded-full inline-block" /> Movimiento principal
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className="w-5 h-0.5 bg-white rounded-full inline-block" /> Pase / Apoyo
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className="w-5 h-0.5 bg-[#facc15] rounded-full inline-block" /> Carrera
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className="w-5 h-0.5 bg-[#ef4444] rounded-full inline-block" /> Presión / Ataque
                </span>
              </div>
            </motion.div>
          )}

          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#1a1f36]/60 border border-[#C1D82F]/10">
            {/* Field type selector */}
            <div className="flex gap-1 mr-3">
              {(["7", "9", "11"] as FieldType[]).map((ft) => (
                <button
                  key={ft}
                  onClick={() => changeFieldType(ft)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    wbFieldType === ft
                      ? "bg-[#C1D82F] text-[#0d1117]"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  F{ft}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Tool selector */}
            <button
              onClick={() => setActiveTool("move")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTool === "move"
                  ? "bg-[#C1D82F] text-[#0d1117]"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              Mover
            </button>
            <button
              onClick={() => setActiveTool("draw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTool === "draw"
                  ? "bg-[#C1D82F] text-[#0d1117]"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Dibujar
            </button>

            <div className="w-px h-6 bg-white/10" />

            {/* Color picker */}
            {DRAW_COLORS.map((c) => (
              <button
                key={c.color}
                onClick={() => setDrawColor(c.color)}
                title={c.label}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  drawColor === c.color ? "border-[#C1D82F] scale-110" : "border-white/20 hover:border-white/40"
                }`}
                style={{ backgroundColor: c.color }}
              />
            ))}

            <div className="w-px h-6 bg-white/10" />

            {/* Line width */}
            <button
              onClick={() => setLineWidth(2)}
              title="Línea fina"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                lineWidth === 2
                  ? "bg-[#C1D82F] text-[#0d1117]"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              Fina
            </button>
            <button
              onClick={() => setLineWidth(5)}
              title="Línea gruesa"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                lineWidth === 5
                  ? "bg-[#C1D82F] text-[#0d1117]"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <Circle className="w-3 h-3 fill-current" />
              Gruesa
            </button>

            <div className="flex-1" />

            {/* Clear buttons */}
            <button
              onClick={clearDrawing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
            >
              <Eraser className="w-3.5 h-3.5" />
              Borrar dibujo
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </div>

          {/* Pitch + Canvas */}
          <div className="max-w-3xl mx-auto">
            <div
              ref={pitchRef}
              className="relative w-full aspect-[68/100] rounded-2xl overflow-hidden border border-[#C1D82F]/20 select-none touch-none"
              onPointerMove={handlePlayerPointerMove}
              onPointerUp={handlePlayerPointerUp}
              onPointerLeave={handlePlayerPointerUp}
            >
              {/* Grass background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#1a5c2e] via-[#1e6b34] to-[#1a5c2e]" />
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 8%, rgba(255,255,255,0.12) 8%, rgba(255,255,255,0.12) 16%)",
                }}
              />

              {/* Pitch markings */}
              <div className="absolute inset-0">
                <div className="absolute inset-3 border border-white/20 rounded-lg" />
                <div className="absolute top-1/2 left-3 right-3 h-px bg-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full border border-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30" />
                {/* Top penalty area */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[44%] h-[16%] border-b border-l border-r border-white/20 rounded-b-sm" />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[18%] h-[6%] border-b border-l border-r border-white/20 rounded-b-sm" />
                {/* Bottom penalty area */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[44%] h-[16%] border-t border-l border-r border-white/20 rounded-t-sm" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[18%] h-[6%] border-t border-l border-r border-white/20 rounded-t-sm" />
              </div>

              {/* Drawing canvas overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 z-10"
                style={{ pointerEvents: activeTool === "draw" ? "auto" : "none" }}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerLeave={handleCanvasPointerUp}
              />

              {/* Formation label */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
                <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider">
                  Fútbol {wbFieldType} · {wbPlayers.length} jugadores
                </span>
              </div>

              {/* Tool indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
                <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white/50 text-[9px]">
                  {activeTool === "move" ? "Modo: Mover jugadores" : "Modo: Dibujar"}
                </span>
              </div>

              {/* Players */}
              {wbPlayers.map((player, idx) => {
                const isDragging = draggingIdx === idx;
                const isGK = player.number === 1;
                return (
                  <div
                    key={`${player.number}-${idx}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 ${
                      activeTool === "move"
                        ? isDragging
                          ? "cursor-grabbing z-30"
                          : "cursor-grab"
                        : "pointer-events-none"
                    }`}
                    style={{
                      left: `${player.x}%`,
                      top: `${player.y}%`,
                      transition: isDragging ? "none" : "left 0.3s ease, top 0.3s ease",
                      pointerEvents: activeTool === "move" ? "auto" : "none",
                    }}
                    onPointerDown={(e) => handlePlayerPointerDown(e, idx)}
                  >
                    {/* Glow */}
                    <div
                      className={`absolute -inset-1 rounded-full blur-md opacity-30 ${
                        isDragging ? "bg-[#C1D82F] opacity-50" : isGK ? "bg-[#d4af37]" : "bg-white"
                      }`}
                    />
                    {/* Circle */}
                    <div
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-xl transition-colors duration-200 ${
                        isGK
                          ? "bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#0d1117] ring-2 ring-[#d4af37]/50"
                          : "bg-gradient-to-br from-white to-gray-100 text-[#0d1117] ring-2 ring-white/50"
                      } ${isDragging ? "ring-[#C1D82F] ring-2 shadow-[0_0_20px_rgba(193,216,47,0.4)] scale-110" : ""}`}
                    >
                      {player.number}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
