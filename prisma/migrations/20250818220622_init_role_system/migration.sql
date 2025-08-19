/*
  Warnings:

  - You are about to drop the `IndexItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AnalyticsEvent" AS ENUM ('VIEW', 'PRINT_PREVIEW', 'PRINT_DOWNLOAD', 'EDIT_STARTED', 'SHARE', 'SEARCH_RESULT');

-- CreateEnum
CREATE TYPE "AppointmentCategory" AS ENUM ('OFFICE_HOURS', 'IN_CLASS', 'LECTURE', 'LAB', 'HOURS_BY_ARRANGEMENT', 'REFERENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "College" AS ENUM ('SKYLINE', 'CSM', 'CANADA', 'DISTRICT_OFFICE');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "DisplayNameFormat" AS ENUM ('FULL_WITH_TITLE', 'LAST_WITH_TITLE', 'FIRST_INITIAL_LAST_WITH_TITLE', 'FIRST_INITIAL_LAST', 'FULL_NAME');

-- CreateEnum
CREATE TYPE "TermSeason" AS ENUM ('FALL', 'SPRING', 'SUMMER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'STAFF', 'FACULTY');

-- DropTable
DROP TABLE "IndexItem";

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
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "category" "AppointmentCategory" NOT NULL DEFAULT 'OFFICE_HOURS',
    "location" TEXT,
    "doorcardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doorcard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doorcardName" TEXT NOT NULL,
    "officeNumber" TEXT NOT NULL,
    "term" "TermSeason" NOT NULL,
    "year" INTEGER NOT NULL,
    "college" "College" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "userId" TEXT NOT NULL,
    "termId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doorcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoorcardAnalytics" (
    "id" TEXT NOT NULL,
    "doorcardId" TEXT NOT NULL,
    "eventType" "AnalyticsEvent" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoorcardAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoorcardMetrics" (
    "doorcardId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "totalPrints" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "lastPrintedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoorcardMetrics_pkey" PRIMARY KEY ("doorcardId")
);

-- CreateTable
CREATE TABLE "indexitem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexitem_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isUpcoming" BOOLEAN NOT NULL DEFAULT false,
    "archiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "title" TEXT,
    "displayFormat" "DisplayNameFormat" NOT NULL DEFAULT 'FULL_NAME',
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "college" "College",
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pronouns" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "method" TEXT,
    "path" TEXT,
    "statusCode" INTEGER,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "Appointment_category_idx" ON "Appointment"("category");

-- CreateIndex
CREATE INDEX "Appointment_dayOfWeek_idx" ON "Appointment"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Appointment_doorcardId_idx" ON "Appointment"("doorcardId");

-- CreateIndex
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Doorcard_slug_key" ON "Doorcard"("slug");

-- CreateIndex
CREATE INDEX "Doorcard_college_idx" ON "Doorcard"("college");

-- CreateIndex
CREATE INDEX "Doorcard_term_year_idx" ON "Doorcard"("term", "year");

-- CreateIndex
CREATE INDEX "Doorcard_userId_createdAt_idx" ON "Doorcard"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Doorcard_userId_college_term_year_isActive_key" ON "Doorcard"("userId", "college", "term", "year", "isActive");

-- CreateIndex
CREATE INDEX "DoorcardAnalytics_doorcardId_createdAt_idx" ON "DoorcardAnalytics"("doorcardId", "createdAt");

-- CreateIndex
CREATE INDEX "DoorcardAnalytics_doorcardId_eventType_idx" ON "DoorcardAnalytics"("doorcardId", "eventType");

-- CreateIndex
CREATE INDEX "DoorcardAnalytics_sessionId_idx" ON "DoorcardAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "DoorcardMetrics_lastViewedAt_idx" ON "DoorcardMetrics"("lastViewedAt");

-- CreateIndex
CREATE INDEX "DoorcardMetrics_totalViews_idx" ON "DoorcardMetrics"("totalViews");

-- CreateIndex
CREATE INDEX "DoorcardMetrics_uniqueViews_idx" ON "DoorcardMetrics"("uniqueViews");

-- CreateIndex
CREATE INDEX "indexitem_campus_idx" ON "indexitem"("campus");

-- CreateIndex
CREATE INDEX "indexitem_letter_idx" ON "indexitem"("letter");

-- CreateIndex
CREATE INDEX "indexitem_title_idx" ON "indexitem"("title");

-- CreateIndex
CREATE INDEX "indexitem_campus_letter_idx" ON "indexitem"("campus", "letter");

-- CreateIndex
CREATE INDEX "indexitem_campus_title_idx" ON "indexitem"("campus", "title");

-- CreateIndex
CREATE INDEX "indexitem_letter_title_idx" ON "indexitem"("letter", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Term_name_key" ON "Term"("name");

-- CreateIndex
CREATE INDEX "Term_endDate_idx" ON "Term"("endDate");

-- CreateIndex
CREATE INDEX "Term_isActive_idx" ON "Term"("isActive");

-- CreateIndex
CREATE INDEX "Term_isArchived_idx" ON "Term"("isArchived");

-- CreateIndex
CREATE INDEX "Term_season_idx" ON "Term"("season");

-- CreateIndex
CREATE INDEX "Term_startDate_idx" ON "Term"("startDate");

-- CreateIndex
CREATE INDEX "Term_year_idx" ON "Term"("year");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_college_idx" ON "User"("college");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_resource_idx" ON "ActivityLog"("resource");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_userEmail_idx" ON "ActivityLog"("userEmail");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doorcardId_fkey" FOREIGN KEY ("doorcardId") REFERENCES "Doorcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doorcard" ADD CONSTRAINT "Doorcard_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doorcard" ADD CONSTRAINT "Doorcard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoorcardAnalytics" ADD CONSTRAINT "DoorcardAnalytics_doorcardId_fkey" FOREIGN KEY ("doorcardId") REFERENCES "Doorcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoorcardMetrics" ADD CONSTRAINT "DoorcardMetrics_doorcardId_fkey" FOREIGN KEY ("doorcardId") REFERENCES "Doorcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
