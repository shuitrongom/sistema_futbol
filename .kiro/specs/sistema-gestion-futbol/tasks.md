# Tareas de Implementación - Sistema de Gestión de Fútbol

## Tarea 1: Configuración del Proyecto e Infraestructura Base
- [x] 1. Configuración del Proyecto e Infraestructura Base
  - [x] 1.1 Inicializar proyecto Next.js 14 con App Router y TypeScript, instalar dependencias (tailwindcss, shadcn/ui, prisma, next-auth, zod, react-hook-form, zustand, @tanstack/react-query, recharts, framer-motion, lucide-react, bcrypt, ioredis)
  - [x] 1.2 Configurar Prisma ORM con PostgreSQL: crear schema.prisma con todos los enums (user_role, tournament_format, tournament_status, match_status, phase_type, player_position, task_status, feedback_type, eval_context, strategy_type) y las tablas base (users, categories, teams, team_categories, players, team_players, tournaments, tournament_categories, tournament_teams)
  - [x] 1.3 Agregar al schema.prisma las tablas de partidos y estadísticas (phases, locations, matches, match_events, standings, suspensions, tactics, parent_players, notification_preferences)
  - [x] 1.4 Agregar al schema.prisma las tablas de entrenamiento y evaluación (exercises, exercise_favorites, training_plans, training_sessions, session_exercises, player_evaluations, feedback_360_sessions, feedback_360_evaluators, individual_tasks, task_assignments, development_objectives, personalized_feedback, progress_reports, development_plans, recommendation_cache, notification_log, audit_log)
  - [x] 1.5 Crear migración inicial de Prisma y generar cliente, configurar lib/prisma.ts con singleton pattern
  - [x] 1.6 Configurar Redis client en lib/redis.ts con ioredis para caché y sesiones
  - [x] 1.7 Configurar Tailwind CSS con la paleta de colores profesional del diseño (--primary: #1a472a, --secondary: #d4af37, --accent: #e63946, --bg-dark: #0f1923) y tipografía Inter + JetBrains Mono
  - [x] 1.8 Inicializar shadcn/ui y agregar componentes base: Button, Input, Card, Table, Dialog, Select, Tabs, Badge, Avatar, DropdownMenu, Sheet, Tooltip

## Tarea 2: Autenticación y Sistema de Roles
- [x] 2. Autenticación y Sistema de Roles
  - [x] 2.1 Configurar NextAuth.js con CredentialsProvider en app/api/auth/[...nextauth]/route.ts, JWT strategy con payload {userId, role, teamId}, expiración 24h, y bcrypt para verificación de passwords
  - [x] 2.2 Crear lib/auth.ts con helpers: getCurrentUser(), requireRole(roles[]), requireTeamAccess(teamId), y middleware de autorización que verifica rol y acceso a recursos
  - [x] 2.3 Crear lib/utils/permissions.ts con funciones de verificación por rol (canManageTournaments, canManageTeam, canAccessPlayer, etc.) según Requisito 20
  - [x] 2.4 Crear páginas de login (app/(auth)/login/page.tsx) y registro (app/(auth)/register/page.tsx) con formularios React Hook Form + Zod validation
  - [x] 2.5 Crear middleware.ts de Next.js para proteger rutas /admin (solo admin), /coach (solo coach), /parent (solo parent) con redirección a login
  - [x] 2.6 Crear lib/utils/audit.ts con función logAudit(userId, action, resourceType, resourceId, details) que registra en tabla audit_log
  - [x] 2.7 Crear seed script (prisma/seed.ts) que crea usuario admin por defecto con credenciales configurables por env vars

## Tarea 3: Módulo de Categorías y Ubicaciones (Admin)
- [x] 3. Módulo de Categorías y Ubicaciones
  - [x] 3.1 Crear API routes para categorías: GET/POST /api/categories, GET/PUT/DELETE /api/categories/[id] con validación Zod y autorización admin
  - [x] 3.2 Crear API routes para ubicaciones: GET/POST /api/locations, GET/PUT/DELETE /api/locations/[id] con validación de no eliminar ubicaciones con partidos programados
  - [x] 3.3 Crear lib/services/category.service.ts y lib/services/location.service.ts con lógica de negocio
  - [x] 3.4 Crear páginas admin para categorías (app/admin/categories/) con tabla listado, formulario crear/editar en Dialog, y botón eliminar con confirmación
  - [x] 3.5 Crear páginas admin para ubicaciones (app/admin/locations/) con tabla listado, formulario crear/editar, y verificación de disponibilidad

## Tarea 4: Módulo de Equipos y Jugadores
- [x] 4. Módulo de Equipos y Jugadores
  - [x] 4.1 Crear lib/services/team.service.ts con CRUD completo, validación de nombre único, prevención de eliminación si participa en torneo activo, y asignación de entrenador
  - [x] 4.2 Crear API routes para equipos: GET/POST /api/teams, GET/PUT/DELETE /api/teams/[id], POST/DELETE /api/teams/[id]/players con autorización admin o coach(propio)
  - [x] 4.3 Crear lib/services/player.service.ts con registro, validación de id_number único, validación de fecha nacimiento, y asignación a equipos con jersey_number único
  - [x] 4.4 Crear API routes para jugadores: GET/POST /api/players, GET/PUT /api/players/[id] con autorización admin o coach(propio equipo)
  - [x] 4.5 Crear páginas admin para equipos (app/admin/teams/) con tabla, formulario con campos de equipo + uniformes (colores, imágenes), asignación de categorías y entrenador
  - [x] 4.6 Crear páginas admin para jugadores (app/admin/players/) con tabla, formulario de registro, y asignación a equipos con número de camiseta
  - [x] 4.7 Crear componente UniformDisplay.tsx que muestra visualización gráfica de uniformes local/visitante con colores y preview de imagen
  - [x] 4.8 Crear componente PlayerCard.tsx con diseño profesional: foto, nombre, posición, número, estadísticas destacadas


## Tarea 5: Módulo de Torneos
- [x] 5. Módulo de Torneos
  - [x] 5.1 Crear lib/services/tournament.service.ts con CRUD, validación de estados (draft→registration→in_progress→completed/cancelled), y verificación de categorías permitidas al inscribir equipos
  - [x] 5.2 Crear API routes para torneos: GET/POST /api/tournaments, GET/PUT/DELETE /api/tournaments/[id], POST/DELETE /api/tournaments/[id]/teams/[teamId] con validación de max_teams, duplicados, y categoría
  - [x] 5.3 Crear lib/services/fixture-generator.service.ts con algoritmo round-robin para formato liga (ida y vuelta), bracket para eliminación directa, y grupos+eliminatorias para formato mixto, respetando máximo 1 partido por equipo por día
  - [x] 5.4 Crear API route POST /api/tournaments/[id]/generate-fixture que genera fixture, asigna fechas/horarios, y envía notificaciones a equipos
  - [x] 5.5 Crear páginas admin para torneos (app/admin/tournaments/) con tabla listado, formulario crear/editar con selección de formato y categorías, vista de equipos inscritos, y botón generar fixture
  - [x] 5.6 Crear lib/services/phase.service.ts para gestión de fases: crear fases, configurar criterios de clasificación, determinar equipos clasificados automáticamente, y avance manual

## Tarea 6: Módulo de Partidos, Resultados y Tabla de Posiciones
- [x] 6. Módulo de Partidos, Resultados y Tabla de Posiciones
  - [x] 6.1 Crear lib/services/match.service.ts con registro de resultados (validar partido existe y está programado), registro de eventos (goles, tarjetas, sustituciones), y cambio de estado a "completed"
  - [x] 6.2 Crear lib/services/standings.service.ts con cálculo de tabla: 3pts victoria, 1pt empate, 0pts derrota, ordenamiento por puntos→diferencia goles→goles favor→alfabético, y recálculo automático al registrar/modificar resultado
  - [x] 6.3 Crear lib/services/suspension.service.ts con suspensiones automáticas por acumulación de tarjetas, verificación de elegibilidad de jugadores, y habilitación automática al cumplir suspensión
  - [x] 6.4 Crear API routes: GET /api/matches, GET /api/matches/[id], PUT /api/matches/[id]/result, POST /api/matches/[id]/events, GET /api/tournaments/[id]/standings
  - [x] 6.5 Crear páginas admin para partidos (app/admin/matches/) con lista de partidos por torneo, formulario de registro de resultado con goleadores/tarjetas/sustituciones
  - [x] 6.6 Crear componente StandingsTable.tsx con tabla de posiciones profesional mostrando PJ, G, E, P, GF, GC, DG, Pts con colores de zona de clasificación
  - [x] 6.7 Crear componente MatchScoreWidget.tsx para mostrar marcadores en vivo/finalizados con escudos de equipos, marcador, y minuto

## Tarea 7: Módulo de Tácticas y Formaciones
- [x] 7. Módulo de Tácticas y Formaciones
  - [x] 7.1 Crear lib/services/tactic.service.ts con CRUD de tácticas, validación de formación (suma de números + 1 portero = 11), asignación de jugadores a posiciones, y marcado de táctica principal
  - [x] 7.2 Crear API routes: GET/POST /api/tactics, GET/PUT/DELETE /api/tactics/[id], PUT /api/tactics/[id]/primary con autorización coach(propio equipo)
  - [x] 7.3 Crear componente FormationPitch.tsx que renderiza cancha de fútbol con jugadores posicionados según formación seleccionada (4-4-2, 4-3-3, 3-5-2, 5-3-2, 4-2-3-1), drag-and-drop para asignar jugadores
  - [x] 7.4 Crear página coach/team/tactics/page.tsx con selector de formación, vista de cancha interactiva, lista de tácticas guardadas, historial de tácticas usadas en partidos con resultados

## Tarea 8: Panel del Entrenador - Equipo y Estadísticas
- [x] 8. Panel del Entrenador - Equipo y Estadísticas
  - [x] 8.1 Crear layout del panel entrenador (app/coach/layout.tsx) con sidebar profesional: Dashboard, Mi Equipo, Tácticas, Ejercicios, Entrenamiento, Evaluaciones, Tareas, Desarrollo, Reportes, Recomendaciones, Análisis
  - [x] 8.2 Crear página coach/team/page.tsx con vista general del equipo: nombre, escudo, categoría, entrenador, estadísticas resumen (victorias, derrotas, empates, racha)
  - [x] 8.3 Crear página coach/team/roster/page.tsx con plantilla del equipo: tabla de jugadores con foto, nombre, posición, número, edad, y acciones (agregar/remover)
  - [x] 8.4 Crear página coach/team/uniforms/page.tsx con visualización y edición de uniformes local/visitante usando componente UniformDisplay
  - [x] 8.5 Crear página coach/team/stats/page.tsx con estadísticas del equipo: promedio posesión, tiros al arco, faltas, rendimiento por táctica, historial de partidos

## Tarea 9: Biblioteca de Ejercicios Profesionales
- [x] 9. Biblioteca de Ejercicios Profesionales
  - [x] 9.1 Crear seed de ejercicios (prisma/seeds/exercises.ts) con 200+ ejercicios categorizados por tipo (control, pases, tiros, agilidad, tácticas, físico, individual), edad, dificultad, y metodología (Chelsea FC, Barcelona, Ajax, Arsenal), incluyendo small-sided games (3v3, 4v4, 5v5, 7v7)
  - [x] 9.2 Crear lib/services/exercise.service.ts con búsqueda por filtros (categoría, edad, dificultad, palabra clave), favoritos, y caché en Redis (TTL 7 días)
  - [x] 9.3 Crear API routes: GET /api/exercises (con query params de filtro), GET /api/exercises/[id], POST/DELETE /api/exercises/[id]/favorite, GET /api/exercises/favorites
  - [x] 9.4 Crear página coach/exercises/page.tsx con grid de ejercicios, filtros laterales (categoría, edad, dificultad, metodología), búsqueda por texto, badge de metodología elite, y botón favorito
  - [x] 9.5 Crear página coach/exercises/favorites/page.tsx con lista de ejercicios marcados como favoritos

## Tarea 10: Planes de Entrenamiento
- [x] 10. Planes de Entrenamiento
  - [x] 10.1 Crear lib/services/training-plan.service.ts con CRUD de planes, agregar sesiones con ejercicios en secuencia, cálculo de duración total, validación de ejercicios apropiados por edad, duplicación de planes, y compartir entre entrenadores
  - [x] 10.2 Crear API routes: GET/POST /api/training-plans, GET/PUT /api/training-plans/[id], POST /api/training-plans/[id]/duplicate, POST /api/training-plans/[id]/sessions, PUT /api/training-plans/[id]/sessions/[sid]/execute
  - [x] 10.3 Crear página coach/training/page.tsx con lista de planes del equipo, estado (activo, completado), y duración
  - [x] 10.4 Crear página coach/training/new/page.tsx con formulario: nombre, período, edad objetivo, nivel, objetivos, y builder de sesiones donde se arrastran ejercicios de la biblioteca con fases (calentamiento, principal, enfriamiento)
  - [x] 10.5 Crear página coach/training/[id]/page.tsx con detalle del plan, sesiones programadas, registro de ejecución (fecha, asistencia, calificación de efectividad por ejercicio, notas)


## Tarea 11: Sistema de Evaluación Multidimensional de Jugadores
- [x] 11. Sistema de Evaluación Multidimensional de Jugadores
  - [x] 11.1 Crear lib/services/evaluation.service.ts con creación de evaluaciones (4 dimensiones: técnica, táctica, física, mental), cálculo automático de promedios por dimensión y general, identificación de top 3 fortalezas y debilidades, y métricas por posición (portero, defensa, mediocampista, delantero)
  - [x] 11.2 Crear lib/validators/evaluation.schema.ts con schemas Zod para validar calificaciones 1-10, contexto (partido/entrenamiento/formal), y métricas de posición
  - [x] 11.3 Crear API routes: GET/POST /api/evaluations, GET /api/evaluations/[id], GET /api/evaluations/player/[id]/progress con autorización coach(propio) y parent(hijos)
  - [x] 11.4 Crear componente RadarChart.tsx con Recharts que muestra perfil multidimensional del jugador (técnica, táctica, física, mental) con diseño profesional
  - [x] 11.5 Crear página coach/evaluations/new/page.tsx con formulario de evaluación: selector de jugador, contexto, calificaciones por dimensión con sliders 1-10, métricas de posición automáticas, y comentarios por dimensión
  - [x] 11.6 Crear página coach/evaluations/[id]/page.tsx con detalle de evaluación: radar chart, calificaciones por criterio, fortalezas/debilidades destacadas, y comparación con evaluación anterior
  - [x] 11.7 Crear página coach/evaluations/page.tsx con lista de evaluaciones del equipo, filtros por jugador y fecha, y vista de tracking de progreso temporal con gráfico de líneas

## Tarea 12: Evaluación por Posición y Feedback 360
- [x] 12. Evaluación por Posición y Feedback 360
  - [x] 12.1 Crear lib/services/feedback360.service.ts con creación de sesiones 360, designación de evaluadores, envío de notificaciones, agregación de evaluaciones (promedios por criterio), detección de discrepancias (>3 puntos), y generación de reporte consolidado
  - [x] 12.2 Crear API routes: POST /api/evaluations/feedback-360, GET /api/evaluations/feedback-360/[id], PUT /api/evaluations/feedback-360/[id]/evaluators/[eid]/submit
  - [x] 12.3 Crear página coach/evaluations/feedback-360/page.tsx con lista de sesiones 360, crear nueva sesión (seleccionar jugador, designar evaluadores), y ver resultados consolidados con indicadores de consenso/discrepancia
  - [x] 12.4 Crear componentes de hojas de evaluación personalizables: EvaluationSheet.tsx con criterios editables por posición, plantillas guardables, y comparación entre jugadores de misma posición

## Tarea 13: Asignación de Tareas y Objetivos Individuales
- [x] 13. Asignación de Tareas y Objetivos Individuales
  - [x] 13.1 Crear lib/services/task.service.ts con CRUD de tareas, asignación a jugadores, tareas predefinidas, seguimiento de estado (pending→in_progress→completed/overdue/rejected), aprobación/rechazo por coach, cálculo de porcentaje de cumplimiento, y recordatorios automáticos (48h antes de deadline)
  - [x] 13.2 Crear lib/services/objective.service.ts con CRUD de objetivos a largo plazo (1-6 meses), asociación de tareas a objetivos, tracking de progreso visual, y marcado automático de completitud
  - [x] 13.3 Crear API routes: GET/POST /api/tasks, PUT /api/tasks/[id]/assignments/[aid]/complete, PUT /api/tasks/[id]/assignments/[aid]/review, GET/POST /api/objectives
  - [x] 13.4 Crear página coach/tasks/page.tsx con lista de tareas del equipo, filtros por jugador/estado/tipo, porcentaje de cumplimiento por jugador, y tareas vencidas destacadas
  - [x] 13.5 Crear página coach/tasks/new/page.tsx con formulario: título, descripción, tipo (técnica/táctica/física/mental), fecha límite, criterios de completitud, selección de jugadores, y tareas predefinidas rápidas

## Tarea 14: Comunicación Personalizada y Reportes de Progreso
- [x] 14. Comunicación Personalizada y Reportes de Progreso
  - [x] 14.1 Crear lib/services/feedback.service.ts con envío de feedback personalizado (positivo/mejora/técnica), adjuntar referencias a evaluaciones/tareas, y envío automático de copia a padres en categoría infantil
  - [x] 14.2 Crear lib/services/report.service.ts con generación de reportes de progreso (mensual/trimestral/semestral), selección de secciones a incluir, generación PDF con @react-pdf/renderer, envío automático por email, y programación de reportes periódicos
  - [x] 14.3 Crear lib/utils/pdf-generator.ts con plantilla PDF profesional para reportes: logo, datos del jugador, radar charts, tracking de progreso, tareas completadas, objetivos, y comentarios del entrenador
  - [x] 14.4 Crear API routes: POST /api/feedback, GET /api/feedback?playerId=, POST /api/reports/generate, GET /api/reports?playerId=
  - [x] 14.5 Crear página coach/reports/generate/page.tsx con formulario: seleccionar jugador, período, tipo de reporte, secciones a incluir, preview, y botón generar/enviar
  - [x] 14.6 Crear página coach/reports/page.tsx con historial de reportes generados, filtros por jugador y período, y descarga de PDF

## Tarea 15: Planes de Desarrollo Personalizados
- [x] 15. Planes de Desarrollo Personalizados
  - [x] 15.1 Crear lib/services/development-plan.service.ts con creación de planes basados en debilidades de evaluaciones, sugerencia automática de áreas de enfoque, recomendación de ejercicios de la biblioteca (mínimo 3 por área), metas cuantificables, cronograma de evaluaciones de seguimiento, alertas de falta de progreso (2 evaluaciones sin mejora), y compartir con jugador/padre
  - [x] 15.2 Crear API routes: GET/POST /api/development-plans, GET/PUT /api/development-plans/[id], POST /api/development-plans/[id]/comments
  - [x] 15.3 Crear página coach/development/page.tsx con lista de planes activos por jugador, progreso visual, y alertas
  - [x] 15.4 Crear página coach/development/[playerId]/page.tsx con detalle del plan: áreas de enfoque, ejercicios recomendados, metas con progreso, cronograma de evaluaciones, y sección de comentarios (coach, jugador, padre)

## Tarea 16: Dashboard del Entrenador y Análisis de Rendimiento
- [x] 16. Dashboard del Entrenador y Análisis de Rendimiento
  - [x] 16.1 Crear lib/services/analytics.service.ts con cálculo de métricas agregadas del equipo, identificación de 3 puntos débiles más comunes, sugerencia de ejercicios para debilidades, comparación entre jugadores, rankings por dimensión, correlación entrenamientos-mejoras, y tendencias temporales
  - [x] 16.2 Crear API routes: GET /api/analytics/dashboard?teamId=, GET /api/analytics/training-effectiveness?teamId= con autorización coach(propio)
  - [x] 16.3 Crear página coach/dashboard/page.tsx con: resumen (jugadores, próximo partido, tareas pendientes), puntos débiles del equipo con ejercicios sugeridos, alertas (tareas vencidas, jugadores sin evaluar >30 días, objetivos próximos a vencer), gráfico de progreso del equipo por dimensión, y ranking de jugadores
  - [x] 16.4 Crear página coach/analytics/page.tsx con: efectividad de ejercicios (calificación promedio, veces ejecutado), correlación ejercicios-mejoras, comparación de enfoques (técnico vs táctico), tendencia temporal de efectividad, y exportación CSV/PDF

## Tarea 17: Sistema de Recomendaciones Inteligentes
- [x] 17. Sistema de Recomendaciones Inteligentes
  - [x] 17.1 Crear lib/services/recommendation.service.ts con análisis de edad promedio del equipo, consideración de categoría, reglas de recomendación por edad (<10: tácticas individuales/formaciones simples, 10-14: formaciones básicas 4-4-2/4-3-3, >14: formaciones avanzadas 3-5-2/4-2-3-1), justificación basada en clubes profesionales, caché en Redis (TTL 24h), y fallback a datos locales
  - [x] 17.2 Crear seed de datos de recomendaciones (prisma/seeds/recommendations.ts) con estadísticas de efectividad de formaciones por categoría y edad, basadas en investigación de Barcelona, Ajax, Arsenal
  - [x] 17.3 Crear API route: GET /api/recommendations?teamId= con filtro por estilo de juego (ofensivo/defensivo/balanceado)
  - [x] 17.4 Crear página coach/recommendations/page.tsx con: recomendaciones de formación con justificación, estadísticas de efectividad, filtro por estilo de juego, y visualización de formación recomendada en cancha

## Tarea 18: Sistema de Notificaciones (WhatsApp y Email)
- [x] 18. Sistema de Notificaciones (WhatsApp y Email)
  - [x] 18.1 Crear lib/services/notification.service.ts con envío de WhatsApp via Twilio API (templates: match_reminder, result_notification, task_assigned), envío de email via Resend (templates: match_result, progress_report, task_assigned, feedback), y registro en notification_log
  - [x] 18.2 Crear templates de email HTML profesionales con branding del sistema para: recordatorio de partido, resultado con estadísticas, reporte de progreso adjunto, tarea asignada, y feedback del entrenador
  - [x] 18.3 Integrar notificaciones en flujos existentes: al programar partido (WhatsApp a padres infantiles), al registrar resultado (email a padres con stats), al asignar tarea (notificación a jugador y padre), al enviar feedback (copia a padre infantil), y al generar reporte (email con PDF adjunto)
  - [x] 18.4 Crear API routes: GET/PUT /api/notifications/preferences para que padres configuren canales habilitados (WhatsApp on/off, Email on/off)

## Tarea 19: Portal para Padres de Familia
- [x] 19. Portal para Padres de Familia
  - [x] 19.1 Crear layout del portal padres (app/parent/layout.tsx) con sidebar: Dashboard, Mis Hijos, Calendario, Configuración
  - [x] 19.2 Crear página parent/dashboard/page.tsx con vista general: tarjetas por hijo (nombre, equipo, próximo partido, estadísticas resumen), y notificaciones recientes
  - [x] 19.3 Crear página parent/children/[id]/page.tsx con perfil del hijo: foto, equipo, posición, estadísticas de partidos (goles, asistencias, minutos jugados)
  - [x] 19.4 Crear página parent/children/[id]/stats/page.tsx con estadísticas detalladas del hijo, radar chart de evaluaciones, y tracking de progreso
  - [x] 19.5 Crear página parent/children/[id]/tasks/page.tsx con tareas asignadas al hijo, estado de cumplimiento, y objetivos de desarrollo
  - [x] 19.6 Crear página parent/children/[id]/reports/page.tsx con historial de reportes de progreso, planes de desarrollo, y sección de comentarios
  - [x] 19.7 Crear página parent/schedule/page.tsx con calendario de próximos partidos de todos los hijos
  - [x] 19.8 Crear página parent/settings/page.tsx con preferencias de notificación (WhatsApp on/off, Email on/off)

## Tarea 20: Frontend Público - Página Principal y Torneos
- [x] 20. Frontend Público - Página Principal y Torneos
  - [x] 20.1 Crear layout público (app/(public)/layout.tsx) con navbar profesional: Logo, Torneos, Equipos, Estadísticas, Login, diseño responsive mobile-first con menú hamburguesa
  - [x] 20.2 Crear página principal (app/(public)/page.tsx) con: hero section (imagen alta calidad, título, CTAs), widget de marcadores en vivo, torneos activos, próximos partidos, tabla de posiciones del torneo principal, máximo goleador, y footer profesional
  - [x] 20.3 Crear página de torneos (app/(public)/tournaments/page.tsx) con lista de torneos activos/completados, filtro por categoría, y cards con nombre, fechas, formato, equipos
  - [x] 20.4 Crear página detalle torneo (app/(public)/tournaments/[id]/page.tsx) con tabs: Tabla de Posiciones (StandingsTable), Fixture (FixtureCalendar), Estadísticas (goleadores, equipos), y Equipos participantes
  - [x] 20.5 Crear componente FixtureCalendar.tsx con calendario visual de partidos: fecha, hora, equipos con escudos, ubicación, resultado si finalizado, y uniforme indicado (local/visitante)

## Tarea 21: Frontend Público - Equipos y Jugadores
- [x] 21. Frontend Público - Equipos y Jugadores
  - [x] 21.1 Crear página de equipos (app/(public)/teams/page.tsx) con grid de equipos, filtro por categoría, búsqueda por nombre, y cards con escudo, nombre, ciudad, categoría
  - [x] 21.2 Crear página detalle equipo (app/(public)/teams/[id]/page.tsx) con: info del equipo, escudo, uniformes (UniformDisplay), categoría, plantilla de jugadores (PlayerCard), estadísticas del equipo, próximos partidos, y resultados recientes
  - [x] 21.3 Crear página perfil jugador (app/(public)/players/[id]/page.tsx) con diseño profesional: foto grande, nombre, posición, número, equipo, estadísticas destacadas (goles, asistencias, tarjetas, partidos), y gráficos visuales
  - [x] 21.4 Implementar diseño responsive completo (320px-2560px) con Tailwind breakpoints, lazy loading de imágenes, animaciones Framer Motion (<300ms), y optimización de rendimiento (carga <3s)

## Tarea 22: Consulta de Estadísticas Públicas
- [x] 22. Consulta de Estadísticas Públicas
  - [x] 22.1 Crear lib/services/statistics.service.ts con cálculo de estadísticas por torneo (goleadores, equipos con más victorias, promedio goles/partido), por equipo (historial partidos, promedio goles), y por jugador (goles, asistencias, tarjetas)
  - [x] 22.2 Crear API routes: GET /api/tournaments/[id]/stats, GET /api/teams/[id]/stats, GET /api/players/[id]/stats (públicos)
  - [x] 22.3 Crear página de estadísticas del torneo (app/(public)/tournaments/[id]/stats/page.tsx) con: tabla de goleadores, tabla de asistencias, equipo más goleador, equipo menos goleado, y gráficos de barras
  - [x] 22.4 Implementar exportación de estadísticas en formato tabular (CSV) desde las vistas de estadísticas

## Tarea 23: Panel de Administración - Dashboard y Gestión de Usuarios
- [x] 23. Panel de Administración - Dashboard y Gestión de Usuarios
  - [x] 23.1 Crear layout admin (app/admin/layout.tsx) con sidebar profesional: Dashboard, Torneos, Equipos, Jugadores, Partidos, Ubicaciones, Categorías, Usuarios
  - [x] 23.2 Crear página admin/dashboard/page.tsx con resumen general: total torneos activos, total equipos, total jugadores, partidos programados hoy, y accesos rápidos
  - [x] 23.3 Crear página admin/users/page.tsx con gestión de usuarios: tabla con nombre, email, rol, equipo asignado, estado activo/inactivo, y acciones (crear, editar rol, desactivar)
  - [x] 23.4 Crear API routes: GET/POST /api/users, PUT /api/users/[id] con autorización admin para gestión de entrenadores y padres

## Tarea 24: Tests de Propiedades de Correctitud
- [x] 24. Tests de Propiedades de Correctitud
  - [x] 24.1 Configurar framework de testing (Vitest + fast-check para property-based testing) con setup de base de datos de test
  - [x] 24.2 Implementar test P1 (Integridad Tabla Posiciones): para todo torneo liga, la suma de puntos distribuidos por partido es consistente (3 por partido: 3-0 victoria o 1-1 empate)
  - [x] 24.3 Implementar test P2 (Unicidad Camiseta): para todo equipo, no existen dos jugadores activos con mismo jersey_number
  - [x] 24.4 Implementar test P3 (Validación Formación): para toda táctica, cantidad de jugadores = suma de números en formación + 1 portero = 11
  - [x] 24.5 Implementar test P4 (Restricción Categoría): para todo equipo inscrito en torneo, al menos una categoría del equipo está en categorías permitidas del torneo
  - [x] 24.6 Implementar test P5 (Aislamiento por Rol): operaciones de escritura de coach solo afectan datos de su equipo asignado
  - [x] 24.7 Implementar test P6 (Consistencia Evaluaciones): calificaciones en rango [1,10] y promedios son media aritmética exacta de criterios
  - [x] 24.8 Implementar test P7 (No Conflicto Ubicación): no existen dos partidos en misma ubicación con horarios solapados (2h por partido)
  - [x] 24.9 Implementar test P8 (Elegibilidad Jugadores): jugadores en alineación pertenecen al equipo y no tienen suspensiones activas
  - [x] 24.10 Implementar test P9 (Integridad Fixture): fixture liga tiene exactamente n*(n-1) partidos y máximo 1 partido por equipo por día