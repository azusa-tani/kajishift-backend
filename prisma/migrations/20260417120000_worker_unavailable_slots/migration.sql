-- CreateTable
CREATE TABLE "worker_unavailable_slots" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "local_date" VARCHAR(10) NOT NULL,
    "slot_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_unavailable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "worker_unavailable_slots_worker_id_local_date_slot_index_key" ON "worker_unavailable_slots"("worker_id", "local_date", "slot_index");

-- CreateIndex
CREATE INDEX "worker_unavailable_slots_worker_id_local_date_idx" ON "worker_unavailable_slots"("worker_id", "local_date");

-- AddForeignKey
ALTER TABLE "worker_unavailable_slots" ADD CONSTRAINT "worker_unavailable_slots_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
