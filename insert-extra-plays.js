const fs = require('fs');

const content = fs.readFileSync('src/app/coach/team/plays/page.tsx', 'utf8');

const extraPlays = `  // ── Fútbol 7 — Benfica Academy (extras) ───────────────────────────────────
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
`;

// Find the closing ]; of PLAYS_DATA (the one before "Helper: Default players")
const marker = '];\r\n\r\n// ─── Helper: Default players for empty whiteboard';
const idx = content.indexOf(marker, 1000); // skip the first ]; which is TEAMS

if (idx === -1) {
  console.log('Could not find PLAYS_DATA closing marker');
  process.exit(1);
}

const newContent = content.substring(0, idx) + extraPlays + content.substring(idx);
fs.writeFileSync('src/app/coach/team/plays/page.tsx', newContent, 'utf8');
console.log('Extra plays inserted successfully!');
