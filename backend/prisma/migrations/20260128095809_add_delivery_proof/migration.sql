-- AlterTable
ALTER TABLE "shipments" ALTER COLUMN "tracking_number" DROP DEFAULT,
ALTER COLUMN "origin" DROP DEFAULT,
ALTER COLUMN "destination" DROP DEFAULT;

-- CreateTable
CREATE TABLE "delivery_proofs" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "photo_url" TEXT,
    "signature_url" TEXT,
    "recipient_name" TEXT,
    "notes" TEXT,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_proofs_shipment_id_key" ON "delivery_proofs"("shipment_id");

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
