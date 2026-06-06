-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remindAt" TIMESTAMP(3);
