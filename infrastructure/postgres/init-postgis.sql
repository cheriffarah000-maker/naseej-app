-- Runs once, the first time the emergency database container is created.
-- PostGIS gives us real geography maths (metres, not degrees) for "nearest provider".
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
