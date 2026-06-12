-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "EditSubject" AS ENUM ('person', 'food', 'product', 'animal', 'landscape', 'object');

-- CreateEnum
CREATE TYPE "EditStyle" AS ENUM ('voice', 'voice_scene');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'processing',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultUrl" TEXT,
    "errorCode" TEXT,
    "subject" "EditSubject" NOT NULL,
    "duration" TEXT NOT NULL,
    "style" "EditStyle" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedVideo" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "storagePath" TEXT NOT NULL,

    CONSTRAINT "UploadedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EditJob_userId_idx" ON "EditJob"("userId");

-- AddForeignKey
ALTER TABLE "EditJob" ADD CONSTRAINT "EditJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedVideo" ADD CONSTRAINT "UploadedVideo_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "EditJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
