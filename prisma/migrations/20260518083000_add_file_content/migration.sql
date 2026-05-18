-- Store uploaded file content in PostgreSQL as a beta fallback for Railway redeploys.
ALTER TABLE "files" ADD COLUMN "content" BYTEA;
