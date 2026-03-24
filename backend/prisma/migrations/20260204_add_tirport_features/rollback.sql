-- ============================================
-- LOGITRACK: TIRPORT Features Migration ROLLBACK
-- Version: 1.0
-- Date: 2026-02-04
-- WARNING: This will remove all TIRPORT features
-- ============================================

-- SAFETY CHECK
DO $$
BEGIN
  IF current_database() != 'logitrack_db' THEN
    RAISE EXCEPTION 'Wrong database! Expected logitrack_db, got %', current_database();
  END IF;
  
  RAISE NOTICE 'WARNING: This will delete TIRPORT data!';
END $$;

-- ============================================
-- PHASE 1: DROP TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_companies_updated_at ON "companies";
DROP TRIGGER IF EXISTS update_loads_updated_at ON "loads";
DROP TRIGGER IF EXISTS update_bids_updated_at ON "bids";
DROP TRIGGER IF EXISTS update_driver_scores_updated_at ON "driver_scores";
DROP TRIGGER IF EXISTS update_invoices_updated_at ON "invoices";

-- ============================================
-- PHASE 2: REMOVE COLUMNS FROM EXISTING TABLES
-- ============================================

-- Shipments
ALTER TABLE "shipments" DROP CONSTRAINT IF EXISTS "shipments_load_id_fkey";
ALTER TABLE "shipments" DROP COLUMN IF EXISTS "load_id";

-- Vehicles
ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "features";
ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "max_volume";
ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "max_weight";
ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "vehicle_type_enum";

-- Driver Profiles
ALTER TABLE "driver_profiles" DROP COLUMN IF EXISTS "preferred_routes";
ALTER TABLE "driver_profiles" DROP COLUMN IF EXISTS "current_load_capacity";
ALTER TABLE "driver_profiles" DROP COLUMN IF EXISTS "is_available";

-- Users
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_number";

-- ============================================
-- PHASE 3: DROP NEW TABLES (IN REVERSE ORDER)
-- ============================================

DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "driver_scores" CASCADE;
DROP TABLE IF EXISTS "documents" CASCADE;
DROP TABLE IF EXISTS "geofence_events" CASCADE;
DROP TABLE IF EXISTS "geofences" CASCADE;
DROP TABLE IF EXISTS "bids" CASCADE;
DROP TABLE IF EXISTS "loads" CASCADE;
DROP TABLE IF EXISTS "company_users" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;

-- ============================================
-- PHASE 4: DROP NEW ENUMS
-- ============================================

DROP TYPE IF EXISTS "InvoiceStatus";
DROP TYPE IF EXISTS "DocumentType";
DROP TYPE IF EXISTS "EntityType";
DROP TYPE IF EXISTS "GeofenceEventType";
DROP TYPE IF EXISTS "GeofenceType";
DROP TYPE IF EXISTS "VehicleTypeEnum";
DROP TYPE IF EXISTS "BidStatus";
DROP TYPE IF EXISTS "LoadStatus";
DROP TYPE IF EXISTS "CompanyUserRole";

-- Note: Cannot remove values from UserRole enum without recreating it
-- Manual intervention required if you added COMPANY_OWNER/COMPANY_MANAGER

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  remaining_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'companies', 'company_users', 'loads', 'bids',
    'geofences', 'geofence_events', 'documents',
    'driver_scores', 'messages', 'invoices'
  );
  
  IF remaining_tables = 0 THEN
    RAISE NOTICE 'Rollback successful! All TIRPORT tables removed.';
  ELSE
    RAISE WARNING 'Rollback incomplete! % tables still exist', remaining_tables;
  END IF;
END $$;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================
