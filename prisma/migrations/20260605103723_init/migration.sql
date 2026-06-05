-- CreateEnum
CREATE TYPE "LessonKind" AS ENUM ('LESSON', 'REVIEW', 'SECTION_TEST', 'STORY', 'SPEAKING');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('MCQ', 'FILL_BLANK', 'WORD_BANK', 'TRANSLATE', 'LISTEN');

-- CreateEnum
CREATE TYPE "MedalTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'SPECIAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "dailyGoal" INTEGER NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" "LessonKind" NOT NULL DEFAULT 'LESSON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "ExerciseType" NOT NULL DEFAULT 'MCQ',
    "instructionEn" TEXT NOT NULL,
    "instructionFa" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER,
    "answer" TEXT,
    "explanationFa" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "heartsLeft" INTEGER NOT NULL DEFAULT 0,
    "perfect" BOOLEAN NOT NULL DEFAULT false,
    "crownLevel" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medal" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "MedalTier" NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Medal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMedal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medalId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "earnedAt" TIMESTAMP(3),

    CONSTRAINT "UserMedal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_key" ON "Progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_slug_key" ON "Unit"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_unitId_order_key" ON "Lesson"("unitId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_lessonId_order_key" ON "Exercise"("lessonId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LessonCompletion_userId_lessonId_key" ON "LessonCompletion"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Medal_key_key" ON "Medal"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserMedal_userId_medalId_key" ON "UserMedal"("userId", "medalId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMedal" ADD CONSTRAINT "UserMedal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMedal" ADD CONSTRAINT "UserMedal_medalId_fkey" FOREIGN KEY ("medalId") REFERENCES "Medal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
