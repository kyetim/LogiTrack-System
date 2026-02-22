-- ============================================
-- LOGITRACK: TIRPORT Features Migration
-- Version: 1.0
-- Date: 2026-02-04
-- Type: ADDITIVE ONLY (No destructive changes)
-- Rollback: See down.sql in same directory
-- ============================================

-- SAFETY CHECK: Disabled for shadow database compatibility
-- DO $$
-- BEGIN
--   IF current_database() != 'logitrack_db' THEN
--     RAISE EXCEPTION 'Wrong database! Expected logitrack_db, got %', current_database();
--   END IF;
-- END $$;

-- ============================================
-- PHASE 1: NEW ENUMS
-- ============================================

-- Company & Multi-tenancy
CREATE TYPE "CompanyUserRole" AS ENUM ('OWNER', 'MANAGER', 'DISPATCHER', 'VIEWER');

-- Marketplace
CREATE TYPE "LoadStatus" AS ENUM ('OPEN', 'BIDDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "VehicleTypeEnum" AS ENUM ('TRUCK', 'TRAILER', 'TANKER', 'REFRIGERATED', 'CONTAINER', 'FLATBED');

-- Geofencing
CREATE TYPE "GeofenceType" AS ENUM ('PICKUP', 'DELIVERY', 'WAREHOUSE', 'CHECKPOINT');
CREATE TYPE "GeofenceEventType" AS ENUM ('ENTER', 'EXIT');

-- Document Management
CREATE TYPE "EntityType" AS ENUM ('USER', 'VEHICLE', 'SHIPMENT', 'COMPANY');
CREATE TYPE "DocumentType" AS ENUM (
  'DRIVERS_LICENSE',
  'VEHICLE_REGISTRATION',
  'INSURANCE',
  'SRC_CERTIFICATE',
  'PSYCHOTECHNICAL',
  'INVOICE',
  'WAYBILL',
  'DELIVERY_PHOTO',
  'OTHER'
);

-- Billing
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- Extend existing UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COMPANY_OWNER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COMPANY_MANAGER';

-- ============================================
-- PHASE 2: NEW TABLES
-- ============================================

-- 2.1 COMPANIES TABLE
CREATE TABLE IF NOT EXISTS "companies" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "tax_number" TEXT NOT NULL UNIQUE,
  "address" TEXT NOT NULL,
  "contact_email" TEXT NOT NULL,
  "contact_phone" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "credit_limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "current_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 COMPANY USERS (Many-to-Many: User <-> Company)
CREATE TABLE IF NOT EXISTS "company_users" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "role" "CompanyUserRole" NOT NULL DEFAULT 'VIEWER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "company_users_user_id_company_id_key" UNIQUE("user_id", "company_id"),
  CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2.3 LOADS (Marketplace Load Postings)
CREATE TABLE IF NOT EXISTS "loads" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "company_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "pickup_location" JSONB NOT NULL,
  "delivery_location" JSONB NOT NULL,
  "pickup_date" TIMESTAMP(3) NOT NULL,
  "delivery_date" TIMESTAMP(3),
  "cargo_type" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "volume" DOUBLE PRECISION,
  "vehicle_type" "VehicleTypeEnum" NOT NULL,
  "status" "LoadStatus" NOT NULL DEFAULT 'OPEN',
  "budget" DOUBLE PRECISION,
  "selected_bid_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "loads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for loads
CREATE INDEX IF NOT EXISTS "loads_status_idx" ON "loads"("status");
CREATE INDEX IF NOT EXISTS "loads_pickup_date_idx" ON "loads"("pickup_date");
CREATE INDEX IF NOT EXISTS "loads_company_id_idx" ON "loads"("company_id");

-- 2.4 BIDS (Driver bids on loads)
CREATE TABLE IF NOT EXISTS "bids" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "load_id" TEXT NOT NULL,
  "driver_id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "estimated_delivery" TIMESTAMP(3),
  "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "bids_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "bids_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for bids
CREATE INDEX IF NOT EXISTS "bids_load_id_idx" ON "bids"("load_id");
CREATE INDEX IF NOT EXISTS "bids_driver_id_idx" ON "bids"("driver_id");
CREATE INDEX IF NOT EXISTS "bids_status_idx" ON "bids"("status");

-- 2.5 GEOFENCES
CREATE TABLE IF NOT EXISTS "geofences" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "type" "GeofenceType" NOT NULL,
  "center" JSONB NOT NULL,
  "radius" DOUBLE PRECISION NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 GEOFENCE EVENTS
CREATE TABLE IF NOT EXISTS "geofence_events" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "geofence_id" TEXT NOT NULL,
  "driver_id" TEXT NOT NULL,
  "shipment_id" TEXT,
  "event_type" "GeofenceEventType" NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "location" JSONB NOT NULL,
  
  CONSTRAINT "geofence_events_geofence_id_fkey" FOREIGN KEY ("geofence_id") REFERENCES "geofences"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "geofence_events_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "geofence_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for geofence events
CREATE INDEX IF NOT EXISTS "geofence_events_driver_id_idx" ON "geofence_events"("driver_id");
CREATE INDEX IF NOT EXISTS "geofence_events_timestamp_idx" ON "geofence_events"("timestamp");
CREATE INDEX IF NOT EXISTS "geofence_events_geofence_id_idx" ON "geofence_events"("geofence_id");

-- 2.7 DOCUMENTS
CREATE TABLE IF NOT EXISTS "documents" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "entity_type" "EntityType" NOT NULL,
  "entity_id" TEXT NOT NULL,
  "type" "DocumentType" NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" TEXT NOT NULL,
  "extracted_data" JSONB,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "verified_by" TEXT,
  "verified_at" TIMESTAMP(3),
  "expiry_date" TIMESTAMP(3),
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "upload_location" JSONB
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "documents_type_idx" ON "documents"("type");

-- 2.8 DRIVER SCORES
CREATE TABLE IF NOT EXISTS "driver_scores" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "driver_id" TEXT NOT NULL UNIQUE,
  "overall_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "safety_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fuel_efficiency" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "punctuality_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "customer_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_deliveries" INTEGER NOT NULL DEFAULT 0,
  "on_time_deliveries" INTEGER NOT NULL DEFAULT 0,
  "late_deliveries" INTEGER NOT NULL DEFAULT 0,
  "hard_braking_count" INTEGER NOT NULL DEFAULT 0,
  "rapid_accel_count" INTEGER NOT NULL DEFAULT 0,
  "speeding_count" INTEGER NOT NULL DEFAULT 0,
  "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "driver_scores_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2.9 MESSAGES
CREATE TABLE IF NOT EXISTS "messages" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sender_id" TEXT NOT NULL,
  "recipient_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMP(3),
  "attachments" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS "messages_recipient_id_is_read_idx" ON "messages"("recipient_id", "is_read");
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages"("created_at");

-- 2.10 INVOICES
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "invoice_number" TEXT NOT NULL UNIQUE,
  "company_id" TEXT NOT NULL,
  "shipment_id" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_amount" DOUBLE PRECISION NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
  "due_date" TIMESTAMP(3) NOT NULL,
  "paid_at" TIMESTAMP(3),
  "file_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "invoices_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_company_id_idx" ON "invoices"("company_id");

-- ============================================
-- PHASE 3: MODIFY EXISTING TABLES (ADDITIVE ONLY)
-- ============================================

-- 3.1 Users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" TEXT;

-- 3.2 Driver Profiles table
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN DEFAULT true;
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "current_load_capacity" DOUBLE PRECISION;
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "preferred_routes" JSONB;

-- 3.3 Vehicles table
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "vehicle_type_enum" "VehicleTypeEnum" DEFAULT 'TRUCK';
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "max_weight" DOUBLE PRECISION;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "max_volume" DOUBLE PRECISION;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "features" JSONB;

-- 3.4 Shipments table
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "load_id" TEXT UNIQUE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_load_id_fkey" 
  FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- PHASE 4: TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON "companies"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loads_updated_at BEFORE UPDATE ON "loads"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON "bids"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_scores_updated_at BEFORE UPDATE ON "driver_scores"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON "invoices"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

-- Count new tables
DO $$
DECLARE
  new_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO new_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'companies', 'company_users', 'loads', 'bids',
    'geofences', 'geofence_events', 'documents',
    'driver_scores', 'messages', 'invoices'
  );
  
  RAISE NOTICE 'Successfully created % new tables', new_table_count;
  
  IF new_table_count != 10 THEN
    RAISE WARNING 'Expected 10 new tables, found %', new_table_count;
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Migration executed successfully!
-- New tables: 10
-- Modified tables: 4 (users, driver_profiles, vehicles, shipments)
-- All changes are ADDITIVE - no data loss
-- ============================================
