-- PostgreSQL initialization script
-- This script runs automatically when the database container starts for the first time
-- Only runs if the database is fresh (empty)

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search on character data

-- Set timezone to UTC
ALTER DATABASE alumni_db SET timezone = 'UTC';

-- Create schema (optional, if your app uses schemas)
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE alumni_db TO tms_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO tms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tms_user;

-- Log initialization completion
SELECT now() as initialization_time, 'PostgreSQL initialization completed' as status;
