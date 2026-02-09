-- CreateTable
CREATE TABLE `UserImportAudit` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserImportAudit_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
