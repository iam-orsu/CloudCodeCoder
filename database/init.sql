-- ==========================================
-- Cloud Code — Database Initialization
-- ==========================================
-- This runs automatically on first PostgreSQL start.
-- Prisma handles schema migrations; this just ensures
-- the database and extensions are ready.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a dedicated schema for Prisma so it doesn't drop Coder's tables
CREATE SCHEMA IF NOT EXISTS nextjs;

-- Coder will create its own tables automatically in the public schema.
-- The Next.js app uses Prisma for its tables in the nextjs schema.
