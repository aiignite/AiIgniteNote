/*
  Warnings:

  - Made the column `user_id` on table `categories` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ai_assistants" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "model_configs" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ai_assistants_is_public_idx" ON "ai_assistants"("is_public");

-- CreateIndex
CREATE INDEX "categories_is_public_idx" ON "categories"("is_public");

-- CreateIndex
CREATE INDEX "model_configs_is_public_idx" ON "model_configs"("is_public");

-- CreateIndex
CREATE INDEX "notes_is_public_idx" ON "notes"("is_public");

-- CreateIndex
CREATE INDEX "tags_is_public_idx" ON "tags"("is_public");
