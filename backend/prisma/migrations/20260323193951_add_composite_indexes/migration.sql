-- CreateIndex
CREATE INDEX "audit_logs_created_at_entity_type_idx" ON "audit_logs"("created_at" DESC, "entity_type");

-- CreateIndex
CREATE INDEX "location_logs_driver_id_timestamp_idx" ON "location_logs"("driver_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "shipments_status_driver_id_idx" ON "shipments"("status", "driver_id");

-- CreateIndex
CREATE INDEX "shipments_driver_id_status_idx" ON "shipments"("driver_id", "status");

-- CreateIndex
CREATE INDEX "support_tickets_status_priority_created_at_idx" ON "support_tickets"("status", "priority" DESC, "created_at" DESC);
