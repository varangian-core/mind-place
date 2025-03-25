DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'mindplace') THEN
        CREATE USER mindplace WITH PASSWORD 'mindplace';
    END IF;
END $$;

CREATE DATABASE mindplace WITH OWNER mindplace;

GRANT ALL PRIVILEGES ON DATABASE mindplace TO mindplace;
