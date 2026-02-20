-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PROFILE_IMAGE', 'ID_DOCUMENT', 'GENERAL');

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" "FileType" NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_user_id_file_type_idx" ON "files"("user_id", "file_type");

-- CreateIndex
CREATE INDEX "files_user_id_created_at_idx" ON "files"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
