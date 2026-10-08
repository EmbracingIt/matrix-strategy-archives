-- Additive schema change, applied separately before content consolidation.
-- No rows or history are removed. Not run automatically during Vercel builds.
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "recordType" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "canonicalSlug" TEXT;
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "aliasesJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "educationJson" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Protocol" ADD COLUMN IF NOT EXISTS "reviewJson" TEXT NOT NULL DEFAULT '{}';
