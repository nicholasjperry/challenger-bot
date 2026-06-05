-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);
