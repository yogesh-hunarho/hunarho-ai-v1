-- CreateTable
CREATE TABLE `AptitudeTest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `subCategory` VARCHAR(191) NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL,
    `questionCount` INTEGER NOT NULL,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AptitudeTest_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AptitudeQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `aptitudeTestId` VARCHAR(191) NOT NULL,
    `questionText` TEXT NOT NULL,
    `options` JSON NOT NULL,
    `correctAnswer` VARCHAR(191) NOT NULL,
    `explanation` TEXT NULL,
    `difficulty` VARCHAR(191) NOT NULL,
    `hint` TEXT NULL,
    `userAnswer` VARCHAR(191) NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AptitudeQuestion_aptitudeTestId_idx`(`aptitudeTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AptitudeTest` ADD CONSTRAINT `AptitudeTest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AptitudeQuestion` ADD CONSTRAINT `AptitudeQuestion_aptitudeTestId_fkey` FOREIGN KEY (`aptitudeTestId`) REFERENCES `AptitudeTest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
