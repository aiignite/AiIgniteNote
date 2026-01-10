-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_changed_at" TIMESTAMP(3),
ADD COLUMN     "require_password_change" BOOLEAN NOT NULL DEFAULT false;
