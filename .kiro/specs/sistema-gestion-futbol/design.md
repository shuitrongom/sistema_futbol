# Documento de Diseño Técnico - Sistema de Gestión de Fútbol

## 1. Visión General de la Arquitectura

El sistema utiliza una arquitectura de tres capas con separación clara entre frontend, backend API, y base de datos. Se implementa como una aplicación web monolítica modular con API REST.

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTES                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Frontend  │  │ Portal   │  │ Panel Admin/     │  │
│  │ Público   │  │ Padres   │  │ Entrenador       │  │
│  │ (Next.js) │  │ (Next.js)│  │ (Next.js)        │  │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└────────┼──────────────┼─────────────────┼────────────┘
         │              │                 │
         ▼              ▼                 ▼
┌─────────────────────────────────────────────────────┐
│                 API GATEWAY (Next.js API Routes)     │
│  ┌─────────────────────────────────────────────┐    │
│  │           Middleware de Autenticación         │    │
│  │           (JWT + Role-Based Access)          │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Módulo   │ │ Módulo   │ │ Módulo   │            │
│  │ Torneos  │ │ Equipos  │ │ Jugadores│            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Módulo   │ │ Módulo   │ │ Módulo   │            │
│  │ Partidos │ │ Estadíst.│ │ Evaluac. │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Módulo   │ │ Módulo   │ │ Módulo   │            │
│  │ Entrenam.│ │ Notific. │ │ Recomend.│            │
│  └──────────┘ └──────────┘ └──────────┘            │
└──────────────────────┬───────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Redis   │ │ Servicios    │
│  (Base de    │ │  (Caché/ │ │ Externos     │
│   Datos)     │ │  Sesiones)│ │ (WhatsApp,  │
│              │ │          │ │  Email, APIs)│
└──────────────┘ └──────────┘ └──────────────┘
```

## 2. Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router) con TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui para componentes profesionales
- **Gráficos**: Chart.js / Recharts para radar charts, barras, líneas temporales
- **Estado**: Zustand para estado global + React Query (TanStack Query) para caché de API
- **Formularios**: React Hook Form + Zod para validación
- **Iconos**: Lucide React
- **Animaciones**: Framer Motion (transiciones suaves < 300ms)

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Next.js API Routes (Route Handlers)
- **ORM**: Prisma ORM para PostgreSQL
- **Autenticación**: NextAuth.js con JWT
- **Validación**: Zod para schemas de entrada/salida
- **Generación PDF**: @react-pdf/renderer para reportes de progreso

### Base de Datos
- **Principal**: PostgreSQL 16
- **Caché**: Redis para sesiones, caché de fuentes externas, datos en tiempo real
- **Almacenamiento de archivos**: Sistema de archivos local o S3-compatible para imágenes (escudos, uniformes, fotos)

### Servicios Externos
- **WhatsApp**: Twilio WhatsApp API para notificaciones a padres
- **Email**: Resend o SendGrid para notificaciones por correo
- **Fuentes de Ejercicios**: API REST propia con datos seed de metodologías elite
- **Fuentes de Estadísticas**: API-Football o similar para datos de formaciones


## 3. Modelo de Datos (Base de Datos)

### Diagrama Entidad-Relación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │   Category   │     │   Location   │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ email        │     │ name         │     │ name         │
│ password_hash│     │ description  │     │ address      │
│ full_name    │     │ created_at   │     │ capacity     │
│ phone        │     └──────┬───────┘     │ created_at   │
│ role (enum)  │            │             └──────┬───────┘
│ created_at   │            │                    │
└──────┬───────┘     ┌──────┴───────┐            │
       │             │ TeamCategory │            │
       │             │ (join table) │            │
       │             ├──────────────┤            │
       │             │ team_id (FK) │            │
       │             │ category_id  │            │
       │             └──────────────┘            │
       │                                         │
┌──────┴───────┐     ┌──────────────┐     ┌──────┴───────┐
│    Team      │     │   Player     │     │   Match      │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ full_name    │     │ tournament_id│
│ badge_url    │     │ birth_date   │     │ phase_id     │
│ primary_color│     │ id_number    │     │ home_team_id │
│ secondary_clr│     │ position     │     │ away_team_id │
│ city         │     │ phone        │     │ location_id  │
│ coach_id (FK)│     │ email        │     │ date_time    │
│ home_uniform │     │ photo_url    │     │ status       │
│ away_uniform │     │ created_at   │     │ home_score   │
│ created_at   │     └──────┬───────┘     │ away_score   │
└──────┬───────┘            │             │ home_tactic  │
       │             ┌──────┴───────┐     │ away_tactic  │
       │             │ TeamPlayer   │     │ created_at   │
       │             ├──────────────┤     └──────────────┘
       │             │ id (PK)      │
       │             │ team_id (FK) │
       │             │ player_id(FK)│
       │             │ jersey_number│
       │             │ joined_at    │
       │             │ left_at      │
       │             └──────────────┘
       │
┌──────┴───────┐     ┌──────────────┐
│  Tournament  │     │    Phase     │
├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │
│ name         │     │ tournament_id│
│ start_date   │     │ name         │
│ end_date     │     │ type (enum)  │
│ format (enum)│     │ status       │
│ min_teams    │     │ order        │
│ max_teams    │     │ criteria     │
│ status (enum)│     │ created_at   │
│ created_at   │     └──────────────┘
└──────────────┘
```

### Tablas Principales

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'parent', 'player');
CREATE TYPE tournament_format AS ENUM ('league', 'knockout', 'group_knockout');
CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled');
CREATE TYPE phase_type AS ENUM ('group', 'round_of_16', 'quarter_final', 'semi_final', 'final');
CREATE TYPE player_position AS ENUM ('goalkeeper', 'defender', 'midfielder', 'forward');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'rejected');
CREATE TYPE feedback_type AS ENUM ('positive', 'improvement', 'technical');
CREATE TYPE eval_context AS ENUM ('match', 'training', 'formal');
CREATE TYPE strategy_type AS ENUM ('offensive', 'defensive', 'counter_attack', 'possession');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    badge_url VARCHAR(500),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    city VARCHAR(255),
    coach_id UUID REFERENCES users(id),
    home_uniform_primary VARCHAR(7),
    home_uniform_secondary VARCHAR(7),
    home_uniform_description TEXT,
    home_uniform_image_url VARCHAR(500),
    away_uniform_primary VARCHAR(7),
    away_uniform_secondary VARCHAR(7),
    away_uniform_description TEXT,
    away_uniform_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Team-Category (many-to-many)
CREATE TABLE team_categories (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, category_id)
);

-- Players
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    id_number VARCHAR(50) UNIQUE NOT NULL,
    position player_position NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    photo_url VARCHAR(500),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Team-Player (roster)
CREATE TABLE team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    jersey_number INTEGER NOT NULL,
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    left_at DATE,
    UNIQUE(team_id, jersey_number, left_at)
);

-- Tournaments
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    format tournament_format NOT NULL,
    min_teams INTEGER NOT NULL DEFAULT 2,
    max_teams INTEGER NOT NULL,
    status tournament_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tournament-Category (allowed categories)
CREATE TABLE tournament_categories (
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, category_id)
);

-- Tournament-Team (inscriptions)
CREATE TABLE tournament_teams (
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (tournament_id, team_id)
);
```


```sql
-- Phases
CREATE TABLE phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type phase_type NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    phase_order INTEGER NOT NULL,
    classification_criteria JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    capacity INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id),
    phase_id UUID REFERENCES phases(id),
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    location_id UUID REFERENCES locations(id),
    date_time TIMESTAMP NOT NULL,
    status match_status DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    home_tactic_id UUID,
    away_tactic_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT no_same_team CHECK (home_team_id != away_team_id)
);

-- Match Events (goals, cards, substitutions)
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    event_type VARCHAR(20) NOT NULL, -- 'goal', 'yellow_card', 'red_card', 'substitution', 'assist'
    minute INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Standings (calculated/cached)
CREATE TABLE standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES phases(id),
    team_id UUID REFERENCES teams(id),
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    UNIQUE(tournament_id, phase_id, team_id)
);

-- Suspensions
CREATE TABLE suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    tournament_id UUID REFERENCES tournaments(id),
    reason TEXT NOT NULL,
    matches_remaining INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tactics
CREATE TABLE tactics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    formation VARCHAR(20) NOT NULL, -- '4-4-2', '4-3-3', etc.
    strategy strategy_type,
    player_positions JSONB NOT NULL, -- {position: player_id} mapping
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Parent-Player relationship
CREATE TABLE parent_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL, -- 'father', 'mother', 'guardian'
    UNIQUE(parent_id, player_id)
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    whatsapp_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tablas del Módulo de Entrenamiento y Evaluación

```sql
-- Exercise Library
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'ball_control', 'passing', 'shooting', 'agility', 'tactics', 'physical', 'individual'
    min_age INTEGER,
    max_age INTEGER,
    difficulty VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    duration_minutes INTEGER,
    players_required INTEGER,
    materials TEXT,
    diagram_url VARCHAR(500),
    methodology_source VARCHAR(100), -- 'Chelsea FC', 'Barcelona', 'Ajax', 'Arsenal'
    is_small_sided_game BOOLEAN DEFAULT false,
    game_format VARCHAR(10), -- '3v3', '4v4', '5v5', '7v7'
    is_external BOOLEAN DEFAULT false,
    cached_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Exercise Favorites
CREATE TABLE exercise_favorites (
    coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    PRIMARY KEY (coach_id, exercise_id)
);

-- Training Plans
CREATE TABLE training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    target_age_min INTEGER,
    target_age_max INTEGER,
    level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    objectives TEXT,
    start_date DATE,
    end_date DATE,
    is_shared BOOLEAN DEFAULT false,
    effectiveness_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Sessions (within a plan)
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE,
    session_date DATE,
    duration_minutes INTEGER,
    phase VARCHAR(20), -- 'warmup', 'main', 'cooldown'
    session_order INTEGER NOT NULL,
    executed_at TIMESTAMP,
    attendance JSONB, -- [player_id, ...]
    created_at TIMESTAMP DEFAULT NOW()
);

-- Session-Exercise (exercises in a session)
CREATE TABLE session_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id),
    exercise_order INTEGER NOT NULL,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    coach_notes TEXT
);

-- Player Evaluations
CREATE TABLE player_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    context eval_context NOT NULL,
    evaluation_date DATE NOT NULL,
    -- Technical dimension
    ball_control INTEGER CHECK (ball_control BETWEEN 1 AND 10),
    passing INTEGER CHECK (passing BETWEEN 1 AND 10),
    dribbling INTEGER CHECK (dribbling BETWEEN 1 AND 10),
    shooting INTEGER CHECK (shooting BETWEEN 1 AND 10),
    heading INTEGER CHECK (heading BETWEEN 1 AND 10),
    weak_foot INTEGER CHECK (weak_foot BETWEEN 1 AND 10),
    technical_avg DECIMAL(3,1),
    technical_comments TEXT,
    -- Tactical dimension
    positioning INTEGER CHECK (positioning BETWEEN 1 AND 10),
    game_vision INTEGER CHECK (game_vision BETWEEN 1 AND 10),
    decision_making INTEGER CHECK (decision_making BETWEEN 1 AND 10),
    system_understanding INTEGER CHECK (system_understanding BETWEEN 1 AND 10),
    tactical_avg DECIMAL(3,1),
    tactical_comments TEXT,
    -- Physical dimension
    speed INTEGER CHECK (speed BETWEEN 1 AND 10),
    endurance INTEGER CHECK (endurance BETWEEN 1 AND 10),
    strength INTEGER CHECK (strength BETWEEN 1 AND 10),
    agility INTEGER CHECK (agility BETWEEN 1 AND 10),
    coordination INTEGER CHECK (coordination BETWEEN 1 AND 10),
    physical_avg DECIMAL(3,1),
    physical_comments TEXT,
    -- Mental dimension
    concentration INTEGER CHECK (concentration BETWEEN 1 AND 10),
    attitude INTEGER CHECK (attitude BETWEEN 1 AND 10),
    leadership INTEGER CHECK (leadership BETWEEN 1 AND 10),
    teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 10),
    resilience INTEGER CHECK (resilience BETWEEN 1 AND 10),
    mental_avg DECIMAL(3,1),
    mental_comments TEXT,
    -- Position-specific metrics (JSONB for flexibility)
    position_metrics JSONB,
    -- Overall
    overall_avg DECIMAL(3,1),
    top_strengths JSONB, -- ['ball_control', 'speed', 'leadership']
    top_weaknesses JSONB, -- ['weak_foot', 'heading', 'endurance']
    is_feedback_360 BOOLEAN DEFAULT false,
    feedback_360_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);
```


```sql
-- Feedback 360 Sessions
CREATE TABLE feedback_360_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    coach_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback 360 Evaluators
CREATE TABLE feedback_360_evaluators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES feedback_360_sessions(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES users(id),
    evaluation_id UUID REFERENCES player_evaluations(id),
    status VARCHAR(20) DEFAULT 'pending',
    notified_at TIMESTAMP
);

-- Individual Tasks
CREATE TABLE individual_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(20), -- 'technical', 'tactical', 'physical', 'mental'
    deadline DATE,
    completion_criteria TEXT,
    status task_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task-Player assignments
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES individual_tasks(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id),
    status task_status DEFAULT 'pending',
    player_comments TEXT,
    coach_feedback TEXT,
    completed_at TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- Development Objectives (long-term)
CREATE TABLE development_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(3,1),
    current_value DECIMAL(3,1),
    metric_name VARCHAR(100),
    start_date DATE,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Personalized Feedback
CREATE TABLE personalized_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES users(id),
    player_id UUID REFERENCES players(id),
    team_id UUID REFERENCES teams(id),
    feedback_type feedback_type NOT NULL,
    message TEXT NOT NULL,
    related_evaluation_id UUID REFERENCES player_evaluations(id),
    related_task_id UUID REFERENCES individual_tasks(id),
    sent_to_parent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Progress Reports
CREATE TABLE progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    coach_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_type VARCHAR(20), -- 'monthly', 'quarterly', 'semester'
    content JSONB NOT NULL, -- sections included
    pdf_url VARCHAR(500),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Personal Development Plans
CREATE TABLE development_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    focus_areas JSONB, -- ['weak_foot', 'endurance']
    recommended_exercises JSONB, -- [exercise_id, ...]
    evaluation_schedule JSONB, -- [{date, completed}]
    status VARCHAR(20) DEFAULT 'active',
    parent_comments TEXT,
    player_comments TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recommendation Cache
CREATE TABLE recommendation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    category VARCHAR(50),
    avg_age DECIMAL(4,1),
    recommendations JSONB NOT NULL,
    source VARCHAR(100),
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Notification Log
CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'email'
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Índices Principales

```sql
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_datetime ON matches(date_time);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_standings_tournament ON standings(tournament_id);
CREATE INDEX idx_team_players_team ON team_players(team_id);
CREATE INDEX idx_team_players_player ON team_players(player_id);
CREATE INDEX idx_player_evaluations_player ON player_evaluations(player_id);
CREATE INDEX idx_player_evaluations_date ON player_evaluations(evaluation_date);
CREATE INDEX idx_individual_tasks_team ON individual_tasks(team_id);
CREATE INDEX idx_task_assignments_player ON task_assignments(player_id);
CREATE INDEX idx_notification_log_user ON notification_log(user_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_age ON exercises(min_age, max_age);
CREATE INDEX idx_suspensions_player ON suspensions(player_id, is_active);
```

## 4. Estructura de Módulos del Backend

```
src/
├── app/
│   ├── (public)/                    # Frontend Público
│   │   ├── page.tsx                 # Home - Hero, torneos activos, marcadores
│   │   ├── tournaments/
│   │   │   ├── page.tsx             # Lista de torneos
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Detalle torneo, tabla posiciones
│   │   │       ├── fixture/page.tsx # Fixture completo
│   │   │       └── stats/page.tsx   # Estadísticas del torneo
│   │   ├── teams/
│   │   │   ├── page.tsx             # Lista de equipos (filtro por categoría)
│   │   │   └── [id]/page.tsx        # Perfil equipo, uniformes, jugadores
│   │   └── players/
│   │       └── [id]/page.tsx        # Perfil jugador con estadísticas
│   │
│   ├── (auth)/                      # Autenticación
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── admin/                       # Panel Administrador
│   │   ├── layout.tsx               # Layout con sidebar admin
│   │   ├── dashboard/page.tsx       # Dashboard general
│   │   ├── tournaments/             # CRUD torneos
│   │   ├── teams/                   # CRUD equipos
│   │   ├── players/                 # CRUD jugadores
│   │   ├── locations/               # CRUD ubicaciones
│   │   ├── categories/              # CRUD categorías
│   │   ├── matches/                 # Gestión partidos y resultados
│   │   └── users/                   # Gestión usuarios
│   │
│   ├── coach/                       # Panel Entrenador
│   │   ├── layout.tsx               # Layout con sidebar entrenador
│   │   ├── dashboard/page.tsx       # Dashboard_Entrenador
│   │   ├── team/                    # Mi equipo
│   │   │   ├── page.tsx             # Vista general equipo
│   │   │   ├── roster/page.tsx      # Plantilla
│   │   │   ├── tactics/page.tsx     # Tácticas y formaciones
│   │   │   ├── uniforms/page.tsx    # Uniformes
│   │   │   └── stats/page.tsx       # Estadísticas equipo
│   │   ├── exercises/               # Biblioteca de ejercicios
│   │   │   ├── page.tsx             # Explorar ejercicios
│   │   │   └── favorites/page.tsx   # Favoritos
│   │   ├── training/                # Planes de entrenamiento
│   │   │   ├── page.tsx             # Lista planes
│   │   │   ├── new/page.tsx         # Crear plan
│   │   │   └── [id]/page.tsx        # Detalle plan
│   │   ├── evaluations/             # Evaluaciones
│   │   │   ├── page.tsx             # Lista evaluaciones
│   │   │   ├── new/page.tsx         # Nueva evaluación
│   │   │   ├── [id]/page.tsx        # Detalle evaluación
│   │   │   └── feedback-360/        # Feedback 360
│   │   ├── tasks/                   # Tareas individuales
│   │   │   ├── page.tsx             # Lista tareas
│   │   │   └── new/page.tsx         # Crear tarea
│   │   ├── development/             # Planes de desarrollo
│   │   │   ├── page.tsx             # Lista planes
│   │   │   └── [playerId]/page.tsx  # Plan por jugador
│   │   ├── reports/                 # Reportes de progreso
│   │   │   ├── page.tsx             # Lista reportes
│   │   │   └── generate/page.tsx    # Generar reporte
│   │   ├── recommendations/page.tsx # Recomendaciones inteligentes
│   │   └── analytics/page.tsx       # Análisis de efectividad
│   │
│   ├── parent/                      # Portal Padres
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx       # Vista general hijos
│   │   ├── children/
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Perfil hijo
│   │   │       ├── stats/page.tsx   # Estadísticas
│   │   │       ├── tasks/page.tsx   # Tareas asignadas
│   │   │       └── reports/page.tsx # Reportes de progreso
│   │   ├── schedule/page.tsx        # Calendario partidos
│   │   └── settings/page.tsx        # Preferencias notificación
│   │
│   └── api/                         # API Routes
│       ├── auth/[...nextauth]/      # NextAuth endpoints
│       ├── tournaments/             # API torneos
│       ├── teams/                   # API equipos
│       ├── players/                 # API jugadores
│       ├── matches/                 # API partidos
│       ├── standings/               # API tabla posiciones
│       ├── locations/               # API ubicaciones
│       ├── categories/              # API categorías
│       ├── tactics/                 # API tácticas
│       ├── exercises/               # API biblioteca ejercicios
│       ├── training-plans/          # API planes entrenamiento
│       ├── evaluations/             # API evaluaciones
│       ├── tasks/                   # API tareas
│       ├── development-plans/       # API planes desarrollo
│       ├── feedback/                # API feedback
│       ├── reports/                 # API reportes
│       ├── recommendations/         # API recomendaciones
│       ├── notifications/           # API notificaciones
│       └── analytics/               # API análisis
│
├── lib/
│   ├── prisma.ts                    # Cliente Prisma
│   ├── auth.ts                      # Configuración NextAuth
│   ├── redis.ts                     # Cliente Redis
│   ├── validators/                  # Schemas Zod
│   ├── services/
│   │   ├── tournament.service.ts
│   │   ├── team.service.ts
│   │   ├── player.service.ts
│   │   ├── match.service.ts
│   │   ├── standings.service.ts
│   │   ├── fixture-generator.service.ts
│   │   ├── suspension.service.ts
│   │   ├── tactic.service.ts
│   │   ├── exercise.service.ts
│   │   ├── training-plan.service.ts
│   │   ├── evaluation.service.ts
│   │   ├── feedback360.service.ts
│   │   ├── task.service.ts
│   │   ├── development-plan.service.ts
│   │   ├── report.service.ts
│   │   ├── recommendation.service.ts
│   │   ├── notification.service.ts  # WhatsApp + Email
│   │   └── analytics.service.ts
│   └── utils/
│       ├── permissions.ts           # Role-based access helpers
│       ├── pdf-generator.ts         # Generación PDF reportes
│       └── cache.ts                 # Redis cache helpers
│
└── components/
    ├── ui/                          # shadcn/ui components
    ├── layout/
    │   ├── PublicNavbar.tsx
    │   ├── AdminSidebar.tsx
    │   ├── CoachSidebar.tsx
    │   └── ParentSidebar.tsx
    ├── charts/
    │   ├── RadarChart.tsx           # Perfil multidimensional jugador
    │   ├── LineChart.tsx            # Tracking progreso
    │   ├── BarChart.tsx             # Distribución calificaciones
    │   └── StandingsTable.tsx       # Tabla posiciones
    ├── football/
    │   ├── FormationPitch.tsx       # Cancha con formación visual
    │   ├── MatchScoreWidget.tsx     # Widget marcador en vivo
    │   ├── UniformDisplay.tsx       # Visualización uniformes
    │   ├── PlayerCard.tsx           # Tarjeta jugador profesional
    │   └── FixtureCalendar.tsx      # Calendario de partidos
    └── forms/
        ├── TournamentForm.tsx
        ├── TeamForm.tsx
        ├── PlayerForm.tsx
        ├── EvaluationForm.tsx
        ├── TaskForm.tsx
        └── TacticForm.tsx
```


## 5. API REST - Endpoints Principales

### Autenticación
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/api/auth/login` | Iniciar sesión | Todos |
| POST | `/api/auth/register` | Registrar usuario | Admin |
| POST | `/api/auth/refresh` | Refrescar token | Autenticados |
| POST | `/api/auth/logout` | Cerrar sesión | Autenticados |

### Torneos
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/tournaments` | Listar torneos | Público |
| POST | `/api/tournaments` | Crear torneo | Admin |
| GET | `/api/tournaments/:id` | Detalle torneo | Público |
| PUT | `/api/tournaments/:id` | Actualizar torneo | Admin |
| DELETE | `/api/tournaments/:id` | Eliminar torneo | Admin |
| POST | `/api/tournaments/:id/teams` | Inscribir equipo | Admin |
| DELETE | `/api/tournaments/:id/teams/:teamId` | Remover equipo | Admin |
| POST | `/api/tournaments/:id/generate-fixture` | Generar fixture | Admin |
| GET | `/api/tournaments/:id/standings` | Tabla posiciones | Público |
| GET | `/api/tournaments/:id/fixture` | Ver fixture | Público |
| GET | `/api/tournaments/:id/stats` | Estadísticas torneo | Público |

### Equipos
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/teams` | Listar equipos | Público |
| POST | `/api/teams` | Crear equipo | Admin |
| GET | `/api/teams/:id` | Detalle equipo | Público |
| PUT | `/api/teams/:id` | Actualizar equipo | Admin, Coach(propio) |
| DELETE | `/api/teams/:id` | Eliminar equipo | Admin |
| POST | `/api/teams/:id/players` | Agregar jugador | Admin, Coach(propio) |
| DELETE | `/api/teams/:id/players/:playerId` | Remover jugador | Admin, Coach(propio) |
| GET | `/api/teams/:id/stats` | Estadísticas equipo | Público |

### Jugadores
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/players` | Listar jugadores | Admin, Coach(propio) |
| POST | `/api/players` | Registrar jugador | Admin, Coach(propio) |
| GET | `/api/players/:id` | Detalle jugador | Público(básico), Coach(completo) |
| PUT | `/api/players/:id` | Actualizar jugador | Admin, Coach(propio) |

### Partidos y Resultados
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/matches` | Listar partidos | Público |
| GET | `/api/matches/:id` | Detalle partido | Público |
| PUT | `/api/matches/:id/result` | Registrar resultado | Admin |
| POST | `/api/matches/:id/events` | Agregar evento | Admin |

### Tácticas
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/tactics?teamId=` | Listar tácticas equipo | Coach(propio) |
| POST | `/api/tactics` | Crear táctica | Coach(propio) |
| PUT | `/api/tactics/:id` | Actualizar táctica | Coach(propio) |
| PUT | `/api/tactics/:id/primary` | Marcar como principal | Coach(propio) |
| DELETE | `/api/tactics/:id` | Eliminar táctica | Coach(propio) |

### Biblioteca de Ejercicios
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/exercises` | Listar ejercicios (filtros) | Coach |
| GET | `/api/exercises/:id` | Detalle ejercicio | Coach |
| POST | `/api/exercises/:id/favorite` | Marcar favorito | Coach |
| DELETE | `/api/exercises/:id/favorite` | Quitar favorito | Coach |
| GET | `/api/exercises/favorites` | Mis favoritos | Coach |

### Planes de Entrenamiento
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/training-plans?teamId=` | Listar planes | Coach(propio) |
| POST | `/api/training-plans` | Crear plan | Coach(propio) |
| GET | `/api/training-plans/:id` | Detalle plan | Coach(propio) |
| PUT | `/api/training-plans/:id` | Actualizar plan | Coach(propio) |
| POST | `/api/training-plans/:id/duplicate` | Duplicar plan | Coach(propio) |
| POST | `/api/training-plans/:id/sessions` | Agregar sesión | Coach(propio) |
| PUT | `/api/training-plans/:id/sessions/:sid/execute` | Registrar ejecución | Coach(propio) |

### Evaluaciones
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/evaluations?playerId=` | Listar evaluaciones | Coach(propio), Parent(hijos) |
| POST | `/api/evaluations` | Crear evaluación | Coach(propio) |
| GET | `/api/evaluations/:id` | Detalle evaluación | Coach(propio), Parent(hijos) |
| GET | `/api/evaluations/player/:id/progress` | Tracking progreso | Coach(propio), Parent(hijos) |
| POST | `/api/evaluations/feedback-360` | Iniciar Feedback 360 | Coach(propio) |

### Tareas y Objetivos
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/tasks?teamId=` | Listar tareas | Coach(propio), Parent(hijos) |
| POST | `/api/tasks` | Crear tarea | Coach(propio) |
| PUT | `/api/tasks/:id/assignments/:aid/complete` | Marcar completada | Player |
| PUT | `/api/tasks/:id/assignments/:aid/review` | Revisar tarea | Coach(propio) |
| GET | `/api/objectives?playerId=` | Listar objetivos | Coach(propio), Parent(hijos) |
| POST | `/api/objectives` | Crear objetivo | Coach(propio) |

### Reportes y Feedback
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/api/feedback` | Enviar feedback | Coach(propio) |
| GET | `/api/feedback?playerId=` | Listar feedback | Coach(propio), Parent(hijos) |
| POST | `/api/reports/generate` | Generar reporte PDF | Coach(propio) |
| GET | `/api/reports?playerId=` | Listar reportes | Coach(propio), Parent(hijos) |

### Recomendaciones y Analytics
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/recommendations?teamId=` | Obtener recomendaciones | Coach(propio) |
| GET | `/api/analytics/dashboard?teamId=` | Dashboard entrenador | Coach(propio) |
| GET | `/api/analytics/training-effectiveness?teamId=` | Efectividad entrenamientos | Coach(propio) |

### Notificaciones
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/notifications/preferences` | Ver preferencias | Parent |
| PUT | `/api/notifications/preferences` | Actualizar preferencias | Parent |

## 6. Seguridad y Autenticación

### Flujo de Autenticación

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Cliente  │────>│ NextAuth │────>│ PostgreSQL│
│  (Login)  │     │  (JWT)   │     │ (Users)  │
└──────────┘     └────┬─────┘     └──────────┘
                      │
                      ▼
              ┌───────────────┐
              │  JWT Token    │
              │  {            │
              │   userId,     │
              │   role,       │
              │   teamId,     │
              │   exp         │
              │  }            │
              └───────────────┘
```

### Middleware de Autorización

```typescript
// Pseudocódigo del middleware
function authorize(requiredRole: Role[], resourceCheck?: Function) {
  return async (req, res, next) => {
    // 1. Verificar JWT válido
    const token = verifyJWT(req.headers.authorization);
    
    // 2. Verificar rol
    if (!requiredRole.includes(token.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    
    // 3. Verificar acceso al recurso (coach solo su equipo)
    if (resourceCheck && !await resourceCheck(token, req.params)) {
      auditLog(token.userId, 'ACCESS_DENIED', req.path);
      return res.status(403).json({ error: 'Sin acceso a este recurso' });
    }
    
    next();
  };
}
```

### Políticas de Seguridad
- Passwords hasheados con bcrypt (salt rounds: 12)
- JWT con expiración de 24 horas
- Refresh tokens con rotación
- Rate limiting: 100 requests/minuto por IP
- CORS configurado para dominios permitidos
- Sanitización de inputs con Zod
- Audit log para operaciones sensibles
- HTTPS obligatorio en producción

## 7. Servicios Externos

### WhatsApp (Twilio)
```typescript
// Flujo de notificación WhatsApp
interface WhatsAppNotification {
  to: string;        // Número del padre
  templateName: string; // 'match_reminder', 'result_notification'
  variables: {
    playerName: string;
    matchDate: string;
    location: string;
    opponent: string;
  };
}
```

### Email (Resend)
```typescript
// Flujo de notificación Email
interface EmailNotification {
  to: string;
  subject: string;
  template: 'match_result' | 'progress_report' | 'task_assigned';
  data: Record<string, any>;
  attachments?: { filename: string; content: Buffer }[]; // PDF reports
}
```

### Fuentes Externas de Ejercicios
- Base de datos seed con 200+ ejercicios profesionales precargados
- Categorización por metodología (Barcelona, Chelsea, Ajax, Arsenal)
- Caché en Redis con TTL de 7 días
- Fallback a datos locales si API externa no disponible

### API de Estadísticas de Formaciones
- Datos seed con estadísticas históricas de formaciones
- Recomendaciones basadas en reglas por edad/categoría
- Caché en Redis con TTL de 24 horas

## 8. Diseño de Interfaz - Guía Visual

### Paleta de Colores
```css
:root {
  /* Colores principales - Inspirados en fútbol profesional */
  --primary: #1a472a;        /* Verde oscuro (campo) */
  --primary-light: #2d6a4f;  /* Verde medio */
  --secondary: #d4af37;      /* Dorado (trofeo) */
  --accent: #e63946;         /* Rojo (energía) */
  
  /* Neutros */
  --bg-dark: #0f1923;        /* Fondo oscuro (estilo UEFA) */
  --bg-card: #1a2332;        /* Fondo tarjetas */
  --bg-light: #f8f9fa;       /* Fondo claro */
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --text-dark: #1e293b;
  
  /* Estados */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### Tipografía
- Títulos: Inter Bold (700) - 24px-48px
- Subtítulos: Inter SemiBold (600) - 18px-24px
- Cuerpo: Inter Regular (400) - 14px-16px
- Datos/Stats: JetBrains Mono - 14px-20px (números monoespaciados)

### Componentes Clave del Frontend Público

```
┌─────────────────────────────────────────────────────────┐
│ NAVBAR: Logo | Torneos | Equipos | Estadísticas | Login │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              HERO SECTION                          │  │
│  │  Imagen de alta calidad de fútbol                  │  │
│  │  "Liga Profesional de Fútbol"                      │  │
│  │  [Ver Torneos Activos]  [Explorar Equipos]         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─── MARCADORES EN VIVO ────────────────────────────┐  │
│  │ ⚽ Equipo A  2 - 1  Equipo B  │  45' │  EN VIVO  │  │
│  │ ⚽ Equipo C  0 - 0  Equipo D  │  32' │  EN VIVO  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─── TORNEOS ACTIVOS ──┐  ┌─── PRÓXIMOS PARTIDOS ──┐  │
│  │ 🏆 Liga Apertura     │  │ 📅 Sáb 3 May - 16:00  │  │
│  │    8 equipos | Jorn 5│  │    Eagles vs Tigers     │  │
│  │ 🏆 Copa Juvenil      │  │ 📅 Dom 4 May - 10:00  │  │
│  │    12 equipos | Cuart│  │    Lions vs Hawks       │  │
│  └───────────────────────┘  └────────────────────────┘  │
│                                                          │
│  ┌─── TABLA DE POSICIONES (Torneo Principal) ────────┐  │
│  │ # │ Equipo      │ PJ │ G │ E │ P │ GF│ GC│ DG│Pts│  │
│  │ 1 │ 🟢 Eagles   │ 10 │ 7 │ 2 │ 1 │ 22│  8│+14│ 23│  │
│  │ 2 │ 🔵 Tigers   │ 10 │ 6 │ 3 │ 1 │ 18│  7│+11│ 21│  │
│  │ 3 │ 🔴 Lions    │ 10 │ 5 │ 3 │ 2 │ 15│ 10│ +5│ 18│  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─── MÁXIMO GOLEADOR ──┐  ┌─── ESTADÍSTICAS ───────┐  │
│  │ 👤 Juan Pérez        │  │ Goles totales: 156     │  │
│  │    Eagles | 12 goles  │  │ Promedio/partido: 2.8  │  │
│  └───────────────────────┘  └────────────────────────┘  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ FOOTER: © 2026 | Contacto | Términos | Redes Sociales  │
└─────────────────────────────────────────────────────────┘
```

### Dashboard del Entrenador

```
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR          │  DASHBOARD ENTRENADOR                │
│ ┌──────────────┐ │                                      │
│ │ 🏠 Dashboard │ │  ┌─── RESUMEN ────────────────────┐ │
│ │ ⚽ Mi Equipo  │ │  │ Jugadores: 22 │ Próx Partido:  │ │
│ │ 📋 Tácticas  │ │  │ Tareas Pend: 8│ Sáb 3 May 16h  │ │
│ │ 📚 Ejercicios│ │  │ Eval. Pend: 3 │ vs Tigers       │ │
│ │ 🏋️ Entrenam. │ │  └────────────────────────────────┘ │
│ │ 📊 Evaluac.  │ │                                      │
│ │ ✅ Tareas    │ │  ┌─── PUNTOS DÉBILES EQUIPO ──────┐ │
│ │ 📈 Desarrollo│ │  │ ⚠️ Pie débil (prom: 4.2)       │ │
│ │ 📄 Reportes  │ │  │ ⚠️ Resistencia (prom: 5.1)     │ │
│ │ 💡 Recomend. │ │  │ ⚠️ Juego aéreo (prom: 5.3)     │ │
│ │ 📉 Análisis  │ │  │ [Ver ejercicios recomendados]   │ │
│ └──────────────┘ │  └────────────────────────────────┘ │
│                   │                                      │
│                   │  ┌─── ALERTAS ────────────────────┐ │
│                   │  │ 🔴 3 tareas vencidas            │ │
│                   │  │ 🟡 5 jugadores sin evaluar >30d │ │
│                   │  │ 🟢 2 objetivos próximos a vencer│ │
│                   │  └────────────────────────────────┘ │
│                   │                                      │
│                   │  ┌─── PROGRESO EQUIPO (gráfico) ──┐ │
│                   │  │  📈 Línea temporal de promedios │ │
│                   │  │  Técnica ──── Táctica ────      │ │
│                   │  │  Física ──── Mental ────        │ │
│                   │  └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Perfil de Jugador (Radar Chart)

```
┌─────────────────────────────────────────────────────────┐
│  PERFIL DE JUGADOR                                       │
│  ┌──────────────┐  ┌────────────────────────────────┐   │
│  │  📷 Foto     │  │  Juan Pérez García              │   │
│  │  jugador     │  │  #10 | Mediocampista | Eagles   │   │
│  │              │  │  Edad: 16 | Cat: Juvenil        │   │
│  └──────────────┘  └────────────────────────────────┘   │
│                                                          │
│  ┌─── RADAR CHART ──────┐  ┌─── ESTADÍSTICAS ───────┐  │
│  │      Técnica          │  │ Goles: 8               │  │
│  │        8.2            │  │ Asistencias: 12        │  │
│  │  Mental    Táctica    │  │ Tarjetas Am: 2         │  │
│  │   7.5        7.8      │  │ Tarjetas Rj: 0         │  │
│  │      Física           │  │ Partidos: 15           │  │
│  │        6.9            │  │ Minutos: 1,230         │  │
│  └───────────────────────┘  └────────────────────────┘  │
│                                                          │
│  ┌─── FORTALEZAS ────────┐  ┌─── DEBILIDADES ───────┐  │
│  │ ✅ Visión de juego 9.1│  │ ⚠️ Pie débil 4.5      │  │
│  │ ✅ Pase 8.8           │  │ ⚠️ Resistencia 5.2    │  │
│  │ ✅ Liderazgo 8.5      │  │ ⚠️ Juego aéreo 5.8    │  │
│  └───────────────────────┘  └────────────────────────┘  │
│                                                          │
│  ┌─── TRACKING DE PROGRESO (últimos 6 meses) ───────┐  │
│  │  📈 Gráfico de línea temporal por dimensión       │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 9. Propiedades de Correctitud

### P1: Integridad de Tabla de Posiciones
Para todo torneo T con formato liga, la suma de puntos de todos los equipos debe ser consistente con los resultados registrados. Para cada partido finalizado, exactamente 3 puntos son distribuidos (3-0 para victoria, 1-1 para empate).

### P2: Unicidad de Camiseta por Equipo
Para todo equipo E, no pueden existir dos jugadores activos (sin fecha de salida) con el mismo número de camiseta.

### P3: Validación de Formación
Para toda táctica T con formación F, la cantidad de jugadores asignados debe ser exactamente igual a la suma de los números en F más 1 (portero). Ejemplo: 4-4-2 = 4+4+2+1 = 11 jugadores.

### P4: Restricción de Inscripción por Categoría
Para todo equipo E inscrito en torneo T, al menos una categoría de E debe estar en las categorías permitidas de T.

### P5: Aislamiento de Datos por Rol
Para todo entrenador C asignado a equipo E, las operaciones de escritura de C solo pueden afectar datos asociados a E. Ninguna operación de C puede modificar datos de equipos diferentes a E.

### P6: Consistencia de Evaluaciones
Para toda evaluación de jugador, cada calificación debe estar en el rango [1, 10], y los promedios calculados deben ser la media aritmética exacta de los criterios de su dimensión.

### P7: No Conflicto de Ubicación
Para toda ubicación L, no pueden existir dos partidos programados en L cuyo rango de tiempo se solape (considerando duración estándar de 2 horas por partido).

### P8: Elegibilidad de Jugadores
Para todo partido M, cada jugador en la alineación debe pertenecer al equipo correspondiente y no tener suspensiones activas en el torneo.

### P9: Integridad de Fixture
Para todo torneo T con formato liga, el fixture generado debe contener exactamente n*(n-1) partidos donde n es el número de equipos (ida y vuelta), y cada equipo debe tener máximo 1 partido por día.

### P10: Consistencia de Notificaciones
Para todo partido programado en categoría infantil, cada padre/tutor asociado a un jugador participante debe recibir exactamente una notificación por canal habilitado (WhatsApp y/o Email).
