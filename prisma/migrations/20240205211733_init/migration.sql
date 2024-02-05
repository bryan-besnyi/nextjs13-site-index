-- CreateTable
CREATE TABLE "IndexItem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexItem_pkey" PRIMARY KEY ("id")
);
