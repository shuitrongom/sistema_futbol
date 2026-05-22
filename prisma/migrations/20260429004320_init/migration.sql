-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'coach', 'parent', 'player');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('league', 'knockout', 'group_knockout');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled');

-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('group', 'round_of_16', 'quarter_final', 'semi_final', 'final');

-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('goalkeeper', 'defender', 'midfielder', 'forward');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'rejected');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('positive', 'improvement', 'technical');

-- CreateEnum
CREATE TYPE "EvalContext" AS ENUM ('match', 'training', 'formal');

-- CreateEnum
CREATE TYPE "StrategyType" AS ENUM ('offensive', 'defensive', 'counter_attack', 'possession');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "badge_url" VARCHAR(500),
    "primary_color" VARCHAR(7),
    "secondary_color" VARCHAR(7),
    "city" VARCHAR(255),
    "coach_id" UUID,
    "home_uniform_primary" VARCHAR(7),
    "home_uniform_secondary" VARCHAR(7),
    "home_uniform_description" TEXT,
    "home_uniform_image_url" VARCHAR(500),
    "away_uniform_primary" VARCHAR(7),
    "away_uniform_secondary" VARCHAR(7),
    "away_uniform_description" TEXT,
    "away_uniform_image_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_categories" (
    "team_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "team_categories_pkey" PRIMARY KEY ("team_id","category_id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "birth_date" DATE NOT NULL,
    "id_number" VARCHAR(50) NOT NULL,
    "position" "PlayerPosition" NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "photo_url" VARCHAR(500),
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_players" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "jersey_number" INTEGER NOT NULL,
    "joined_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATE,

    CONSTRAINT "team_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "format" "TournamentFormat" NOT NULL,
    "min_teams" INTEGER NOT NULL DEFAULT 2,
    "max_teams" INTEGER NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_categories" (
    "tournament_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "tournament_categories_pkey" PRIMARY KEY ("tournament_id","category_id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "tournament_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("tournament_id","team_id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "PhaseType" NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "phase_order" INTEGER NOT NULL,
    "classification_criteria" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "phase_id" UUID,
    "home_team_id" UUID NOT NULL,
    "away_team_id" UUID NOT NULL,
    "location_id" UUID,
    "date_time" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "home_score" INTEGER,
    "away_score" INTEGER,
    "home_tactic_id" UUID,
    "away_tactic_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_events" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "team_id" UUID,
    "player_id" UUID,
    "event_type" VARCHAR(20) NOT NULL,
    "minute" INTEGER,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "phase_id" UUID,
    "team_id" UUID NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "goals_for" INTEGER NOT NULL DEFAULT 0,
    "goals_against" INTEGER NOT NULL DEFAULT 0,
    "goal_difference" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspensions" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "matches_remaining" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suspensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tactics" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "formation" VARCHAR(20) NOT NULL,
    "strategy" "StrategyType",
    "player_positions" JSONB NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tactics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_players" (
    "id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,

    CONSTRAINT "parent_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "difficulty" VARCHAR(20),
    "duration_minutes" INTEGER,
    "players_required" INTEGER,
    "materials" TEXT,
    "diagram_url" VARCHAR(500),
    "methodology_source" VARCHAR(100),
    "is_small_sided_game" BOOLEAN NOT NULL DEFAULT false,
    "game_format" VARCHAR(10),
    "is_external" BOOLEAN NOT NULL DEFAULT false,
    "cached_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_favorites" (
    "coach_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,

    CONSTRAINT "exercise_favorites_pkey" PRIMARY KEY ("coach_id","exercise_id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "coach_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "target_age_min" INTEGER,
    "target_age_max" INTEGER,
    "level" VARCHAR(20),
    "objectives" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "effectiveness_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "session_date" DATE,
    "duration_minutes" INTEGER,
    "phase" VARCHAR(20),
    "session_order" INTEGER NOT NULL,
    "executed_at" TIMESTAMP(3),
    "attendance" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_exercises" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "exercise_order" INTEGER NOT NULL,
    "effectiveness_rating" INTEGER,
    "coach_notes" TEXT,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_evaluations" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "evaluator_id" UUID,
    "team_id" UUID,
    "context" "EvalContext" NOT NULL,
    "evaluation_date" DATE NOT NULL,
    "ball_control" INTEGER,
    "passing" INTEGER,
    "dribbling" INTEGER,
    "shooting" INTEGER,
    "heading" INTEGER,
    "weak_foot" INTEGER,
    "technical_avg" DECIMAL(3,1),
    "technical_comments" TEXT,
    "positioning" INTEGER,
    "game_vision" INTEGER,
    "decision_making" INTEGER,
    "system_understanding" INTEGER,
    "tactical_avg" DECIMAL(3,1),
    "tactical_comments" TEXT,
    "speed" INTEGER,
    "endurance" INTEGER,
    "strength" INTEGER,
    "agility" INTEGER,
    "coordination" INTEGER,
    "physical_avg" DECIMAL(3,1),
    "physical_comments" TEXT,
    "concentration" INTEGER,
    "attitude" INTEGER,
    "leadership" INTEGER,
    "teamwork" INTEGER,
    "resilience" INTEGER,
    "mental_avg" DECIMAL(3,1),
    "mental_comments" TEXT,
    "position_metrics" JSONB,
    "overall_avg" DECIMAL(3,1),
    "top_strengths" JSONB,
    "top_weaknesses" JSONB,
    "is_feedback_360" BOOLEAN NOT NULL DEFAULT false,
    "feedback_360_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_360_sessions" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_360_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_360_evaluators" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "evaluator_id" UUID NOT NULL,
    "evaluation_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "notified_at" TIMESTAMP(3),

    CONSTRAINT "feedback_360_evaluators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_tasks" (
    "id" UUID NOT NULL,
    "coach_id" UUID,
    "team_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "task_type" VARCHAR(20),
    "deadline" DATE,
    "completion_criteria" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "individual_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "player_comments" TEXT,
    "coach_feedback" TEXT,
    "completed_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development_objectives" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "coach_id" UUID,
    "team_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "target_value" DECIMAL(3,1),
    "current_value" DECIMAL(3,1),
    "metric_name" VARCHAR(100),
    "start_date" DATE,
    "target_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "development_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalized_feedback" (
    "id" UUID NOT NULL,
    "coach_id" UUID,
    "player_id" UUID NOT NULL,
    "team_id" UUID,
    "feedback_type" "FeedbackType" NOT NULL,
    "message" TEXT NOT NULL,
    "related_evaluation_id" UUID,
    "related_task_id" UUID,
    "sent_to_parent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personalized_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_reports" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "coach_id" UUID,
    "team_id" UUID,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "report_type" VARCHAR(20),
    "content" JSONB NOT NULL,
    "pdf_url" VARCHAR(500),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development_plans" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "coach_id" UUID,
    "team_id" UUID,
    "focus_areas" JSONB,
    "recommended_exercises" JSONB,
    "evaluation_schedule" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "parent_comments" TEXT,
    "player_comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "development_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_cache" (
    "id" UUID NOT NULL,
    "team_id" UUID,
    "category" VARCHAR(50),
    "avg_age" DECIMAL(4,1),
    "recommendations" JSONB NOT NULL,
    "source" VARCHAR(100),
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "channel" VARCHAR(20) NOT NULL,
    "subject" VARCHAR(255),
    "content" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "players_id_number_key" ON "players"("id_number");

-- CreateIndex
CREATE INDEX "team_players_team_id_idx" ON "team_players"("team_id");

-- CreateIndex
CREATE INDEX "team_players_player_id_idx" ON "team_players"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_players_team_id_jersey_number_left_at_key" ON "team_players"("team_id", "jersey_number", "left_at");

-- CreateIndex
CREATE INDEX "matches_tournament_id_idx" ON "matches"("tournament_id");

-- CreateIndex
CREATE INDEX "matches_date_time_idx" ON "matches"("date_time");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "match_events_match_id_idx" ON "match_events"("match_id");

-- CreateIndex
CREATE INDEX "standings_tournament_id_idx" ON "standings"("tournament_id");

-- CreateIndex
CREATE UNIQUE INDEX "standings_tournament_id_phase_id_team_id_key" ON "standings"("tournament_id", "phase_id", "team_id");

-- CreateIndex
CREATE INDEX "suspensions_player_id_is_active_idx" ON "suspensions"("player_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "parent_players_parent_id_player_id_key" ON "parent_players"("parent_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "exercises_category_idx" ON "exercises"("category");

-- CreateIndex
CREATE INDEX "exercises_min_age_max_age_idx" ON "exercises"("min_age", "max_age");

-- CreateIndex
CREATE INDEX "player_evaluations_player_id_idx" ON "player_evaluations"("player_id");

-- CreateIndex
CREATE INDEX "player_evaluations_evaluation_date_idx" ON "player_evaluations"("evaluation_date");

-- CreateIndex
CREATE INDEX "individual_tasks_team_id_idx" ON "individual_tasks"("team_id");

-- CreateIndex
CREATE INDEX "task_assignments_player_id_idx" ON "task_assignments"("player_id");

-- CreateIndex
CREATE INDEX "notification_log_user_id_idx" ON "notification_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_categories" ADD CONSTRAINT "team_categories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_categories" ADD CONSTRAINT "team_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_categories" ADD CONSTRAINT "tournament_categories_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_categories" ADD CONSTRAINT "tournament_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tactics" ADD CONSTRAINT "tactics_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_players" ADD CONSTRAINT "parent_players_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_players" ADD CONSTRAINT "parent_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_favorites" ADD CONSTRAINT "exercise_favorites_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_favorites" ADD CONSTRAINT "exercise_favorites_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_evaluations" ADD CONSTRAINT "player_evaluations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_evaluations" ADD CONSTRAINT "player_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_evaluations" ADD CONSTRAINT "player_evaluations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_360_sessions" ADD CONSTRAINT "feedback_360_sessions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_360_sessions" ADD CONSTRAINT "feedback_360_sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_360_sessions" ADD CONSTRAINT "feedback_360_sessions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_360_evaluators" ADD CONSTRAINT "feedback_360_evaluators_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "feedback_360_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_360_evaluators" ADD CONSTRAINT "feedback_360_evaluators_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_360_evaluators" ADD CONSTRAINT "feedback_360_evaluators_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "player_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_tasks" ADD CONSTRAINT "individual_tasks_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_tasks" ADD CONSTRAINT "individual_tasks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "individual_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_objectives" ADD CONSTRAINT "development_objectives_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_objectives" ADD CONSTRAINT "development_objectives_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_objectives" ADD CONSTRAINT "development_objectives_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_feedback" ADD CONSTRAINT "personalized_feedback_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_feedback" ADD CONSTRAINT "personalized_feedback_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_feedback" ADD CONSTRAINT "personalized_feedback_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_feedback" ADD CONSTRAINT "personalized_feedback_related_evaluation_id_fkey" FOREIGN KEY ("related_evaluation_id") REFERENCES "player_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_feedback" ADD CONSTRAINT "personalized_feedback_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "individual_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_plans" ADD CONSTRAINT "development_plans_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_plans" ADD CONSTRAINT "development_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_plans" ADD CONSTRAINT "development_plans_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_cache" ADD CONSTRAINT "recommendation_cache_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
