-- ============================================
-- Remove Marketplace-specific tables
-- Keep: companies, company_users (internal use)
-- Remove: loads, bids (marketplace features)
-- ============================================

-- Drop marketplace tables
DROP TABLE IF EXISTS "bids" CASCADE;
DROP TABLE IF EXISTS "loads" CASCADE;

-- Drop marketplace enums
DROP TYPE IF EXISTS "BidStatus";
DROP TYPE IF EXISTS "LoadStatus";

-- Remove load_id from shipments (if exists)
ALTER TABLE "shipments" DROP CONSTRAINT IF EXISTS "shipments_load_id_fkey";
ALTER TABLE "shipments" DROP COLUMN IF EXISTS "load_id";

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Marketplace tables removed successfully';
  RAISE NOTICE 'Companies table retained for internal use';
  RAISE NOTICE 'Driver availability fields already in driver_profiles';
END $$;
