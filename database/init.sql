-- ==========================================
-- Cloud Code — Database Initialization
-- ==========================================
-- This runs automatically on first PostgreSQL start.
-- Prisma handles schema migrations; this just ensures
-- the database and extensions are ready.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Coder will create its own tables automatically.
-- The Next.js app uses Prisma for its tables.
