-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add new UUID column
ALTER TABLE "indexitem" ADD COLUMN "new_id" TEXT;

-- Populate UUIDs for all existing rows (preserves all data)
UPDATE "indexitem" SET "new_id" = gen_random_uuid()::TEXT;

-- Make NOT NULL now that all rows have values
ALTER TABLE "indexitem" ALTER COLUMN "new_id" SET NOT NULL;

-- Drop the old primary key constraint and integer id column
ALTER TABLE "indexitem" DROP CONSTRAINT "indexitem_pkey";
ALTER TABLE "indexitem" DROP COLUMN "id";

-- Rename new_id to id and set as primary key
ALTER TABLE "indexitem" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "indexitem" ADD CONSTRAINT "indexitem_pkey" PRIMARY KEY ("id");
