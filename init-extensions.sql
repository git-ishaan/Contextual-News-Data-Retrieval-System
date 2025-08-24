-- =============================================================================
-- SECTION 1: EXTENSION SETUP
-- =============================================================================
-- This section ensures all necessary PostgreSQL extensions are enabled.

-- Enable PostGIS for geospatial data types and functions.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Enable pg_cron for scheduling background jobs.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable uuid-ossp to generate UUIDs, needed for seeding.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- SECTION 2: PERMISSIONS
-- =============================================================================

-- Grant permissions to the database user to manage cron jobs.
-- IMPORTANT: Replace 'myuser' if your Docker setup uses a different username.
GRANT USAGE ON SCHEMA cron TO myuser;


-- =============================================================================
-- SECTION 3: SCHEMA CREATION (from Prisma)
-- =============================================================================
-- This section creates the tables, columns, and relations defined in your schema.prisma.

-- Create the "User" table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create the "Article" table
CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publication_date" TIMESTAMP(3) NOT NULL,
    "source_name" TEXT NOT NULL,
    "category" TEXT[] NOT NULL,
    "relevance_score" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    "search_vector" tsvector,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- Create the "UserEvent" table
CREATE TABLE IF NOT EXISTS "UserEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for UserEvent -> Article
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserEvent_articleId_fkey') THEN
        ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END;
$$;


-- =============================================================================
-- SECTION 4: INDEX CREATION (from Prisma)
-- =============================================================================
-- Create unique constraints and indexes for faster queries.

-- Indexes for "User"
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Indexes for "Article"
CREATE INDEX IF NOT EXISTS "Article_url_key" ON "Article"("url");
CREATE INDEX IF NOT EXISTS "location_idx" ON "Article" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "Article_search_vector_idx" ON "Article" USING GIN ("search_vector");

-- Indexes for "UserEvent"
CREATE INDEX IF NOT EXISTS "event_location_idx" ON "UserEvent" USING GIST ("location");


-- =============================================================================
-- SECTION 5: FULL-TEXT SEARCH AUTOMATION
-- =============================================================================
-- Create a trigger to automatically populate the 'search_vector' column.

CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', NEW.title || ' ' || NEW.description);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger first to ensure it's not duplicated, then create it.
DROP TRIGGER IF EXISTS article_search_vector_update ON "Article";
CREATE TRIGGER article_search_vector_update
BEFORE INSERT OR UPDATE ON "Article"
FOR EACH ROW
EXECUTE FUNCTION update_article_search_vector();


-- =============================================================================
-- SECTION 6: TRENDING ARTICLES MATERIALIZED VIEW
-- =============================================================================
-- Create a materialized view to efficiently query trending articles.

CREATE MATERIALIZED VIEW IF NOT EXISTS "TrendingArticles" AS
SELECT
    a.id,
    a.title,
    a.description,
    a.url,
    a.publication_date,
    a.source_name,
    a.category,
    a.relevance_score,
    a.latitude,
    a.longitude,
    a.location,
    COALESCE(SUM(
        CASE WHEN ue."eventType" = 'click' THEN 1.5 ELSE 1.0 END *
        EXP(-EXTRACT(EPOCH FROM (NOW() - ue."createdAt")) / (3600 * 12))
    ), 0) as trending_score
FROM "Article" a
LEFT JOIN "UserEvent" ue ON a.id = ue."articleId" AND ue."createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY a.id;


-- =============================================================================
-- SECTION 7: INDEXING FOR MATERIALIZED VIEW
-- =============================================================================

-- Create a UNIQUE index on the view's primary key to allow CONCURRENT refreshes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_articles_id ON "TrendingArticles"(id);

-- Index for sorting by trending_score.
CREATE INDEX IF NOT EXISTS idx_trending_articles_score ON "TrendingArticles"(trending_score DESC);

-- Geospatial index for fast location-based lookups.
CREATE INDEX IF NOT EXISTS idx_trending_articles_location ON "TrendingArticles" USING GIST (location);


-- =============================================================================
-- SECTION 8: AUTOMATIC REFRESH SCHEDULE
-- =============================================================================
-- Use pg_cron to keep the materialized view fresh.

-- Schedules the view to be refreshed concurrently every 5 minutes.
SELECT cron.schedule('refresh-trending-articles', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY "TrendingArticles";');


-- =============================================================================
-- SECTION 9: DATABASE SEEDING
-- =============================================================================
-- This section populates the database with initial data, mimicking the seed script.

-- 9.1: Seed Admin User
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE "username" = 'admin') THEN
        -- IMPORTANT: The password 'admin@123' is hashed.
        -- Replace the hash below with the actual hash generated by your application's `hashPassword` function.
        -- Example hash for bcrypt ($2b$10$...):
        INSERT INTO "User" ("id", "username", "password", "updatedAt")
        VALUES (
            uuid_generate_v4(),
            'admin',
            '$2b$10$2dYNm5NaRL7DsTcPVSACSOjp/JGCyCbxmQ4Zm03uIQIsMtG4j4En2', 
            NOW()
        );
    END IF;
END;
$$;


-- 9.2: Seed Articles from JSON
DO $$
DECLARE
    article_count INT;
    json_data JSONB;
BEGIN
    SELECT count(*) INTO article_count FROM "Article";

    IF article_count = 0 THEN
        -- Read the JSON file from the filesystem.
        -- IMPORTANT: This requires 'news_data.json' to be present at '/docker-entrypoint-initdb.d/news_data.json'
        -- inside the PostgreSQL Docker container when this script runs.
        json_data := pg_read_file('/docker-entrypoint-initdb.d/news_data.json')::jsonb;

        -- Populate the "Article" table from the JSON array.
        -- This uses jsonb_populate_recordset to map JSON keys to table columns automatically.
        INSERT INTO "Article" (
            id, title, description, url, publication_date, source_name,
            category, relevance_score, latitude, longitude
        )
        SELECT
            p.id, p.title, p.description, p.url, (p.publication_date)::TIMESTAMP, p.source_name,
            p.category, p.relevance_score, p.latitude, p.longitude
        FROM jsonb_populate_recordset(NULL::"Article", json_data) AS p;

        -- After inserting, update the geospatial 'location' column from latitude/longitude.
        UPDATE "Article"
        SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        WHERE location IS NULL;
    END IF;
END;
$$;

-- 9.3 Simulate User Interation
-- Simulate 5 recent clicks on the target article
INSERT INTO "public"."UserEvent" ("id", "eventType", "createdAt", "articleId", "userId", "latitude", "longitude") 
VALUES
  (gen_random_uuid(), 'click', NOW() - INTERVAL '1 hour',  'be1a8c2b-c3ad-40f4-993a-78fe5d65f631', 'test-user-1', 21.77, 76.07),
  (gen_random_uuid(), 'click', NOW() - INTERVAL '2 hours', 'be1a8c2b-c3ad-40f4-993a-78fe5d65f631', 'test-user-1', 21.77, 76.07),
  (gen_random_uuid(), 'click', NOW() - INTERVAL '30 minutes', 'be1a8c2b-c3ad-40f4-993a-78fe5d65f631', 'test-user-1', 21.77, 76.07),
  (gen_random_uuid(), 'click', NOW() - INTERVAL '10 minutes', 'be1a8c2b-c3ad-40f4-993a-78fe5d65f631', 'test-user-1', 21.77, 76.07),
  (gen_random_uuid(), 'click', NOW() - INTERVAL '5 minutes',  'be1a8c2b-c3ad-40f4-993a-78fe5d65f631', 'test-user-1', 21.77, 76.07);
  
-- 9.4 Populate the material view
REFRESH MATERIALIZED VIEW CONCURRENTLY "TrendingArticles";

-- =============================================================================
-- Final log message to confirm successful execution.
SELECT 'Database initialization complete: Tables, triggers, views, and seed data are set up.' AS status;
-- =============================================================================