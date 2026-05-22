-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TournamentFormat" ADD VALUE 'double_knockout';
ALTER TYPE "TournamentFormat" ADD VALUE 'swiss';
ALTER TYPE "TournamentFormat" ADD VALUE 'league_playoff';
ALTER TYPE "TournamentFormat" ADD VALUE 'league_single';
ALTER TYPE "TournamentFormat" ADD VALUE 'cup';
ALTER TYPE "TournamentFormat" ADD VALUE 'round_robin_groups';
ALTER TYPE "TournamentFormat" ADD VALUE 'mini_tournament';
