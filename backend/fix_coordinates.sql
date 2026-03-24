-- Fix null coordinates in shipments
UPDATE shipments 
SET 
  origin_coordinates = '{"lat": 0, "lng": 0}'::jsonb,
  destination_coordinates = '{"lat": 0, "lng": 0}'::jsonb
WHERE origin_coordinates IS NULL OR destination_coordinates IS NULL;
