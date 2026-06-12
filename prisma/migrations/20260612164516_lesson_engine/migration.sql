-- CreateEnum
CREATE TYPE "SectionKind" AS ENUM ('READING', 'CONCEPT', 'SUMMARY', 'VIDEO');

-- CreateTable
CREATE TABLE "LessonSection" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" "SectionKind" NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleFa" TEXT NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "LessonSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyXp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyXp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonSection_lessonId_order_key" ON "LessonSection"("lessonId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "DailyXp_userId_day_key" ON "DailyXp"("userId", "day");

-- AddForeignKey
ALTER TABLE "LessonSection" ADD CONSTRAINT "LessonSection_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyXp" ADD CONSTRAINT "DailyXp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
