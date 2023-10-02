/*
  Warnings:

  - You are about to drop the `SiteIndexItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SiteIndexItem";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "IndexItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
