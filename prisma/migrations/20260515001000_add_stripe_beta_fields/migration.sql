ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_transaction_id_key" ON "payments"("transaction_id");

CREATE TABLE IF NOT EXISTS "stripe_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stripe_events_type_idx" ON "stripe_events"("type");
CREATE INDEX IF NOT EXISTS "stripe_events_processed_at_idx" ON "stripe_events"("processed_at");
