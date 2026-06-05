-- Persist operational mode and audit automatic stop/recovery decisions.
CREATE TABLE "ops_incidents" (
  "id" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'warning',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "auto_paused_at" TIMESTAMP(3),
  "resolved_at" TIMESTAMP(3),
  "created_by" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ops_incidents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ops_events" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'info',
  "source" TEXT,
  "fingerprint" TEXT,
  "payment_id" TEXT,
  "stripe_event_id" TEXT,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ops_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "payments" ADD COLUMN "stripe_status" TEXT;
ALTER TABLE "payments" ADD COLUMN "last_synced_at" TIMESTAMP(3);

ALTER TABLE "stripe_events" ADD COLUMN "payment_id" TEXT;
ALTER TABLE "stripe_events" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'processed';
ALTER TABLE "stripe_events" ADD COLUMN "error_message" TEXT;
ALTER TABLE "stripe_events" ADD COLUMN "payload" JSONB;

CREATE INDEX "ops_incidents_mode_idx" ON "ops_incidents"("mode");
CREATE INDEX "ops_incidents_trigger_idx" ON "ops_incidents"("trigger");
CREATE INDEX "ops_incidents_status_idx" ON "ops_incidents"("status");
CREATE INDEX "ops_incidents_created_at_idx" ON "ops_incidents"("created_at");
CREATE INDEX "ops_events_type_idx" ON "ops_events"("type");
CREATE INDEX "ops_events_severity_idx" ON "ops_events"("severity");
CREATE INDEX "ops_events_source_idx" ON "ops_events"("source");
CREATE INDEX "ops_events_fingerprint_idx" ON "ops_events"("fingerprint");
CREATE INDEX "ops_events_created_at_idx" ON "ops_events"("created_at");
CREATE INDEX "stripe_events_status_idx" ON "stripe_events"("status");
CREATE INDEX "stripe_events_payment_id_idx" ON "stripe_events"("payment_id");
