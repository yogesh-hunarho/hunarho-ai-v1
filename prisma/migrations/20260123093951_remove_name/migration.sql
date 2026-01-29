/*
  Warnings:

  - You are about to alter the column `type` on the `credittransaction` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.
  - The primary key for the `plancredit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `type` on the `plancredit` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to alter the column `type` on the `usercredit` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `credittransaction` MODIFY `type` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `plancredit` DROP PRIMARY KEY,
    MODIFY `type` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`planId`, `type`);

-- AlterTable
ALTER TABLE `usercredit` MODIFY `type` VARCHAR(191) NOT NULL;
