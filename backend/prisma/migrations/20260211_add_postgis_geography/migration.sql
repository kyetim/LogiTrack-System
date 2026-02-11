-- Add PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Rename existing JSON columns to avoid conflict
ALTER TABLE shipments 
  RENAME COLUMN pickup_location TO origin_coordinates;
  
ALTER TABLE shipments 
  RENAME COLUMN delivery_location TO destination_coordinates;

-- Add new geography columns
ALTER TABLE shipments 
  ADD COLUMN pickup_location GEOGRAPHY(Point, 4326),
  ADD COLUMN delivery_location GEOGRAPHY(Point, 4326);

-- Migrate existing JSON coordinates to geography (if they exist)
UPDATE shipments SET
  pickup_location = ST_SetSRID(
    ST_MakePoint(
      (origin_coordinates->>'lng')::float,
      (origin_coordinates->>'lat')::float
    ), 4326
  )::geography
WHERE origin_coordinates IS NOT NULL 
  AND origin_coordinates != 'null'::jsonb;

UPDATE shipments SET
  delivery_location = ST_SetSRID(
    ST_MakePoint(
      (destination_coordinates->>'lng')::float,
      (destination_coordinates->>'lat')::float
    ), 4326
  )::geography
WHERE destination_coordinates IS NOT NULL 
  AND destination_coordinates != 'null'::jsonb;

-- Add geography column to driver_profiles table
ALTER TABLE driver_profiles
  ADD COLUMN IF NOT EXISTS current_location GEOGRAPHY(Point, 4326),
  ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_available_for_work BOOLEAN DEFAULT false;

-- Create spatial indexes (GIST) for fast proximity searches
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_location 
  ON shipments USING GIST (pickup_location);

CREATE INDEX IF NOT EXISTS idx_shipments_delivery_location 
  ON shipments USING GIST (delivery_location);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_current_location 
  ON driver_profiles USING GIST (current_location);

-- Create index for availability queries
CREATE INDEX IF NOT EXISTS idx_driver_profiles_is_available 
  ON driver_profiles (is_available_for_work)
  WHERE is_available_for_work = true;
