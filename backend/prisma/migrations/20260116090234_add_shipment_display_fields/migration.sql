-- AlterTable
ALTER TABLE "shipments" ADD COLUMN "tracking_number" TEXT NOT NULL DEFAULT 'TRK' || EXTRACT(EPOCH FROM NOW())::TEXT,
ADD COLUMN "origin" TEXT NOT NULL DEFAULT '',
ADD COLUMN "destination" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "shipments_tracking_number_key" ON "shipments"("tracking_number");
