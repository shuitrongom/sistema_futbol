import { createPrismaClient } from "../lib/create-client";

const prisma = createPrismaClient();

// ─── Types ───

interface FormationEffectiveness {
  formation: string;
  name: string;
  style: "offensive" | "defensive" | "balanced";
  effectiveness: number;
  clubReference: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  justification: string;
}

interface TacticRecommendation {
  name: string;
  description: string;
  focusAreas: string[];
  drills: string[];
  clubReference: string;
}

interface AgeGroupRecommendation {
  category: string;
  avgAge: number;
  ageGroup: string;
  label: string;
  philosophy: string;
  formations: FormationEffectiveness[];
  tactics: TacticRecommendation[];
}

// ─── Under 10 (Infantil Menor) ───
// Based on Barcelona La Masía, Ajax Academy, Arsenal Academy methodologies
// At this age, focus is on fun, motor development, and individual skills (7v7 format)

const under10Recommendations: AgeGroupRecommendation[] = [
  {
    category: "infantil",
    avgAge: 8.0,
    ageGroup: "under10",
    label: "Menores de 10 años",
    philosophy:
      "Enfoque en diversión, desarrollo motor y habilidades individuales. Formaciones simplificadas (fútbol 7) con rotación de posiciones. No se enfatiza el resultado sino el aprendizaje. Basado en metodologías de La Masía (Barcelona), Ajax Academy y Arsenal Academy.",
    formations: [
      {
        formation: "3-3",
        name: "Triángulo Ofensivo (7v7)",
        style: "balanced",
        effectiveness: 75,
        clubReference: "Ajax Academy",
        description: "Formación simplificada para fútbol 7 que fomenta la participación de todos los jugadores.",
        strengths: ["Máxima participación", "Desarrollo motor", "Diversión"],
        weaknesses: ["Sin estructura táctica compleja", "Espacios amplios"],
        justification: "Ajax prioriza el contacto con el balón y la creatividad individual sobre los resultados en menores de 10 años.",
      },
      {
        formation: "2-3-1",
        name: "Diamante Creativo (7v7)",
        style: "offensive",
        effectiveness: 70,
        clubReference: "FC Barcelona La Masía",
        description: "Formación ofensiva para fútbol 7 que permite explorar posiciones y desarrollar habilidades con el balón.",
        strengths: ["Muchas opciones de pase", "Desarrollo técnico", "Creatividad"],
        weaknesses: ["Vulnerable en defensa", "Requiere rotación constante"],
        justification: "La Masía enfatiza el juego posicional desde edades tempranas con formaciones que permiten triángulos de pase.",
      },
      {
        formation: "3-2-1",
        name: "Base Defensiva (7v7)",
        style: "defensive",
        effectiveness: 68,
        clubReference: "Arsenal Academy",
        description: "Formación con base defensiva sólida para fútbol 7, ideal para equipos aprendiendo conceptos de posicionamiento.",
        strengths: ["Seguridad defensiva", "Transiciones claras", "Fácil de entender"],
        weaknesses: ["Menos opciones ofensivas", "Puede ser estática"],
        justification: "Arsenal utiliza estructuras defensivas claras para enseñar conceptos de línea y cobertura desde edades tempranas.",
      },
    ],
    tactics: [
      {
        name: "Juego Libre Guiado",
        description: "Enfoque en diversión y desarrollo motor. Rotación de posiciones cada período.",
        focusAreas: ["Coordinación motriz", "Contacto con el balón", "Diversión"],
        drills: ["Rondos 3v1", "Juegos de posesión 4v4", "Circuitos de habilidad"],
        clubReference: "Ajax Academy",
      },
      {
        name: "Desarrollo Individual",
        description: "Sesiones enfocadas en habilidades individuales: control, conducción, regate y tiro.",
        focusAreas: ["Control de balón", "Regate", "Tiro básico"],
        drills: ["1v1 en espacios reducidos", "Conducción con obstáculos", "Juegos de finalización"],
        clubReference: "FC Barcelona La Masía",
      },
    ],
  },
];

// ─── Youth 10-14 (Infantil / Juvenil) ───
// Transition to 11-a-side with basic formations

const youth1014Recommendations: AgeGroupRecommendation[] = [
  {
    category: "infantil",
    avgAge: 11.0,
    ageGroup: "youth",
    label: "Infantil (10-12 años)",
    philosophy:
      "Transición al fútbol 11 con formaciones básicas. Énfasis en desarrollo técnico, comprensión táctica inicial, juego de posesión y trabajo en equipo. Se introducen conceptos de posicionamiento y roles específicos.",
    formations: [
      {
        formation: "4-4-2",
        name: "Clásica Equilibrada",
        style: "balanced",
        effectiveness: 82,
        clubReference: "Arsenal Academy",
        description: "Formación clásica que ofrece equilibrio entre defensa y ataque para desarrollo táctico.",
        strengths: ["Equilibrio defensivo-ofensivo", "Fácil de entender", "Amplitud"],
        weaknesses: ["Puede faltar creatividad central", "Predecible"],
        justification: "Arsenal ha utilizado el 4-4-2 como formación base para categorías juveniles, permitiendo roles claros y transiciones.",
      },
      {
        formation: "4-3-3",
        name: "Posesión y Amplitud",
        style: "offensive",
        effectiveness: 85,
        clubReference: "FC Barcelona La Masía",
        description: "Formación ofensiva con tres delanteros que fomenta el juego por bandas y la posesión.",
        strengths: ["Amplitud ofensiva", "Presión alta", "Desarrollo técnico"],
        weaknesses: ["Mediocampo puede quedar expuesto", "Requiere extremos rápidos"],
        justification: "El 4-3-3 es la formación insignia de La Masía. Barcelona la utiliza en todas sus categorías juveniles para desarrollar posesión y presión tras pérdida.",
      },
      {
        formation: "4-4-2",
        name: "Bloque Defensivo",
        style: "defensive",
        effectiveness: 78,
        clubReference: "Ajax Academy",
        description: "Variante defensiva del 4-4-2 con líneas compactas y transiciones rápidas al contraataque.",
        strengths: ["Solidez defensiva", "Contraataques", "Compacto"],
        weaknesses: ["Menos posesión", "Dependencia de transiciones"],
        justification: "Ajax enseña a sus juveniles a defender en bloque compacto con el 4-4-2, desarrollando disciplina táctica.",
      },
    ],
    tactics: [
      {
        name: "Juego de Posesión",
        description: "Desarrollo del juego de posesión con pases cortos, movimiento sin balón y triángulos.",
        focusAreas: ["Pase corto", "Movimiento sin balón", "Visión de juego"],
        drills: ["Rondos 5v2", "Posesión 6v6 con comodines", "Juego posicional en zonas"],
        clubReference: "FC Barcelona La Masía",
      },
      {
        name: "Transiciones Rápidas",
        description: "Trabajo en transiciones defensa-ataque y ataque-defensa, lectura del juego y toma de decisiones.",
        focusAreas: ["Transición ofensiva", "Transición defensiva", "Toma de decisiones"],
        drills: ["Juegos de transición 4v4+4", "Contraataques 3v2", "Pressing tras pérdida"],
        clubReference: "Ajax Academy",
      },
    ],
  },
  {
    category: "juvenil",
    avgAge: 13.0,
    ageGroup: "youth",
    label: "Juvenil (12-14 años)",
    philosophy:
      "Consolidación del fútbol 11 con formaciones intermedias. Mayor énfasis en comprensión táctica, juego colectivo, y desarrollo de roles específicos por posición.",
    formations: [
      {
        formation: "4-3-3",
        name: "Posesión Avanzada",
        style: "offensive",
        effectiveness: 86,
        clubReference: "FC Barcelona La Masía",
        description: "4-3-3 con mayor complejidad táctica, rotaciones posicionales y presión coordinada.",
        strengths: ["Juego posicional", "Presión alta coordinada", "Creatividad"],
        weaknesses: ["Requiere alto nivel técnico", "Espacios a la espalda"],
        justification: "A los 12-14 años, La Masía introduce rotaciones posicionales dentro del 4-3-3 y presión coordinada tras pérdida.",
      },
      {
        formation: "4-4-2",
        name: "Equilibrio Táctico",
        style: "balanced",
        effectiveness: 80,
        clubReference: "Arsenal Academy",
        description: "4-4-2 con mayor sofisticación táctica, basculaciones y cambios de orientación.",
        strengths: ["Versatilidad", "Basculación defensiva", "Transiciones"],
        weaknesses: ["Puede ser predecible", "Mediocampo plano"],
        justification: "Arsenal desarrolla la versatilidad táctica en juveniles con el 4-4-2 como base para entender sistemas más complejos.",
      },
      {
        formation: "4-2-3-1",
        name: "Doble Pivote Juvenil",
        style: "defensive",
        effectiveness: 79,
        clubReference: "Ajax Academy",
        description: "Introducción al doble pivote con mediapunta, equilibrando solidez defensiva y creatividad.",
        strengths: ["Doble pivote protector", "Mediapunta creativo", "Equilibrio"],
        weaknesses: ["Complejidad para la edad", "Requiere mediapunta talentoso"],
        justification: "Ajax introduce el 4-2-3-1 en categorías juveniles avanzadas para desarrollar la comprensión de sistemas modernos.",
      },
    ],
    tactics: [
      {
        name: "Pressing Coordinado Básico",
        description: "Introducción a la presión alta coordinada con gatillos de presión simples.",
        focusAreas: ["Presión alta", "Gatillos de presión", "Trabajo colectivo"],
        drills: ["Pressing por zonas 8v8", "Recuperación en 5 segundos", "Juegos de superioridad"],
        clubReference: "FC Barcelona La Masía",
      },
      {
        name: "Construcción desde Atrás",
        description: "Salida de balón desde el portero con opciones de pase corto y largo según presión rival.",
        focusAreas: ["Salida de balón", "Toma de decisiones", "Pase bajo presión"],
        drills: ["Salida 4+GK v 3", "Juego posicional 6v4", "Progresión por zonas"],
        clubReference: "Ajax Academy",
      },
    ],
  },
];

// ─── Advanced 14+ (Juvenil Avanzado / Profesional / Amateur) ───

const advanced14PlusRecommendations: AgeGroupRecommendation[] = [
  {
    category: "juvenil",
    avgAge: 15.5,
    ageGroup: "advanced",
    label: "Juvenil Avanzado (14-17 años)",
    philosophy:
      "Formaciones avanzadas con tácticas complejas. Desarrollo de sistemas de juego sofisticados, presión coordinada, transiciones rápidas y adaptación táctica. Preparación para el fútbol competitivo de alto nivel.",
    formations: [
      {
        formation: "4-2-3-1",
        name: "Control y Creatividad",
        style: "balanced",
        effectiveness: 88,
        clubReference: "Arsenal FC",
        description: "Formación moderna con doble pivote y libertad creativa para el mediapunta.",
        strengths: ["Doble pivote protector", "Creatividad ofensiva", "Versatilidad"],
        weaknesses: ["Dependencia del mediapunta", "Requiere laterales ofensivos"],
        justification: "Arsenal ha perfeccionado el 4-2-3-1, demostrando su versatilidad para equipos que buscan control con solidez defensiva.",
      },
      {
        formation: "3-5-2",
        name: "Dominio del Mediocampo",
        style: "offensive",
        effectiveness: 84,
        clubReference: "Ajax Academy",
        description: "Superioridad numérica en mediocampo con carrileros dinámicos y juego asociativo.",
        strengths: ["Superioridad en mediocampo", "Carrileros ofensivos", "Juego asociativo"],
        weaknesses: ["Vulnerable por bandas", "Requiere centrales rápidos"],
        justification: "Ajax utiliza el 3-5-2 en juveniles avanzados para desarrollar superioridad numérica y juego de posición total.",
      },
      {
        formation: "4-3-3",
        name: "Presión Alta Total",
        style: "offensive",
        effectiveness: 86,
        clubReference: "FC Barcelona La Masía",
        description: "Variante avanzada del 4-3-3 con presión alta coordinada y juego de posición sofisticado.",
        strengths: ["Presión alta", "Recuperación rápida", "Juego posicional"],
        weaknesses: ["Espacios a la espalda", "Desgaste físico"],
        justification: "La versión avanzada del 4-3-3 de Barcelona incluye movimientos coordinados de presión que se enseñan a partir de los 15 años.",
      },
      {
        formation: "5-3-2",
        name: "Fortaleza Defensiva",
        style: "defensive",
        effectiveness: 80,
        clubReference: "FC Barcelona",
        description: "Formación defensiva con cinco defensores para transiciones rápidas y contraataques.",
        strengths: ["Máxima solidez defensiva", "Contraataques", "Difícil de superar"],
        weaknesses: ["Menos posesión", "Puede ser muy reactiva"],
        justification: "Barcelona utiliza variantes de 5 defensores en contextos tácticos específicos, enseñando versatilidad y adaptación.",
      },
    ],
    tactics: [
      {
        name: "Pressing Coordinado Avanzado",
        description: "Sistema de presión alta con gatillos definidos, basculación defensiva y trampas de presión.",
        focusAreas: ["Presión alta", "Basculación", "Recuperación de balón"],
        drills: ["Pressing 11v11 por zonas", "Gatillos de presión", "Trampas de presión"],
        clubReference: "Arsenal FC",
      },
      {
        name: "Juego Posicional Avanzado",
        description: "Sistema táctico complejo con rotaciones posicionales, superioridades numéricas y salida desde atrás.",
        focusAreas: ["Rotaciones posicionales", "Salida de balón", "Superioridades"],
        drills: ["Salida de balón 4+GK v 3", "Juego posicional 8v8", "Movimientos coordinados"],
        clubReference: "FC Barcelona",
      },
    ],
  },
  {
    category: "profesional",
    avgAge: 22.0,
    ageGroup: "advanced",
    label: "Profesional (18+ años)",
    philosophy:
      "Sistemas tácticos de élite con máxima complejidad. Adaptación táctica según rival, múltiples esquemas por partido, y ejecución precisa de planes de juego. Referencia directa a metodologías de primer equipo.",
    formations: [
      {
        formation: "4-2-3-1",
        name: "Sistema Moderno Completo",
        style: "balanced",
        effectiveness: 90,
        clubReference: "Arsenal FC",
        description: "Sistema táctico completo con doble pivote, mediapunta libre y laterales proyectados.",
        strengths: ["Máxima versatilidad", "Control del juego", "Adaptabilidad"],
        weaknesses: ["Requiere jugadores polivalentes", "Complejidad alta"],
        justification: "El 4-2-3-1 de Arsenal representa el equilibrio perfecto entre solidez y creatividad a nivel profesional.",
      },
      {
        formation: "4-3-3",
        name: "Tiki-Taka Profesional",
        style: "offensive",
        effectiveness: 92,
        clubReference: "FC Barcelona",
        description: "El sistema de juego de posesión de Barcelona llevado a su máxima expresión profesional.",
        strengths: ["Posesión dominante", "Presión asfixiante", "Juego combinativo"],
        weaknesses: ["Vulnerable a contraataques rápidos", "Requiere técnica excepcional"],
        justification: "El 4-3-3 de Barcelona es el sistema más exitoso del fútbol moderno, con posesión superior al 65% y presión tras pérdida.",
      },
      {
        formation: "3-4-3",
        name: "Fútbol Total",
        style: "offensive",
        effectiveness: 87,
        clubReference: "Ajax",
        description: "El concepto de Fútbol Total del Ajax con intercambio constante de posiciones y superioridad numérica.",
        strengths: ["Intercambio posicional", "Superioridad numérica", "Impredecible"],
        weaknesses: ["Requiere condición física excepcional", "Vulnerable en transiciones"],
        justification: "El Fútbol Total del Ajax revolucionó el fútbol con su concepto de jugadores universales e intercambio posicional.",
      },
      {
        formation: "5-4-1",
        name: "Bloque Bajo Profesional",
        style: "defensive",
        effectiveness: 83,
        clubReference: "Arsenal FC",
        description: "Sistema defensivo profesional con bloque bajo compacto y transiciones letales.",
        strengths: ["Solidez máxima", "Contraataques letales", "Disciplina táctica"],
        weaknesses: ["Poca posesión", "Dependencia de transiciones"],
        justification: "Arsenal ha demostrado que un bloque bajo bien organizado puede neutralizar a los mejores equipos del mundo.",
      },
    ],
    tactics: [
      {
        name: "Adaptación Táctica por Rival",
        description: "Capacidad de cambiar sistema durante el partido según el contexto y el rival.",
        focusAreas: ["Lectura del juego", "Cambios tácticos", "Comunicación"],
        drills: ["Simulación de escenarios", "Cambios de sistema en vivo", "Análisis de video"],
        clubReference: "Arsenal FC",
      },
      {
        name: "Posesión de Élite",
        description: "Sistema de posesión con salida desde el portero, progresión por zonas y finalización.",
        focusAreas: ["Salida de balón", "Progresión", "Finalización"],
        drills: ["Juego posicional 11v11", "Salida bajo presión", "Ataque organizado"],
        clubReference: "FC Barcelona",
      },
    ],
  },
  {
    category: "amateur",
    avgAge: 25.0,
    ageGroup: "advanced",
    label: "Amateur (adultos)",
    philosophy:
      "Formaciones prácticas y adaptables para equipos con entrenamiento limitado. Énfasis en organización simple, roles claros y aprovechamiento de fortalezas individuales.",
    formations: [
      {
        formation: "4-4-2",
        name: "Clásica Amateur",
        style: "balanced",
        effectiveness: 85,
        clubReference: "Arsenal Academy",
        description: "La formación más efectiva para equipos amateur por su simplicidad y equilibrio.",
        strengths: ["Fácil de implementar", "Roles claros", "Equilibrio natural"],
        weaknesses: ["Predecible", "Mediocampo puede quedar expuesto"],
        justification: "La base del 4-4-2 enseñada en Arsenal es ideal para equipos con tiempo de entrenamiento limitado.",
      },
      {
        formation: "4-3-3",
        name: "Ofensiva Directa",
        style: "offensive",
        effectiveness: 80,
        clubReference: "Ajax",
        description: "Versión simplificada del 4-3-3 con énfasis en amplitud y juego directo por bandas.",
        strengths: ["Amplitud", "Opciones ofensivas", "Presión natural"],
        weaknesses: ["Requiere extremos con desborde", "Mediocampo reducido"],
        justification: "Los principios básicos del 4-3-3 de Ajax son aplicables a nivel amateur con simplificaciones tácticas.",
      },
      {
        formation: "5-4-1",
        name: "Muro Defensivo",
        style: "defensive",
        effectiveness: 82,
        clubReference: "Arsenal FC",
        description: "Sistema defensivo sólido ideal para equipos que enfrentan rivales superiores.",
        strengths: ["Máxima solidez", "Fácil de organizar", "Contraataques"],
        weaknesses: ["Poca posesión", "Puede ser aburrido"],
        justification: "Un bloque defensivo bien organizado es la herramienta más efectiva para equipos amateur contra rivales superiores.",
      },
    ],
    tactics: [
      {
        name: "Organización Defensiva Simple",
        description: "Sistema defensivo basado en líneas compactas y coberturas claras.",
        focusAreas: ["Líneas defensivas", "Coberturas", "Comunicación"],
        drills: ["Basculación 4v0", "Pressing por zonas simplificado", "Juegos de posición 6v6"],
        clubReference: "Arsenal Academy",
      },
      {
        name: "Transiciones Directas",
        description: "Aprovechamiento de recuperaciones para transiciones rápidas y directas.",
        focusAreas: ["Transición rápida", "Pase largo", "Desmarques"],
        drills: ["Contraataques 3v2", "Juegos de transición 5v5", "Pases largos en movimiento"],
        clubReference: "Ajax",
      },
    ],
  },
];

// ─── All recommendations combined ───

const allRecommendations: AgeGroupRecommendation[] = [
  ...under10Recommendations,
  ...youth1014Recommendations,
  ...advanced14PlusRecommendations,
];


// ─── Seed Function ───

export async function seedRecommendations() {
  const existingCount = await prisma.recommendationCache.count();
  if (existingCount > 0) {
    console.log(
      `Skipping recommendations seed: ${existingCount} records already exist.`
    );
    return;
  }

  console.log(`Seeding ${allRecommendations.length} recommendation entries...`);

  // Set expiration far in the future for seed data (10 years)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 10);

  for (const rec of allRecommendations) {
    await prisma.recommendationCache.create({
      data: {
        category: rec.category,
        avgAge: rec.avgAge,
        recommendations: JSON.parse(JSON.stringify({
          ageGroup: rec.ageGroup,
          label: rec.label,
          philosophy: rec.philosophy,
          formations: rec.formations,
          tactics: rec.tactics,
        })),
        source: `seed:${rec.ageGroup}:${rec.category}`,
        cachedAt: new Date(),
        expiresAt,
      },
    });
  }

  console.log(
    `✅ ${allRecommendations.length} recommendation entries seeded successfully.`
  );
}

// Allow running standalone
if (require.main === module) {
  seedRecommendations()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
