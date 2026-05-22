import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import redis from "@/lib/redis";

// ─── Constants ───

const CACHE_PREFIX = "recommendations";
const CACHE_TTL = 60 * 60 * 24; // 24 hours

// ─── Types ───

export type PlayStyle = "offensive" | "defensive" | "balanced";

export interface FormationRecommendation {
  formation: string;
  name: string;
  style: PlayStyle;
  description: string;
  strengths: string[];
  weaknesses: string[];
  effectiveness: number; // 0-100
  clubReference: string;
  justification: string;
}

export interface TacticRecommendation {
  name: string;
  description: string;
  focusAreas: string[];
  drills: string[];
  clubReference: string;
}

export interface AgeGroupProfile {
  ageGroup: "under10" | "youth" | "advanced";
  label: string;
  avgAge: number;
  philosophy: string;
  formations: FormationRecommendation[];
  tactics: TacticRecommendation[];
}

export interface RecommendationResult {
  teamId: string;
  teamName: string;
  avgAge: number;
  categories: string[];
  ageGroup: "under10" | "youth" | "advanced";
  profile: AgeGroupProfile;
  filteredFormations: FormationRecommendation[];
  generatedAt: string;
  source: string;
}

// ─── Cache Helpers ───

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    // Redis unavailable – fall through to local data
  }
  return null;
}

async function setCache(key: string, data: unknown, ttl = CACHE_TTL): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch {
    // Redis unavailable
  }
}

// ─── Local Recommendation Data (Fallback) ───

const UNDER_10_FORMATIONS: FormationRecommendation[] = [
  {
    formation: "3-3",
    name: "Triángulo Ofensivo (7v7)",
    style: "balanced",
    description: "Formación simplificada para fútbol 7 que fomenta la participación de todos los jugadores y el desarrollo individual.",
    strengths: ["Máxima participación", "Desarrollo motor", "Diversión"],
    weaknesses: ["Sin estructura táctica compleja", "Espacios amplios"],
    effectiveness: 75,
    clubReference: "Ajax Academy",
    justification: "La academia del Ajax utiliza formaciones simplificadas para menores de 10 años, priorizando el contacto con el balón y la creatividad individual sobre los resultados.",
  },
  {
    formation: "2-3-1",
    name: "Diamante Creativo (7v7)",
    style: "offensive",
    description: "Formación ofensiva para fútbol 7 que permite a los niños explorar posiciones y desarrollar habilidades con el balón.",
    strengths: ["Muchas opciones de pase", "Desarrollo técnico", "Creatividad"],
    weaknesses: ["Vulnerable en defensa", "Requiere rotación constante"],
    effectiveness: 70,
    clubReference: "FC Barcelona La Masía",
    justification: "La Masía de Barcelona enfatiza el juego posicional desde edades tempranas con formaciones que permiten triángulos de pase y rotación libre.",
  },
  {
    formation: "3-2-1",
    name: "Base Defensiva (7v7)",
    style: "defensive",
    description: "Formación con base defensiva sólida para fútbol 7, ideal para equipos que están aprendiendo conceptos de posicionamiento.",
    strengths: ["Seguridad defensiva", "Transiciones claras", "Fácil de entender"],
    weaknesses: ["Menos opciones ofensivas", "Puede ser estática"],
    effectiveness: 68,
    clubReference: "Arsenal Academy",
    justification: "La academia del Arsenal utiliza estructuras defensivas claras para enseñar conceptos de línea y cobertura desde edades tempranas.",
  },
];

const YOUTH_FORMATIONS: FormationRecommendation[] = [
  {
    formation: "4-4-2",
    name: "Clásica Equilibrada",
    style: "balanced",
    description: "Formación clásica que ofrece equilibrio entre defensa y ataque, ideal para el desarrollo táctico de jugadores de 10-14 años.",
    strengths: ["Equilibrio defensivo-ofensivo", "Fácil de entender", "Amplitud"],
    weaknesses: ["Puede faltar creatividad central", "Predecible"],
    effectiveness: 82,
    clubReference: "Arsenal Academy",
    justification: "La academia del Arsenal ha utilizado el 4-4-2 como formación base para categorías juveniles, permitiendo a los jugadores entender roles claros y transiciones.",
  },
  {
    formation: "4-3-3",
    name: "Posesión y Amplitud",
    style: "offensive",
    description: "Formación ofensiva con tres delanteros que fomenta el juego por bandas y la posesión del balón.",
    strengths: ["Amplitud ofensiva", "Presión alta", "Desarrollo técnico"],
    weaknesses: ["Mediocampo puede quedar expuesto", "Requiere extremos rápidos"],
    effectiveness: 85,
    clubReference: "FC Barcelona La Masía",
    justification: "El 4-3-3 es la formación insignia de La Masía. Barcelona la utiliza en todas sus categorías juveniles para desarrollar el juego de posesión y la presión tras pérdida.",
  },
  {
    formation: "4-4-2",
    name: "Bloque Defensivo",
    style: "defensive",
    description: "Variante defensiva del 4-4-2 con líneas compactas y transiciones rápidas al contraataque.",
    strengths: ["Solidez defensiva", "Contraataques", "Compacto"],
    weaknesses: ["Menos posesión", "Dependencia de transiciones"],
    effectiveness: 78,
    clubReference: "Ajax Academy",
    justification: "Ajax enseña a sus juveniles a defender en bloque compacto con el 4-4-2, desarrollando la disciplina táctica y la lectura del juego.",
  },
];

const ADVANCED_FORMATIONS: FormationRecommendation[] = [
  {
    formation: "4-2-3-1",
    name: "Control y Creatividad",
    style: "balanced",
    description: "Formación moderna que combina solidez defensiva con doble pivote y libertad creativa para el mediapunta.",
    strengths: ["Doble pivote protector", "Creatividad ofensiva", "Versatilidad"],
    weaknesses: ["Dependencia del mediapunta", "Requiere laterales ofensivos"],
    effectiveness: 88,
    clubReference: "Arsenal FC",
    justification: "Arsenal ha perfeccionado el 4-2-3-1 bajo múltiples entrenadores, demostrando su versatilidad para equipos que buscan control del juego con solidez defensiva.",
  },
  {
    formation: "3-5-2",
    name: "Dominio del Mediocampo",
    style: "offensive",
    description: "Formación con superioridad numérica en mediocampo, ideal para equipos con carrileros dinámicos y buen juego asociativo.",
    strengths: ["Superioridad en mediocampo", "Carrileros ofensivos", "Juego asociativo"],
    weaknesses: ["Vulnerable por bandas", "Requiere centrales rápidos"],
    effectiveness: 84,
    clubReference: "Ajax Academy",
    justification: "Ajax ha utilizado el 3-5-2 en sus equipos juveniles avanzados para desarrollar la superioridad numérica en mediocampo y el juego de posición total.",
  },
  {
    formation: "5-3-2",
    name: "Fortaleza Defensiva",
    style: "defensive",
    description: "Formación ultra-defensiva con cinco defensores que permite transiciones rápidas y contraataques letales.",
    strengths: ["Máxima solidez defensiva", "Contraataques", "Difícil de superar"],
    weaknesses: ["Menos posesión", "Puede ser muy reactiva"],
    effectiveness: 80,
    clubReference: "FC Barcelona",
    justification: "Barcelona utiliza variantes de 5 defensores en contextos tácticos específicos, enseñando a jugadores avanzados la versatilidad y adaptación táctica.",
  },
  {
    formation: "4-3-3",
    name: "Presión Alta Total",
    style: "offensive",
    description: "Variante avanzada del 4-3-3 con presión alta coordinada y juego de posición sofisticado.",
    strengths: ["Presión alta", "Recuperación rápida", "Juego posicional"],
    weaknesses: ["Espacios a la espalda", "Desgaste físico"],
    effectiveness: 86,
    clubReference: "FC Barcelona La Masía",
    justification: "La versión avanzada del 4-3-3 de Barcelona incluye movimientos coordinados de presión y basculación que se enseñan a partir de los 15 años en La Masía.",
  },
];

const UNDER_10_TACTICS: TacticRecommendation[] = [
  {
    name: "Juego Libre Guiado",
    description: "Enfoque en la diversión y el desarrollo motor. Los jugadores rotan posiciones cada período para experimentar todos los roles.",
    focusAreas: ["Coordinación motriz", "Contacto con el balón", "Diversión"],
    drills: ["Rondos 3v1", "Juegos de posesión 4v4", "Circuitos de habilidad"],
    clubReference: "Ajax Academy",
  },
  {
    name: "Desarrollo Individual",
    description: "Sesiones enfocadas en habilidades individuales: control, conducción, regate y tiro. Sin énfasis en resultados.",
    focusAreas: ["Control de balón", "Regate", "Tiro básico"],
    drills: ["1v1 en espacios reducidos", "Conducción con obstáculos", "Juegos de finalización"],
    clubReference: "FC Barcelona La Masía",
  },
];

const YOUTH_TACTICS: TacticRecommendation[] = [
  {
    name: "Juego de Posesión",
    description: "Desarrollo del juego de posesión con énfasis en pases cortos, movimiento sin balón y creación de triángulos.",
    focusAreas: ["Pase corto", "Movimiento sin balón", "Visión de juego"],
    drills: ["Rondos 5v2", "Posesión 6v6 con comodines", "Juego posicional en zonas"],
    clubReference: "FC Barcelona La Masía",
  },
  {
    name: "Transiciones Rápidas",
    description: "Trabajo en transiciones defensa-ataque y ataque-defensa, desarrollando la lectura del juego y la toma de decisiones.",
    focusAreas: ["Transición ofensiva", "Transición defensiva", "Toma de decisiones"],
    drills: ["Juegos de transición 4v4+4", "Contraataques 3v2", "Pressing tras pérdida"],
    clubReference: "Ajax Academy",
  },
];

const ADVANCED_TACTICS: TacticRecommendation[] = [
  {
    name: "Pressing Coordinado",
    description: "Sistema de presión alta coordinada con gatillos de presión definidos y basculación defensiva.",
    focusAreas: ["Presión alta", "Basculación", "Recuperación de balón"],
    drills: ["Pressing 11v11 por zonas", "Gatillos de presión", "Juegos de superioridad"],
    clubReference: "Arsenal FC",
  },
  {
    name: "Juego Posicional Avanzado",
    description: "Sistema táctico complejo con rotaciones posicionales, superioridades numéricas y salida de balón desde atrás.",
    focusAreas: ["Rotaciones posicionales", "Salida de balón", "Superioridades"],
    drills: ["Salida de balón 4+GK v 3", "Juego posicional 8v8", "Movimientos coordinados"],
    clubReference: "FC Barcelona",
  },
];

// ─── Age Group Classification ───

function classifyAgeGroup(avgAge: number): "under10" | "youth" | "advanced" {
  if (avgAge < 10) return "under10";
  if (avgAge <= 14) return "youth";
  return "advanced";
}

function getAgeGroupLabel(group: "under10" | "youth" | "advanced"): string {
  switch (group) {
    case "under10": return "Menores de 10 años";
    case "youth": return "Juvenil (10-14 años)";
    case "advanced": return "Avanzado (>14 años)";
  }
}

function getAgeGroupPhilosophy(group: "under10" | "youth" | "advanced"): string {
  switch (group) {
    case "under10":
      return "Enfoque en diversión, desarrollo motor y habilidades individuales. Las formaciones son simplificadas (fútbol 7) y los jugadores rotan posiciones para experimentar todos los roles. No se enfatiza el resultado sino el aprendizaje.";
    case "youth":
      return "Transición hacia el fútbol 11 con formaciones básicas. Énfasis en desarrollo técnico, comprensión táctica inicial, juego de posesión y trabajo en equipo. Se introducen conceptos de posicionamiento y roles específicos.";
    case "advanced":
      return "Formaciones avanzadas con tácticas complejas. Desarrollo de sistemas de juego sofisticados, presión coordinada, transiciones rápidas y adaptación táctica. Preparación para el fútbol competitivo de alto nivel.";
  }
}

function getFormationsForGroup(group: "under10" | "youth" | "advanced"): FormationRecommendation[] {
  switch (group) {
    case "under10": return UNDER_10_FORMATIONS;
    case "youth": return YOUTH_FORMATIONS;
    case "advanced": return ADVANCED_FORMATIONS;
  }
}

function getTacticsForGroup(group: "under10" | "youth" | "advanced"): TacticRecommendation[] {
  switch (group) {
    case "under10": return UNDER_10_TACTICS;
    case "youth": return YOUTH_TACTICS;
    case "advanced": return ADVANCED_TACTICS;
  }
}

// ─── Core Functions ───

export async function calculateTeamAvgAge(teamId: string): Promise<number> {
  const activePlayers = await prisma.teamPlayer.findMany({
    where: { teamId, leftAt: null },
    include: { player: { select: { birthDate: true } } },
  });

  if (activePlayers.length === 0) return 0;

  const now = new Date();
  const ages = activePlayers.map((tp) => {
    const birth = new Date(tp.player.birthDate);
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  });

  const sum = ages.reduce((a, b) => a + b, 0);
  return Math.round((sum / ages.length) * 10) / 10;
}

export async function getTeamCategories(teamId: string): Promise<string[]> {
  const teamCats = await prisma.teamCategory.findMany({
    where: { teamId },
    include: { category: { select: { name: true } } },
  });
  return teamCats.map((tc) => tc.category.name);
}

function buildAgeGroupProfile(ageGroup: "under10" | "youth" | "advanced", avgAge: number): AgeGroupProfile {
  return {
    ageGroup,
    label: getAgeGroupLabel(ageGroup),
    avgAge,
    philosophy: getAgeGroupPhilosophy(ageGroup),
    formations: getFormationsForGroup(ageGroup),
    tactics: getTacticsForGroup(ageGroup),
  };
}

function filterByPlayStyle(formations: FormationRecommendation[], style?: PlayStyle): FormationRecommendation[] {
  if (!style) return formations;
  return formations.filter((f) => f.style === style);
}

// ─── Persistent Cache (DB fallback) ───

async function getDbCachedRecommendation(teamId: string): Promise<RecommendationResult | null> {
  try {
    const cached = await prisma.recommendationCache.findFirst({
      where: {
        teamId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { cachedAt: "desc" },
    });

    if (cached) {
      return cached.recommendations as unknown as RecommendationResult;
    }
  } catch {
    // DB error – return null
  }
  return null;
}

async function saveDbCachedRecommendation(teamId: string, result: RecommendationResult, avgAge: number, categories: string[]): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL * 1000);
    await prisma.recommendationCache.create({
      data: {
        teamId,
        category: categories.join(", "),
        avgAge,
        recommendations: result as unknown as Prisma.InputJsonValue,
        source: "local",
        expiresAt,
      },
    });
  } catch {
    // DB error – silently fail
  }
}

// ─── Main Recommendation Function ───

export async function getRecommendations(
  teamId: string,
  playStyle?: PlayStyle
): Promise<RecommendationResult> {
  // 1. Check Redis cache
  const cacheKey = `${CACHE_PREFIX}:team:${teamId}`;
  const redisCached = await getCached<RecommendationResult>(cacheKey);
  if (redisCached) {
    return {
      ...redisCached,
      filteredFormations: filterByPlayStyle(redisCached.profile.formations, playStyle),
    };
  }

  // 2. Check DB cache (persistent fallback)
  const dbCached = await getDbCachedRecommendation(teamId);
  if (dbCached) {
    // Re-populate Redis
    await setCache(cacheKey, dbCached, CACHE_TTL);
    return {
      ...dbCached,
      filteredFormations: filterByPlayStyle(dbCached.profile.formations, playStyle),
    };
  }

  // 3. Build fresh recommendations
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  if (!team) {
    throw new Error(`Team not found: ${teamId}`);
  }

  const [avgAge, categories] = await Promise.all([
    calculateTeamAvgAge(teamId),
    getTeamCategories(teamId),
  ]);

  const ageGroup = classifyAgeGroup(avgAge);
  const profile = buildAgeGroupProfile(ageGroup, avgAge);

  const result: RecommendationResult = {
    teamId,
    teamName: team.name,
    avgAge,
    categories,
    ageGroup,
    profile,
    filteredFormations: filterByPlayStyle(profile.formations, playStyle),
    generatedAt: new Date().toISOString(),
    source: "local",
  };

  // 4. Cache in Redis and DB
  await setCache(cacheKey, result, CACHE_TTL);
  await saveDbCachedRecommendation(teamId, result, avgAge, categories);

  return result;
}

// ─── Invalidation ───

export async function invalidateRecommendationCache(teamId: string): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}:team:${teamId}`;
  try {
    await redis.del(cacheKey);
  } catch {
    // Redis unavailable
  }
}
