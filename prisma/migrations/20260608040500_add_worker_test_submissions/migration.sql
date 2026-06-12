-- CreateEnum
CREATE TYPE "AiInitialDecision" AS ENUM ('PASS_CANDIDATE', 'FAIL_CANDIDATE', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "AdminFinalDecision" AS ENUM ('PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkerTestSubmissionStatus" AS ENUM ('TEST_SUBMITTED', 'AI_REVIEWED', 'NEEDS_REVIEW', 'ADMIN_PASSED', 'ADMIN_FAILED');

-- CreateTable
CREATE TABLE "worker_test_submissions" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "test_answer" TEXT NOT NULL,
    "ai_score" INTEGER,
    "ai_initial_decision" "AiInitialDecision",
    "ai_reason" TEXT,
    "ai_warnings" JSONB,
    "ai_reviewed_at" TIMESTAMP(3),
    "ai_error_message" TEXT,
    "admin_final_decision" "AdminFinalDecision",
    "admin_comment" TEXT,
    "reviewed_by_admin_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "status" "WorkerTestSubmissionStatus" NOT NULL DEFAULT 'TEST_SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_test_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "worker_test_submissions_worker_id_status_idx" ON "worker_test_submissions"("worker_id", "status");

-- CreateIndex
CREATE INDEX "worker_test_submissions_status_created_at_idx" ON "worker_test_submissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "worker_test_submissions_created_at_idx" ON "worker_test_submissions"("created_at");

-- AddForeignKey
ALTER TABLE "worker_test_submissions" ADD CONSTRAINT "worker_test_submissions_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_test_submissions" ADD CONSTRAINT "worker_test_submissions_reviewed_by_admin_id_fkey" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
