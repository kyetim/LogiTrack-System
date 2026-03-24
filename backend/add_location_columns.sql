-- Add location tracking columns to driver_profiles table
ALTER TABLE driver_profiles 
ADD COLUMN IF NOT EXISTS current_location geography(Point,4326),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_available_for_work BOOLEAN DEFAULT false;

-- Add PostGIS geography columns to shipments table  
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS pickup_location geography(Point,4326),
ADD COLUMN IF NOT EXISTS delivery_location geography(Point,4326);

-- Create spatial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_driver_current_location ON driver_profiles USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_shipment_pickup_location ON shipments USING GIST(pickup_location);
CREATE INDEX IF NOT EXISTS idx_shipment_delivery_location ON shipments USING GIST(delivery_location);
