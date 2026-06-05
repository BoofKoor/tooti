-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "correctAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "UserMedal" ADD COLUMN     "seenAt" TIMESTAMP(3);
