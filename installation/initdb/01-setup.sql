-- First connect to template1 to ensure we have a working connection
\c template1

DO $$
BEGIN
    -- Create user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'mindplace') THEN
        CREATE USER mindplace WITH PASSWORD 'mindplace';
    END IF;
    
    -- Create database if not exists
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindplace') THEN
        CREATE DATABASE mindplace WITH OWNER mindplace;
    END IF;
END $$;

-- Connect to the new database to set additional privileges
\c mindplace

DO $$
BEGIN
    -- Ensure privileges
    GRANT ALL PRIVILEGES ON DATABASE mindplace TO mindplace;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mindplace;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mindplace;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO mindplace;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO mindplace;
END $$;
