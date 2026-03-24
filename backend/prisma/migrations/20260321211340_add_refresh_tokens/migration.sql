/*
  Warnings:

  - You are about to drop the column `delivery_location` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `load_id` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_location` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the `bids` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loads` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `is_available` on table `driver_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_load_capacity` on table `driver_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_available_for_work` on table `driver_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_type_enum` on table `vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE', 'REPAIR', 'INSPECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'ASSIGNED', 'WAITING_REPLY', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');

-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'DRIVER';

-- DropForeignKey
ALTER TABLE "bids" DROP CONSTRAINT "bids_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "bids" DROP CONSTRAINT "bids_load_id_fkey";

-- DropForeignKey
ALTER TABLE "loads" DROP CONSTRAINT "loads_company_id_fkey";

-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_load_id_fkey";

-- DropIndex
DROP INDEX "idx_driver_profiles_current_location";

-- DropIndex
DROP INDEX "idx_shipments_delivery_location";

-- DropIndex
DROP INDEX "idx_shipments_pickup_location";

-- DropConstraint (load_id unique constraint — index değil constraint olarak oluşturulmuş)
ALTER TABLE "shipments" DROP CONSTRAINT IF EXISTS "shipments_load_id_key";

-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "company_users" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "display_name" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "driver_profiles" ALTER COLUMN "is_available" SET NOT NULL,
ALTER COLUMN "current_load_capacity" SET NOT NULL,
ALTER COLUMN "current_load_capacity" SET DEFAULT 0,
ALTER COLUMN "last_location_update" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "is_available_for_work" SET NOT NULL;

-- AlterTable
ALTER TABLE "driver_scores" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "geofence_events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "geofences" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "delivery_location",
DROP COLUMN "load_id",
DROP COLUMN "pickup_location",
ADD COLUMN     "delivery_location_geo" geography(Point,4326),
ADD COLUMN     "pickup_location_geo" geography(Point,4326),
ADD COLUMN     "sequence" INTEGER,
ADD COLUMN     "waybill_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "push_token" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "last_service_date" TIMESTAMP(3),
ADD COLUMN     "mileage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "next_service_date" TIMESTAMP(3),
ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "vehicle_type_enum" SET NOT NULL;

-- DropTable
DROP TABLE "bids";

-- DropTable
DROP TABLE "loads";

-- DropEnum
DROP TYPE "BidStatus";

-- DropEnum
DROP TYPE "LoadStatus";

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "subject" TEXT NOT NULL DEFAULT 'Support Request',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "response_count" INTEGER NOT NULL DEFAULT 0,
    "assigned_at" TIMESTAMP(3),
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "is_system_message" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_logs_vehicle_id_idx" ON "maintenance_logs"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "support_tickets_driver_id_idx" ON "support_tickets"("driver_id");

-- CreateIndex
CREATE INDEX "support_tickets_assigned_to_id_idx" ON "support_tickets"("assigned_to_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_messages_ticket_id_idx" ON "support_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "support_messages_sender_id_idx" ON "support_messages"("sender_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_user_id_key" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "shipments_driver_id_idx" ON "shipments"("driver_id");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
