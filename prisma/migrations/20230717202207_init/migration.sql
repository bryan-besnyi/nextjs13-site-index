-- CreateTable
CREATE TABLE "SiteIndexItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
