/*
  Warnings:

  - A unique constraint covering the columns `[uniqueId]` on the table `AptitudeTest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uniqueId` to the `AptitudeTest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `aptitudetest` ADD COLUMN `uniqueId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `AptitudeTest_uniqueId_key` ON `AptitudeTest`(`uniqueId`);
