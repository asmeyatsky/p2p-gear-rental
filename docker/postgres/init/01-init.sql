-- PostgreSQL initialization script for P2P Gear Rental Platform
-- This script runs when the database container is first created

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create custom indexes for better performance
-- Note: Prisma will handle the main schema creation

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function for full-text search with ranking
CREATE OR REPLACE FUNCTION gear_search_rank(
    search_text TEXT,
    title TEXT,
    description TEXT,
    brand TEXT,
    model TEXT
) RETURNS FLOAT AS $$
BEGIN
    RETURN (
        COALESCE(ts_rank(to_tsvector('english', title), plainto_tsquery('english', search_text)), 0) * 4 +
        COALESCE(ts_rank(to_tsvector('english', description), plainto_tsquery('english', search_text)), 0) * 2 +
        COALESCE(ts_rank(to_tsvector('english', COALESCE(brand, '')), plainto_tsquery('english', search_text)), 0) * 3 +
        COALESCE(ts_rank(to_tsvector('english', COALESCE(model, '')), plainto_tsquery('english', search_text)), 0) * 3
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to calculate distance between two points (haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 FLOAT,
    lon1 FLOAT,
    lat2 FLOAT,
    lon2 FLOAT
) RETURNS FLOAT AS $$
DECLARE
    r FLOAT := 6371; -- Earth's radius in kilometers
    dlat FLOAT;
    dlon FLOAT;
    a FLOAT;
    c FLOAT;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon/2) * sin(dlon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Log the initialization
INSERT INTO pg_stat_statements_reset() SELECT 1 WHERE false; -- This is just a placeholder
-- The actual logging will be handled by the application