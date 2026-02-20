-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_4" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "expiry_month" INTEGER NOT NULL,
    "expiry_year" INTEGER NOT NULL,
    "cardholder_name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_cards_user_id_idx" ON "credit_cards"("user_id");

-- CreateIndex
CREATE INDEX "credit_cards_user_id_is_default_idx" ON "credit_cards"("user_id", "is_default");

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
